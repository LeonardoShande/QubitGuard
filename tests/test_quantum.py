import math

import pytest


@pytest.mark.parametrize("n,expected", [(2, 1), (3, 2), (4, 3), (5, 4), (6, 6)])
def test_grover_optimum_and_success_probability(client, n, expected):
    state = "0" * n
    result = client.post("/api/quantum/grover", json={"n_qubits": n, "marked_state": state, "shots": 100, "seed": 11}).json()
    theta = math.asin(1 / math.sqrt(2**n))
    assert result["optimal_iterations"] == expected == math.floor(math.pi / (4 * theta))
    assert result["iterations"] == expected
    assert result["theoretical_success"] == pytest.approx(math.sin((2 * expected + 1) * theta) ** 2, abs=1e-9)


@pytest.mark.parametrize("n", range(2, 7))
def test_grover_curve_starts_uniform_and_peaks_at_optimum(client, n):
    response = client.post("/api/quantum/grover-curve", json={"n_qubits": n})
    assert response.status_code == 200
    data = response.json()
    assert data["probability"][0] == pytest.approx(1 / (2**n))
    assert data["iterations"][data["probability"].index(max(data["probability"]))] == data["optimal_iterations"]


def test_grover_ideal_counts_are_seeded_and_consistent(client):
    payload = {"n_qubits": 4, "marked_state": "0101", "shots": 2048, "seed": 127}
    first = client.post("/api/quantum/grover", json=payload)
    second = client.post("/api/quantum/grover", json=payload)
    assert first.status_code == second.status_code == 200
    result = first.json()
    assert result["counts"] == second.json()["counts"]
    assert sum(result["counts"].values()) == payload["shots"]
    assert result["measured_success"] > 0.9
    assert abs(result["measured_success"] - result["theoretical_success"]) < 0.05


def test_two_qubit_grover_finds_marked_state(client):
    result = client.post("/api/quantum/grover", json={"n_qubits": 2, "marked_state": "10", "iterations": 1, "shots": 128, "seed": 3}).json()
    assert result["measured_success"] == 1.0


def test_montecarlo_distribution_and_expected_attempts(client):
    result = client.post("/api/quantum/montecarlo", json={"n_bits": 10, "trials": 5000, "seed": 1}).json()
    assert result["expected_attempts"] == 512.5
    assert abs(result["mean_attempts"] - 512.5) < 20


def test_compare_speedup_grows_with_bits(client):
    result = client.get("/api/quantum/compare", params={"max_bits": 40})
    assert result.status_code == 200
    speedups = [row["speedup"] for row in result.json()["rows"]]
    assert len(speedups) >= 2
    assert speedups[-1] > speedups[0]


@pytest.mark.slow
def test_noisy_grover_uses_fake_fez_backend(client):
    result = client.post("/api/quantum/grover", json={"n_qubits": 3, "marked_state": "101", "shots": 128, "seed": 9, "noisy": True})
    assert result.status_code == 200
    assert result.json()["noisy"] is True
    assert "FakeFez" in result.json()["backend"]
