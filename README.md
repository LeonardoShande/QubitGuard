# QubitGuard Quantum Lab (Qiskit)

Este módulo ejecuta circuitos reales de Qiskit en `qiskit-aer` local. No se limita a dibujar circuitos ni afirma ejecutar en hardware físico.

## Requisitos

- Python 3.11 recomendado.
- pip y un entorno virtual.

## Instalación

Desde la carpeta `backend/`:

```bash
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## Ejecutar la API

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Documentación interactiva: http://127.0.0.1:8000/docs

## Probar endpoints

Hadamard:

```bash
curl -X POST http://127.0.0.1:8000/api/quantum/hadamard-demo -H "Content-Type: application/json" -d '{"shots":1024,"seed":42}'
```

Grover (espacio de ocho estados, objetivo ficticio `101`):

```bash
curl -X POST http://127.0.0.1:8000/api/quantum/grover-demo -H "Content-Type: application/json" -d '{"n_qubits":3,"marked_state":"101","shots":2048,"seed":42}'
```

## Ejecutar pruebas

```bash
pytest -q
```

## Notas científicas

- Hadamard sobre `|0>` produce idealmente probabilidades teóricas 50/50 antes de medir; los recuentos observados fluctúan por muestreo.
- Grover utiliza un oráculo que marca una cadena binaria sintética y un difusor. El espacio está limitado a 4 qubits para que las simulaciones sigan siendo pequeñas.
- El número de consultas al oráculo no es equivalente directamente a tiempo real de ataque ni demuestra que se puedan recuperar contraseñas reales.
- Los resultados se obtienen con un simulador de software, sin ruido físico ni hardware cuántico real.
