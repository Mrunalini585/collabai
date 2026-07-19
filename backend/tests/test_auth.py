def test_signup_creates_user(client):
    resp = client.post("/api/auth/signup", json={
        "name": "Priya", "email": "priya@test.dev", "password": "pw123456", "role": "student",
    })
    assert resp.status_code == 200
    body = resp.json()
    assert body["email"] == "priya@test.dev"
    assert body["role"] == "student"
    assert "hashed_password" not in body  # never leak the hash


def test_signup_rejects_duplicate_email(client):
    payload = {"name": "Priya", "email": "priya@test.dev", "password": "pw123456"}
    client.post("/api/auth/signup", json=payload)
    resp = client.post("/api/auth/signup", json=payload)
    assert resp.status_code == 400


def test_login_succeeds_with_correct_password(client):
    client.post("/api/auth/signup", json={
        "name": "Rahul", "email": "rahul@test.dev", "password": "correcthorse",
    })
    resp = client.post("/api/auth/login", data={"username": "rahul@test.dev", "password": "correcthorse"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_rejects_wrong_password(client):
    client.post("/api/auth/signup", json={
        "name": "Rahul", "email": "rahul2@test.dev", "password": "correcthorse",
    })
    resp = client.post("/api/auth/login", data={"username": "rahul2@test.dev", "password": "wrong"})
    assert resp.status_code == 401


def test_me_requires_auth(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401


def test_me_returns_current_user(client, auth_headers):
    resp = client.get("/api/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "krushitha@test.dev"


def test_login_succeeds_with_username(client):
    client.post("/api/auth/signup", json={
        "name": "Aman", "email": "aman@test.dev", "password": "correcthorse",
    })
    # Login with name (username) instead of email
    resp = client.post("/api/auth/login", data={"username": "Aman", "password": "correcthorse"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()
