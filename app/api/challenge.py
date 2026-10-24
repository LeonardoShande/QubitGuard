"""Reto diario determinista por fecha UTC (fase 3)."""

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/challenge", tags=["Challenge"])


@router.get("/daily")
def daily():
    raise HTTPException(status_code=501, detail="Pendiente de implementar (fase 3).")
