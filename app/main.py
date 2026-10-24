"""Aplicación principal de QubitGuard: API + frontend estático en un solo proceso."""

from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.gzip import GZipMiddleware

from app.api.challenge import router as challenge_router
from app.api.learn import router as learn_router
from app.api.quantum import router as quantum_router
from app.quantum.experiments import SimulatorBusy

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

app = FastAPI(
    title="QubitGuard Quantum Lab API",
    version="1.0.0",
    description="Laboratorio educativo: búsqueda Monte Carlo frente a Grover con Qiskit. "
    "Las contraseñas se analizan solo en el navegador; ningún endpoint las recibe.",
)
app.add_middleware(GZipMiddleware, minimum_size=1024)

app.include_router(quantum_router)
app.include_router(learn_router)
app.include_router(challenge_router)


@app.exception_handler(SimulatorBusy)
async def simulator_busy_handler(request: Request, error: SimulatorBusy):
    return JSONResponse(
        status_code=503,
        content={"detail": "Simulador ocupado, reintenta"},
        headers={"Retry-After": "2"},
    )


DOCS_PATHS = {"/docs", "/redoc", "/openapi.json"}
# frontend/ también contiene src/, node_modules/ y package.json: solo se publica lo que el navegador necesita.
PUBLIC_FILES = {"/", "/index.html", "/styles.css"}
PUBLIC_PREFIXES = ("/api/", "/dist/", "/assets/")


@app.middleware("http")
async def response_policies(request: Request, call_next):
    path = request.url.path
    if path not in PUBLIC_FILES and path not in DOCS_PATHS and not path.startswith(PUBLIC_PREFIXES):
        response = JSONResponse(status_code=404, content={"detail": "Not Found"})
    else:
        response = await call_next(request)
    if path not in DOCS_PATHS:
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; "
            "base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
        )
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), interest-cohort=()"
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    response.headers["X-Frame-Options"] = "DENY"
    # Añadir HSTS solo detrás de HTTPS/Cloudflare.
    if path.startswith("/api/"):
        cache_control = "no-store"
        if request.method == "GET":
            if path.startswith("/api/learn/") or path in {"/api/quantum/compare", "/api/quantum/capabilities"}:
                cache_control = "public, max-age=3600"
            elif path == "/api/challenge/daily":
                cache_control = "public, max-age=300"
        response.headers["Cache-Control"] = cache_control
    elif path not in DOCS_PATHS:
        # ETag hace barata la revalidación del HTML y de los recursos tras recompilar la demo.
        response.headers["Cache-Control"] = "no-cache"
    return response


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "QubitGuard Quantum Lab"}


# El frontend se sirve desde frontend/ (index.html, styles.css y dist/*.js compilado con tsc).
if (FRONTEND_DIR / "index.html").exists():
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
