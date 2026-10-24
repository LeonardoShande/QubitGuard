import pytest


def test_health_and_capabilities(client):
    health = client.get("/api/health")
    assert health.status_code == 200
    assert health.json() == {"status": "ok", "service": "QubitGuard Quantum Lab"}
    capabilities = client.get("/api/quantum/capabilities")
    assert capabilities.status_code == 200
    assert {"qiskit_version", "aer_version", "min_qubits", "max_qubits", "max_shots", "noise_model", "physical_hardware"} <= capabilities.json().keys()


def test_quantum_endpoints_shapes(client):
    grover = client.post("/api/quantum/grover", json={"n_qubits": 3, "marked_state": "101", "shots": 64, "seed": 4})
    assert grover.status_code == 200
    assert {"counts", "measured_success", "theoretical_success", "optimal_iterations", "iterations", "n_qubits", "marked_state", "shots", "depth", "two_qubit_gates", "backend", "noisy", "circuit_text"} <= grover.json().keys()
    curve = client.post("/api/quantum/grover-curve", json={"n_qubits": 3})
    assert curve.status_code == 200
    assert {"n_qubits", "optimal_iterations", "iterations", "probability"} <= curve.json().keys()
    montecarlo = client.post("/api/quantum/montecarlo", json={"n_bits": 4, "trials": 10, "seed": 4})
    assert montecarlo.status_code == 200
    assert {"n_bits", "N", "trials", "mean_attempts", "expected_attempts", "histogram"} <= montecarlo.json().keys()
    compare = client.get("/api/quantum/compare")
    assert compare.status_code == 200
    assert "rows" in compare.json()
    if compare.json()["rows"]:
        assert {"bits", "N", "classical_expected", "grover_iterations", "speedup"} <= compare.json()["rows"][0].keys()


@pytest.mark.parametrize("payload", [
    {"n_qubits": 1, "marked_state": "0"}, {"n_qubits": 7, "marked_state": "0"},
    {"n_qubits": 3, "marked_state": "10"}, {"n_qubits": 3, "marked_state": "1x0"},
    {"n_qubits": 3, "marked_state": "000", "shots": 0}, {"n_qubits": 3, "marked_state": "000", "shots": 8193},
    {"n_qubits": 3, "marked_state": "000", "iterations": -1},
])
def test_grover_rejects_invalid_payloads(client, payload):
    assert client.post("/api/quantum/grover", json=payload).status_code == 422


@pytest.mark.parametrize("payload", [{"n_bits": 21}, {"n_bits": 4, "trials": 0}])
def test_montecarlo_rejects_invalid_payloads(client, payload):
    assert client.post("/api/quantum/montecarlo", json=payload).status_code == 422


def test_compare_rejects_too_few_bits(client):
    assert client.get("/api/quantum/compare", params={"max_bits": 1}).status_code == 422


@pytest.mark.parametrize("path,payload", [
    ("/api/quantum/grover", {"n_qubits": 3, "marked_state": "000", "extra": 1}),
    ("/api/quantum/grover-curve", {"n_qubits": 3, "extra": 1}),
    ("/api/quantum/montecarlo", {"n_bits": 3, "extra": 1}),
])
def test_post_bodies_reject_extra_fields(client, path, payload):
    assert client.post(path, json=payload).status_code == 422


def test_learning_content_and_daily_challenge(client):
    pqc = client.get("/api/learn/pqc")
    assert pqc.status_code == 200
    cards = pqc.json()["cards"]
    assert len(cards) >= 4
    assert all(card.get("sources") and all(source.get("url") for source in card["sources"]) for card in cards)
    limitations = client.get("/api/learn/limitations")
    assert limitations.status_code == 200
    assert len(limitations.json()["items"]) >= 5
    first = client.get("/api/challenge/daily")
    second = client.get("/api/challenge/daily")
    assert first.status_code == second.status_code == 200
    challenge = first.json()
    assert challenge == second.json()
    assert 0 <= challenge["answer_index"] < len(challenge["options"])


def test_oversized_seed_is_rejected_with_422_not_500(client):
    for path, extra in (("/api/quantum/grover", {"n_qubits": 2, "marked_state": "01"}), ("/api/quantum/montecarlo", {})):
        assert client.post(path, json={**extra, "seed": 2**32 - 1}).status_code == 200
        assert client.post(path, json={**extra, "seed": 2**63}).status_code == 422


def test_oversized_seed_rejected_in_library():
    import pytest
    from app.quantum import experiments
    with pytest.raises(ValueError):
        experiments.run_grover(n_qubits=2, marked_state="01", seed=2**63)


def test_compare_includes_requested_size(client):
    for max_bits in (2, 3, 41):
        bits = [row["bits"] for row in client.get("/api/quantum/compare", params={"max_bits": max_bits}).json()["rows"]]
        assert bits and bits[-1] == max_bits
