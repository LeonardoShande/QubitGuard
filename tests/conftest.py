import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client


def pytest_configure(config):
    config.addinivalue_line("markers", "slow: requires a noisy backend simulation")
