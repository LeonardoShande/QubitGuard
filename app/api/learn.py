"""Contenido educativo: criptografía poscuántica y limitaciones. Se lee una vez al importar."""

import json
from pathlib import Path

from fastapi import APIRouter

router = APIRouter(prefix="/api/learn", tags=["Learn"])

_CONTENT = Path(__file__).resolve().parent.parent / "content"
_PQC = json.loads((_CONTENT / "pqc.json").read_text(encoding="utf-8"))
_LIMITATIONS = json.loads((_CONTENT / "limitations.json").read_text(encoding="utf-8"))


@router.get("/pqc")
def pqc():
    return _PQC


@router.get("/limitations")
def limitations():
    return _LIMITATIONS
