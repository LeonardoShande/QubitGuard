"""Experimentos educativos locales: Grover con Qiskit y búsqueda clásica con NumPy."""

from __future__ import annotations

import math
from functools import lru_cache
from typing import Any

import numpy as np
# Qiskit 2.6/Python 3.13 necesita importarse antes de los hilos efímeros del servidor.
import qiskit
import qiskit_aer
from qiskit import QuantumCircuit, transpile
from qiskit.quantum_info import Statevector
from qiskit_aer import AerSimulator
from qiskit_ibm_runtime.fake_provider import FakeFez

MIN_GROVER_QUBITS = 2
MAX_GROVER_QUBITS = 6
MAX_SHOTS = 8192


def _validate_integer(name: str, value: int, minimum: int, maximum: int) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or not minimum <= value <= maximum:
        raise ValueError(f"{name} must be an integer between {minimum} and {maximum}")
    return value


def _validate_seed(seed: int | None) -> None:
    if seed is not None and (isinstance(seed, bool) or not isinstance(seed, int) or seed < 0):
        raise ValueError("seed must be a non-negative integer or null")


def optimal_iterations(n_qubits: int) -> int:
    _validate_integer("n_qubits", n_qubits, MIN_GROVER_QUBITS, MAX_GROVER_QUBITS)
    theta = math.asin(1 / math.sqrt(2 ** n_qubits))
    return math.floor(math.pi / (4 * theta))


def theoretical_success(n_qubits: int, iterations: int) -> float:
    _validate_integer("n_qubits", n_qubits, MIN_GROVER_QUBITS, MAX_GROVER_QUBITS)
    _validate_integer("iterations", iterations, 0, 20)
    theta = math.asin(1 / math.sqrt(2 ** n_qubits))
    return math.sin((2 * iterations + 1) * theta) ** 2


def _phase_oracle_for_basis_state(n_qubits: int, marked_state: str) -> QuantumCircuit:
    oracle = QuantumCircuit(n_qubits, name="phase_oracle")
    zero_qubits = [i for i, bit in enumerate(reversed(marked_state)) if bit == "0"]
    for qubit in zero_qubits:
        oracle.x(qubit)
    oracle.h(n_qubits - 1)
    oracle.mcx(list(range(n_qubits - 1)), n_qubits - 1)
    oracle.h(n_qubits - 1)
    for qubit in zero_qubits:
        oracle.x(qubit)
    return oracle


def _diffuser(n_qubits: int) -> QuantumCircuit:
    diffuser = QuantumCircuit(n_qubits, name="diffuser")
    diffuser.h(range(n_qubits))
    diffuser.compose(_phase_oracle_for_basis_state(n_qubits, "0" * n_qubits), inplace=True)
    diffuser.h(range(n_qubits))
    return diffuser


def build_grover_circuit(
    n_qubits: int,
    marked_state: str,
    iterations: int | None = None,
    *,
    measure: bool = True,
) -> tuple[QuantumCircuit, int]:
    optimum = optimal_iterations(n_qubits)
    if not isinstance(marked_state, str) or len(marked_state) != n_qubits or any(bit not in "01" for bit in marked_state):
        raise ValueError("marked_state must contain exactly n_qubits binary digits")
    iterations = optimum if iterations is None else _validate_integer("iterations", iterations, 0, 20)
    circuit = QuantumCircuit(n_qubits, name="grover_demo")
    circuit.h(range(n_qubits))
    oracle = _phase_oracle_for_basis_state(n_qubits, marked_state)
    diffuser = _diffuser(n_qubits)
    for _ in range(iterations):
        circuit.compose(oracle, inplace=True)
        circuit.compose(diffuser, inplace=True)
    if measure:
        circuit.measure_all()
    return circuit, iterations


@lru_cache(maxsize=1)
def _noisy_backend() -> AerSimulator:
    return AerSimulator.from_backend(FakeFez())


def capabilities() -> dict[str, Any]:
    return {
        "qiskit_version": qiskit.__version__,
        "aer_version": qiskit_aer.__version__,
        "min_qubits": MIN_GROVER_QUBITS,
        "max_qubits": MAX_GROVER_QUBITS,
        "max_shots": MAX_SHOTS,
        "noise_model": "FakeFez (qiskit_ibm_runtime.fake_provider)",
        "physical_hardware": False,
    }


