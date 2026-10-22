"""Funciones de utilidad para validación y seguridad."""


def sanitize_text(value: str) -> str:
    """Normaliza el input eliminando espacios innecesarios."""
    if value is None:
        return ""
    return value.strip()


def contains_keyword(value: str, keyword: str) -> bool:
    """Verifica si un texto contiene el keyword indicado."""
    if not value or not keyword:
        return False
    return keyword.lower() in value.lower()
