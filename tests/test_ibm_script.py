import json
from types import SimpleNamespace

import pytest
from qiskit.primitives import BackendSamplerV2
from qiskit.providers.fake_provider import GenericBackendV2

from scripts import run_ibm_hardware as cli


@pytest.mark.parametrize("argv", [
    ["--marked", "10"], ["--marked", "10x"], ["--n-qubits", "7"],
    ["--shots", "0"], ["--shots", "8193"], ["--iterations", "21"],
    ["--seed", "-1"], ["--seed", str(2**32)], ["--job-id", "existing"],
])
def test_invalid_args(argv):
    with pytest.raises(SystemExit) as error:
        cli.parse_args(argv)
    assert error.value.code == 2


def test_no_token_argument(capsys):
    with pytest.raises(SystemExit):
        cli.parse_args(["--help"])
    assert "--token" not in capsys.readouterr().out
    with pytest.raises(SystemExit) as error:
        cli.parse_args(["--token", "secret-sentinel"])
    assert error.value.code == 2
    assert "secret-sentinel" not in capsys.readouterr().err


def test_service_environment(monkeypatch):
    calls = []
    monkeypatch.setattr(cli, "QiskitRuntimeService", lambda **kwargs: calls.append(kwargs))
    monkeypatch.setenv("QISKIT_IBM_TOKEN", "test-only-secret")
    monkeypatch.setenv("QISKIT_IBM_INSTANCE", "test-instance")
    cli.build_service()
    assert calls[-1] == {"channel": "ibm_quantum_platform", "token": "test-only-secret",
                         "instance": "test-instance"}
    cli.build_service("explicit-instance")
    assert calls[-1]["instance"] == "explicit-instance"
    monkeypatch.delenv("QISKIT_IBM_TOKEN")
    cli.build_service()
    assert calls[-1] == {"instance": "test-instance"}
    monkeypatch.delenv("QISKIT_IBM_INSTANCE")
    cli.build_service()
    assert calls[-1] == {}


def test_account_error_is_safe(monkeypatch):
    def fail(**kwargs):
        raise RuntimeError("secret-sentinel")
    monkeypatch.setattr(cli, "QiskitRuntimeService", fail)
    with pytest.raises(cli.CLIError, match="No se pudo abrir la cuenta") as error:
        cli.build_service()
    assert "secret-sentinel" not in str(error.value)


@pytest.mark.slow
def test_fake_end_to_end(tmp_path, monkeypatch):
    def no_network(*args, **kwargs):
        pytest.fail("El modo fake intentó abrir una cuenta IBM")
    monkeypatch.setattr(cli, "QiskitRuntimeService", no_network)
    out = tmp_path / "fake.json"
    assert cli.main(["--mode", "fake", "--n-qubits", "3", "--marked", "101",
                     "--shots", "256", "--seed", "7", "--out", str(out)]) == 0
    report = json.loads(out.read_text())
    assert {"date_utc", "versions", "backend", "job_id", "n", "marked", "k", "shots",
            "seed", "depth", "two_qubit_gates", "layout", "counts", "measured_success",
            "theoretical_success", "random_success"} <= report.keys()
    assert report["mode"] == "fake" and report["physical_hardware"] is False
    assert report["job_id"] is None and report["backend"] == "fake_fez"
    assert report["shots"] == sum(report["counts"].values()) == 256
    assert report["n"] == 3 and report["marked"] == "101" and report["k"] == 2
    assert report["seed"] == 7 and report["random_success"] == 1 / 8
    assert report["theoretical_success"] == pytest.approx(0.9453125)
    assert report["measured_success"] == report["counts"].get("101", 0) / 256
    assert report["depth"] > 0 and report["two_qubit_gates"] > 0
    assert len(report["layout"]["final"]) == 3


