import re
from pathlib import Path

import pytest


def test_openapi_has_no_password_like_request_fields(client):
    schema = client.get("/openapi.json").json()
    forbidden = re.compile(r"pass|pwd|secret", re.IGNORECASE)
    for path in schema["paths"].values():
        for operation in path.values():
            if not isinstance(operation, dict):
                continue
            for parameter in operation.get("parameters", []):
                assert not forbidden.search(parameter.get("name", ""))
            request_body = operation.get("requestBody", {})
            for media in request_body.get("content", {}).values():
                properties = media.get("schema", {}).get("properties", {})
                assert not any(forbidden.search(name) for name in properties)
    for definition in schema.get("components", {}).get("schemas", {}).values():
        assert not any(forbidden.search(name) for name in definition.get("properties", {}))


def test_post_endpoints_reject_password_field(client):
    schema = client.get("/openapi.json").json()
    for path, operations in schema["paths"].items():
        if "post" in operations and path.startswith("/api/"):
            response = client.post(path, json={"password": "x"})
            assert response.status_code == 422, (path, response.status_code, response.text)


def test_password_module_does_not_send_or_store_passwords():
    files = list((Path(__file__).resolve().parents[1] / "frontend" / "src").glob("*.ts"))
    password_files = [path for path in files if "password" in path.name.lower()]
    if not password_files:
        pytest.skip("password module is not present yet")
    forbidden = re.compile(r"fetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|localStorage|sessionStorage")
    for path in password_files:
        assert not forbidden.search(path.read_text(encoding="utf-8")), path
