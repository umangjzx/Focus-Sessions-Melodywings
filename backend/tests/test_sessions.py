def _auth_header(client):
    import uuid

    email = f"session_{uuid.uuid4().hex[:8]}@example.com"
    client.post(
        "/api/auth/register",
        json={"name": "Session Tester", "email": email, "password": "secret123"},
    )
    res = client.post(
        "/api/auth/login",
        json={"email": email, "password": "secret123"},
    )
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_complete_session_flow(client):
    headers = _auth_header(client)
    start_res = client.post(
        "/api/sessions/start",
        json={"title": "Focus block", "planned_minutes": 25},
        headers=headers,
    )
    assert start_res.status_code == 201
    session_id = start_res.json()["id"]

    complete_res = client.post(
        f"/api/sessions/{session_id}/complete",
        json={"actual_minutes": 25, "pauses": 0, "mood": 4, "task_completed": False},
        headers=headers,
    )
    assert complete_res.status_code == 200
    body = complete_res.json()
    assert body["session"]["status"] == "completed"
    assert body["xp_earned"] > 0