@pytest.fixture
def local_service(monkeypatch):
    backend = GenericBackendV2(3, seed=7)
    service = SimpleNamespace(
        backend=lambda name: backend,
        least_busy=lambda **kwargs: backend,
    )
    monkeypatch.setattr(cli, "build_service", lambda instance: service)
    return service


def test_dry_run_json_without_submission(tmp_path, monkeypatch, local_service):
    def no_submit(*args, **kwargs):
        pytest.fail("dry-run no debe construir SamplerV2")
    monkeypatch.setattr(cli, "SamplerV2", no_submit)
    out = tmp_path / "dry.json"
    assert cli.main(["--mode", "dry-run", "--seed", "7", "--out", str(out)]) == 0
    report = json.loads(out.read_text())
    assert {"date_utc", "versions", "backend", "job_id", "n", "marked", "k", "shots",
            "seed", "depth", "two_qubit_gates", "layout", "counts", "measured_success",
            "theoretical_success", "random_success"} <= report.keys()
    assert report["counts"] is None and report["measured_success"] is None
    assert report["job_id"] is None and report["physical_hardware"] is False
    assert report["depth"] > 0 and report["two_qubit_gates"] > 0


def test_least_busy_filters(monkeypatch, local_service):
    calls = []
    backend = local_service.backend("unused")
    def select(**kwargs):
        calls.append(kwargs)
        return backend
    monkeypatch.setattr(local_service, "least_busy", select)
    cli.run(cli.parse_args(["--mode", "dry-run", "--seed", "7"]))
    assert calls == [{"operational": True, "simulator": False, "min_num_qubits": 3}]


def test_named_backend(monkeypatch, local_service):
    backend = local_service.backend("unused")
    names = []
    def select(name):
        names.append(name)
        return backend
    monkeypatch.setattr(local_service, "backend", select)
    monkeypatch.setattr(backend, "configuration", lambda: SimpleNamespace(simulator=False), raising=False)
    monkeypatch.setattr(backend, "status", lambda: SimpleNamespace(operational=True), raising=False)
    report = cli.run(cli.parse_args(["--mode", "dry-run", "--backend", "chosen", "--seed", "7"]))
    assert names == ["chosen"] and report["backend"] == backend.name


def test_sampler_and_recovery_use_original_metadata(monkeypatch, local_service, capsys):
    captured = {}
    def sampler(*, mode):
        def submit(pubs, *, shots):
            captured["circuit"] = pubs[0]
            result = BackendSamplerV2(backend=mode).run(pubs, shots=shots).result()
            def wait():
                assert "job_id: test-job" in capsys.readouterr().out
                return result
            job = SimpleNamespace(job_id=lambda: "test-job", result=wait)
            local_service.job = lambda job_id: job
            return job
        return SimpleNamespace(run=submit)
    monkeypatch.setattr(cli, "SamplerV2", sampler)
    report = cli.run(cli.parse_args(["--mode", "ibm", "--marked", "010", "--iterations", "1",
                                     "--shots", "32", "--seed", "7"]))
    assert report["job_id"] == "test-job" and report["shots"] == 32
    assert [reg.name for reg in captured["circuit"].cregs] == ["meas"]
    recovered = cli.run(cli.parse_args(["--mode", "ibm", "--job-id", "test-job"]))
    assert recovered["marked"] == "010" and recovered["k"] == 1
    assert recovered["counts"] == report["counts"] and recovered["seed"] == 7
    assert recovered["date_utc"] == report["date_utc"]


def test_recovery_rejects_missing_metadata(local_service):
    pub = SimpleNamespace(metadata={})
    local_service.job = lambda job_id: SimpleNamespace(
        job_id=lambda: job_id, result=lambda: [pub]
    )
    with pytest.raises(cli.CLIError, match="no conserva metadatos"):
        cli.recover_job(local_service, "other-job")


def test_out_does_not_overwrite(tmp_path):
    out = tmp_path / "existing.json"
    out.write_text("keep")
    assert cli.main(["--out", str(out)]) == 1
    assert out.read_text() == "keep"
