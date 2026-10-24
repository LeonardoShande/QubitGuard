# QubitGuard Quantum Lab

Laboratorio web educativo de ciberseguridad cuántica para el IBM Quantum Hackathon / Qiskit Fall Fest 2026 (Lima), reto 5.3 EdTech de IEEE CS PUCP. Público objetivo: personas desde los 14 años, sin conocimientos previos de computación cuántica.

QubitGuard enseña **distribuciones de probabilidad y amplitudes** (una amplitud es un número, que puede ser negativo, cuyo cuadrado da la probabilidad) con una pregunta concreta: ¿cuántos intentos hacen falta para encontrar un secreto? La búsqueda aleatoria clásica espera `(N+1)/2` intentos; el algoritmo de Grover amplifica la amplitud del estado correcto y necesita del orden de `π/4 · √N` iteraciones. El estudiante **predice, ejecuta un circuito de Qiskit en un simulador y contrasta** su predicción con la teoría y con mediciones ideales o con ruido.

> **Estado honesto.** Todos los circuitos de la aplicación web se ejecutan en simuladores locales (Qiskit Aer, con el modelo de ruido `FakeFez` como opción). **No se ha ejecutado nada en hardware cuántico real de IBM**: existe un CLI listo para hacerlo ([sección 5](#5-ejecución-en-hardware-cuántico-de-ibm)) pero no hay un solo job enviado. Tampoco se ha hecho todavía un piloto con estudiantes: no afirmamos mejoras de aprendizaje ni retención. QubitGuard es una herramienta didáctica y no ejecuta ataques contra sistemas reales.

El laboratorio se integró en `main` mediante el [PR #1](https://github.com/LeonardoShande/QubitGuard/pull/1). La [guía del código](docs/GUIA_DEL_CODIGO.md) explica sus módulos, y la [revisión frente al prompt y las bases](docs/REVISION_PROMPT_Y_BASES.md) compara lo implementado con el encargo y prioriza mejoras en general.

## Para el jurado en 3 minutos

```bash
git clone https://github.com/LeonardoShande/QubitGuard.git && cd QubitGuard
python3 -m venv .venv && .venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m uvicorn app.main:app --port 8000   # abrir http://127.0.0.1:8000
```

1. **Laboratorio Grover:** 4 qubits, estado `1010`, predice la probabilidad y ejecuta (óptimo: 3 iteraciones, 96,1 % teórico).
2. Activa el **ruido FakeFez** y sube a 6 qubits: el éxito cae al nivel del azar.
3. **Explorador de amplitudes:** mueve `k` y mira cómo gira el estado.
4. Evidencia y límites: [sección 7](#7-resultados-reproducibles-validación-y-limitaciones); hardware IBM: [sección 5](#5-ejecución-en-hardware-cuántico-de-ibm); guion: [pitch/GUION.md](pitch/GUION.md).

## Índice

1. [Qué es y qué problema resuelve](#1-qué-es-y-qué-problema-resuelve)
2. [Cómo se usa](#2-cómo-se-usa)
3. [Cómo funciona por dentro](#3-cómo-funciona-por-dentro)
4. [Arquitectura y decisiones técnicas](#4-arquitectura-y-decisiones-técnicas)
5. [Ejecución en hardware cuántico de IBM](#5-ejecución-en-hardware-cuántico-de-ibm)
6. [Instalación, pruebas y despliegue](#6-instalación-pruebas-y-despliegue)
7. [Resultados reproducibles, validación y limitaciones](#7-resultados-reproducibles-validación-y-limitaciones)
8. [Privacidad, seguridad y accesibilidad](#8-privacidad-seguridad-y-accesibilidad)
9. [Referencias y créditos](#9-referencias-y-créditos)
10. [Mapa de documentación](#mapa-de-documentación)

---

## 1. Qué es y qué problema resuelve

### El problema

- **La probabilidad cuántica no se deja intuir.** Las amplitudes pueden ser negativas y cancelarse entre sí; nada en la estadística escolar lo anticipa. Una fórmula como `sin²((2k+1)θ)` no se aprende leyéndola: hay que verla moverse.
- **La amenaza cuántica a la criptografía se cuenta mal.** Suele reducirse a «romperá todas las contraseñas» o a fórmulas que nadie comprueba. La realidad es más matizada: Grover da una ventaja solo cuadrática (duplicar los bits restaura el margen) y el riesgo concreto es para RSA y curvas elípticas por el algoritmo de Shor.
- **Falta una práctica activa y breve.** Un curso introductorio explica; muy pocas herramientas piden al estudiante comprometerse con una predicción antes de ver el resultado.

### Para quién y con qué frecuencia

| Pregunta de las bases | Respuesta del proyecto | Estado |
|---|---|---|
| ¿Desde qué edad? | **Desde 14 años.** Solo exige fracciones, porcentajes y la idea de probabilidad; no exige álgebra lineal. | Público propuesto; **no validado** con menores. |
| ¿Uso diario o semanal? | **Diario, unos 3 minutos:** un reto del día, una predicción y un experimento. Para un docente, también sirve como actividad de aula semanal. | Diseño; **la retención no se ha medido**. |
| ¿Metodología de enseñanza? | **Predice, Observa, Explica**: el estudiante apuesta antes de mirar, observa teoría y medición, y lee una explicación que corrige su error. | Implementada. |
| ¿Razón para volver? | Reto diario determinista por fecha, racha, XP, siete niveles, cinco pasos de ruta y seis logros. | Implementada; su efecto en el hábito no está probado. |

### La solución

El estudiante recorre un bucle corto: **predice** una probabilidad o un número de iteraciones, **ejecuta** un circuito de Grover de 2 a 6 qubits construido con Qiskit, **compara** su predicción con la teoría y con lo medido (con y sin ruido de `FakeFez`) y **practica** cada día con un reto. Además puede mover un **explorador de amplitudes** en vivo, analizar y generar contraseñas localmente y leer tarjetas de criptografía poscuántica.

### Mapeo: de la estadística a la amplitud, y de Monte Carlo a Grover

El **par oficial del reto** que cubre QubitGuard es **Distribuciones de probabilidad → Superposición y amplitudes**. Es el eje principal del producto.

| Concepto estadístico | Equivalente cuántico en QubitGuard |
|---|---|
| Distribución uniforme sobre `N = 2^n` resultados, `p = 1/N` | Superposición uniforme tras las puertas Hadamard: amplitud `a = 1/√N` para cada estado, con `p = a²`. |
| Las probabilidades son `≥ 0` y suman 1 | Las amplitudes pueden ser negativas; la probabilidad es `a²` y la suma de cuadrados es 1. |
| Una distribución uniforme no favorece a ningún resultado | El **oráculo** cambia el signo de la amplitud del estado marcado y el **difusor** refleja todas respecto a su media. El resultado es una rotación de `2θ`: la amplitud del marcado sube. |
| Más muestras, más información | Con `k` iteraciones, `P(k) = sin²((2k+1)θ)`; pasarse del óptimo **reduce** la probabilidad (sobre-rotación). |

El segundo par que toca el proyecto es **Monte Carlo → búsqueda de Grover** (como comparación de coste), **no Quantum Amplitude Estimation**. **QubitGuard no implementa QAE:** el «Monte Carlo» de la aplicación es la búsqueda aleatoria clásica sin repetición de un secreto, muestreada con NumPy, que sirve como referencia contra la que se mide la ventaja de Grover. La estimación cuántica de amplitud sería un alcance nuevo con diseño científico y pruebas propios; no se finge aquí.

Fórmulas usadas (con `N = 2^n`, un único estado marcado y `k` iteraciones):

| Magnitud | Búsqueda clásica aleatoria (sin repetir) | Grover ideal |
|---|---|---|
| Trabajo esperado | `(N + 1) / 2` intentos | `≈ (π/4) · √N` iteraciones |
| Éxito tras `k` pasos | `k / N`, para `0 ≤ k ≤ N` | `P(k) = sin²((2k + 1) · θ)` |
| Ángulo | N candidatos equiprobables | `θ = asin(1 / √N)` |
| Iteraciones del laboratorio | no aplica | `k_opt = floor(π / (4 · θ))` |

La ventaja es **cuadrática** en consultas al oráculo. Comparar intentos clásicos con iteraciones de Grover no equivale a comparar segundos: una iteración cuántica tiene un coste propio y la simulación consume CPU clásica.

### Qué NO es

No es un gestor de contraseñas, un escáner de seguridad, un sistema de evaluación antitrampa ni un servicio de ejecución en hardware IBM. No entrena modelos de machine learning. Una lista completa de límites está en la [sección 7](#7-resultados-reproducibles-validación-y-limitaciones) y en [docs/LIMITACIONES.md](docs/LIMITACIONES.md).

---

## 2. Cómo se usa

Con el servidor iniciado ([sección 6](#6-instalación-pruebas-y-despliegue)), abre `http://127.0.0.1:8000`. Al cargar, una entrada breve forma el logotipo ASCII de IBM «midiéndolo» (cada glifo nace en superposición y colapsa al carácter final); se puede saltar con clic, toque o `Esc`, y no se ejecuta si el sistema pide movimiento reducido. Un botón **ASCII** de la cabecera oculta el fondo decorativo. La cabecera muestra tu nivel, XP y racha. La navegación sigue el orden de las secciones reales de la página:

| Sección de la UI | Qué hacer y qué enseña |
|---|---|
| **Inicio** y «Explora la escala» | Mueve el control de bits (2 a 128) y observa `N = 2ⁿ`, los intentos al azar `(N+1)/2` y las iteraciones de Grover `π/4·√N`. Es una comparación teórica de consultas, no tiempos medidos. |
| **El problema** | Resume el problema, el público (desde 14 años, unos 3 minutos al día), la solución (predice, ejecuta, compara, practica) y la evidencia: lo medido y lo pendiente (el piloto con estudiantes no se ha hecho). |
| **Tu ruta** | Cinco pasos guiados: superposición, oráculo, amplificación, ruido y criptografía. Cada botón deja el laboratorio configurado; tú predices y ejecutas. Aquí también están los seis logros. |
| **Reto diario** | Una pregunta nueva cada día (iteraciones óptimas, probabilidad de éxito o comparación clásico/Grover). Acertar da 50 XP y mantener la racha suma un extra. Solo puntúa la primera respuesta del día. |
| **Laboratorio Grover** | Elige 2 a 6 qubits, un estado marcado (o aleatorio), las iteraciones (óptimas o de 0 a 20), los *shots* (1 a 8192) y si quieres ruido de `FakeFez`. Antes de ejecutar haces tu **predicción**. |
| **Amplitudes** (explorador) | Cálculo en vivo en el navegador para 2 a 10 qubits y hasta `2·óptimo + 2` iteraciones. Ver más abajo. |
| **Azar frente a Grover** | Simulación Monte Carlo (2 a 20 bits, hasta 5000 ensayos) con su media frente a `(N+1)/2`, y una tabla/gráfico de cómo crece cada búsqueda hasta 256 bits. |
| **Tu contraseña** | Analizador de fortaleza y generador (caracteres, frase de palabras o reforzar una base). Todo se hace en el navegador. |
| **Poscuántica** | Tarjetas sobre Grover frente a AES, Shor frente a RSA/ECC, el estándar NIST, *harvest now, decrypt later* y contraseñas, con fuentes enlazadas. |
| **Limitaciones** | Lo que esta demo no demuestra, servido desde la API. |

### Predice, Observa, Explica

1. **Predice.** En «Tu predicción» eliges entre estimar la *probabilidad de acertar* (control deslizante) o el *número de iteraciones óptimas*. La referencia visible es el azar, `1/N`.
2. **Observa.** Al pulsar **Ejecutar circuito** aparece el panel «Predice, observa, explica» con tres cifras: lo que predijiste, la teoría `sin²((2k+1)θ)` y lo medido, sobre una escala común. Debajo, el histograma de conteos, la curva de éxito por iteración, las métricas del circuito transpilado (profundidad, puertas de 2 qubits, backend) y el diagrama del circuito en texto.
3. **Explica.** Una lista breve interpreta el resultado: cuánto te acercaste, qué dice la comparación con el azar `k/N`, qué pasa si te pasas del óptimo y, con ruido, por qué la medida cae respecto a la teoría. La cercanía de la predicción da XP (hasta cinco predicciones puntuables por día) y desbloquea logros.

Una secuencia sugerida de 60 a 90 segundos: 4 qubits, estado `1010`, cero iteraciones (distribución casi uniforme), iteraciones óptimas (3, teoría 96,1 %) y 6 qubits con ruido activado.

### Explorador de amplitudes en vivo

Sección «Explorador de amplitudes» (`#amplitudes`). Mueve **qubits** (2 a 10) e **iteraciones** y ve, en tiempo real:

- las **barras de amplitud** del estado marcado `ω` frente al resto, con la línea de la media;
- el **vector de estado** en el plano `|ω⟩` / `|s'⟩`, que gira un ángulo `2θ` por iteración, con sus proyecciones;
- las lecturas de **Grover `sin²((2k+1)θ)`** frente al **azar con `k` consultas `k/N`**;
- un botón **Siguiente iteración** que anima la iteración en dos tiempos (primero el oráculo cambia el signo de `ω`; luego el difusor refleja respecto a la media) y avisa cuando te pasas del óptimo.

El explorador pide antes una predicción: la comparación enseña más cuando hay un compromiso previo. Se puede abrir sin predecir con «Explorar sin predecir». **Lo que calcula son las fórmulas exactas en el navegador; no llama al servidor ni ejecuta un circuito de Qiskit.** La curva de Qiskit (`Statevector`) coincide con esa fórmula entre 2 y 6 qubits con un error máximo de `6,15·10⁻¹⁴` (cubierto por `test_grover_curve_matches_formula_at_every_k`), así que laboratorio y explorador cuentan la misma historia. Con movimiento reducido las transiciones saltan al estado final.

### Reto diario, racha, XP y logros

- **Reto diario:** determinista por fecha (SHA-256 de la fecha ISO como semilla), sin base de datos. La interfaz pide el reto de la **fecha local del navegador**; la API, si no recibe `?date=`, usa UTC. Devuelve también la respuesta correcta: es un juego para aprender, no un examen seguro.
- **XP y niveles:** siete niveles, de «Aprendiz de qubits» a «Guardián cuántico».
- **Racha:** días locales consecutivos con el reto resuelto; la misma fecha no puntúa dos veces.
- **Logros (6):** primera predicción, primera predicción exacta, ver el ruido borrar a Grover, contraseña de 128+ bits generada, tres días seguidos y ruta completa.
- **Dónde se guarda:** `localStorage`, clave `qubitguard.progress.v1`. Pertenece a ese navegador y origen (`localhost` y `127.0.0.1` son distintos); borrar los datos del sitio lo elimina; si el almacenamiento está bloqueado, solo dura la pestaña. Es editable y no sirve para ranking ni exámenes.

### Analizador y generador de contraseñas (locales)

Ambos corren en el navegador; la API no tiene ningún campo de contraseña. Copiar una contraseña sí la coloca en el portapapeles del sistema.

**Analizador (`frontend/src/password.ts`).** Estima bits a partir de la longitud y del alfabeto detectado y penaliza palabras comunes, recorridos de teclado, secuencias, repeticiones y años. Es una heurística: no consulta filtraciones ni un diccionario exhaustivo y puede sobreestimar. El tiempo clásico depende de la tasa de intentos elegida (por defecto `1e10`); el cuántico supone **un millón de iteraciones de Grover por segundo**, un escenario hipotético y no una medición.

**Generador (`frontend/src/generator.ts`).** Usa `crypto.getRandomValues` con muestreo por rechazo (sin sesgo de módulo) y no admite semilla.

| Modo | Funcionamiento |
|---|---|
| Caracteres | 8 a 128 caracteres, clases seleccionables y opción de excluir caracteres confusos. Exige presencia de cada clase activa y calcula el tamaño del espacio válido por inclusión-exclusión. |
| Frase de palabras | 3 a 12 palabras de una lista deduplicada, con separador y opciones de mayúscula y número. |
| Mejorar la mía | Inserta caracteres aleatorios en la base; solo cuentan los bits añadidos, porque la base se considera conocida. |

La meta educativa es **128 bits**; la interfaz muestra la mitad como bits efectivos frente al modelo idealizado de Grover. Alcanzarla no certifica una contraseña ni equivale a una garantía de seguridad.

---

## 3. Cómo funciona por dentro

### Librerías y por qué cada una

| Biblioteca | Versión verificada | Para qué se usa | Por qué ésta y no otra |
|---|---|---|---|
| `qiskit` | 2.6.1 (rango `>=2.6,<3`) | `QuantumCircuit` para oráculo, difusor y medición; `transpile`; `quantum_info.Statevector`. | Es el SDK del evento; los circuitos **se ejecutan**, no solo se dibujan. `transpile` da métricas que importan en hardware (profundidad, puertas de 2 qubits) que una fórmula no entrega. |
| `qiskit-aer` | 0.18.0 | `AerSimulator`: muestreo con *shots* e histogramas; admite ruido. | Imita la medición de un dispositivo real y permite `from_backend` con un modelo de ruido. Es simulación clásica de circuitos cuánticos. |
| `qiskit-ibm-runtime` | 0.51.0 | `FakeFez` (fake provider) para el ruido simulado en la web; `QiskitRuntimeService` y `SamplerV2` en el CLI de hardware. | `FakeFez` enseña el efecto del ruido sin cuenta; el mismo paquete lleva el camino a procesadores reales. |
| `numpy` | 2.5.4 | Monte Carlo (muestreo uniforme y histograma). | Es estadística clásica: no necesita Qiskit y no se disfraza de cuántica. |
| `fastapi` | 0.162.0 | API HTTP y servicio de los archivos estáticos desde un solo proceso. | Validación declarativa y contrato OpenAPI sin código extra. |
| `uvicorn` | 0.54.0 | Servidor ASGI. | Estándar con FastAPI. |
| `pydantic` | 2.14.1 | Modelos de petición con `extra="forbid"` y rangos acotados. | Rechaza campos inesperados (incluido cualquier campo de contraseña). |
| `pytest`, `httpx` | 9.1.1, 0.28.1 | Pruebas con `TestClient`. | Sin arrancar Uvicorn por separado. |
| TypeScript (`tsc`) | 5.9.3, solo desarrollo | Frontend compilado a `frontend/dist/*.js`. | **Sin dependencias de ejecución** ni frameworks: menos superficie, compilación simple, fácil de leer. |
| `python-pptx` | 1.0.2, opcional | Solo `pitch/build_deck.py` (`.venv/bin/python -m pip install python-pptx==1.0.2`). | No forma parte de la aplicación. |

Usar Qiskit no es adorno: cada pieza responde a una pregunta pedagógica concreta. El oráculo y el difusor se **construyen y se miden** (entrega la probabilidad real del circuito); `Statevector` da la curva exacta sin ruido de muestreo; `AerSimulator` enseña qué es un *shot*; `FakeFez` y `transpile` enseñan que el coste del circuito crece y que el ruido lo degrada. Lo que no necesita Qiskit (Monte Carlo, el explorador, el análisis de contraseñas) no lo usa.

### Funciones clave

Backend (`app/`):

| Función o clase | Archivo | Qué hace |
|---|---|---|
| `build_grover_circuit` | `app/quantum/experiments.py` | Hadamard en todos los qubits, `k` veces (oráculo + difusor) y `measure_all()`. Con `measure=False` devuelve el circuito sin medir para `Statevector`. |
| `_phase_oracle_for_basis_state` | `app/quantum/experiments.py` | **Oráculo de fase:** X en los qubits cuyo bit objetivo es 0, H + `mcx` + H sobre el último qubit (una Z multicontrolada) y X de nuevo. Cambia el signo del estado marcado. |
| `_diffuser` | `app/quantum/experiments.py` | **Difusor:** H, oráculo del estado `00…0`, H. Refleja las amplitudes respecto a su media. |
| `optimal_iterations` | `app/quantum/experiments.py` | `floor(π / (4·θ))` con `θ = asin(1/√N)`. |
| `theoretical_success` | `app/quantum/experiments.py` | `sin²((2k+1)θ)`: referencia matemática, no sustituye al circuito. |
| `grover_curve` (`_grover_curve_cached`) | `app/quantum/experiments.py` | Probabilidad exacta del marcado para `k = 0..2·óptimo` con `Statevector.from_instruction`; caché en memoria. |
| `run_grover` (`_run_grover`) | `app/quantum/experiments.py` | Valida, construye, transpila y simula. Ideal: `AerSimulator`, base `cx/rz/sx/x`, optimización 1. Ruidoso: `AerSimulator.from_backend(FakeFez())` (`_noisy_backend`), optimización 3. Mide `depth` y `two_qubit_gates` **tras** transpilar. Con `seed`, cachea el resultado. |
| `montecarlo` | `app/quantum/experiments.py` | Muestrea con NumPy la posición uniforme del secreto, agrupa en un histograma y devuelve media y `(N+1)/2`. |
| `compare` (`_compare_cached`) | `app/quantum/experiments.py` | Tabla teórica de `(N+1)/2` frente a `π/4·√N` hasta 256 bits; siempre incluye el `max_bits` pedido. |
| `capabilities` | `app/quantum/experiments.py` | Versiones, límites y `physical_hardware: false`. |
| `SimulatorBusy` y `_NOISY_SIMULATOR_LIMIT` | `app/quantum/experiments.py` | Semáforo de 2 simulaciones ruidosas simultáneas por proceso; si no hay cupo en 10 s se lanza `SimulatorBusy`. |
| `simulator_busy_handler` | `app/main.py` | Traduce `SimulatorBusy` a 503 con `Retry-After: 2`. |
| `response_policies` (middleware) | `app/main.py` | Lista blanca de rutas públicas (normaliza `..`), CSP y demás cabeceras de seguridad, política de caché, 500 genérico con cabeceras. |
| `GroverRequest`, `MonteCarloRequest`, `CurveRequest` | `app/api/quantum.py` | Validación Pydantic y traducción de `ValueError` a 422. |
| `daily` | `app/api/challenge.py` | Reto determinista por fecha (SHA-256 alimenta `random.Random`); no importa Qiskit. |
| `pqc`, `limitations` | `app/api/learn.py` | Sirven el contenido de `app/content/*.json`, leído una vez al importar. |

Frontend (`frontend/src/`):

| Módulo | Qué hace |
|---|---|
| `api.ts` | Cliente de [docs/API.md](docs/API.md): objeto `api`, `ApiError`, `describeError`. Caché por sesión con deduplicación en vuelo para respuestas deterministas; entiende `Retry-After` en 503. |
| `charts.ts` | Gráficos SVG propios (`barChart`, `lineChart`, `mount`) con título, descripción y tabla equivalente; entrada animada solo por cada generación nueva de datos. |
| `explorer.ts` | Explorador de amplitudes: `groverAngle`, `theoreticalSuccess`, `randomSuccess`, `amplitudesAt` y `initExplorer` (barras, vector, lecturas y paso oráculo/difusor). |
| `password.ts` | `analyze`: entropía bruta, penalizaciones, tiempo clásico y Grover hipotético; `formatDuration`. |
| `generator.ts` | `randomInt` (CSPRNG con rechazo), `generateChars`, `generatePassphrase`, `strengthen`, `countValidLog2`. Con `wordlist.ts` (2072 palabras). |
| `password-ui.ts` | Conecta analizador y generador con el DOM y fija la meta de 128 bits. |
| `progress.ts` | Ruta (`STEPS`), logros (`ACHIEVEMENTS`), niveles, XP, racha (`todayLocal`, `currentStreak`), tope de predicciones por día y `localStorage` tolerante a datos corruptos. |
| `ambience.ts` | `initAmbience`: lluvia ASCII por columnas CSS y la intro IBM (`decodeIntro`); usa `crypto.getRandomValues`, nunca `Math.random`. |
| `main.ts`, `dom.ts` | Flujo de la interfaz (laboratorio, Predice-Observa-Explica, reto, Monte Carlo, comparación, navegación) y utilidades de DOM y movimiento. |

### Qué ejecuta cada componente

- **`Statevector`:** probabilidad exacta del estado marcado; por eso la curva es **ideal** incluso cuando el histograma usa ruido.
- **`AerSimulator`:** ejecuta el circuito con *shots* (repeticiones con medición); más *shots* reducen la variación estadística pero no eliminan el ruido del modelo.
- **`FakeFez`:** backend simulado basado en una instantánea de un procesador IBM. No contacta hardware.
- **`transpile`:** adapta el circuito a la base de puertas o al backend; `depth` y `two_qubit_gates` describen el circuito **transpilado**, mientras `circuit_text` dibuja el circuito lógico previo.
- **Monte Carlo:** estadísticamente equivalente a buscar sin repetir; no genera ni prueba claves una por una.
- **Tabla comparativa:** solo fórmulas; no simula circuitos de 128 o 256 bits.

El flujo completo es: **predicción en el navegador → petición validada por FastAPI → experimento local → respuesta JSON → gráficos, explicación y progreso**.

---

## 4. Arquitectura y decisiones técnicas

```text
                       mismo origen y puerto (por defecto :8000)
 ┌───────────────────┐   HTTP/JSON    ┌────────────────────────┐   llamadas    ┌──────────────────────────┐
 │ Navegador         │ ─────────────▶ │ FastAPI (un proceso)   │ ────────────▶ │ Qiskit / Aer / FakeFez   │
 │ TypeScript + SVG  │ ◀───────────── │ rutas, validación,     │ ◀──────────── │ NumPy (Monte Carlo)      │
 │ contraseñas y     │                │ cabeceras, caché,      │   locales     │ app/quantum/experiments  │
 │ progreso locales  │                │ archivos estáticos     │               └──────────────────────────┘
 └───────────────────┘                └────────────────────────┘

 Opcional, fuera del servidor web (proceso independiente, requiere cuenta IBM):

 scripts/run_ibm_hardware.py ──▶ mismo build_grover_circuit ──▶ generate_preset_pass_manager
        (fake | dry-run | ibm | --job-id)                         └▶ SamplerV2 ──▶ IBM Quantum Platform (QPU)
```

Estructura del repositorio:

```text
QubitGuard/
├── app/
│   ├── main.py                   # Aplicación, middleware y frontend estático
│   ├── api/
│   │   ├── quantum.py            # Grover, curva, Monte Carlo y comparación
│   │   ├── challenge.py          # Reto determinista por fecha
│   │   └── learn.py              # Contenido educativo
│   ├── quantum/experiments.py    # Circuitos, simulación y cálculos
│   └── content/                  # Tarjetas y limitaciones en JSON
├── frontend/
│   ├── index.html, styles.css    # Interfaz en español
│   ├── src/                      # TypeScript: laboratorio, explorador, contraseñas, progreso
│   ├── dist/                     # JavaScript compilado y versionado
│   ├── test/                     # Pruebas con node:test
│   └── UX_AUDIT.md               # Criterios de interfaz y accesibilidad
├── scripts/run_ibm_hardware.py   # CLI: el mismo Grover en FakeFez o en hardware IBM
├── tests/                        # API, experimentos, privacidad, cabeceras y CLI
├── docs/                         # Arquitectura, contrato, despliegue, límites, IBM
├── pitch/                        # Presentación, guion y entregables
├── Dockerfile, compose.yaml      # Imagen y stack para Docker / CasaOS
├── .github/workflows/ci.yml      # Validación de Python y frontend
├── pyproject.toml, requirements.txt
```

No hay cuentas, base de datos ni sincronización de progreso. El servidor guarda cachés en memoria (curvas, tablas y ejecuciones con semilla) que se pierden al reiniciar. Detalle por capas en [docs/architecture.md](docs/architecture.md).

### Decisiones técnicas y su justificación

| Decisión | Razón | Coste asumido |
|---|---|---|
| **Sin frameworks y sin dependencias de ejecución en el frontend** | Menos superficie de ataque y de mantenimiento; `tsc` basta; el código es legible en un hackathon. `dist/` va versionado, así que la demo arranca sin Node. | Sin la comodidad de un framework; gráficos y componentes propios. |
| **Un solo proceso** (FastAPI sirve API y estáticos) | Un comando para ejecutar, un origen, nada de CORS. | El semáforo y las cachés son por proceso; más *workers* multiplican límites y cachés. |
| **CSP `default-src 'self'` y lista blanca de rutas** | Sin scripts de terceros; solo se publican `index.html`, `styles.css`, `dist/` y `assets/` (`/src/`, `/node_modules/` dan 404). | Se permiten estilos inline e imágenes `data:`. |
| **Funciona sin internet** (tras instalar) | Demo fiable en un salón sin red; sin fuentes ni CDN externos. | El túnel público, las fuentes enlazadas en docs y Swagger/ReDoc sí necesitan red. |
| **Contraseñas solo en el navegador** | Ningún endpoint las recibe; un test lo comprueba. | El análisis es heurístico. |
| **Cuántica en Qiskit, estadística en NumPy** | Cada herramienta donde corresponde; se evita fingir que Monte Carlo es cuántico. | Dos caminos de código. |
| **CLI de hardware separado del servidor** | Arrancar la web no crea cuentas ni consume cuota IBM; las credenciales nunca pasan por la web. | La imagen Docker no incluye `scripts/`. |
| **Contenido en JSON** | Se edita sin tocar código. | Se carga una vez al importar. |

---

## 5. Ejecución en hardware cuántico de IBM

El CLI `scripts/run_ibm_hardware.py` importa `build_grover_circuit`, `optimal_iterations` y `theoretical_success` de `app.quantum.experiments`: usa **el mismo oráculo, difusor y mediciones** que el laboratorio. Es un proceso independiente. La guía completa, con credenciales, cuota y formato de resultados, está en [docs/IBM_HARDWARE.md](docs/IBM_HARDWARE.md); aquí el resumen.

> **No se ejecutó en hardware real.** No se envió ningún job a IBM en esta validación (no había cuenta configurada). Lo que se midió es `FakeFez` local. Los modos `dry-run` e `ibm` se probaron únicamente con dobles locales, sin red.

### Preparación

1. Crea un IBMid e inicia sesión en [IBM Quantum Platform](https://quantum.cloud.ibm.com/).
2. Crea o selecciona una instancia del plan **Open** y copia su CRN; crea una API key en el panel.
3. Autentícate de una de dos formas. **El CLI no acepta `--token`, no guarda cuentas y no escribe credenciales en sus JSON ni mensajes.**
   - **Cuenta guardada** con `QiskitRuntimeService.save_account(...)` (ejemplo con `getpass` en la guía). El SDK la guarda en `~/.qiskit/qiskit-ibm.json`, fuera del repositorio y sin cifrar: protege ese archivo.
   - **Variables de entorno** `QISKIT_IBM_TOKEN` y `QISKIT_IBM_INSTANCE`, leídas con `read -rs` para que la clave no quede en el historial; `unset` al terminar. `--instance CRN` tiene prioridad.

### Modos

| Modo | Red y cuenta | Qué hace |
|---|---|---|
| `fake` (por defecto) | No | Transpila con `generate_preset_pass_manager(optimization_level=3, backend=FakeFez())` y ejecuta en `AerSimulator.from_backend(FakeFez())`. |
| `dry-run` | Sí | Elige el backend (`least_busy` si no indicas `--backend`) y transpila, **sin crear Sampler ni enviar job**. Imprime profundidad, puertas de 2 qubits y layout. |
| `ibm` | Sí, **consume cuota** | Misma compilación y envía un circuito con `SamplerV2(mode=backend).run([compiled], shots=shots)`. Imprime el `job_id` de inmediato, antes de esperar el resultado. |
| `--job-id ID` | Sí | **Recupera** el resultado de un job creado por este CLI, sin reenviarlo, con los parámetros guardados en `circuit_metadata.qubitguard`. Lee `result[0].data.meas.get_counts()`. |

```bash
# Sin cuenta ni red: el mismo circuito sobre el modelo de ruido FakeFez
python -m scripts.run_ibm_hardware --mode fake --n-qubits 3 --marked 101 --shots 1024 --seed 7

# Con cuenta: revisar la compilación y luego (consume cuota) enviar un job
python -m scripts.run_ibm_hardware --mode dry-run --n-qubits 3 --marked 101 --seed 7
python -m scripts.run_ibm_hardware --mode ibm --n-qubits 3 --marked 101 --shots 1024 --seed 7

# Recuperar un job ya enviado
python -m scripts.run_ibm_hardware --mode ibm --job-id ID_DEL_JOB --out results/recuperado.json
```

Opciones: `--n-qubits` 2 a 6, `--marked` binario de esa longitud, `--iterations` 0 a 20 (por defecto el óptimo), `--shots` 1 a 8192 (1024), `--seed` 0 a 4294967295 (controla la transpilación y, en `fake`, el muestreo; no fija el hardware). Cada ejecución guarda `results/ibm_<fecha UTC>.json` o la ruta de `--out` sin sobrescribir; incluye versiones, backend, `job_id`, profundidad, puertas de 2 qubits, layout, *counts* y éxito observado, ideal y aleatorio.

### Qué esperar: cifras medidas en FakeFez

Medido el **24 de octubre de 2026** con el CLI, `FakeFez` local, 1024 *shots*, `seed` 7, optimización 3, Qiskit 2.6.1, Aer 0.18.0 y Runtime 0.51.0. **No son resultados de una QPU.**

| n | Marcado | k | Profundidad | Puertas de 2 qubits | Éxito medido | Éxito ideal | Azar `1/N` |
|---|---|---|---|---|---|---|---|
| 3 | `101` | 2 | 137 | 39 | 0,802 | 0,945 | 0,125 |
| 4 | `1010` | 3 | 448 | 111 | 0,662 | 0,961 | 0,0625 |
| 5 | `10101` | 4 | 1456 | 517 | 0,184 | 0,999 | 0,031 |
| 6 | `101010` | 6 | 4447 | 1706 | 0,0166 | 0,997 | 0,0156 |

**Lectura:** el ruido NISQ borra la amplificación al crecer el circuito. La profundidad pasa de 137 a 4447 y las puertas de 2 qubits de 39 a 1706 porque descomponer y enrutar las puertas multicontroladas (`mcx`) en la topología del chip es costoso; con cada puerta se acumula error y, a n=6, el éxito (1,66 %) es indistinguible del azar (1,56 %). Aun así, con n=3 la señal sigue claramente por encima del azar. Estas cifras dependen del backend, la calibración, las versiones, el layout y el estado marcado: no se extrapolan a una QPU. La cuota Open de IBM es limitada (la guía cita 10 minutos de tiempo QPU por ventana móvil de 28 días; verifícalo en el panel); empieza con n=3 y un solo job.

---

<a id="instalación-y-ejecución"></a>

## 6. Instalación, pruebas y despliegue

### Requisitos

| Herramienta | Uso |
|---|---|
| Git | Clonar el repositorio. |
| Python 3.11 o superior | Backend. La CI y la imagen Docker usan Python 3.13. |
| pip y `venv` (o `uv`) | Entorno aislado. |
| Navegador moderno con JavaScript | Interfaz y Web Crypto. |
| Node.js y npm (opcionales) | Recompilar o probar el frontend. La CI usa Node.js 24. |

`frontend/dist/*.js` está versionado: **para ejecutar sin modificar el frontend no necesitas Node.js**. Instalar dependencias requiere internet; después, la interfaz y las simulaciones funcionan con el servidor local sin servicios externos.

### Instalación local (macOS / Linux)

```bash
git clone https://github.com/LeonardoShande/QubitGuard.git
cd QubitGuard

python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Con `uv` (alternativa equivalente, **no probada en este repositorio**): `uv venv && source .venv/bin/activate && uv pip install -r requirements.txt`.

**Windows (PowerShell):**

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Si PowerShell bloquea la activación, usa `.\.venv\Scripts\python.exe` directamente.

Abre [http://127.0.0.1:8000](http://127.0.0.1:8000). Estado: `/api/health`. Versiones y límites: `/api/quantum/capabilities`. Contrato: `/openapi.json`; interfaces `/docs` y `/redoc` (cargan recursos externos y pueden necesitar internet). No hay archivo `.env` ni credenciales para la web.

Para recompilar el frontend si lo editas:

```bash
cd frontend && npm ci && npm run build && cd ..
```

`--reload` de Uvicorn no compila TypeScript. No hay servidor frontend aparte ni `npm start`.

### PyCharm

Selecciona el intérprete de `.venv` y crea tres configuraciones, todas con la raíz del repositorio como directorio de trabajo:

| Configuración | Tipo | Parámetros |
|---|---|---|
| Servidor | Python, *Module name* `uvicorn` | `app.main:app --reload --port 8000` |
| Pruebas | pytest, *Target* `tests/` | Opcional: `-m "not slow"` |
| CLI de IBM | Python, *Module name* `scripts.run_ibm_hardware` | `--mode fake --n-qubits 3 --marked 101 --seed 7` |

Para el frontend, una configuración *npm* con el script `build` o `test` dentro de `frontend/`.

### Pruebas

```bash
# Python, desde la raíz con el entorno activo
python -m pytest -q                # suite completa, incluye 2 pruebas "slow" (ruido FakeFez)
python -m pytest -q -m "not slow"  # igual que el job Python de la CI

# Frontend
cd frontend
npm ci
npm run check    # tsc --noEmit
npm test         # compila y ejecuta node:test
```

**Resultados reales del 24 de octubre de 2026** (Python 3.13.14, Node.js 24.18.0): `pytest -q` → **67 pruebas aprobadas** (65 sin `slow`, 2 `slow`); `npm test` → **36 pruebas aprobadas**; `npm run check` sin errores. Las pruebas Python se reparten así: API 19, CLI de IBM 19, física cuántica 15, cabeceras de seguridad 10, privacidad 4. Son resultados de esa revisión, no una garantía frente a futuras versiones de las dependencias. La CI ejecuta las pruebas sin `slow`, la comprobación de tipos y las del frontend en Ubuntu; no equivale a una validación manual de toda la interfaz ni de todos los sistemas.

### Despliegue con Docker y CasaOS (resumen)

El repositorio incluye `Dockerfile` (imagen `python:3.13-slim`, usuario sin privilegios, solo `app/` y los archivos públicos del frontend, `HEALTHCHECK`) y `compose.yaml` (puerto **8781**, `read_only`, sin capabilities, límites de ejemplo de 1 GB y 2 CPU, metadatos de CasaOS).

```bash
git clone https://github.com/LeonardoShande/QubitGuard.git
cd QubitGuard
docker compose build
docker compose up -d
docker compose ps
curl -s http://127.0.0.1:8781/api/health     # {"status":"ok", ...}
```

Pasos resumidos: construir la imagen, levantar el stack, comprobar `healthy` y abrir `http://IP_DE_LA_LAPTOP:8781`. Desde CasaOS puede importarse con *Custom Install* tras quitar `build: .`. **Estado:** Docker no estaba instalado en la máquina de desarrollo, así que **la imagen no se ha construido ni ejecutado**; los archivos y el YAML se validaron estáticamente. Guía completa, camino de panel CasaOS, actualización, logs y problemas frecuentes: [docs/LUBUNTU_CASAOS.md](docs/LUBUNTU_CASAOS.md) (sección 7). La imagen no incluye `scripts/` ni credenciales IBM: el CLI de hardware solo se usa con la instalación nativa.

### Demo pública con Cloudflare Tunnel

Qiskit Aer necesita CPU y librerías nativas y no cabe en Cloudflare Workers: el servidor queda en una máquina propia y se expone con un túnel, sin abrir puertos.

```bash
brew install cloudflared                              # o el paquete de tu sistema
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
cloudflared tunnel --url http://localhost:8000        # en otra terminal; imprime una URL https://*.trycloudflare.com
```

La URL temporal cambia en cada arranque: sirve para el jurado, no como hosting permanente. El túnel no mantiene el proceso ni evita la suspensión del equipo. Para un dominio propio, límites por IP y Cloudflare Access, ver [docs/DEPLOY.md](docs/DEPLOY.md). QubitGuard no tiene autenticación ni limitación general de peticiones: quien tenga la URL puede consumir CPU simulando circuitos. No expongas por el túnel el panel de CasaOS.

### Problemas frecuentes

| Problema | Qué revisar |
|---|---|
| `No module named uvicorn`, `qiskit` o `app` | Activa el entorno, instala `requirements.txt` con ese mismo Python y ejecuta desde la raíz. |
| Falla la instalación de Qiskit Aer | Comprueba versión y arquitectura de Python y actualiza pip; Aer incluye componentes nativos. |
| La página abre sin la funcionalidad esperada | Comprueba que existen `frontend/dist/*.js` y, si editaste TypeScript, ejecuta `npm ci && npm run build`. |
| El navegador no encuentra el backend | Abre la URL de Uvicorn; no abras `frontend/index.html` como `file://`. |
| Puerto ocupado | Usa `--port 8001` y ajusta URLs, ejemplos y túnel. |
| Respuesta 422 | Revisa rangos, longitud binaria del estado, formato de fecha y campos adicionales. |
| Respuesta 503 al activar ruido | Espera el `Retry-After`; las simulaciones ruidosas están limitadas a 2 simultáneas. |
| Resultados distintos entre ejecuciones | Los *shots* son muestreo; usa `seed` por API. El ruido y las versiones también influyen. La interfaz no fija semilla. |
| No se conserva la racha | El navegador puede bloquear almacenamiento; `localhost` y `127.0.0.1` tienen almacenamientos distintos. |
| No se puede copiar una contraseña | El portapapeles exige permisos y contexto seguro (localhost o HTTPS). |

---

<a id="pruebas-y-resultados-reproducibles"></a>

## 7. Resultados reproducibles, validación y limitaciones

<a id="api-y-ejemplos"></a>

### API y comandos exactos

Rutas relativas a `http://127.0.0.1:8000`. Los POST rechazan campos extra (422) y ningún endpoint define un campo de contraseña. Contrato completo en [docs/API.md](docs/API.md).

| Método | Ruta | Función y límites |
|---|---|---|
| GET | `/api/health` | Comprobar el servicio. |
| GET | `/api/quantum/capabilities` | Versiones, límites y `physical_hardware: false`. |
| POST | `/api/quantum/grover` | 2 a 6 qubits, 0 a 20 iteraciones, 1 a 8192 *shots*, ruido opcional. |
| POST | `/api/quantum/grover-curve` | Curva ideal exacta (`Statevector`) para 2 a 6 qubits. |
| POST | `/api/quantum/montecarlo` | 2 a 20 bits y 1 a 5000 ensayos. |
| GET | `/api/quantum/compare?max_bits=40` | Tabla teórica; `max_bits` de 2 a 256. |
| GET | `/api/learn/pqc`, `/api/learn/limitations` | Tarjetas poscuánticas y limitaciones. |
| GET | `/api/challenge/daily?date=2026-10-24` | Reto de una fecha; UTC si se omite. |

`marked_state` debe tener exactamente `n_qubits` bits, con el bit más significativo a la izquierda (igual que las claves de `counts`). `iterations` omitido o `null` selecciona el óptimo. `seed` es opcional, de 0 a `2^32 - 1`, y solo vale para experimentos.

```bash
curl -fsS http://127.0.0.1:8000/api/health

# Grover ideal: 4 qubits, 3 iteraciones, 2048 mediciones
curl -fsS -X POST http://127.0.0.1:8000/api/quantum/grover \
  -H 'Content-Type: application/json' \
  -d '{"n_qubits":4,"marked_state":"1010","iterations":3,"shots":2048,"seed":7}'

# Grover con 6 qubits y ruido FakeFez
curl -fsS -X POST http://127.0.0.1:8000/api/quantum/grover \
  -H 'Content-Type: application/json' \
  -d '{"n_qubits":6,"marked_state":"101010","iterations":6,"shots":256,"seed":7,"noisy":true}'

# Búsqueda clásica equivalente sobre 1024 candidatos
curl -fsS -X POST http://127.0.0.1:8000/api/quantum/montecarlo \
  -H 'Content-Type: application/json' \
  -d '{"n_bits":10,"trials":5000,"seed":1}'
```

```powershell
$body = @{ n_qubits = 4; marked_state = '1010'; iterations = 3; shots = 2048; seed = 7 } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:8000/api/quantum/grover' -ContentType 'application/json' -Body $body
```

### Resultados medidos

Reproducidos el 24 de octubre de 2026 con los cuerpos anteriores (Qiskit 2.6.1, Aer 0.18.0, IBM Runtime 0.51.0).

| Experimento | Resultado observado | Estado |
|---|---|---|
| Grover ideal: `1010`, 4 qubits, k=3, 2048 *shots*, seed 7 | Éxito medido `0,95263671875`; teórico `0,9613189697265625`; profundidad 172 y 84 puertas de 2 qubits (circuito transpilado a `cx/rz/sx/x`). | Medido. |
| Grover ruidoso: `101010`, 6 qubits, k=6, 256 *shots*, seed 7 | Éxito `0,03125`; profundidad `4447`; `1706` puertas de 2 qubits; azar `0,015625`. | Medido (simulado). |
| Monte Carlo: 10 bits, 5000 ensayos, seed 1 | Media `513,281` intentos frente a `512,5` esperados. | Medido. |
| Curva `Statevector` frente a `sin²((2k+1)θ)`, n=2 a 6, `k=0..2·óptimo` | Error absoluto máximo `6,15·10⁻¹⁴`. | Medido; la prueba `test_grover_curve_matches_formula_at_every_k` exige < 10⁻¹². |
| CLI en FakeFez, n=3 a 6 (sección 5) | 0,802; 0,662; 0,184; 0,0166. | Medido (simulado). |
| Ejecución en QPU de IBM | Ninguna. | **No realizada.** |

La semilla permite repetir un experimento dentro del mismo entorno. El éxito medido también varía con el estado marcado. Versiones de Qiskit, transpilador y datos de `FakeFez` pueden cambiar métricas y resultados entre instalaciones; las dependencias tienen rangos, no un bloqueo exacto.

### Validación y estrategia frente a errores

- **Física:** la curva de `Statevector` se contrasta con la fórmula en todos los puntos de 2 a 6 qubits; el explorador del navegador usa esa misma fórmula y tiene sus propias pruebas.
- **Contrato y privacidad:** pruebas de API (rangos, 422, semilla fuera de rango, campos extra), de cabeceras, de rutas públicas y de recorrido de rutas y de que ningún módulo de contraseñas use red, almacenamiento ni `Math.random`.
- **Entradas hostiles:** validación en la API y de nuevo en el motor (seguro llamarlo directo desde Python); normalización de rutas contra *path traversal*; tope de `seed` para evitar 500 por desbordamiento; error 500 genérico con cabeceras.
- **Fallos en la interfaz:** estados de carga, vacío y error en cada panel; reintento con `Retry-After` ante 503; respuestas obsoletas descartadas; bloqueo de doble envío; `localStorage` corrupto o bloqueado no rompe la carga.
- **Honestidad por diseño:** las etiquetas distinguen *teórico*, *medido* e *hipotético* (el tiempo de Grover usa una tasa supuesta); «resistente a Grover» se presenta como meta educativa y no como certificación; el ruido se declara simulado.

**Piloto con usuarios: pendiente.** No se ha medido comprensión ni retención. Protocolo propuesto (no ejecutado): cinco participantes del público objetivo, tres preguntas antes y después (distribución uniforme inicial, efecto de pasarse de iteraciones, diferencia entre simulación y hardware), con tiempo y dificultades registrados y sin contraseñas.

### Limitaciones

1. **El oráculo conoce la respuesta.** El estado marcado se introduce al construir el circuito; no se implementan hashes ni cifrados reversibles para buscar secretos desconocidos.
2. **La ventaja es cuadrática, no exponencial.** Duplicar los bits de una clave restaura el margen. Shor (que sí rompe RSA/ECC) no se simula.
3. **No se implementa QAE.** El «Monte Carlo» es búsqueda clásica de referencia; no hay estimación cuántica de amplitud, QML ni entrenamiento de modelos.
4. **La simulación alcanza 6 qubits (64 estados).** Los valores de 128 o 256 bits son extrapolaciones matemáticas. El explorador llega a 10 qubits porque usa fórmulas, no circuitos.
5. **El ruido es simulado** (`FakeFez`), no medido en un dispositivo; las métricas de ideal y ruidoso usan distintos objetivos y niveles de optimización, por lo que no aíslan solo el ruido.
6. **Sin hardware real.** El CLI existe pero no se ha ejecutado contra IBM; la cuenta, la cola y el resultado en QPU están pendientes.
7. **No existe hoy un ataque cuántico práctico a contraseñas ni a AES.** Con corrección de errores el coste real de Grover sería enorme.
8. **El análisis de contraseñas es aproximado** y los tiempos dependen de tasas supuestas.
9. **El progreso es local y editable:** sin cuentas, respaldo, ranking confiable ni controles para exámenes.
10. **Despliegue no verificado en servidor:** la imagen Docker no se ha construido y no se ha medido la capacidad con usuarios simultáneos.
11. **Piloto con usuarios y retención:** pendientes.

Las 8 fichas de `/api/learn/limitations` salen de `app/content/limitations.json`; [docs/LIMITACIONES.md](docs/LIMITACIONES.md) las amplía.

---

## 8. Privacidad, seguridad y accesibilidad

**Privacidad.** El generador usa Web Crypto. Los módulos de contraseñas no usan red, almacenamiento ni `Math.random`, y las pruebas lo comprueban; la API no acepta campos de contraseña. El progreso queda solo en tu navegador. No hay cuentas, analítica ni servicios de terceros en tiempo de ejecución.

**Seguridad.**

- El servidor publica únicamente `index.html`, `styles.css`, `dist/` y `assets/`, además de la API y su documentación; `/src/`, `/node_modules/` y `/package.json` devuelven 404.
- Cabeceras: `X-Content-Type-Options`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, COOP, `Permissions-Policy` y una CSP de mismo origen (con excepciones para estilos inline e imágenes `data:`); `/docs`, `/redoc` y `/openapi.json` quedan fuera de esa CSP. El código no envía HSTS porque en local se sirve por HTTP; al publicar por HTTPS hay que activarlo en el borde (Cloudflare) o en el servidor.
- gzip, caché HTTP para contenido determinista, `no-store` para simulaciones y revalidación con ETag.
- Límite de 2 simulaciones ruidosas simultáneas por proceso (503 con `Retry-After`). **No hay autenticación ni *rate limiting* por IP**; para una publicación estable configúralo en el borde (ver [docs/DEPLOY.md](docs/DEPLOY.md)).
- El contenedor Docker corre sin privilegios, con sistema de archivos de solo lectura y sin capabilities.

**Accesibilidad.** El objetivo es **WCAG 2.2 AA**, **verificado parcialmente**: no es una certificación de conformidad. Lo comprobado y registrado en [frontend/UX_AUDIT.md](frontend/UX_AUDIT.md): navegación por teclado y foco visible, enlace para saltar al contenido, errores asociados a sus campos, regiones `aria-live`, contraste medido, reflow a 320 px, gráficos SVG con título, descripción y tabla equivalente, y respeto a `prefers-reduced-motion` (sin intro, sin animaciones de entrada y con transiciones del explorador instantáneas). **No se ha probado con lectores de pantalla ni en dispositivos reales.** El fondo ASCII y la intro son decorativos y están ocultos a tecnologías de asistencia.

---

## 9. Referencias y créditos

### Referencias

- L. K. Grover, *A fast quantum mechanical algorithm for database search*, STOC 1996. [arXiv:quant-ph/9605043](https://arxiv.org/abs/quant-ph/9605043).
- M. Boyer, G. Brassard, P. Høyer, A. Tapp, *Tight bounds on quantum searching*, Fortschritte der Physik 46, 1998. [arXiv:quant-ph/9605034](https://arxiv.org/abs/quant-ph/9605034).
- P. W. Shor, *Polynomial-time algorithms for prime factorization and discrete logarithms on a quantum computer*, SIAM J. Comput. 26, 1997. [arXiv:quant-ph/9508027](https://arxiv.org/abs/quant-ph/9508027).
- NIST, estándares de criptografía poscuántica: **FIPS 203** (ML-KEM), **FIPS 204** (ML-DSA) y **FIPS 205** (SLH-DSA), 2024. [csrc.nist.gov/projects/post-quantum-cryptography](https://csrc.nist.gov/projects/post-quantum-cryptography).
- Documentación de Qiskit: [docs.quantum.ibm.com](https://docs.quantum.ibm.com) (redirige a [quantum.cloud.ibm.com/docs](https://quantum.cloud.ibm.com/docs)); código fuente en [github.com/Qiskit/qiskit](https://github.com/Qiskit/qiskit); presentación en [ibm.com/quantum/qiskit](https://www.ibm.com/quantum/qiskit).
- [Qiskit Aer](https://github.com/Qiskit/qiskit-aer) y [qiskit-ibm-runtime](https://github.com/Qiskit/qiskit-ibm-runtime) (incluye `FakeFez` y `SamplerV2`).
- Páginas del evento: [recursos del Qiskit Fall Fest 2026](https://qiskitfallfest2026.ieeecspucp.com/resources) y [IBM Quantum Hackathon](https://ibmquantumhackathon.ieeecspucp.com).
- Repositorio original del que parte el proyecto: [github.com/LeonardoShande/QubitGuard](https://github.com/LeonardoShande/QubitGuard).

Las tarjetas poscuánticas de la aplicación enlazan sus propias fuentes en `app/content/pqc.json`. No se copian logotipos ni se implica patrocinio de IBM; la intro ASCII es una marca textual decorativa.

### Créditos

- **Bibliotecas:** Qiskit, Qiskit Aer y qiskit-ibm-runtime (IBM y colaboradores), NumPy, FastAPI, Starlette, Uvicorn, Pydantic, pytest, httpx y TypeScript, con sus licencias propias.
- **Dirección visual:** referencias ASCII y el portfolio del autor; ver [DESIGN.md](DESIGN.md).
- **Equipo:** nombre del equipo, integrantes (4), roles y contactos: **TODO**, pendientes en [pitch/ENTREGABLES.md](pitch/ENTREGABLES.md). No se añaden nombres sin confirmar.
- **Base del proyecto:** repositorio de [LeonardoShande](https://github.com/LeonardoShande/QubitGuard).

---

## Mapa de documentación

| Documento | Contenido |
|---|---|
| [Arquitectura](docs/architecture.md) | Capas, flujo, cachés y decisiones técnicas. |
| [Contrato de API](docs/API.md) | Cuerpos, respuestas y convenciones. |
| [Guía del código](docs/GUIA_DEL_CODIGO.md) | Funcionamiento por módulos, funciones, privacidad y mantenimiento. |
| [Hardware IBM](docs/IBM_HARDWARE.md) | CLI de hardware: credenciales, modos, cuota, formato de resultados y mediciones FakeFez. |
| [Limitaciones](docs/LIMITACIONES.md) | Alcance educativo y supuestos. |
| [Reto y entrega](docs/RETO_Y_ENTREGA.md) | Encaje con los tres retos, pares oficiales y cronograma. |
| [Revisión del prompt y las bases](docs/REVISION_PROMPT_Y_BASES.md) | Comparación del encargo con el resultado, rúbrica y mejoras priorizadas. |
| [Despliegue](docs/DEPLOY.md) | Demo pública con Cloudflare Tunnel. |
| [Lubuntu con CasaOS](docs/LUBUNTU_CASAOS.md) | Servicio systemd, Docker/CasaOS, LAN y túnel. |
| [Dirección visual](DESIGN.md) y [ASCII y motion](docs/UI_ASCII_Y_MOTION.md) | Referencias, motivos, intro IBM, fondo e invariantes de movimiento. |
| [Auditoría UX](frontend/UX_AUDIT.md) | Criterios de interfaz y accesibilidad. |
| [Encargos para GLM](docs/TAREAS_GLM.md) | Prompts acotados para revisión, guion y comprobaciones. |
| [Guion del pitch](pitch/GUION.md), [Presentación](pitch/QubitGuard_pitch.pptx) y [Entregables](pitch/ENTREGABLES.md) | Material del hackathon y pendientes. |

Antes de proponer cambios, ejecuta las comprobaciones de Python y frontend. Si modificas TypeScript, incluye el JavaScript recompilado en `frontend/dist/`. Si cambias rutas, límites o supuestos, actualiza la documentación y los ejemplos afectados. `pitch/build_deck.py` regenera la presentación y requiere `python-pptx` (`.venv/bin/python -m pip install python-pptx==1.0.2`), que no forma parte de las dependencias de la aplicación.
