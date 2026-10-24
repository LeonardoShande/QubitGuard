"""Contenido educativo: criptografía poscuántica y limitaciones (fase 3)."""

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/learn", tags=["Learn"])


@router.get("/pqc")
def pqc():
    raise HTTPException(status_code=501, detail="Pendiente de implementar (fase 3).")


@router.get("/limitations")
def limitations():
    raise HTTPException(status_code=501, detail="Pendiente de implementar (fase 3).")
