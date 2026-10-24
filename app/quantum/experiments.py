"""Experimentos cuánticos simulados con Qiskit Aer."""

from __future__ import annotations

import math
from typing import Any

from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator

MAX_SHOTS = 20_000
MAX_GROVER_QUBITS = 4


def _validate_shots(shots: int) -> int:
    if isinstance(shots, bool) or not isinstance(shots, int) or not 1 <= shots <= MAX_SHOTS:
        raise ValueError(f"shots must be an integer between 1 and {MAX_SHOTS}")
    return shots


def _counts_to_json(counts: dict[str, int]) -> dict[str, int]:
    return {key: int(counts[key]) for key in sorted(counts)}


def run_hadamard(shots: int = 1024, seed: int | None = None) -> dict[str, Any]:
    shots = _validate_shots(shots)
    circuit = QuantumCircuit(1, 1, name="hadamard_measurement")
    circuit.h(0)
    circuit.measure(0, 0)

    simulator = AerSimulator(seed_simulator=seed)
    compiled = transpile(circuit, simulator)
    counts = _counts_to_json(simulator.run(compiled, shots=shots).result().get_counts(compiled))
    total = sum(counts.values())
    return {
        "experiment": "hadamard",
        "backend": "Qiskit AerSimulator (local software simulation)",
        "physical_hardware": False,
        "qubit_count": 1,
        "shots": shots,
        "counts": counts,
        "probabilities": {state: count / total for state, count in counts.items()},
        "total_counts": total,
        "circuit_qasm_like": "q: |0> -- H -- Measure",
        "explanation": "La puerta Hadamard prepara una superposición ideal con probabilidad teórica 1/2 para 0 y 1. Las frecuencias observadas varían por muestreo.",
        "limitations": ["Simulación ideal local; no representa ruido de hardware físico."],
    }


def _phase_oracle_for_basis_state(n_qubits: int, marked_state: str) -> QuantumCircuit:
    oracle = QuantumCircuit(n_qubits, name="phase_oracle")
    for qubit, bit in enumerate(reversed(marked_state)):
        if bit == "0":
            oracle.x(qubit)
    if n_qubits == 1:
        oracle.z(0)
    elif n_qubits == 2:
        oracle.cz(0, 1)
    else:
        oracle.h(n_qubits - 1)
        oracle.mcx(list(range(n_qubits - 1)), n_qubits - 1)
        oracle.h(n_qubits - 1)
    for qubit, bit in enumerate(reversed(marked_state)):
        if bit == "0":
            oracle.x(qubit)
    return oracle


def _diffuser(n_qubits: int) -> QuantumCircuit:
    diffuser = QuantumCircuit(n_qubits, name="diffuser")
    diffuser.h(range(n_qubits))
    diffuser.x(range(n_qubits))
    if n_qubits == 1:
        diffuser.z(0)
    elif n_qubits == 2:
        diffuser.h(n_qubits - 1)
        diffuser.cx(0, n_qubits - 1)
        diffuser.h(n_qubits - 1)
    else:
        diffuser.h(n_qubits - 1)
        diffuser.mcx(list(range(n_qubits - 1)), n_qubits - 1)
        diffuser.h(n_qubits - 1)
    diffuser.x(range(n_qubits))
    diffuser.h(range(n_qubits))
    return diffuser


def build_grover_circuit(n_qubits: int, marked_state: str) -> tuple[QuantumCircuit, int]:
    if isinstance(n_qubits, bool) or not isinstance(n_qubits, int) or not 1 <= n_qubits <= MAX_GROVER_QUBITS:
        raise ValueError(f"n_qubits must be between 1 and {MAX_GROVER_QUBITS}")
    if not isinstance(marked_state, str) or len(marked_state) != n_qubits or any(bit not in "01" for bit in marked_state):
        raise ValueError("marked_state must be a bit string matching n_qubits")

    state_count = 2 ** n_qubits
    iterations = max(0, math.floor((math.pi / 4) * math.sqrt(state_count)))
    circuit = QuantumCircuit(n_qubits, n_qubits, name="grover_demo")
    circuit.h(range(n_qubits))
    oracle = _phase_oracle_for_basis_state(n_qubits, marked_state)
    diffuser = _diffuser(n_qubits)
    for _ in range(iterations):
        circuit.compose(oracle, inplace=True)
        circuit.compose(diffuser, inplace=True)
    circuit.measure(range(n_qubits), range(n_qubits))
    return circuit, iterations


def run_grover(
    n_qubits: int = 3,
    marked_state: str = "101",
    shots: int = 2048,
    seed: int | None = None,
) -> dict[str, Any]:
    shots = _validate_shots(shots)
    circuit, iterations = build_grover_circuit(n_qubits, marked_state)
    simulator = AerSimulator(seed_simulator=seed)
    compiled = transpile(circuit, simulator)
    counts = _counts_to_json(simulator.run(compiled, shots=shots).result().get_counts(compiled))
    total = sum(counts.values())
    success_probability = counts.get(marked_state, 0) / total if total else 0.0
    return {
        "experiment": "grover",
        "backend": "Qiskit AerSimulator (local software simulation)",
        "physical_hardware": False,
        "qubit_count": n_qubits,
        "search_space_size": 2 ** n_qubits,
        "marked_state": marked_state,
        "iterations": iterations,
        "shots": shots,
        "counts": counts,
        "total_counts": total,
        "success_probability_empirical": success_probability,
        "classical_worst_case_queries": 2 ** n_qubits,
        "grover_query_count": iterations,
        "explanation": "El oráculo invierte la fase del estado sintético marcado y el difusor amplifica su amplitud. La probabilidad reportada es la frecuencia observada en las mediciones simuladas.",
        "limitations": [
            "El espacio es sintético y muy pequeño; no se busca una contraseña real.",
            "El número de iteraciones es una elección teórica aproximada para un único estado marcado.",
            "Simulación ideal local; no representa ruido ni restricciones de hardware físico.",
        ],
        "circuit_summary": f"H en {n_qubits} qubits; oracle + diffuser repetidos {iterations} veces; medición de todos los qubits.",
    }
