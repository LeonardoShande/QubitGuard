"""Smoke test de la fase 0; la fase 4 lo reemplaza por la suite completa."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    assert client.get("/api/health").json()["status"] == "ok"
