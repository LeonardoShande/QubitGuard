"""Configuración principal del proyecto."""

from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    """Configuración compartida del sistema."""

    app_name: str = "QubitGuard"
    environment: str = "development"
    debug: bool = True
