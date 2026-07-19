def test_analyze_requirements_is_grounded_in_ai_output(client, auth_headers, mocker):
    mocker.patch(
        "app.routers.ai.requirement_analyzer.analyze_requirements",
        return_value={
            "modules_found": ["Patient", "Doctor", "Billing"],
            "missing_modules": ["Authentication", "Notifications"],
            "ambiguous": [],
            "summary": "A hospital management system.",
        },
    )
    resp = client.post(
        "/api/ai/analyze-requirements",
        json={"srs_text": "The system shall let patients book appointments with doctors."},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "Patient" in body["modules_found"]
    assert "Authentication" in body["missing_modules"]


def test_chat_endpoint_includes_live_task_context(client, auth_headers, mocker):
    project = client.post("/api/projects/", json={"name": "Chat Test"}, headers=auth_headers).json()
    client.post(
        f"/api/projects/{project['id']}/tasks/",
        json={"title": "Payment API", "status": "To Do", "priority": "High"},
        headers=auth_headers,
    )

    spy = mocker.patch("app.routers.ai.chat_assistant.answer", return_value="Payment API is still pending.")
    resp = client.post(
        "/api/ai/chat",
        json={"project_id": project["id"], "message": "What tasks are pending?"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["reply"] == "Payment API is still pending."
    # Assert the live board state was actually passed into the AI call.
    called_context = spy.call_args[0][0]
    assert "Payment API" in called_context


def test_risk_endpoint_computes_metrics_from_real_tasks(client, auth_headers, mocker):
    project = client.post("/api/projects/", json={"name": "Risk Test"}, headers=auth_headers).json()
    client.post(f"/api/projects/{project['id']}/tasks/", json={"title": "A", "status": "Done"}, headers=auth_headers)
    client.post(f"/api/projects/{project['id']}/tasks/", json={"title": "B", "status": "To Do"}, headers=auth_headers)

    mocker.patch(
        "app.routers.ai.risk_predictor.predict_risk",
        return_value={"probability_of_delay": 40, "reasons": ["Half tasks incomplete"], "suggestions": ["Add resources"]},
    )
    resp = client.get(f"/api/ai/risk/{project['id']}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["probability_of_delay"] == 40
