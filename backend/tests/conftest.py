"""
Test fixtures. Uses an in-memory SQLite DB instead of Postgres so tests run
anywhere with zero setup, and monkeypatches the AI client so no real API
calls (or API key) are needed to run the suite.
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture()
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def auth_headers(client):
    """Signs up + logs in a team_leader user, returns Authorization headers."""
    client.post("/api/auth/signup", json={
        "name": "Krushitha", "email": "krushitha@test.dev",
        "password": "secret123", "role": "team_leader",
    })
    resp = client.post(
        "/api/auth/login",
        data={"username": "krushitha@test.dev", "password": "secret123"},
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def mock_ai(mocker):
    """Patches the raw AI client so tests never hit a real provider."""
    mocker.patch(
        "app.ai_service.client.complete",
        return_value="Mocked AI response.",
    )
    mocker.patch(
        "app.ai_service.client.complete_json",
        return_value={"mocked": True},
    )
