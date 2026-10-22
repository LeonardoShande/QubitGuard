"""Ejemplo de uso básico del paquete QubitGuard."""

from qubitguard.security import contains_keyword, sanitize_text

raw = "  QubitGuard analysis  "
clean = sanitize_text(raw)
print(f"Sanitized: '{clean}'")
print(f"Contains 'guard': {contains_keyword(clean, 'guard')}")
