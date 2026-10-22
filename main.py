from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.quantum import router as quantum_router

app = FastAPI(
    title="QubitGuard Quantum Lab API",
    version="0.1.0",
    description="Circuitos Qiskit educativos ejecutados en un simulador local. No usa hardware físico.",
)

# Restrict CORS to local development origins. Adjust explicitly for deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

app.include_router(quantum_router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "QubitGuard Quantum Lab", "physical_hardware": False}
