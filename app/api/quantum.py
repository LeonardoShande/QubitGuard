"""Rutas HTTP del laboratorio cuántico (contrato fijo, ver docs/API.md)."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field

from app.quantum import experiments

router = APIRouter(prefix="/api/quantum", tags=["Quantum Lab"])

MIN_QUBITS, MAX_QUBITS = 2, 6


class GroverRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    n_qubits: int = Field(default=4, ge=MIN_QUBITS, le=MAX_QUBITS)
    marked_state: str = Field(default="0101", min_length=MIN_QUBITS, max_length=MAX_QUBITS, pattern="^[01]+$")
    iterations: int | None = Field(default=None, ge=0, le=20)
    shots: int = Field(default=1024, ge=1, le=8192)
    seed: int | None = Field(default=None, ge=0, le=2**32 - 1)
    noisy: bool = False


class CurveRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    n_qubits: int = Field(default=4, ge=MIN_QUBITS, le=MAX_QUBITS)


class MonteCarloRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    n_bits: int = Field(default=4, ge=2, le=20)
    trials: int = Field(default=1000, ge=1, le=5000)
    seed: int | None = Field(default=None, ge=0, le=2**32 - 1)


@router.get("/capabilities")
def capabilities():
    return experiments.capabilities()


@router.post("/grover")
def grover(request: GroverRequest):
    try:
        return experiments.run_grover(**request.model_dump())
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@router.post("/grover-curve")
def grover_curve(request: CurveRequest):
    try:
        return experiments.grover_curve(request.n_qubits)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@router.post("/montecarlo")
def montecarlo(request: MonteCarloRequest):
    try:
        return experiments.montecarlo(**request.model_dump())
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@router.get("/compare")
def compare(max_bits: int = Query(default=40, ge=2, le=256)):
    try:
        return experiments.compare(max_bits)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
