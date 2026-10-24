"""Reto diario determinista por fecha UTC. Solo usa math: no importa qiskit."""

import hashlib
import math
import random
from datetime import date, datetime, timezone

from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api/challenge", tags=["Challenge"])

KINDS = ("optimal_iterations", "success_probability", "classical_vs_grover")


def _theta(n: int) -> float:
    return math.asin(1 / math.sqrt(2**n))


def optimal_iterations(n: int) -> int:
    return math.floor(math.pi / (4 * _theta(n)))


def success_prob(n: int, k: int) -> float:
    return math.sin((2 * k + 1) * _theta(n)) ** 2


def _options(rng: random.Random, correct: str, candidates: list[str]) -> tuple[list[str], int]:
    """4 opciones únicas que incluyen la correcta, barajadas de forma determinista."""
    pool = [c for c in dict.fromkeys(candidates) if c != correct]
    opts = [correct] + rng.sample(pool, 3)
    rng.shuffle(opts)
    return opts, opts.index(correct)


def _optimal_iterations(rng):
    n = rng.randint(2, 6)
    ans = optimal_iterations(n)
    opts, idx = _options(rng, str(ans), [str(v) for v in range(1, 10)])
    return {
        "n_qubits": n,
        "question": f"Con {n} qubits hay {2**n} estados posibles. ¿Cuántas iteraciones de Grover son óptimas para encontrar el estado marcado?",
        "options": opts, "answer_index": idx,
        "explanation": f"Cada iteración de Grover gira el estado un ángulo 2θ, con θ = asin(1/√{2**n}) ≈ {_theta(n):.3f} rad. "
        f"Lo mejor es parar cerca de π/2, es decir, después de floor(π/(4θ)) = {ans} iteraciones. "
        "Si te pasas, la probabilidad empieza a bajar otra vez: más iteraciones no siempre es mejor.",
    }


def _success_probability(rng):
    n = rng.randint(3, 6)
    k = rng.randint(1, max(1, optimal_iterations(n)))
    p = round(success_prob(n, k) * 100)
    ans = f"{p}%"
    cands = [f"{v}%" for v in {p - 25, p - 10, p + 10, p - 40, p + 5, p - 18, p + 20} if 1 <= v <= 100 and v != p]
    # relleno de seguridad: siempre hay >= 3 candidatos distintos
    cands += [f"{v}%" for v in (3, 12, 50, 77) if f"{v}%" != ans and f"{v}%" not in cands]
    opts, idx = _options(rng, ans, sorted(cands))
    return {
        "n_qubits": n,
        "question": f"Con {n} qubits ({2**n} estados), ¿qué probabilidad aproximada hay de medir el estado marcado tras {k} iteración(es) de Grover?",
        "options": opts, "answer_index": idx,
        "explanation": f"La probabilidad es sin²((2k+1)·θ) con θ = asin(1/√{2**n}) y k = {k}. "
        f"Resulta {success_prob(n, k):.3f}, o sea ≈ {p}%. Sin iterar (k = 0) solo habría 1/{2**n} ≈ {100 / 2**n:.1f}% de acierto.",
    }


def _classical_vs_grover(rng):
    n = rng.choice([4, 6, 8, 10, 12, 16, 20])
    N = 2**n
    classical = (N + 1) / 2
    grover = math.floor(math.pi / 4 * math.sqrt(N))
    ans = f"{classical:g} intentos clásicos vs {grover} iteraciones de Grover"
    others = [(classical * f, max(1, math.floor(grover * g))) for f, g in ((2, 1), (0.5, 2), (1, 3), (0.25, 0.5), (4, 1.5))]
    cands = [f"{c:g} intentos clásicos vs {g} iteraciones de Grover" for c, g in others]
    opts, idx = _options(rng, ans, cands)
    return {
        "n_qubits": n,
        "question": f"Buscas un secreto de {n} bits ({N} posibilidades). ¿Cuántos intentos esperaría una búsqueda aleatoria clásica y cuántas iteraciones necesita Grover?",
        "options": opts, "answer_index": idx,
        "explanation": f"Al azar, sin repetir, esperas probar (N+1)/2 = {classical:g} claves. Grover necesita ≈ π/4·√N = {grover} iteraciones. "
        "La ventaja es cuadrática: crece con N, pero no vuelve fácil un problema enorme.",
    }


_BUILDERS = {"optimal_iterations": _optimal_iterations, "success_probability": _success_probability,
             "classical_vs_grover": _classical_vs_grover}


@router.get("/daily")
def daily(date_: str | None = Query(None, alias="date", description="YYYY-MM-DD (UTC); por defecto hoy")):
    if date_ is None:
        day = datetime.now(timezone.utc).date()
    else:
        try:
            day = date.fromisoformat(date_)
        except ValueError:
            raise HTTPException(status_code=422, detail="date debe ser YYYY-MM-DD")
    iso = day.isoformat()
    rng = random.Random(int.from_bytes(hashlib.sha256(iso.encode()).digest()[:8], "big"))
    kind = rng.choice(KINDS)
    return {"date": iso, "id": iso, "kind": kind, **_BUILDERS[kind](rng)}
