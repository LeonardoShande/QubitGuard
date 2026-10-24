# Contrato de API de QubitGuard

Contrato del laboratorio. Los esquemas abreviados describen tipos y rangos; no deben copiarse como cuerpos JSON. Los ejemplos con elipsis son extractos ilustrativos, no resultados completos ni fixtures reproducibles. Para peticiones ejecutables y resultados medidos, consulta el [README](../README.md#api-y-ejemplos).
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
- `seed`: `null` o entero entre 0 y `2^32 - 1`; se aplica a transpilación y simulación. `noisy` es `false` por defecto.

Response:
```text
{"counts": {"0101": 980, "0000": 3}, "measured_success": 0.957, "theoretical_success": 0.9613,
 "optimal_iterations": 3, "iterations": 3, "n_qubits": 4, "marked_state": "0101", "shots": 1024,
 "depth": 120, "two_qubit_gates": 84, "backend": "AerSimulator (ideal)" | "AerSimulator.from_backend(FakeFez)",
 "noisy": false, "circuit_text": "<diagrama ASCII del circuito lógico, antes de transpilar>"}
```
- `theoretical_success = sin²((2k+1)·θ)`, `θ = asin(1/√N)`, `N = 2^n`, `k = iterations`.
- `optimal_iterations = floor(π/(4θ))` (para N=4 da 1, que es exacto).
- `depth` y `two_qubit_gates` se miden después de transpilar para el backend usado.
- `theoretical_success` es ideal incluso con `noisy: true`. Los conteos dependen del muestreo y de la versión del entorno; el ejemplo anterior solo ilustra los campos.
- El límite ruidoso es de dos ejecuciones por proceso. Si no se obtiene cupo tras esperar hasta 10 segundos, responde 503 con `Retry-After: 2`.

## POST /api/quantum/grover-curve
Request: `{"n_qubits": 2..6}` → Response (Statevector exacto, k = 0..2·óptimo):
```text
{"n_qubits": 4, "optimal_iterations": 3, "iterations": [0,1,2,3,4,5,6], "probability": [0.0625, 0.47, ...]}
```

## POST /api/quantum/montecarlo
Request: `{"n_bits": 2..20, "trials": 1..5000, "seed": int|null}`
Búsqueda aleatoria sin repetición de un secreto entre N = 2^n_bits (numpy). Response:
```text
{"n_bits": 4, "N": 16, "trials": 1000, "mean_attempts": 8.4, "expected_attempts": 8.5,
 "histogram": {"bins": [1,2,...,16], "counts": [61, 64, ...]}}
```
- `expected_attempts = (N+1)/2`. Si N > 64 el histograma agrupa en 32 bins (`bins` = borde inferior de cada bin).
- `seed`: `null` o entero entre 0 y `2^32 - 1`. Se muestrea la posición uniforme del secreto; no se prueban todas las claves de forma explícita.

## GET /api/quantum/compare?max_bits=40
`max_bits` 2..256. Filas cada 4 bits más 128 y 256 si caben:
```json
{"rows": [{"bits": 8, "N": 256, "classical_expected": 128.5, "grover_iterations": 12, "speedup": 10.7}]}
```
`N`, `classical_expected` y `grover_iterations` pueden ser floats grandes (usar notación científica en la UI).
`speedup` expresa una razón de consultas, no tiempo medido. Caso límite conocido: `max_bits=2` y `3` devuelven `{"rows":[]}`; ver la [revisión y mejora propuesta](REVISION_PROMPT_Y_BASES.md#mejoras-priorizadas).

## GET /api/learn/pqc
```text
{"cards": [{"id": "grover-aes", "title": "...", "threat": "Grover", "targets": ["AES-128"],
 "summary": "...", "impact": "...", "mitigation": "...", "sources": [{"label": "...", "url": "..."}]}]}
```

## GET /api/learn/limitations
```json
{"items": [{"id": "oracle", "title": "...", "detail": "..."}]}
```

## GET /api/challenge/daily
Acepta `?date=YYYY-MM-DD`; si se omite usa la fecha UTC actual. La interfaz envía la fecha local del navegador. Determinista para cada fecha:
```text
{"date": "2026-10-24", "id": "2026-10-24", "kind": "optimal_iterations" | "success_probability" | "classical_vs_grover",
 "question": "...", "n_qubits": 5, "options": ["3", "4", "5", "6"], "answer_index": 1, "explanation": "..."}
```
La respuesta viaja al cliente a propósito: es un juego educativo local, no un examen.

## Errores y compatibilidad

- 422: cuerpo o parámetros inválidos, estado con longitud incorrecta, semilla fuera de rango o campo adicional en POST.
- 503: simulador ruidoso ocupado, con `Retry-After: 2`.
- 500: error interno, con mensaje público genérico.

Las antiguas rutas `/api/quantum/hadamard-demo` y `/api/quantum/grover-demo` ya no se exponen. La nueva ruta de ejecución es `/api/quantum/grover`; más detalles en la [guía del código](GUIA_DEL_CODIGO.md#compatibilidad-con-el-starter-anterior).
