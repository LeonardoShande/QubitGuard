# QubitGuard

QubitGuard es un proyecto de laboratorio cuántico con simulación local en Python/FastAPI.

## Estructura del repositorio

```text
QubitGuard/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── api/
│   │   ├── __init__.py
│   │   └── quantum.py
│   └── quantum/
│       ├── __init__.py
│       └── experiments.py
├── src/
│   └── qubitguard/
│       ├── __init__.py
│       ├── config.py
│       └── security.py
├── tests/
│   ├── test_quantum.py
│   └── test_security.py
├── docs/
│   └── architecture.md
├── examples/
│   └── basic_usage.py
├── .gitignore
├── pyproject.toml
├── requirements.txt
├── README.md
└── ...
```

## Ejecutar la API

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Probar

```bash
pytest
```

## Principio

Toda la lógica funcional queda en `app/` y `src/`; el resto del repositorio sirve como configuración y documentación.
