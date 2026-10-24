"""Rutas HTTP del laboratorio cuántico (contrato fijo, ver docs/API.md)."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field

router = APIRouter(prefix="/api/quantum", tags=["Quantum Lab"])

MIN_QUBITS, MAX_QUBITS = 2, 6


class GroverRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    n_qubits: int = Field(default=4, ge=MIN_QUBITS, le=MAX_QUBITS)
    marked_state: str = Field(default="0101", min_length=MIN_QUBITS, max_length=MAX_QUBITS, pattern="^[01]+$")
    iterations: int | None = Field(default=None, ge=0, le=20)
    shots: int = Field(default=1024, ge=1, le=8192)
    seed: int | None = Field(default=None, ge=0)
    noisy: bool = False


class CurveRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    n_qubits: int = Field(default=4, ge=MIN_QUBITS, le=MAX_QUBITS)


class MonteCarloRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    n_bits: int = Field(default=4, ge=2, le=20)
    trials: int = Field(default=1000, ge=1, le=5000)
    seed: int | None = Field(default=None, ge=0)


def _todo():
    raise HTTPException(status_code=501, detail="Pendiente de implementar (fase 1).")


@router.get("/capabilities")
def capabilities():
    _todo()


@router.post("/grover")
def grover(request: GroverRequest):
    _todo()


@router.post("/grover-curve")
def grover_curve(request: CurveRequest):
    _todo()


@router.post("/montecarlo")
def montecarlo(request: MonteCarloRequest):
    _todo()


@router.get("/compare")
def compare(max_bits: int = Query(default=40, ge=2, le=256)):
    _todo()