def run_grover(
    n_qubits: int = 4,
    marked_state: str = "0101",
    shots: int = 1024,
    seed: int | None = None,
    iterations: int | None = None,
    noisy: bool = False,
) -> dict[str, Any]:
    _validate_integer("shots", shots, 1, MAX_SHOTS)
    _validate_seed(seed)
    if not isinstance(noisy, bool):
        raise ValueError("noisy must be a boolean")
    circuit, iterations = build_grover_circuit(n_qubits, marked_state, iterations)
    simulator = _noisy_backend() if noisy else AerSimulator(seed_simulator=seed)
    compiled = transpile(circuit, simulator, seed_transpiler=seed, optimization_level=3 if noisy else 1)
    raw_counts = simulator.run(compiled, shots=shots, seed_simulator=seed).result().get_counts(compiled)
    counts = {state: int(raw_counts[state]) for state in sorted(raw_counts)}
    return {
        "counts": counts,
        "measured_success": counts.get(marked_state, 0) / shots,
        "theoretical_success": theoretical_success(n_qubits, iterations),
        "optimal_iterations": optimal_iterations(n_qubits),
        "iterations": iterations,
        "n_qubits": n_qubits,
        "marked_state": marked_state,
        "shots": shots,
        "depth": compiled.depth(),
        "two_qubit_gates": sum(instruction.operation.num_qubits == 2 for instruction in compiled.data),
        "backend": "AerSimulator.from_backend(FakeFez)" if noisy else "AerSimulator (ideal)",
        "noisy": noisy,
        "circuit_text": str(circuit.draw("text", fold=120)),
    }


def grover_curve(n_qubits: int) -> dict[str, Any]:
    optimum = optimal_iterations(n_qubits)
    iterations = list(range(2 * optimum + 1))
    marked_state = "1" * n_qubits
    probabilities = []
    for k in iterations:
        circuit, _ = build_grover_circuit(n_qubits, marked_state, k, measure=False)
        probabilities.append(float(Statevector.from_instruction(circuit).probabilities()[int(marked_state, 2)]))
    return {
        "n_qubits": n_qubits,
        "optimal_iterations": optimum,
        "iterations": iterations,
        "probability": probabilities,
    }


def montecarlo(n_bits: int = 4, trials: int = 1000, seed: int | None = None) -> dict[str, Any]:
    _validate_integer("n_bits", n_bits, 2, 20)
    _validate_integer("trials", trials, 1, 5000)
    _validate_seed(seed)
    N = 2 ** n_bits
    # La posición del secreto en una permutación aleatoria es uniforme entre 1 y N.
    attempts = np.random.default_rng(seed).integers(1, N + 1, size=trials)
    width = 1 if N <= 64 else N // 32
    edges = np.arange(1, N + 2, width)
    counts, _ = np.histogram(attempts, bins=edges)
    return {
        "n_bits": n_bits,
        "N": N,
        "trials": trials,
        "mean_attempts": float(attempts.mean()),
        "expected_attempts": (N + 1) / 2,
        "histogram": {"bins": edges[:-1].tolist(), "counts": counts.tolist()},
    }


def compare(max_bits: int = 40) -> dict[str, Any]:
    _validate_integer("max_bits", max_bits, 2, 256)
    bits_values = sorted(set(range(4, max_bits + 1, 4)) | {bits for bits in (128, 256) if bits <= max_bits})
    rows = []
    for bits in bits_values:
        N = 2 ** bits
        classical_expected = (N + 1) / 2
        estimate = math.pi / 4 * math.sqrt(N)
        grover_iterations = math.floor(estimate) if bits <= 52 else estimate
        rows.append({
            "bits": bits,
            "N": N if bits <= 52 else float(N),
            "classical_expected": classical_expected,
            "grover_iterations": grover_iterations,
            "speedup": classical_expected / max(grover_iterations, 1),
        })
    return {"rows": rows}
