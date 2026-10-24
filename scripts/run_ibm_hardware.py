"""Ejecuta el circuito del laboratorio offline o en IBM Quantum, fuera del servidor."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import sys

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import qiskit
import qiskit_aer
import qiskit_ibm_runtime
from qiskit.transpiler import generate_preset_pass_manager
from qiskit_aer import AerSimulator
from qiskit_ibm_runtime import QiskitRuntimeService, SamplerV2
from qiskit_ibm_runtime.fake_provider import FakeFez

from app.quantum.experiments import (
    MAX_SEED,
    build_grover_circuit,
    optimal_iterations,
    theoretical_success,
)


class CLIError(RuntimeError):
    """Error publicable sin incluir respuestas del servicio ni credenciales."""


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, allow_abbrev=False)
    parser.add_argument("--n-qubits", type=int, choices=range(2, 7), default=3)
    parser.add_argument("--marked", default="101")
    parser.add_argument("--iterations", type=int, choices=range(21))
    parser.add_argument("--shots", type=int, default=1024)
    parser.add_argument("--seed", type=int)
    parser.add_argument("--backend", help="Nombre del procesador IBM; por defecto, least_busy")
    parser.add_argument("--instance", help="CRN de la instancia IBM Quantum")
    parser.add_argument("--mode", choices=("fake", "dry-run", "ibm"), default="fake")
    parser.add_argument("--job-id", help="Recuperar un job creado por este script, sin reenviarlo")
    parser.add_argument("--out", type=Path, default=Path("results") / (
        f"ibm_{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S_%fZ')}.json"
    ))
    args, unknown = parser.parse_known_args(argv)
    if unknown:
        parser.error("argumentos no reconocidos; consulta --help. No se aceptan tokens por CLI")
    if len(args.marked) != args.n_qubits or any(bit not in "01" for bit in args.marked):
        parser.error("--marked debe contener exactamente n-qubits dígitos binarios")
    if not 1 <= args.shots <= 8192:
        parser.error("--shots debe estar entre 1 y 8192")
    if args.seed is not None and not 0 <= args.seed <= MAX_SEED:
        parser.error(f"--seed debe estar entre 0 y {MAX_SEED}")
    if args.job_id and args.mode != "ibm":
        parser.error("--job-id requiere --mode ibm")
    if args.mode == "fake" and (args.backend or args.instance):
        parser.error("--backend y --instance requieren --mode dry-run o ibm")
    if args.iterations is None:
        args.iterations = optimal_iterations(args.n_qubits)
    return args


def build_service(instance=None):
    instance = instance or os.environ.get("QISKIT_IBM_INSTANCE")
    token = os.environ.get("QISKIT_IBM_TOKEN")
    try:
        if token:
            return QiskitRuntimeService(
                channel="ibm_quantum_platform", token=token, instance=instance
            )
        return QiskitRuntimeService(**({"instance": instance} if instance else {}))
    except Exception:
        raise CLIError(
            "No se pudo abrir la cuenta IBM. Guarda una cuenta con save_account() o define "
            "QISKIT_IBM_TOKEN y QISKIT_IBM_INSTANCE; comprueba acceso, CRN y conexión. "
            "Consulta docs/IBM_HARDWARE.md."
        ) from None


def add_counts(report, raw_counts):
    counts = {state: int(count) for state, count in sorted(raw_counts.items())}
    shots = sum(counts.values())
    if shots <= 0 or any(
        len(state) != report["n"] or set(state) - {"0", "1"} or count < 0
        for state, count in counts.items()
    ):
        raise CLIError("El resultado no contiene counts válidos del registro meas")
    report.update(counts=counts, shots=shots,
                  measured_success=counts.get(report["marked"], 0) / shots)
    return report


def recover_job(service, job_id):
    job = service.job(job_id)
    print(f"job_id: {job.job_id()}", flush=True)
    result = job.result()
    if len(result) != 1:
        raise CLIError("La recuperación admite un único circuito de este script")
    pub = result[0]
    report = pub.metadata.get("circuit_metadata", {}).get("qubitguard")
    if not report or report.get("mode") != "ibm":
        raise CLIError("El job no conserva metadatos QubitGuard; no se inferirán sus parámetros")
    report = dict(report)
    report.update(job_id=job.job_id(), retrieved_at_utc=datetime.now(timezone.utc).isoformat())
    return add_counts(report, pub.data.meas.get_counts())


def run(args):
    service = None if args.mode == "fake" else build_service(args.instance)
    if args.job_id:
        return recover_job(service, args.job_id)

    circuit, k = build_grover_circuit(args.n_qubits, args.marked, args.iterations)
    if args.mode == "fake":
        backend = FakeFez()
    elif args.backend:
        backend = service.backend(args.backend)
        if backend.num_qubits < args.n_qubits or backend.configuration().simulator:
            raise CLIError("El backend debe ser un procesador real con suficientes qubits")
        if not backend.status().operational:
            raise CLIError("El backend seleccionado no está operativo")
    else:
        backend = service.least_busy(
            operational=True, simulator=False, min_num_qubits=args.n_qubits
        )

    compiled = generate_preset_pass_manager(
        optimization_level=3, backend=backend, seed_transpiler=args.seed
    ).run(circuit)
    report = {
        "date_utc": datetime.now(timezone.utc).isoformat(),
        "versions": {"qiskit": qiskit.__version__, "runtime": qiskit_ibm_runtime.__version__,
                     "aer": qiskit_aer.__version__},
        "mode": args.mode,
        "physical_hardware": args.mode == "ibm",
        "backend": backend.name,
        "job_id": None,
        "n": args.n_qubits,
        "marked": args.marked,
        "k": k,
        "shots": args.shots,
        "seed": args.seed,
        "optimization_level": 3,
        "depth": compiled.depth(),
        "two_qubit_gates": sum(item.operation.num_qubits == 2 for item in compiled.data),
        "layout": {"initial": compiled.layout.initial_index_layout(filter_ancillas=True),
                   "final": compiled.layout.final_index_layout(filter_ancillas=True)},
        "counts": None,
        "measured_success": None,
        "theoretical_success": theoretical_success(args.n_qubits, k),
        "random_success": 1 / 2 ** args.n_qubits,
    }
    if args.mode == "dry-run":
        return report
    if args.mode == "fake":
        simulator = AerSimulator.from_backend(backend)
        raw_counts = simulator.run(
            compiled, shots=args.shots, seed_simulator=args.seed
        ).result().get_counts()
    else:
        compiled.metadata = {**(compiled.metadata or {}), "qubitguard": dict(report)}
        job = SamplerV2(mode=backend).run([compiled], shots=args.shots)
        report["job_id"] = job.job_id()
        print(f"job_id: {report['job_id']}", flush=True)
        raw_counts = job.result()[0].data.meas.get_counts()
    return add_counts(report, raw_counts)


def main(argv=None):
    args = parse_args(argv)
    try:
        if args.out.exists():
            raise CLIError("El archivo --out ya existe; elige otro para conservar los resultados")
        args.out.parent.mkdir(parents=True, exist_ok=True)
        report = run(args)
        with args.out.open("x", encoding="utf-8") as handle:
            json.dump(report, handle, ensure_ascii=False, indent=2, allow_nan=False)
            handle.write("\n")
        print(json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False))
        print(f"Salida: {args.out}")
    except CLIError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    except Exception as exc:
        # Las excepciones del SDK pueden contener datos de la cuenta.
        print(f"Error ({type(exc).__name__}): no se completó el experimento. Revisa conexión, "
              "backend, cuota y ruta de salida. Si se imprimió job_id, usa --mode ibm "
              "--job-id para recuperarlo. Consulta docs/IBM_HARDWARE.md.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
