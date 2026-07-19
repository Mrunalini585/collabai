def test_create_and_list_project(client, auth_headers):
    resp = client.post(
        "/api/projects/",
        json={"name": "Campus Recruitment System", "description": "SRS-driven demo project"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    project = resp.json()
    assert project["name"] == "Campus Recruitment System"

    resp = client.get("/api/projects/", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_only_owner_can_delete_project(client, auth_headers):
    resp = client.post("/api/projects/", json={"name": "Temp"}, headers=auth_headers)
    project_id = resp.json()["id"]

    # Second user, not on the project.
    client.post("/api/auth/signup", json={"name": "Outsider", "email": "outsider@test.dev", "password": "pw123456"})
    login = client.post("/api/auth/login", data={"username": "outsider@test.dev", "password": "pw123456"})
    outsider_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    resp = client.delete(f"/api/projects/{project_id}", headers=outsider_headers)
    assert resp.status_code == 403


def test_task_lifecycle(client, auth_headers):
    project = client.post("/api/projects/", json={"name": "Kanban Test"}, headers=auth_headers).json()
    pid = project["id"]

    created = client.post(
        f"/api/projects/{pid}/tasks/",
        json={"title": "Login Page", "priority": "Low", "status": "To Do"},
        headers=auth_headers,
    )
    assert created.status_code == 200
    task = created.json()
    assert task["status"] == "To Do"

    moved = client.patch(
        f"/api/projects/{pid}/tasks/{task['id']}",
        json={"status": "In Progress"},
        headers=auth_headers,
    )
    assert moved.status_code == 200
    assert moved.json()["status"] == "In Progress"

    listing = client.get(f"/api/projects/{pid}/tasks/", headers=auth_headers)
    assert len(listing.json()) == 1

    deleted = client.delete(f"/api/projects/{pid}/tasks/{task['id']}", headers=auth_headers)
    assert deleted.status_code == 200
    assert client.get(f"/api/projects/{pid}/tasks/", headers=auth_headers).json() == []
