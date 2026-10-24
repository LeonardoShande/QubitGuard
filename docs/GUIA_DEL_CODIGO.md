# Guía del código y funcionamiento de QubitGuard

Esta guía explica cómo una interacción del navegador llega a Qiskit y cómo vuelve convertida en gráficos y retroalimentación. También identifica qué archivos cambiar para mantener el proyecto. Para instalarlo, consulta el [README](../README.md#instalación-y-ejecución); para evaluar lo construido frente al encargo, consulta la [revisión del prompt y las bases](REVISION_PROMPT_Y_BASES.md).

## Qué problema resuelve y dónde usarlo

QubitGuard permite experimentar con la búsqueda de un elemento marcado en un espacio pequeño, sin aprender primero a programar circuitos. Sirve para una introducción a probabilidades cuánticas, una clase sobre búsqueda clásica y Grover, o un taller de ciberseguridad que distinga algoritmos cuánticos, criptografía poscuántica y contraseñas.

Un docente puede pedir al estudiante una predicción, variar una sola condición y hacerle explicar la diferencia. El reto diario ofrece una práctica breve. La edad de 14+ es el público propuesto por el proyecto, no el resultado de una validación de comprensión con menores.

No es un gestor de contraseñas, un escáner de seguridad, un sistema de evaluación antitrampa ni un servicio de ejecución en hardware IBM.

## Recorrido de una ejecución

```text
frontend/index.html carga dist/main.js
    │
    ├─ progress.load() recupera progreso local
    ├─ se registran eventos, gráficos y controles
    └─ se solicitan reto, contenido, curva y tabla

El usuario predice y envía el formulario Grover
    │
    ▼
main.ts / initLab: valida y llama a api.grover(...)
    │ POST /api/quantum/grover, sin contraseña
    ▼
app/api/quantum.py: Pydantic valida el cuerpo
    │
    ▼
experiments.run_grover: valida, construye, transpila y simula
    │
    ▼
JSON con counts, probabilidades, métricas y circuito
    │
    ▼
renderResult → observe → afterRun
gráficos y tablas → explicación → XP, ruta y logros
```

`app/main.py` registra los routers antes de montar los archivos estáticos en `/`. Se monta el directorio **`frontend/`**, donde están el HTML, CSS y `dist/`; no solamente `frontend/dist/`. Un middleware restringe qué rutas de ese directorio se pueden publicar.

## Backend y contrato HTTP

| Archivo | Responsabilidad | Puntos de entrada |
|---|---|---|
| [`app/main.py`](../app/main.py) | Crear FastAPI, gzip, políticas de respuesta, manejo de simulador ocupado y estáticos. | `health`, `response_policies`, `simulator_busy_handler`. |
| [`app/api/quantum.py`](../app/api/quantum.py) | Validar peticiones y traducir errores de valor a HTTP 422. | `GroverRequest`, `CurveRequest`, `MonteCarloRequest` y rutas cuánticas. |
| [`app/quantum/experiments.py`](../app/quantum/experiments.py) | Circuitos, simulación, probabilidades y estadísticas. | `run_grover`, `grover_curve`, `montecarlo`, `compare`, `capabilities`. |
| [`app/api/challenge.py`](../app/api/challenge.py) | Generar una pregunta determinista por fecha. | `daily`, constructores de preguntas y opciones. |
| [`app/api/learn.py`](../app/api/learn.py) | Servir contenido educativo cargado al importar. | `pqc`, `limitations`. |
| [`app/content/pqc.json`](../app/content/pqc.json) | Tarjetas, impacto, mitigación y fuentes. | Datos consumidos por `/api/learn/pqc`. |
| [`app/content/limitations.json`](../app/content/limitations.json) | Limitaciones que ve la interfaz. | Datos consumidos por `/api/learn/limitations`. |

La API no ejecuta texto como código ni recibe contraseñas. Los cuerpos POST rechazan campos adicionales. El motor vuelve a validar sus entradas para que también sea seguro llamarlo directamente desde Python. Límites y respuestas se describen en [API.md](API.md).

## Motor cuántico paso a paso

### Parámetros y teoría

`optimal_iterations(n_qubits)` valida entre 2 y 6 qubits y calcula:

```text
N = 2^n
θ = asin(1 / √N)
k = floor(π / (4θ))
```

`theoretical_success(n_qubits, iterations)` devuelve `sin²((2k+1)θ)`. Este cálculo es una referencia matemática; no sustituye al circuito que se ejecuta. `iterations=None` selecciona el óptimo y un entero permite experimentar entre 0 y 20 iteraciones.

### Oráculo de fase

`_phase_oracle_for_basis_state` construye una operación que cambia el signo de la amplitud del estado marcado. Ese cambio de fase aún no aumenta por sí solo su probabilidad de medición.

1. Recorre `marked_state` en sentido inverso porque la cadena se escribe con el bit más significativo a la izquierda, mientras que los índices de qubit comienzan por el menos significativo.
2. Aplica X a las posiciones cuyo bit objetivo es cero, transformando temporalmente el patrón objetivo en todos unos.
3. Usa H, una X multicontrolada (`mcx`) y H sobre el último qubit para producir una Z multicontrolada.
4. Deshace las X iniciales.

El oráculo conoce el objetivo porque se lo proporcionamos. No está calculando un hash, probando una contraseña real ni descubriendo un secreto externo.

### Difusor y circuito

`_diffuser` aplica Hadamard, el oráculo del estado cero y Hadamard. Su convención difiere del difusor habitual por una fase global, que no cambia las probabilidades medidas.

`build_grover_circuit` prepara todos los qubits con H, compone el oráculo y el difusor k veces y añade `measure_all()` si `measure=True`. Devuelve el circuito y el número de iteraciones usado. Con `measure=False` permite calcular el estado exacto.

### Transpilación y medición

`_run_grover` selecciona el simulador, transpila y ejecuta:

- **Ideal:** `AerSimulator`, base de puertas `cx/rz/sx/x`, optimización de nivel 1.
- **Ruidoso:** backend obtenido con `AerSimulator.from_backend(FakeFez())`, optimización de nivel 3.
- **Semilla:** se pasa tanto al transpilador como al simulador para reproducir dentro del mismo entorno.
- **Mediciones:** `simulator.run(...).result().get_counts(...)` obtiene frecuencias de estados.

`measured_success` es `counts[marked_state] / shots`. `theoretical_success` sigue siendo la referencia ideal. `depth` y `two_qubit_gates` se calculan sobre el circuito transpilado; `circuit_text` dibuja el circuito lógico anterior.

Una diferencia entre histogramas ideales y ruidosos puede reflejar tanto ruido como cambios de objetivo, layout y optimización. No se debe presentar como una medición aislada del ruido con compilación idéntica.

`_NOISY_SIMULATOR_LIMIT` admite dos ejecuciones ruidosas por proceso. Espera hasta diez segundos por un cupo y lo libera en `finally`, incluso si falla el trabajo. Si no obtiene cupo, eleva `SimulatorBusy`; FastAPI responde 503 con `Retry-After: 2`. Las ejecuciones ideales no usan ese semáforo.

### Curva exacta y cachés

`_grover_curve_cached` construye circuitos sin medición, con el estado todo unos y k desde cero hasta dos veces el óptimo. `Statevector.from_instruction` produce las probabilidades y se extrae la del objetivo. En el modelo ideal de un único objetivo, la probabilidad de éxito depende de n y k, no del patrón binario elegido.

Las curvas y tablas se memorizan mediante `lru_cache`. Las ejecuciones de Grover con semilla también tienen caché; las que no tienen semilla se vuelven a ejecutar. Las funciones públicas devuelven copias profundas para que un consumidor no altere resultados compartidos. Reiniciar el proceso vacía esas cachés.

## Parte clásica y extrapolación

`montecarlo` usa `np.random.default_rng(seed).integers(1, N+1, size=trials)` para muestrear posiciones del secreto. Es equivalente, en distribución, a ordenar aleatoriamente los candidatos sin repetición y contar cuándo aparece el secreto. Evita materializar una permutación de hasta un millón de elementos por ensayo.

Devuelve media medida, media esperada `(N+1)/2` e histograma. Hasta 64 candidatos usa un bin por intento; para tamaños mayores agrupa en 32 bins. Este PRNG es para experimentos estadísticos, no para generar contraseñas.

`compare` extrapola fórmulas hasta 256 bits y calcula la razón entre intentos clásicos esperados e iteraciones de Grover. El campo `speedup` es esa razón, **no una aceleración de tiempo medida**. En tamaños grandes se usan flotantes para presentar magnitudes; no representan conteos enteros exactos de ejecución.

Caso límite conocido: con `max_bits=2` o `3`, la API no genera filas. El frontend muestra una explicación, vacía la tabla y retira el observador del gráfico anterior para que no reaparezca al redimensionar. La ampliación del conjunto de filas del backend sigue siendo una mejora propuesta.

## Frontend por módulos

| Archivo | Qué contiene | Cuándo modificarlo |
|---|---|---|
| [`src/main.ts`](../frontend/src/main.ts) | Inicialización, formularios, ruta, retos, comparación, renderizado y retroalimentación. | Cambios en el flujo educativo o en la interacción con resultados. |
| [`src/api.ts`](../frontend/src/api.ts) | Tipos HTTP, `request`, `ApiError`, caché por sesión y cliente de cada endpoint. | Cuando cambia el contrato de API o la presentación de errores. |
| [`src/charts.ts`](../frontend/src/charts.ts) | `mount`, `barChart`, `lineChart` y construcción SVG. | Cambios de gráficos, escalas y redimensionamiento. |
| [`src/dom.ts`](../frontend/src/dom.ts) | Búsqueda por ID (`$`), creación de elementos (`h`), errores y movimiento. | Utilidades pequeñas compartidas de interfaz. |
| [`src/ambience.ts`](../frontend/src/ambience.ts) | Control del fondo ASCII global, pausa por visibilidad/movimiento reducido y retirada de la entrada IBM. | Solo ambientación y presentación inicial. |
| [`src/progress.ts`](../frontend/src/progress.ts) | Persistencia, fecha local, XP, niveles, rachas, ruta y logros. | Reglas de progreso y compatibilidad del estado guardado. |
| [`src/password.ts`](../frontend/src/password.ts) | Analizador puro y formato de tiempos y magnitudes. | Heurísticas y supuestos del cálculo. |
| [`src/generator.ts`](../frontend/src/generator.ts) | CSPRNG, caracteres, frases y refuerzo de base. | Opciones y distribución del generador. |
| [`src/wordlist.ts`](../frontend/src/wordlist.ts) | Lista de palabras. | Cambios de vocabulario, revisando entropía y tests. |
| [`src/password-ui.ts`](../frontend/src/password-ui.ts) | Controles privados, medidores, mostrar/ocultar y portapapeles. | Interacción de contraseñas sin mezclarla con red o almacenamiento. |
| [`index.html`](../frontend/index.html) y [`styles.css`](../frontend/styles.css) | Estructura, IDs, estilos y adaptación de pantalla. | Presentación y accesibilidad, conservando los IDs que consulta TypeScript. |

Todos esos módulos se compilan a `dist/*.js` con `npm run build`. Los imports usan extensión `.js` porque son los archivos que carga el navegador. `dist/` se versiona; modificar solo TypeScript no actualiza la demo hasta recompilar.

### Predice, observa y explica

`initLab` registra los controles y el envío, comprueba las entradas e impide envíos simultáneos. La UI no fija semilla. Guarda un identificador de ejecución y descarta la respuesta si el cambio de número de qubits la ha vuelto obsoleta.

`renderResult` actualiza histograma, tabla, probabilidad, métricas y circuito. `observe` compara la predicción con la teoría en modo ideal o con el porcentaje medido en modo ruidoso. Las predicciones de iteraciones se comparan con el óptimo. Después llama a `rewardPrediction`, que aplica el tope diario.

`explain` describe la posición respecto al óptimo, el éxito clásico con consultas comparables y la diferencia entre medida y teoría. `afterRun` registra actividades y pasos. La curva permanece oculta hasta la primera ejecución para cada tamaño de circuito.

### Red, gráficos y errores

`request` usa rutas relativas al mismo origen. Si recibe un error, `ApiError` conserva el estado y un tiempo de reintento acotado. `cached` memoriza promesas de respuestas deterministas y elimina una entrada fallida para permitir reintentar; no memoriza los valores de contraseñas.

`setState`, `setBusy` y `release` presentan carga, errores y el tiempo de espera tras un 503. Los gráficos SVG llevan título y descripción; `main.ts` construye las tablas equivalentes. `h` introduce texto mediante nodos y `textContent`, en lugar de interpretar contenido educativo como HTML. Los enlaces del contenido se limitan a HTTP/HTTPS.

## Retos y progreso

`daily` convierte una fecha ISO en semilla mediante SHA-256 y usa `random.Random` para seleccionar tipo, parámetros y respuestas. No es un generador criptográfico ni necesita serlo: todos pueden reproducir la pregunta y la respuesta viene en el JSON.

La API usa UTC cuando se omite fecha. `loadChallenge` pasa la fecha local del navegador, y al volver a una pestaña visible se comprueba si cambió el día.

`progress.ts` guarda identificadores y resultados educativos en `qubitguard.progress.v1`. `load` intenta normalizar datos anteriores o corruptos; `save` tolera almacenamiento bloqueado. Cada fecha admite una respuesta de reto con puntos; se conservan las últimas 60 fechas. Los niveles dependen de la XP acumulada, con umbrales `60·(nivel−1)²`. Los pasos y logros solo se registran una vez.

No se guarda una contraseña para otorgar el logro: `password-ui.ts` llama a `onStrong` únicamente con el tipo de evento, `analizada` o `generada`. El progreso puede editarse en el navegador y no sirve como evidencia confiable de rendimiento académico.

## Contraseñas y frontera de privacidad

`analyze` recibe una cadena y una tasa clásica de intentos. Detecta clases de caracteres y resta penalizaciones por patrones, sin contar dos veces la misma posición. Devuelve una estimación heurística, no la entropía real de una elección humana. Los tiempos cuánticos presuponen `QUANTUM_ITERATIONS_PER_SECOND = 1e6`, sin medición de hardware.

`randomInt` toma enteros de 32 bits mediante `crypto.getRandomValues` y rechaza la cola que produciría sesgo al calcular el módulo. `generateChars` vuelve a generar la cadena si falta alguna clase requerida y calcula el logaritmo del número de cadenas válidas mediante inclusión-exclusión. `generatePassphrase` elige palabras uniformemente de la lista deduplicada. `strengthen` añade caracteres y cuenta su aleatoriedad; considera conocida la base.

El valor vive en memoria y en el DOM de la pestaña. Mostrarlo o copiarlo es una acción del usuario; copiarlo lo entrega al portapapeles del sistema. Al abandonar la página se vacían las variables o campos sensibles manejados por la UI. Esto no permite prometer borrado físico de memoria ni control sobre extensiones del navegador o el sistema operativo.

Al añadir una opción, mantén esta frontera: no pases la contraseña a `api.ts`, `progress.ts`, logs ni almacenamiento. Un evento educativo puede incluir el tipo de actividad; no necesita la cadena privada.

## Seguridad y límites operativos

El middleware normaliza rutas antes de comprobar la lista pública, añade cabeceras y asigna caché HTTP. La CSP se aplica a la aplicación, con excepción de las rutas de documentación; permite estilos inline e imágenes `data:`. Las simulaciones usan `no-store` y el contenido determinista tiene tiempos de caché.

Las cabeceras y el semáforo no aportan autenticación ni un límite global de solicitudes por IP. Aumentar workers crea semáforos y cachés independientes. Para una demo pública, la exposición, HTTPS y controles externos se describen en [DEPLOY.md](DEPLOY.md).

## Pruebas y cómo mantener el contrato

| Archivo o comando | Qué comprueba |
|---|---|
| `tests/test_api.py` | Formas de respuesta, contenido, rangos y campos extra. |
| `tests/test_quantum.py` | Óptimos de 2–6 qubits, curvas, mediciones ideales, Monte Carlo y ejecución FakeFez marcada `slow`. |
| `tests/test_privacy.py` | Contrato sin contraseñas y búsqueda estática de E/S, persistencia y `Math.random` en módulos sensibles. |
| `tests/test_security_headers.py` | Cabeceras, caché, gzip, rutas públicas, traversal, copias de caché y traducción de errores. |
| `frontend/test/*.test.mjs` | Generación, aleatoriedad, estimaciones básicas y reglas de progreso. |
| `npm run check` | Consistencia de tipos TypeScript sin emitir archivos. |
| `.github/workflows/ci.yml` | Python 3.13 y Node 24 en Ubuntu; Python excluye `slow`. |

Pruebas locales ejecutadas: 47 Python y 33 frontend, además de tipos. `dom.test.mjs` verifica interrupción de animaciones, movimiento reducido y ausencia de Web Animations; `ambience.test.mjs` comprueba ocultación del fondo, pausa en segundo plano, movimiento reducido y salida de la entrada IBM. No son pruebas completas del DOM ni un estudio de aprendizaje. Cuando cambies una ruta, revisa router, cliente TypeScript, consumidor, tests y [API.md](API.md); cuando cambies TypeScript, recompila y versiona `dist/`.

Para revisar el motor desde PyCharm, usa como intérprete el entorno que contiene las dependencias, configura `uvicorn` como módulo, `app.main:app --reload` como parámetros y la raíz del repositorio como directorio. Puedes colocar breakpoints en `grover` y `run_grover`, o ejecutar directamente los tests con ese intérprete.

## Compatibilidad con el starter anterior

El laboratorio es una evolución con cambios de contrato respecto del starter anterior al PR #1:

- `/api/quantum/grover-demo` se sustituye por `/api/quantum/grover`.
- `/api/quantum/hadamard-demo` y la función `run_hadamard` ya no se exponen. La actividad con cero iteraciones demuestra la superposición, pero no es un alias HTTP de esa ruta.
- `capabilities` tiene otro esquema y el mínimo del laboratorio es 2 qubits.
- Se eliminaron wrappers de raíz y utilidades `src/qubitguard` desconectadas; los imports deben apuntar al paquete `app` actual.

No se añadieron adaptadores de compatibilidad. Si existe un consumidor externo de la API anterior, habrá que migrarlo o acordar una transición antes de actualizarlo.
