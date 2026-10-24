"""Aplicación principal de QubitGuard: API + frontend estático en un solo proceso."""

from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.api.challenge import router as challenge_router
from app.api.learn import router as learn_router
from app.api.quantum import router as quantum_router

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

app = FastAPI(
    title="QubitGuard Quantum Lab API",
    version="1.0.0",
    description="Laboratorio educativo: búsqueda Monte Carlo frente a Grover con Qiskit. "
    "Las contraseñas se analizan solo en el navegador; ningún endpoint las recibe.",
)

app.include_router(quantum_router)
app.include_router(learn_router)
app.include_router(challenge_router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "QubitGuard Quantum Lab"}


# El frontend se sirve desde frontend/ (index.html, styles.css y dist/*.js compilado con tsc).
if (FRONTEND_DIR / "index.html").exists():
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
