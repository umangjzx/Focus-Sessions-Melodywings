def test_register_and_login(client):
    import uuid
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    client.post(
        "/api/auth/register",
        json={"name": "Test", "email": email, "password": "secret123"},
    )
    res = client.post(
        "/api/auth/login",
        json={"email": email, "password": "secret123"},
    )
    assert res.status_code == 200
    assert "access_token" in res.json()


def test_health(client):
    assert client.get("/api/health").json()["status"] == "ok"
