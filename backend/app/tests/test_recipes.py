"""Tests for recipes: create, list, get, update, delete."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def auth_headers(client: TestClient) -> dict[str, str]:
    """Register, login, return Authorization header."""
    client.post(
        "/auth/register",
        json={"email": "recipeuser@example.com", "name": "Recipe User", "password": "password123"},
    )
    r = client.post("/auth/login", json={"email": "recipeuser@example.com", "password": "password123"})
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_recipe(client: TestClient, auth_headers: dict[str, str]) -> None:
    r = client.post(
        "/recipes/",
        json={
            "title": "Test Recipe",
            "description": "A test",
            "ingredients": ["a", "b"],
            "steps": ["Step 1", "Step 2"],
        },
        headers=auth_headers,
    )
    assert r.status_code == 201
    data = r.json()
    assert data["title"] == "Test Recipe"
    assert data["ingredients"] == ["a", "b"]
    assert "id" in data


def test_list_recipes(client: TestClient, auth_headers: dict[str, str]) -> None:
    client.post("/recipes/", json={"title": "R1", "ingredients": [], "steps": []}, headers=auth_headers)
    client.post("/recipes/", json={"title": "R2", "ingredients": [], "steps": []}, headers=auth_headers)
    r = client.get("/recipes/", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["total"] >= 2
    assert len(data["items"]) >= 2


def test_get_recipe(client: TestClient, auth_headers: dict[str, str]) -> None:
    cr = client.post("/recipes/", json={"title": "Get Me", "ingredients": [], "steps": []}, headers=auth_headers)
    recipe_id = cr.json()["id"]
    r = client.get(f"/recipes/{recipe_id}", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["title"] == "Get Me"


def test_get_recipe_404(client: TestClient, auth_headers: dict[str, str]) -> None:
    r = client.get("/recipes/00000000-0000-0000-0000-000000000001", headers=auth_headers)
    assert r.status_code == 404


def test_update_recipe(client: TestClient, auth_headers: dict[str, str]) -> None:
    cr = client.post("/recipes/", json={"title": "Old", "ingredients": [], "steps": []}, headers=auth_headers)
    recipe_id = cr.json()["id"]
    r = client.patch(f"/recipes/{recipe_id}", json={"title": "Updated"}, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["title"] == "Updated"


def test_delete_recipe(client: TestClient, auth_headers: dict[str, str]) -> None:
    cr = client.post("/recipes/", json={"title": "To Delete", "ingredients": [], "steps": []}, headers=auth_headers)
    recipe_id = cr.json()["id"]
    r = client.delete(f"/recipes/{recipe_id}", headers=auth_headers)
    assert r.status_code == 204
    r2 = client.get(f"/recipes/{recipe_id}", headers=auth_headers)
    assert r2.status_code == 404


def test_shared_viewer_cannot_edit(client: TestClient) -> None:
    """Owner shares recipe with viewer; viewer can get but not patch."""
    client.post(
        "/auth/register",
        json={"email": "owner@example.com", "name": "Owner", "password": "password123"},
    )
    client.post(
        "/auth/register",
        json={"email": "viewer@example.com", "name": "Viewer", "password": "password123"},
    )
    owner_r = client.post("/auth/login", json={"email": "owner@example.com", "password": "password123"})
    viewer_r = client.post("/auth/login", json={"email": "viewer@example.com", "password": "password123"})
    owner_headers = {"Authorization": f"Bearer {owner_r.json()['access_token']}"}
    viewer_headers = {"Authorization": f"Bearer {viewer_r.json()['access_token']}"}
    cr = client.post(
        "/recipes/",
        json={"title": "Shared Recipe", "ingredients": [], "steps": []},
        headers=owner_headers,
    )
    recipe_id = cr.json()["id"]
    client.post(
        f"/recipes/{recipe_id}/shares",
        json={"shared_with_email": "viewer@example.com", "permission": "viewer"},
        headers=owner_headers,
    )
    get_r = client.get(f"/recipes/{recipe_id}", headers=viewer_headers)
    assert get_r.status_code == 200
    patch_r = client.patch(f"/recipes/{recipe_id}", json={"title": "Hacked"}, headers=viewer_headers)
    assert patch_r.status_code == 403
