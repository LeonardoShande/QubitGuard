# QubitGuard Quantum Lab

Laboratorio educativo de ciberseguridad cuántica para el IBM Quantum Hackathon / Qiskit Fall Fest 2026 (reto EdTech). Público objetivo: desde 14 años, sin requisitos previos.

Basado en el repositorio original de LeonardoShande.

## Qué es

Una aplicación web en la que quien aprende ve, con circuitos reales de Qiskit, por qué buscar un secreto al azar (Monte Carlo) es más lento que buscarlo con amplificación de amplitud (Grover), qué tan grande es esa ventaja y por qué no rompe la criptografía simétrica de hoy. Incluye un reto diario corto, tarjetas sobre criptografía poscuántica y una sección honesta de limitaciones.

## Problema y mapeo estadístico a cuántico

Buscar un secreto entre N = 2^n candidatos sin información adicional:

| | Clásico (Monte Carlo) | Cuántico (Grover) |
|---|---|---|
| Método | Probar candidatos al azar sin repetir | Amplificar la amplitud del estado marcado |
| Costo esperado | (N + 1) / 2 intentos | ~ pi/4 · raíz(N) iteraciones |
| Probabilidad de éxito tras k pasos | k / N | sin²((2k + 1)·theta), con theta = asin(1/raíz(N)) |
| Iteraciones óptimas | no aplica | floor(pi / (4·theta)) |

La ventaja es cuadrática, no exponencial. El laboratorio la muestra de tres formas: simulación Monte Carlo con histograma, curva exacta de probabilidad de Grover por iteración y tabla comparativa por número de bits.

## Por qué Qiskit

Cada pieza de Qiskit cumple una función concreta (detalle en [docs/architecture.md](docs/architecture.md)):

- `Statevector`: da la probabilidad exacta de éxito para cada iteración k, sin ruido de muestreo. Alimenta la curva.
- `AerSimulator`: ejecuta el circuito con shots y devuelve conteos, como lo haría un dispositivo real.
- `FakeFez` (`qiskit_ibm_runtime.fake_provider`): modelo de ruido simulado de un procesador IBM, para ver cómo el ruido degrada Grover. No es hardware real.
- `transpile`: descompone el circuito a las puertas del backend y permite medir profundidad y número de puertas de dos qubits tras transpilar.

## Privacidad de contraseñas

El análisis de contraseñas ocurre solo en el navegador. Ningún endpoint de la API recibe una contraseña y existe un test que lo verifica (`tests/test_privacy.py`). La estimación de entropía es heurística (ver limitaciones).

## Arquitectura

```text
+---------------------+        HTTP / JSON        +------------------------+        +----------------------+
|  Navegador (TS)     | <-----------------------> |  FastAPI (un proceso)  | -----> |  Qiskit / Aer        |
|  frontend/ (tsc)    |   /api/quantum/*          |  app/main.py           |        |  Statevector,        |
|  sin frameworks     |   /api/learn/*            |  app/api/*.py          |        |  AerSimulator,       |
|  analiza contraseñas|   /api/challenge/daily    |  sirve frontend/       |        |  FakeFez, transpile  |
+---------------------+                           +------------------------+        +----------------------+
```

## Cómo correr

```bash
# 1. Dependencias de Python
uv pip install -r requirements.txt      # o: pip install -r requirements.txt

# 2. Frontend (TypeScript compilado con tsc)
cd frontend && npm install && npm run build && cd ..

# 3. Servidor
uvicorn app.main:app --reload
```

Abrir http://127.0.0.1:8000.

En PyCharm: crear una run configuration de tipo módulo con módulo `uvicorn`, parámetros `app.main:app --reload` y directorio de trabajo igual a la raíz del repositorio.

## Cómo probar

```bash
pytest -q
cd frontend && npx tsc --noEmit
```

## API

Contrato en [docs/API.md](docs/API.md). Documentación interactiva de FastAPI en http://127.0.0.1:8000/docs.

## Limitaciones

Resumen honesto en [docs/LIMITACIONES.md](docs/LIMITACIONES.md): el oráculo ya conoce la respuesta, la ventaja es solo cuadrática, el ruido mostrado es simulado, y hoy no existe un ataque cuántico práctico a AES ni a contraseñas.

## Resultados de la demo

TODO: completar con números medidos (por ejemplo éxito medido frente a teórico con y sin FakeFez para n = 4) antes de presentar. No se incluyen cifras sin medir.

## Créditos de librerías

Qiskit, Qiskit Aer, qiskit-ibm-runtime, NumPy, FastAPI, Uvicorn, Pydantic, TypeScript.

## Equipo

TODO: nombres e integrantes.
