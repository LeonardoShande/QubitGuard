"""Los escenarios didácticos usan el motor existente, sin recibir contraseñas."""
import pytest


@pytest.mark.parametrize("n,k,expected", [(3, 0, 0.125), (4, 3, 0.9613189697265625), (4, 5, 0.1254916787147522)])
def test_vault_scenarios_match_lesson(client, n, k, expected):
    response = client.post("/api/quantum/grover", json={
        "n_qubits": n, "marked_state": "1" * n, "iterations": k,
        "shots": 512, "seed": 42, "noisy": False,
    })
    assert response.status_code == 200
    data = response.json()
    assert data["theoretical_success"] == pytest.approx(expected, abs=1e-12)
    assert sum(data["counts"].values()) == 512
    assert abs(data["measured_success"] - expected) < 0.06
