"""Pruebas del laboratorio cuántico."""

from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.quantum.experiments import build_grover_circuit, run_grover, run_hadamard

client = TestClient(app)


def test_hadamard_executes_real_qiskit_simulation():
    result = run_hadamard(shots=256, seed=1234)
    assert result["backend"].startswith("Qiskit AerSimulator")
    assert result["physical_hardware"] is False
    assert result["total_counts"] == 256
    assert sum(result["counts"].values()) == 256
    assert set(result["counts"]).issubset({"0", "1"})
    assert set(result["counts"])  # at least one measurement outcome exists


def test_grover_builds_and_executes_a_measured_circuit():
    circuit, iterations = build_grover_circuit(3, "101")
    assert circuit.num_qubits == 3
    assert circuit.num_clbits == 3
    assert iterations >= 1
    assert any(item.operation.name == "measure" for item in circuit.data)

    result = run_grover(n_qubits=3, marked_state="101", shots=1024, seed=7)
    assert result["physical_hardware"] is False
    assert result["total_counts"] == 1024
    assert result["search_space_size"] == 8
    assert result["marked_state"] == "101"
    assert 0.0 <= result["success_probability_empirical"] <= 1.0
    assert sum(result["counts"].values()) == 1024


def test_grover_rejects_mismatched_marked_state():
    with pytest.raises(ValueError):
        build_grover_circuit(3, "10")


def test_shots_are_bounded():
    with pytest.raises(ValueError):
        run_hadamard(shots=0)
    with pytest.raises(ValueError):
        run_grover(n_qubits=3, marked_state="101", shots=20001)


def test_hadamard_api():
    response = client.post("/api/quantum/hadamard-demo", json={"shots": 128, "seed": 5})
    assert response.status_code == 200
    payload = response.json()
    assert payload["total_counts"] == 128
    assert payload["physical_hardware"] is False


def test_grover_api_validates_bitstring_length():
    response = client.post("/api/quantum/grover-demo", json={"n_qubits": 3, "marked_state": "10", "shots": 128})
    assert response.status_code == 422
