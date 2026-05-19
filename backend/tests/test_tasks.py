def _auth_header(client):
    import uuid

    email = f"task_{uuid.uuid4().hex[:8]}@example.com"
    client.post(
        "/api/auth/register",
        json={"name": "Task Tester", "email": email, "password": "secret123"},
    )
    res = client.post(
        "/api/auth/login",
        json={"email": email, "password": "secret123"},
    )
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_task_and_subtask(client):
    headers = _auth_header(client)
    task_res = client.post(
        "/api/tasks",
        json={"title": "Plan sprint", "priority": "high"},
        headers=headers,
    )
    assert task_res.status_code == 201
    task_id = task_res.json()["id"]

    sub_res = client.post(
        "/api/tasks",
        json={"title": "Outline backlog", "parent_id": task_id, "priority": "medium"},
        headers=headers,
    )
    assert sub_res.status_code == 201

    list_res = client.get("/api/tasks", headers=headers)
    assert list_res.status_code == 200
    rows = list_res.json()
    assert any(t["id"] == task_id and t["parent_id"] is None for t in rows)
    assert any(t["parent_id"] == task_id for t in rows)
