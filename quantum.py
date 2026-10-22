from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.quantum.experiments import MAX_GROVER_QUBITS, MAX_SHOTS, run_grover, run_hadamard

router = APIRouter(prefix="/api/quantum", tags=["Quantum Lab"])


class HadamardRequest(BaseModel):
    shots: int = Field(default=1024, ge=1, le=MAX_SHOTS)
    seed: int | None = Field(default=None, ge=0)


class GroverRequest(BaseModel):
    n_qubits: int = Field(default=3, ge=1, le=MAX_GROVER_QUBITS)
    marked_state: str = Field(default="101", min_length=1, max_length=MAX_GROVER_QUBITS, pattern="^[01]+$")
    shots: int = Field(default=2048, ge=1, le=MAX_SHOTS)
    seed: int | None = Field(default=None, ge=0)


@router.post("/hadamard-demo")
def hadamard_demo(request: HadamardRequest):
    try:
        return run_hadamard(shots=request.shots, seed=request.seed)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="La simulación Hadamard falló.") from exc


@router.post("/grover-demo")
def grover_demo(request: GroverRequest):
    if len(request.marked_state) != request.n_qubits:
        raise HTTPException(status_code=422, detail="marked_state debe tener exactamente n_qubits bits.")
    try:
        return run_grover(
            n_qubits=request.n_qubits,
            marked_state=request.marked_state,
            shots=request.shots,
            seed=request.seed,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="La simulación Grover falló.") from exc


@router.get("/capabilities")
def capabilities():
    return {
        "qiskit_available": True,
        "simulator": "Qiskit AerSimulator",
        "physical_hardware": False,
        "experiments": ["hadamard-demo", "grover-demo"],
        "max_grover_qubits": MAX_GROVER_QUBITS,
        "max_shots": MAX_SHOTS,
    }
