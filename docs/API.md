# Contrato de API de QubitGuard

Fijado en la fase 0. Backend y frontend se ajustan a esto; cualquier cambio se anuncia en el board.
Todos los cuerpos POST rechazan campos extra (`extra="forbid"` → 422). Ningún endpoint acepta una contraseña.

## GET /api/health
`{"status": "ok", "service": "QubitGuard Quantum Lab"}`

## GET /api/quantum/capabilities
```json
{"qiskit_version": "2.6.1", "aer_version": "0.18.0", "min_qubits": 2, "max_qubits": 6,
 "max_shots": 8192, "noise_model": "FakeFez (qiskit_ibm_runtime.fake_provider)", "physical_hardware": false}
```

## POST /api/quantum/grover
Request: `{"n_qubits": 2..6, "marked_state": "0101", "iterations": int|null, "shots": 1..8192, "seed": int|null, "noisy": bool}`
- `marked_state` debe tener exactamente `n_qubits` bits (si no, 422). Convención: string de Qiskit (bit más significativo a la izquierda, igual que las claves de `counts`).
- `iterations: null` → usa las iteraciones óptimas. Rango 0..20.

Response:
```json
{"counts": {"0101": 980, "0000": 3}, "measured_success": 0.957, "theoretical_success": 0.9613,
 "optimal_iterations": 3, "iterations": 3, "n_qubits": 4, "marked_state": "0101", "shots": 1024,
 "depth": 120, "two_qubit_gates": 84, "backend": "AerSimulator (ideal)" | "AerSimulator.from_backend(FakeFez)",
 "noisy": false, "circuit_text": "<diagrama ASCII del circuito lógico, antes de transpilar>"}
```
- `theoretical_success = sin²((2k+1)·θ)`, `θ = asin(1/√N)`, `N = 2^n`, `k = iterations`.
- `optimal_iterations = floor(π/(4θ))` (para N=4 da 1, que es exacto).
- `depth` y `two_qubit_gates` se miden después de transpilar para el backend usado.

## POST /api/quantum/grover-curve
Request: `{"n_qubits": 2..6}` → Response (Statevector exacto, k = 0..2·óptimo):
```json
{"n_qubits": 4, "optimal_iterations": 3, "iterations": [0,1,2,3,4,5,6], "probability": [0.0625, 0.47, ...]}
```

## POST /api/quantum/montecarlo
Request: `{"n_bits": 2..20, "trials": 1..5000, "seed": int|null}`
Búsqueda aleatoria sin repetición de un secreto entre N = 2^n_bits (numpy). Response:
```json
{"n_bits": 4, "N": 16, "trials": 1000, "mean_attempts": 8.4, "expected_attempts": 8.5,
 "histogram": {"bins": [1,2,...,16], "counts": [61, 64, ...]}}
```
- `expected_attempts = (N+1)/2`. Si N > 64 el histograma agrupa en 32 bins (`bins` = borde inferior de cada bin).

## GET /api/quantum/compare?max_bits=40
`max_bits` 2..256. Filas cada 4 bits más 128 y 256 si caben:
```json
{"rows": [{"bits": 8, "N": 256, "classical_expected": 128.5, "grover_iterations": 12, "speedup": 10.7}]}
```
`N`, `classical_expected` y `grover_iterations` pueden ser floats grandes (usar notación científica en la UI).

## GET /api/learn/pqc
```json
{"cards": [{"id": "grover-aes", "title": "...", "threat": "Grover", "targets": ["AES-128"],
 "summary": "...", "impact": "...", "mitigation": "...", "sources": [{"label": "...", "url": "..."}]}]}
```

## GET /api/learn/limitations
```json
{"items": [{"id": "oracle", "title": "...", "detail": "..."}]}
```

## GET /api/challenge/daily
Determinista por fecha UTC:
```json
{"date": "2026-10-24", "id": "2026-10-24", "kind": "optimal_iterations" | "success_probability" | "classical_vs_grover",
 "question": "...", "n_qubits": 5, "options": ["3", "4", "5", "6"], "answer_index": 1, "explanation": "..."}
```
La respuesta viaja al cliente a propósito: es un juego educativo local, no un examen.
