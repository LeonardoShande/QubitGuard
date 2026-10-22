"""Pruebas unitarias del módulo security."""

from qubitguard.security import contains_keyword, sanitize_text


def test_sanitize_text_removes_whitespace():
    assert sanitize_text("  hello  ") == "hello"


def test_contains_keyword_is_case_insensitive():
    assert contains_keyword("QubitGuard Security", "guard") is True
    assert contains_keyword("QubitGuard Security", "vault") is False
