# Arquitectura

Visión de conjunto para quien lea el código. El uso, la instalación y los resultados medidos están en el [README](../README.md).

## Capas

```text
frontend/ (TypeScript, tsc)  ->  app/api/  ->  app/quantum/  ->  Qiskit / Aer / FakeFez
 UI, explorador, contraseñas     routers       experimentos      simulación
 y progreso (solo navegador)     FastAPI       puros de Python
                                 app/content/*.json (texto educativo)

scripts/run_ibm_hardware.py  ->  app/quantum/ (mismo circuito)  ->  FakeFez local o IBM Quantum Platform
 CLI aparte, no lo importa el servidor web                           (ejecución real: pendiente, ver docs/IBM_HARDWARE.md)
```

- `frontend/`: TypeScript sin frameworks y sin dependencias de runtime, compilado con `tsc` a `frontend/dist`. Módulos:
  - `main.ts`: UI y flujo Predice, Observa, Explica; reto diario; Monte Carlo; comparación; navegación.
  - `explorer.ts`: **explorador de amplitudes** (sección «Amplitudes»). Calcula en el navegador con las fórmulas exactas (`θ = asin(1/√N)`, amplitud del marcado `sin φ`, del resto `cos φ / √(N−1)`, con `φ = (2k+1)θ`) para 2 a 10 qubits. No llama al servidor ni usa Qiskit; sus lecturas coinciden con la curva de `Statevector` de 2 a 6 qubits.
  - `api.ts`: cliente con caché por sesión y deduplicación en vuelo; entiende `Retry-After`.
  - `charts.ts`: SVG con título, descripción y tabla equivalente; entrada animada solo por generación nueva de datos.
  - `progress.ts`: ruta de 5 pasos, 6 logros, 7 niveles, XP y racha en `localStorage`, con fecha local.
  - `password.ts`, `generator.ts`, `wordlist.ts`, `password-ui.ts`: analizador y generador CSPRNG, solo en el navegador.
  - `ambience.ts`, `dom.ts`: fondo ASCII, intro IBM y utilidades de movimiento; ver [UI_ASCII_Y_MOTION.md](UI_ASCII_Y_MOTION.md).
- `app/main.py`: crea la aplicación FastAPI, monta los routers, añade gzip, cabeceras de seguridad y política de caché, y sirve solo los archivos públicos de `frontend/` (el resto devuelve 404).
- `app/api/quantum.py`: validación de peticiones (Pydantic, `extra="forbid"`) y llamada a los experimentos.
- `app/quantum/experiments.py`: lógica de Qiskit (`build_grover_circuit`, `run_grover`, `grover_curve`) y estadística clásica (`montecarlo`, `compare`).
- `app/api/learn.py` y `app/content/*.json`: tarjetas poscuánticas y limitaciones; los JSON se leen una vez al importar.
- `app/api/challenge.py`: reto diario con módulos de la biblioteca estándar (no importa Qiskit).
- `scripts/run_ibm_hardware.py`: CLI independiente con cuatro usos (`fake`, `dry-run`, `ibm`, `--job-id`). Importa `build_grover_circuit`, `optimal_iterations` y `theoretical_success`, así que el circuito es el mismo que ve el estudiante. Usa `generate_preset_pass_manager` y `SamplerV2`. Arrancar FastAPI no crea cuentas, no consulta colas ni envía jobs.

## Seguridad y rendimiento

- CSP `default-src 'self'`, con estilos inline e imágenes `data:` permitidos. `/docs`, `/redoc` y `/openapi.json` omiten esa CSP y conservan las demás cabeceras de seguridad.
- Caché: `/api/learn/*`, `compare` y `capabilities` con `max-age=3600`; reto diario `max-age=300`; simulaciones `no-store`; estáticos `no-cache` con ETag.
- En servidor: caché en memoria de curva, comparación y simulaciones con semilla (copias aisladas).
- Límite de 2 simulaciones FakeFez simultáneas por proceso: una nueva ejecución espera hasta 10 segundos por un cupo; si no lo obtiene, recibe 503 con `Retry-After: 2`. No limita las peticiones por IP ni las simulaciones ideales.
- Credenciales de IBM: nunca pasan por la web. El CLI las lee del entorno o de una cuenta guardada por el usuario, no acepta `--token` y oculta el texto bruto de las excepciones del SDK.
- Demo pública: Cloudflare Tunnel ([DEPLOY.md](DEPLOY.md)). La interfaz y los experimentos funcionan con el servidor local sin internet después de instalar dependencias; el túnel, las fuentes enlazadas y los recursos externos de Swagger/ReDoc sí necesitan conexión.
- Docker/CasaOS: `Dockerfile` y `compose.yaml` (puerto 8781, `read_only`, sin capabilities, un solo worker). La imagen solo lleva `app/` y los archivos públicos del frontend, no `scripts/`. **No se ha construido ni ejecutado todavía**; ver [LUBUNTU_CASAOS.md](LUBUNTU_CASAOS.md).

