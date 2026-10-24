# QubitGuard Quantum Lab

Laboratorio web educativo de ciberseguridad cuántica para el IBM Quantum Hackathon / Qiskit Fall Fest 2026, reto EdTech. Está pensado para personas desde los 14 años, sin conocimientos previos de computación cuántica.

QubitGuard compara la búsqueda clásica de un secreto con el algoritmo de Grover: permite predecir un resultado, ejecutar circuitos de Qiskit y contrastar la teoría con mediciones simuladas, tanto ideales como con ruido. Incluye una ruta de aprendizaje, retos diarios, análisis y generación local de contraseñas y contenido sobre criptografía poscuántica.

**Todos los circuitos se ejecutan en simuladores locales.** No se necesita cuenta de IBM Quantum, token, hardware cuántico ni base de datos. El proyecto es una herramienta didáctica; no ejecuta ataques contra sistemas reales.

El laboratorio se integró en `main` mediante el [PR #1](https://github.com/LeonardoShande/QubitGuard/pull/1). La [guía del código](docs/GUIA_DEL_CODIGO.md) explica sus módulos, y la [revisión frente al prompt y las bases](docs/REVISION_PROMPT_Y_BASES.md) compara lo implementado con el encargo y prioriza mejoras en general.

## Contenido

- [Qué puedes hacer](#qué-puedes-hacer)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Guía de uso](#guía-de-uso)
- [Cómo funciona](#cómo-funciona)
- [Contraseñas: análisis y generación](#contraseñas-análisis-y-generación)
- [Arquitectura y archivos](#arquitectura-y-archivos)
- [API y ejemplos](#api-y-ejemplos)
- [Pruebas y resultados reproducibles](#pruebas-y-resultados-reproducibles)
- [Privacidad, seguridad y accesibilidad](#privacidad-seguridad-y-accesibilidad)
- [Despliegue](#despliegue)
- [Problemas frecuentes](#problemas-frecuentes)
- [Limitaciones](#limitaciones)
- [Contribuir y documentación](#contribuir-y-documentación)

## Qué puedes hacer

| Módulo | Qué muestra o permite |
|---|---|
| Ruta de aprendizaje | Cinco pasos: superposición, oráculo, amplificación, ruido y criptografía. |
| Laboratorio Grover | Circuitos de 2 a 6 qubits; estado objetivo, iteraciones, shots, ruido, histograma, curva de éxito y diagrama textual del circuito. |
| Azar frente a Grover | Monte Carlo de 2 a 20 bits y tabla teórica de búsqueda clásica frente a cuántica hasta 256 bits mediante la API. |
| Reto diario | Preguntas sobre iteraciones, probabilidades y comparación de búsquedas; XP, niveles, rachas y seis logros. |
| Tu contraseña | Estimación local de fortaleza y generador de caracteres, frases o refuerzo de una base. |
| Poscuántica y limitaciones | Tarjetas educativas con fuentes y explicaciones de lo que la simulación permite concluir. |

El frontend está escrito en TypeScript sin frameworks ni dependencias de ejecución. FastAPI sirve la interfaz y la API desde el mismo origen y puerto.

## Instalación y ejecución

### Requisitos

| Herramienta | Uso |
|---|---|
| Git | Clonar el repositorio. |
| Python 3.11 o superior | Ejecutar el backend. La CI usa Python 3.13. |
| pip y venv | Instalar las dependencias en un entorno aislado. |
| Navegador moderno con JavaScript | Usar la interfaz y Web Crypto. |
| Node.js y npm, opcionales | Modificar, recompilar o probar el frontend. La CI usa Node.js 24. |

`frontend/dist/*.js` está versionado: **para ejecutar la aplicación sin modificarla no necesitas Node.js**. La instalación de dependencias requiere internet; una vez instaladas, la interfaz y las simulaciones pueden usarse con el servidor local sin servicios externos. Esto no convierte la web en una aplicación offline instalable.

### 1. Clonar esta versión

```bash
git clone https://github.com/LeonardoShande/QubitGuard.git
cd QubitGuard
```

Si ya tienes el repositorio, comprueba la rama con `git branch --show-current`. La versión integrada está en `main`; guarda tus cambios antes de cambiar de rama y actualizarla.

### 2. Crear el entorno e instalar dependencias

**macOS / Linux:**

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

**Windows (PowerShell):**

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Usa una instalación de Python 3.11 o superior. Si PowerShell bloquea la activación, puedes usar directamente `.\.venv\Scripts\python.exe` en lugar de `python` en los comandos siguientes, sin cambiar la política del sistema.

Las dependencias y sus rangos están en [requirements.txt](requirements.txt): Qiskit `>=2.6,<3`, Qiskit Aer, IBM Runtime (para `FakeFez`), NumPy, FastAPI, Uvicorn, pytest y httpx. No hace falta configurar un archivo `.env` ni credenciales.

### 3. Iniciar la aplicación

Desde la raíz del repositorio y con el entorno activo:

```bash
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Abre [http://127.0.0.1:8000](http://127.0.0.1:8000). Detén el servidor con `Ctrl+C`.

- Estado del servicio: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health).
- Capacidades y versiones: [http://127.0.0.1:8000/api/quantum/capabilities](http://127.0.0.1:8000/api/quantum/capabilities).
- Contrato OpenAPI: [http://127.0.0.1:8000/openapi.json](http://127.0.0.1:8000/openapi.json).
- Documentación interactiva: [Swagger UI](http://127.0.0.1:8000/docs) y [ReDoc](http://127.0.0.1:8000/redoc). Sus interfaces predeterminadas cargan recursos externos y pueden necesitar internet.

En PyCharm, selecciona el intérprete de `.venv` y crea una configuración de módulo `uvicorn`, con parámetros `app.main:app --reload` y la raíz del repositorio como directorio de trabajo.

### 4. Recompilar el frontend, si vas a editarlo

```bash
cd frontend
npm ci
npm run build
cd ..
```

`npm ci` instala las versiones del archivo de bloqueo y `npm run build` compila `src/*.ts` a `dist/*.js` mediante `tsc`. No hay un servidor frontend independiente ni un comando `npm start`. Después de modificar TypeScript, recompila y recarga el navegador; `--reload` de Uvicorn no compila TypeScript.

## Guía de uso

1. Abre **Tu ruta** y comienza por superposición. Ejecutar con cero iteraciones permite observar la distribución inicial, aproximadamente uniforme.
2. En **Laboratorio Grover**, usa 4 qubits y un estado de cuatro bits, por ejemplo `1010`. Predice la probabilidad de éxito o el número óptimo de iteraciones antes de ejecutar.
3. Ejecuta con las iteraciones óptimas y compara tu predicción, el valor teórico y el porcentaje medido. Revisa el histograma, la curva y el circuito. La curva se revela después de la primera ejecución para ese número de qubits.
4. Desactiva el ajuste automático y prueba distintas iteraciones. Pasarse del óptimo también reduce la probabilidad de éxito. Activa **ruido** para comparar el mismo problema con `FakeFez`.
5. En **Azar frente a Grover**, ejecuta Monte Carlo y compara su media con `(N + 1) / 2`. La tabla permite explorar cómo crece la diferencia entre ambos métodos.
6. Prueba el analizador con una contraseña de ejemplo o genera una nueva en **Tu contraseña**. Lee las suposiciones de los cálculos y las tarjetas poscuánticas.
7. Resuelve el **Reto diario** para sumar experiencia y mantener la racha.

XP, rachas, respuestas, pasos y logros se guardan en `localStorage` con la clave `qubitguard.progress.v1`. El progreso pertenece a ese navegador y origen: cambiar de equipo, navegador o dirección no lo sincroniza, y borrar los datos del sitio lo elimina. Si el almacenamiento está bloqueado, el progreso solo permanece en la pestaña.

La interfaz solicita el reto para la **fecha local del navegador**. La API, si no recibe `?date=YYYY-MM-DD`, utiliza la fecha UTC. El reto es determinista para cada fecha y devuelve también la respuesta correcta: está diseñado para aprender, no para evaluar de forma segura. Solo la primera respuesta diaria puntúa; las predicciones con recompensa tienen un tope de cinco al día.

## Cómo funciona

### El problema que se compara

Se busca un único estado marcado entre `N = 2^n` candidatos. Para una búsqueda clásica aleatoria **sin repetir**, la posición del secreto es uniforme entre 1 y N. Grover amplifica la amplitud del estado marcado antes de medir.

| Magnitud | Búsqueda clásica | Grover ideal |
|---|---|---|
| Trabajo esperado o recomendado | `(N + 1) / 2` intentos | Aproximadamente `(π / 4) · √N` iteraciones |
| Éxito tras k intentos o iteraciones | `k / N`, para `0 ≤ k ≤ N` | `sin²((2k + 1) · θ)` |
| Parámetro | N candidatos equiprobables | `θ = asin(1 / √N)` |
| Elección de iteraciones en el laboratorio | No aplica | `floor(π / (4 · θ))` |

La ventaja es **cuadrática** en número de consultas. Comparar intentos clásicos con iteraciones de Grover no equivale a comparar segundos de ejecución: una iteración cuántica tiene un costo propio y la simulación consume CPU clásica.

### Qué ejecuta cada componente

- **Circuito de Grover:** aplica Hadamard para preparar la superposición, repite un oráculo de fase y un difusor, y mide. El oráculo se construye a partir del estado objetivo elegido por el usuario.
- **`Statevector`:** calcula la probabilidad exacta del estado marcado para `k = 0..2·óptimo`. La curva es ideal incluso cuando la ejecución con shots usa ruido.
- **`AerSimulator`:** ejecuta el circuito con shots. Un shot es una repetición con medición; más shots reducen la variación estadística, sin eliminar el ruido del modelo.
- **`FakeFez`:** proporciona un backend simulado basado en datos de un procesador IBM. `AerSimulator.from_backend(FakeFez())` permite observar el efecto del ruido sin contactar hardware físico.
- **`transpile`:** transforma el circuito para el backend o la base de puertas elegida. `depth` y `two_qubit_gates` describen ese circuito transpilado; `circuit_text` muestra el circuito lógico anterior a esa transformación.
- **Monte Carlo con NumPy:** muestrea directamente la posición uniforme del secreto en una permutación aleatoria. Es estadísticamente equivalente a buscar sin repetir; no genera ni prueba todas las claves una por una.
- **Tabla comparativa:** aplica fórmulas para tamaños de hasta 256 bits. No construye ni simula circuitos de ese tamaño.

El flujo completo es: **predicción en el navegador → petición validada por FastAPI → experimento local → respuesta JSON → gráficos, explicación y progreso**. Más detalles en [docs/architecture.md](docs/architecture.md).

## Contraseñas: análisis y generación

El análisis y la generación se realizan en el navegador. Los módulos de contraseñas no envían los valores al backend ni los guardan en el almacenamiento de la aplicación. Copiar una contraseña sí la coloca en el portapapeles del sistema.

**Analizador (`frontend/src/password.ts`).** Estima bits a partir de la longitud y del alfabeto detectado, y aplica penalizaciones por palabras comunes, recorridos de teclado, secuencias, repeticiones y años. Es una heurística: no consulta filtraciones ni un diccionario exhaustivo y puede sobreestimar la fortaleza. El tiempo clásico depende de la tasa de intentos elegida; el cuántico supone **un millón de iteraciones de Grover por segundo**, un escenario hipotético, no una medición.

**Generador (`frontend/src/generator.ts`).** Usa `crypto.getRandomValues` y muestreo por rechazo para evitar sesgo de módulo. No admite una semilla reproducible.

| Modo | Funcionamiento |
|---|---|
| Caracteres | De 8 a 128 caracteres, clases seleccionables y opción de excluir caracteres confusos. Exige presencia de cada clase activa y calcula el tamaño del espacio válido mediante inclusión-exclusión. |
| Frase de palabras | De 3 a 12 palabras elegidas de una lista deduplicada, con separador y opciones de mayúsculas y número. |
| Mejorar la mía | Inserta caracteres aleatorios en la base. El cálculo cuenta los caracteres aleatorios añadidos y considera conocida la base. |

La interfaz usa **128 bits** como meta educativa y muestra la mitad como bits efectivos frente al modelo idealizado de Grover. Alcanzar esa etiqueta no certifica una contraseña ni convierte 64 bits efectivos en una garantía de seguridad. Los bits de una generación aleatoria y los estimados para un texto humano tienen supuestos diferentes.

## Arquitectura y archivos

```text
Navegador: TypeScript compilado, análisis/generación y progreso local
    │ HTTP/JSON al mismo origen
    ▼
FastAPI: rutas, validación, cabeceras, caché y archivos estáticos
    │ llamadas locales
    ▼
Qiskit / Aer / FakeFez / NumPy: experimentos y estadísticas
```

```text
QubitGuard/
├── app/
│   ├── main.py                 # Aplicación, middleware y frontend estático
│   ├── api/
│   │   ├── quantum.py          # Grover, curva, Monte Carlo y comparación
│   │   ├── challenge.py        # Reto determinista por fecha
│   │   └── learn.py            # Contenido educativo
│   ├── quantum/experiments.py  # Circuitos, simulación y cálculos
│   └── content/               # Tarjetas y limitaciones en JSON
├── frontend/
│   ├── index.html             # Interfaz en español
│   ├── styles.css
│   ├── src/                   # TypeScript, gráficos y lógica del navegador
│   ├── dist/                  # JavaScript compilado y versionado
│   └── test/                  # Pruebas con node:test
├── tests/                     # API, experimentos, privacidad y cabeceras
├── docs/                      # Arquitectura, contrato, despliegue y límites
├── pitch/                     # Presentación, guion y entregables
├── .github/workflows/ci.yml    # Validación de Python y frontend
├── pyproject.toml             # Metadatos y configuración de pytest
└── requirements.txt           # Dependencias Python
```

No hay cuentas, base de datos ni sincronización de progreso. El servidor mantiene cachés en memoria para curvas, tablas y ejecuciones con semilla; se pierden al reiniciar el proceso.

## API y ejemplos

Las rutas son relativas a `http://127.0.0.1:8000`. Ningún endpoint define un campo de contraseña; los modelos POST rechazan campos adicionales.

| Método | Ruta | Función y límites principales |
|---|---|---|
| GET | `/api/health` | Comprobar que responde el servicio. |
| GET | `/api/quantum/capabilities` | Versiones, límites y `physical_hardware: false`. |
| POST | `/api/quantum/grover` | 2–6 qubits, 0–20 iteraciones, 1–8192 shots y ruido opcional. |
| POST | `/api/quantum/grover-curve` | Curva ideal exacta para 2–6 qubits. |
| POST | `/api/quantum/montecarlo` | 2–20 bits y 1–5000 ensayos. |
| GET | `/api/quantum/compare?max_bits=40` | Tabla teórica; `max_bits` entre 2 y 256. |
| GET | `/api/learn/pqc` | Tarjetas de criptografía poscuántica con fuentes. |
| GET | `/api/learn/limitations` | Limitaciones educativas. |
| GET | `/api/challenge/daily?date=2026-10-24` | Reto de una fecha; fecha UTC actual si se omite. |

En Grover, `marked_state` debe tener exactamente `n_qubits` dígitos binarios, con el bit más significativo a la izquierda, igual que las claves de `counts`. Omitir `iterations` o enviarlo como `null` selecciona el óptimo. Grover y Monte Carlo aceptan una `seed` opcional entre 0 y `2^32 - 1`; se usa para los experimentos, nunca para el generador de contraseñas.

Ejemplos para Bash, con el servidor iniciado:

```bash
curl -fsS http://127.0.0.1:8000/api/health

# Grover ideal: 4 qubits, 3 iteraciones y 2048 mediciones
curl -fsS -X POST http://127.0.0.1:8000/api/quantum/grover \
  -H 'Content-Type: application/json' \
  -d '{"n_qubits":4,"marked_state":"1010","iterations":3,"shots":2048,"seed":7}'

# El mismo algoritmo con un problema de 6 qubits y ruido FakeFez
curl -fsS -X POST http://127.0.0.1:8000/api/quantum/grover \
  -H 'Content-Type: application/json' \
  -d '{"n_qubits":6,"marked_state":"101010","iterations":6,"shots":256,"seed":7,"noisy":true}'

# Búsqueda clásica equivalente sobre 1024 candidatos
curl -fsS -X POST http://127.0.0.1:8000/api/quantum/montecarlo \
  -H 'Content-Type: application/json' \
  -d '{"n_bits":10,"trials":5000,"seed":1}'
```

En PowerShell puedes usar `Invoke-RestMethod`:

```powershell
$body = @{ n_qubits = 4; marked_state = '1010'; iterations = 3; shots = 2048; seed = 7 } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:8000/api/quantum/grover' -ContentType 'application/json' -Body $body
```

Una petición inválida devuelve **422**. El backend limita a dos simulaciones ruidosas simultáneas por proceso; si no obtiene un cupo tras esperar hasta diez segundos, responde **503** con `Retry-After: 2`. Contrato y campos de respuesta en [docs/API.md](docs/API.md).

## Pruebas y resultados reproducibles

Desde la raíz, con el entorno Python activo:

```bash
# Suite completa, incluida la simulación ruidosa marcada como slow
python -m pytest -q

# Suite rápida, igual que el job Python de CI
python -m pytest -q -m "not slow"

# Comprobación de tipos y pruebas del frontend
cd frontend
npm ci
npm run check
npm test
cd ..
```

Las pruebas Python usan `TestClient`: no requieren iniciar Uvicorn por separado. `npm test` compila el frontend y ejecuta las pruebas de contraseñas, generación y progreso con `node:test`.

Validación local del **24 de octubre de 2026**: **47 pruebas Python** y **33 pruebas de frontend** aprobadas, además de `npm run check`. Se ejecutaron con Python 3.13.14 y Node.js 24.18.0. Son resultados de esa revisión, no una garantía sobre futuras versiones de dependencias.

Resultados reproducidos con los mismos cuerpos JSON de los ejemplos anteriores, Qiskit 2.6.1, Aer 0.18.0 e IBM Runtime 0.51.0:

| Experimento | Resultado observado |
|---|---|
| Grover ideal: `1010`, 4 qubits, k=3, 2048 shots, seed 7 | Éxito medido `0,95263671875`; teórico `0,9613189697265625`. |
| Grover ruidoso: `101010`, 6 qubits, k=6, 256 shots, seed 7 | Éxito `0,03125`; profundidad `4447`; `1706` puertas de dos qubits. |
| Monte Carlo: 10 bits, 5000 ensayos, seed 1 | Media `513,281` intentos frente a `512,5` esperados. |

La semilla permite repetir un experimento dentro del mismo entorno. Las versiones de Qiskit, el transpilador y los datos de `FakeFez` pueden cambiar los resultados o las métricas entre instalaciones; las dependencias Python tienen rangos, no un bloqueo exacto. La interfaz no fija semilla para sus ejecuciones.

La CI ejecuta pruebas Python sin `slow`, comprobación de tipos y pruebas frontend en Ubuntu. No equivale a una validación manual de toda la interfaz ni de todos los sistemas operativos.

## Privacidad, seguridad y accesibilidad

- El generador utiliza Web Crypto. Los módulos sensibles no usan red, almacenamiento ni `Math.random`; los tests comprueban esas restricciones y que la API no acepte campos de contraseña.
- El servidor solo publica `index.html`, `styles.css`, `dist/` y `assets/`, además de la API y su documentación. Rutas como `/src/`, `/node_modules/` y `/package.json` devuelven 404.
- Las respuestas llevan cabeceras como `X-Content-Type-Options`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, COOP y `Permissions-Policy`. La CSP limita los recursos al mismo origen, con excepciones para estilos inline e imágenes de datos; `/docs`, `/redoc` y `/openapi.json` quedan fuera de esa CSP.
- Se usa gzip, caché HTTP para contenido determinista, `no-store` para las simulaciones y revalidación de estáticos con ETag. No hay autenticación ni limitación general de peticiones por IP incorporadas.
- La interfaz incluye navegación por teclado, foco visible, enlace para saltar al contenido, errores asociados a campos, tablas equivalentes a gráficos SVG y respeto a `prefers-reduced-motion`. El trabajo de contraste y reflow está registrado en [frontend/UX_AUDIT.md](frontend/UX_AUDIT.md); no constituye una certificación WCAG.

## Despliegue

API y frontend se despliegan juntos en una máquina con Python y las dependencias nativas de Qiskit Aer. Publicar solo `frontend/` en un hosting estático no permite ejecutar los experimentos.

Para iniciar el servidor sin recarga automática:

```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Si ya tienes `cloudflared` instalado, puedes exponer una demo temporal desde otra terminal:

```bash
cloudflared tunnel --url http://127.0.0.1:8000
```

El túnel depende de internet y del servidor local; su URL temporal no es alojamiento permanente. Para una publicación estable, configura HTTPS, supervisión del proceso y controles de acceso o rate limiting según el uso. El semáforo de simulación es por proceso: añadir workers multiplica el límite total y las cachés.

Consulta [docs/DEPLOY.md](docs/DEPLOY.md) para la propuesta de despliegue con Cloudflare. Adapta su ruta de Python a tu entorno `.venv`.

## Problemas frecuentes

| Problema | Qué revisar |
|---|---|
| `No module named uvicorn`, `qiskit` o `app` | Activa el entorno, instala `requirements.txt` con ese mismo Python y ejecuta el comando desde la raíz del repositorio. |
| Falla la instalación de Qiskit Aer | Comprueba la versión y arquitectura de Python y actualiza pip. Aer incluye componentes nativos; revisa el error de compatibilidad antes de intentar compilarlo. |
| La página abre sin la funcionalidad esperada | Comprueba que tienes `main` actualizado, que existen los archivos de `frontend/dist/` y, si editaste TypeScript, ejecuta `npm ci` y `npm run build`. |
| El navegador no encuentra el backend | Abre la URL de Uvicorn. No abras `frontend/index.html` como `file://`; la API usa rutas del mismo origen. |
| Puerto 8000 ocupado | Usa `--port 8001` y abre `http://127.0.0.1:8001`; ajusta también los ejemplos y el túnel. |
| Respuesta 422 | Revisa rangos, longitud binaria del estado, formato de fecha y campos adicionales del JSON. |
| Respuesta 503 al activar ruido | Espera el tiempo de `Retry-After` y vuelve a ejecutar. Las simulaciones ruidosas tienen concurrencia limitada. |
| Resultados distintos en ejecuciones sucesivas | Los shots son muestreo. Usa `seed` mediante la API para reproducir dentro del mismo entorno; el ruido y las versiones también influyen. |
| No se conserva la racha o el progreso | Revisa si el navegador bloquea almacenamiento o si cambiaste de origen. `localhost` y `127.0.0.1` tienen almacenamientos distintos. |
| No se puede copiar una contraseña | El portapapeles del navegador puede exigir permisos y un contexto seguro; usa localhost o HTTPS. |
| Swagger o ReDoc no cargan sin internet | Sus recursos externos pueden no estar disponibles. Consulta `docs/API.md` o `/openapi.json`. |

## Limitaciones

1. **El oráculo conoce la respuesta.** El estado objetivo se introduce al construir el circuito. No se implementan hashes ni cifrados reversibles para buscar secretos desconocidos.
2. **La simulación alcanza 6 qubits, es decir, 64 estados.** Los valores de 128 o 256 bits son extrapolaciones matemáticas.
3. **El ruido es simulado.** No mide el comportamiento actual de un dispositivo IBM ni demuestra ventaja cuántica en tiempo real.
4. **El análisis de contraseñas es aproximado.** Los tiempos dependen de supuestos sobre tasa de intentos y costo del oráculo; no son predicciones de un ataque real.
5. **No se implementan Shor ni algoritmos poscuánticos de producción.** Las tarjetas explican esos temas; no cifran ni firman datos.
6. **El progreso es local y editable.** No hay cuentas, respaldo remoto, ranking confiable ni controles para exámenes.
7. **Las comprobaciones automáticas tienen alcance limitado.** No demuestran resistencia bajo carga, seguridad completa ni accesibilidad en dispositivos y lectores de pantalla reales.

Más detalle en [docs/LIMITACIONES.md](docs/LIMITACIONES.md) y en las fuentes enlazadas por las tarjetas educativas.

## Contribuir y documentación

Antes de proponer cambios, revisa el contrato de API y ejecuta las comprobaciones de Python y frontend. Si modificas TypeScript, incluye el JavaScript recompilado en `frontend/dist/`, porque permite iniciar la demo sin Node.js. Si cambias rutas, límites o supuestos, actualiza también la documentación y los ejemplos afectados.

| Documento | Contenido |
|---|---|
| [Arquitectura](docs/architecture.md) | Capas, flujo, cachés y decisiones técnicas. |
| [Guía del código](docs/GUIA_DEL_CODIGO.md) | Funcionamiento por módulos, funciones, privacidad y mantenimiento. |
| [Revisión del prompt y las bases](docs/REVISION_PROMPT_Y_BASES.md) | Comparación del encargo con el resultado, rúbrica y mejoras priorizadas. |
| [Dirección visual](DESIGN.md) | Referencias ASCII, motivos, colores semánticos y decisiones de movimiento. |
| [Encargos para GLM](docs/TAREAS_GLM.md) | Prompts acotados para revisión científica, guion, piloto y comprobaciones. |
| [Reto y entrega](docs/RETO_Y_ENTREGA.md) | Encaje con los tres retos, nuevo mapeo oficial y cronograma compartido. |
| [Contrato de API](docs/API.md) | Cuerpos, respuestas y convenciones. |
| [Despliegue](docs/DEPLOY.md) | Demo pública y configuración de publicación. |
| [Lubuntu con CasaOS](docs/LUBUNTU_CASAOS.md) | Instalación en la laptop Linux, servicio persistente, LAN, túnel y encargo para GLM MAX. |
| [Limitaciones](docs/LIMITACIONES.md) | Alcance educativo y supuestos. |
| [Auditoría UX](frontend/UX_AUDIT.md) | Registro de criterios de interfaz y accesibilidad. |
| [Guion del pitch](pitch/GUION.md) | Guía de presentación del proyecto. |
| [Presentación](pitch/QubitGuard_pitch.pptx) | Archivo PowerPoint incluido en el repositorio. |
| [Entregables](pitch/ENTREGABLES.md) | Material y pendientes del hackathon. |

El script opcional `pitch/build_deck.py` regenera la presentación y usa `python-pptx`, que no forma parte de las dependencias de la aplicación.

Proyecto basado en el repositorio de [LeonardoShande](https://github.com/LeonardoShande/QubitGuard). Las bibliotecas principales son Qiskit, Qiskit Aer, qiskit-ibm-runtime, NumPy, FastAPI, Uvicorn, Pydantic y TypeScript. Los datos completos del equipo siguen pendientes en `pitch/ENTREGABLES.md`; no se añaden nombres ni roles sin confirmar.
