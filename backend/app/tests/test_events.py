"""Tests for events: create, list, get, update, delete."""
from __future__ import annotations

from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def auth_headers(client: TestClient) -> dict[str, str]:
    """Register, login, return Authorization header."""
    client.post(
        "/auth/register",
        json={"email": "eventuser@example.com", "name": "Event User", "password": "password123"},
    )
    r = client.post("/auth/login", json={"email": "eventuser@example.com", "password": "password123"})
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _iso(dt: datetime) -> str:
    return dt.isoformat().replace("+00:00", "Z")


def test_create_event(client: TestClient, auth_headers: dict[str, str]) -> None:
    start = datetime(2025, 6, 1, 14, 0, 0, tzinfo=timezone.utc)
    end = datetime(2025, 6, 1, 16, 0, 0, tzinfo=timezone.utc)
    r = client.post(
        "/events/",
        json={
            "title": "Team Meeting",
            "description": "Weekly sync",
            "location": "Room 1",
            "start_time": _iso(start),
            "end_time": _iso(end),
        },
        headers=auth_headers,
    )
    assert r.status_code == 201
    data = r.json()
    assert data["title"] == "Team Meeting"
    assert data["location"] == "Room 1"
    assert "id" in data


def test_list_events(client: TestClient, auth_headers: dict[str, str]) -> None:
    start = datetime(2025, 7, 1, 10, 0, 0, tzinfo=timezone.utc)
    client.post(
        "/events/",
        json={"title": "E1", "start_time": _iso(start)},
        headers=auth_headers,
    )
    client.post(
        "/events/",
        json={"title": "E2", "start_time": _iso(start)},
        headers=auth_headers,
    )
    r = client.get("/events/", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["total"] >= 2
    assert len(data["items"]) >= 2


def test_get_event(client: TestClient, auth_headers: dict[str, str]) -> None:
    start = datetime(2025, 8, 1, 12, 0, 0, tzinfo=timezone.utc)
    cr = client.post(
        "/events/",
        json={"title": "Get Me Event", "start_time": _iso(start)},
        headers=auth_headers,
    )
    event_id = cr.json()["id"]
    r = client.get(f"/events/{event_id}", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["title"] == "Get Me Event"


def test_get_event_404(client: TestClient, auth_headers: dict[str, str]) -> None:
    r = client.get("/events/00000000-0000-0000-0000-000000000001", headers=auth_headers)
    assert r.status_code == 404


def test_update_event(client: TestClient, auth_headers: dict[str, str]) -> None:
    start = datetime(2025, 9, 1, 9, 0, 0, tzinfo=timezone.utc)
    cr = client.post(
        "/events/",
        json={"title": "Old Title", "start_time": _iso(start)},
        headers=auth_headers,
    )
    event_id = cr.json()["id"]
    r = client.patch(f"/events/{event_id}", json={"title": "Updated Title"}, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["title"] == "Updated Title"


def test_delete_event(client: TestClient, auth_headers: dict[str, str]) -> None:
    start = datetime(2025, 10, 1, 10, 0, 0, tzinfo=timezone.utc)
    cr = client.post(
        "/events/",
        json={"title": "To Delete", "start_time": _iso(start)},
        headers=auth_headers,
    )
    event_id = cr.json()["id"]
    r = client.delete(f"/events/{event_id}", headers=auth_headers)
    assert r.status_code == 204
    r2 = client.get(f"/events/{event_id}", headers=auth_headers)
    assert r2.status_code == 404


def test_invite_and_respond(client: TestClient) -> None:
    """Owner creates event, invites user by email; invitee responds with token."""
    client.post(
        "/auth/register",
        json={"email": "owner@events.com", "name": "Owner", "password": "password123"},
    )
    client.post(
        "/auth/register",
        json={"email": "invitee@events.com", "name": "Invitee", "password": "password123"},
    )
    owner_login = client.post("/auth/login", json={"email": "owner@events.com", "password": "password123"})
    invitee_login = client.post("/auth/login", json={"email": "invitee@events.com", "password": "password123"})
    owner_headers = {"Authorization": f"Bearer {owner_login.json()['access_token']}"}
    invitee_headers = {"Authorization": f"Bearer {invitee_login.json()['access_token']}"}
    start = datetime(2025, 12, 1, 18, 0, 0, tzinfo=timezone.utc)
    er = client.post(
        "/events/",
        json={"title": "Party", "start_time": _iso(start)},
        headers=owner_headers,
    )
    event_id = er.json()["id"]
    ir = client.post(
        f"/events/{event_id}/invites",
        json={"invited_email": "invitee@events.com"},
        headers=owner_headers,
    )
    assert ir.status_code == 201
    token = ir.json()["token"]
    assert ir.json()["status"] == "pending"
    # Invitee responds
    resp = client.post(
        f"/invites/{token}/respond",
        json={"status": "accepted"},
        headers=invitee_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "accepted"
    # Attendees list includes owner and invitee
    att = client.get(f"/events/{event_id}/attendees", headers=owner_headers)
    assert att.status_code == 200
    assert att.json()["owner"]["status"] == "owner"
    invitees = att.json()["invitees"]
    assert len(invitees) == 1
    assert invitees[0]["email"] == "invitee@events.com"
    assert invitees[0]["status"] == "accepted"
