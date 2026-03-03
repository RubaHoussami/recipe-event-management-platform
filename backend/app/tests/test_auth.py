"""Tests for auth: register, login."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


def test_register(client: TestClient) -> None:
    r = client.post(
        "/auth/register",
        json={"email": "test@example.com", "name": "Test User", "password": "password123"},
    )
    assert r.status_code == 201
    data = r.json()
    assert data["email"] == "test@example.com"
    assert data["name"] == "Test User"
    assert "id" in data
    assert "hashed_password" not in data


def test_register_duplicate_email(client: TestClient) -> None:
    client.post(
        "/auth/register",
        json={"email": "dup@example.com", "name": "First", "password": "password123"},
    )
    r = client.post(
        "/auth/register",
        json={"email": "dup@example.com", "name": "Second", "password": "other456"},
    )
    assert r.status_code == 409


def test_login(client: TestClient) -> None:
    client.post(
        "/auth/register",
        json={"email": "login@example.com", "name": "Login User", "password": "secret123"},
    )
    r = client.post("/auth/login", json={"email": "login@example.com", "password": "secret123"})
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_password(client: TestClient) -> None:
    client.post(
        "/auth/register",
        json={"email": "bad@example.com", "name": "Bad", "password": "secret123"},
    )
    r = client.post("/auth/login", json={"email": "bad@example.com", "password": "wrong"})
    assert r.status_code == 403


def test_me_requires_auth(client: TestClient) -> None:
    r = client.get("/auth/me")
    assert r.status_code == 401


def test_me_returns_user(client: TestClient) -> None:
    client.post(
        "/auth/register",
        json={"email": "me@example.com", "name": "Me User", "password": "password123"},
    )
    r = client.post("/auth/login", json={"email": "me@example.com", "password": "password123"})
    token = r.json()["access_token"]
    r2 = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r2.status_code == 200
    assert r2.json()["email"] == "me@example.com"
