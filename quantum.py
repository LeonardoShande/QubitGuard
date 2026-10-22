"""Compatibilidad: import de la API desde la raíz del proyecto."""

from app.api.quantum import router

__all__ = ["router"]
