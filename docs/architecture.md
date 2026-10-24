# Arquitectura

## Capas

```text
frontend/ (TypeScript, tsc)  ->  app/api/  ->  app/quantum/  ->  Qiskit / Aer / FakeFez
 UI, análisis de contraseña      routers       experimentos      simulación
 (solo en el navegador)          FastAPI       puros de Python
                                 app/content/*.json (texto educativo)
```

- `frontend/`: TypeScript sin frameworks, compilado con `tsc` a `frontend/dist`. Maneja la UI y el análisis de contraseñas.
- `app/main.py`: crea la aplicación FastAPI, monta los routers y sirve `frontend/` como estáticos.
- `app/api/quantum.py`: validación de peticiones (Pydantic, `extra="forbid"`) y llamada a los experimentos.
- `app/quantum/`: lógica de Qiskit (circuito de Grover, curva, Monte Carlo, comparación).
- `app/api/learn.py` y `app/content/*.json`: tarjetas poscuánticas y limitaciones; los JSON se leen una vez al importar.
- `app/api/challenge.py`: reto diario con `math` solamente (no importa Qiskit).

## Flujo

1. El navegador llama a `POST /api/quantum/grover` con n, estado marcado, iteraciones, shots y si hay ruido.
2. El router valida y delega en `app/quantum`.
3. Qiskit construye el circuito, lo transpila para el backend (ideal o FakeFez), lo ejecuta en Aer y mide profundidad y puertas de dos qubits.
4. La respuesta incluye conteos, éxito medido y teórico, y el diagrama del circuito lógico. El frontend la dibuja.

El reto diario es determinista: la fecha UTC (ISO) se pasa por sha256 y alimenta `random.Random`, de modo que todos ven el mismo reto sin base de datos. `?date=YYYY-MM-DD` permite pruebas y demos.

## Por qué cada pieza de Qiskit

| Pieza | Para qué | Por qué no otra cosa |
|---|---|---|
| `Statevector` | Probabilidad exacta por iteración (curva) | Sin ruido de muestreo; la curva de sin²((2k+1)·theta) se ve limpia |
| `AerSimulator` | Muestreo con shots y conteos | Imita la medición de un dispositivo real |
| `FakeFez` | Modelo de ruido realista | Enseña el efecto del ruido sin acceso a hardware (simulado, no real) |
| `transpile` | Profundidad y puertas de dos qubits | Son las métricas que importan en hardware real |

NumPy cubre Monte Carlo porque es estadística clásica y no necesita Qiskit.

## Decisiones

- Sin frameworks de frontend: menos dependencias, compilación simple con `tsc`, fácil de leer en un hackathon.
- Un solo proceso: FastAPI sirve API y estáticos; un solo comando para correr.
- Contraseñas solo en el navegador: ningún endpoint las recibe y un test lo comprueba.
- Contenido en JSON: se edita sin tocar código y se carga una vez.
- Contrato de API fijo en [API.md](API.md); limitaciones en [LIMITACIONES.md](LIMITACIONES.md).