## Generador de contraseñas

Módulo del navegador, sin llamadas de red ni almacenamiento. `randomInt` toma `crypto.getRandomValues` con muestreo por rechazo; `generateChars`, `generatePassphrase` (2072 palabras, 11,02 bits por palabra) y `strengthen` (inserta caracteres al azar en posiciones al azar; solo cuenta la entropía añadida) devuelven `bits` y `groverBits` (la mitad). La entropía con clases obligatorias se calcula por inclusión-exclusión en escala logarítmica. Los tests prohíben red, almacenamiento y `Math.random` en estos módulos.

## Flujo

1. El usuario predice la probabilidad o las iteraciones óptimas.
2. El navegador llama a `POST /api/quantum/grover` con n, estado marcado, iteraciones, shots y si hay ruido.
3. El router valida y delega en `app/quantum`.
4. Qiskit construye el circuito, lo transpila para el backend (ideal o FakeFez), lo ejecuta en Aer y mide profundidad y puertas de dos qubits.
5. La respuesta incluye conteos, éxito medido y teórico, y el diagrama del circuito lógico. El frontend dibuja y compara predicción, teoría y medida, da XP y explica.
6. Tras la primera predicción se desbloquea el explorador de amplitudes, que anima la misma iteración en dos tiempos (oráculo y difusor) sin pedir nada al servidor.

El reto diario es determinista: una fecha ISO se pasa por SHA-256 y alimenta `random.Random`, de modo que la misma fecha produce el mismo reto sin base de datos. La API usa UTC si se omite `?date=YYYY-MM-DD`; el frontend envía expresamente la fecha local del navegador para alinear reto, racha y topes diarios.

## Por qué cada pieza de Qiskit

| Pieza | Para qué | Por qué no otra cosa |
|---|---|---|
| `QuantumCircuit` | Oráculo de fase, difusor y medición | Los circuitos se ejecutan; no es una fórmula dibujada |
| `Statevector` | Probabilidad exacta por iteración (curva) | Sin ruido de muestreo; la curva de sin²((2k+1)·theta) se ve limpia |
| `AerSimulator` | Muestreo con shots y conteos | Imita la medición de un dispositivo real |
| `FakeFez` | Modelo de ruido realista | Enseña el efecto del ruido sin acceso a hardware (simulado, no real) |
| `transpile` | Profundidad y puertas de dos qubits | Son las métricas que importan en hardware real |
| `generate_preset_pass_manager` y `SamplerV2` (solo CLI) | Compilar y enviar a un procesador IBM | Camino oficial de Runtime; la ejecución real está pendiente |

NumPy cubre Monte Carlo porque es estadística clásica y no necesita Qiskit. **QubitGuard no implementa Quantum Amplitude Estimation**: el Monte Carlo es la referencia clásica de la búsqueda.

## El ruido NISQ frente al tamaño del circuito

Medido con el CLI en FakeFez (`seed` 7, 1024 shots): el éxito cae de 0,802 (n=3, profundidad 137) a 0,662 (n=4, 448), 0,184 (n=5, 1456) y 0,0166 (n=6, 4447, azar 0,0156). La profundidad y las puertas de dos qubits crecen mucho al descomponer y enrutar las puertas multicontroladas, y el ruido acumulado borra la amplificación. Son simulaciones, no una QPU; detalle y límites en [IBM_HARDWARE.md](IBM_HARDWARE.md).

## Decisiones

- Sin frameworks de frontend ni dependencias de runtime: menos superficie, menos dependencias, compilación simple con `tsc`, fácil de leer en un hackathon.
- Un solo proceso: FastAPI sirve API y estáticos; un solo comando para correr.
- El explorador usa fórmulas en el navegador y no el servidor: respuesta inmediata al mover un control, sin carga ni concurrencia; la fidelidad con Qiskit está comprobada de 2 a 6 qubits.
- Contraseñas (analizadas y generadas) solo en el navegador: ningún endpoint las recibe y un test lo comprueba.
- CLI de hardware separado del servidor: la web no crea cuentas ni gasta cuota IBM.
- Accesibilidad como objetivo: criterios WCAG 2.2 AA y contrastes registrados en [../frontend/UX_AUDIT.md](../frontend/UX_AUDIT.md), sin certificación de conformidad completa.
- Contenido en JSON: se edita sin tocar código y se carga una vez.
- Contrato de API fijo en [API.md](API.md); limitaciones en [LIMITACIONES.md](LIMITACIONES.md).

Para el recorrido por funciones y las notas de compatibilidad del starter, consulta [GUIA_DEL_CODIGO.md](GUIA_DEL_CODIGO.md). El análisis de adecuación al reto está en [REVISION_PROMPT_Y_BASES.md](REVISION_PROMPT_Y_BASES.md) y [RETO_Y_ENTREGA.md](RETO_Y_ENTREGA.md).
