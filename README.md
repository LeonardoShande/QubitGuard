# QubitGuard Quantum Lab

Laboratorio educativo de ciberseguridad cuántica para el IBM Quantum Hackathon / Qiskit Fall Fest 2026 (reto EdTech). Público objetivo: desde 14 años, sin requisitos previos.

Basado en el repositorio original de LeonardoShande.

## Qué es

Una aplicación web en la que quien aprende ve, con circuitos reales de Qiskit, por qué buscar un secreto al azar (Monte Carlo) es más lento que buscarlo con amplificación de amplitud (Grover), qué tan grande es esa ventaja y por qué no rompe la criptografía simétrica de hoy. Incluye una ruta de aprendizaje de 5 pasos, un reto diario corto con racha y XP, un generador de contraseñas criptográficas, tarjetas sobre criptografía poscuántica y una sección honesta de limitaciones.

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

## Metodología: Predice, Observa, Explica

El laboratorio Grover obliga a comprometerse antes de mirar:

1. **Predice.** Antes de pulsar "Ejecutar circuito", la persona elige la probabilidad de acertar (0-100 %) o las iteraciones óptimas. Referencia visible: al azar sería 1/N.
2. **Observa.** Tras ejecutar se comparan tres números: lo predicho, la teoría `sin²((2k+1)θ)` y lo medido por el simulador.
3. **Explica.** El panel "Predice, observa, explica" da XP según la cercanía de la predicción (con tope diario) y explica el resultado frente a una búsqueda al azar con las mismas consultas (k/N).

Alrededor del laboratorio hay una **ruta de 5 pasos** (superposición, oráculo, amplificación, ruido, criptografía), **6 logros**, el **reto diario**, racha y XP. El progreso vive solo en `localStorage` del navegador. Pensado desde 14 años, con uso diario de unos 3 minutos.

## Generador de contraseñas

En la sección "Tu contraseña", panel "Genera tu contraseña" (código en `frontend/src/generator.ts`):

- **CSPRNG sin semilla.** Solo usa `crypto.getRandomValues`, con muestreo por rechazo para que no haya sesgo de módulo. El código es público y aun así no se puede reproducir una contraseña: no hay semilla que adivinar.
- **Tres modos.** Caracteres (longitud 8-128, clases y evitar caracteres confusos); frase de palabras (lista de 2072 palabras, 11,02 bits por palabra); "Mejorar la mía", que inserta caracteres al azar en tu base y solo cuenta la entropía aleatoria añadida (tu base se considera conocida).
- **Entropía exacta.** Con clases obligatorias, el conteo de contraseñas válidas se calcula por inclusión-exclusión, no con la aproximación `longitud · log2(alfabeto)`.
- **Meta "resistente a Grover".** 128 bits o más de entropía: Grover los reduce a 64 efectivos.

## Seguridad y privacidad

- Las contraseñas (analizadas o generadas) nunca salen del navegador; ningún endpoint las recibe. Tests prohíben red, almacenamiento y `Math.random` en los módulos de contraseña (`tests/test_privacy.py`).
- CSP `default-src 'self'` (sin scripts de terceros ni fuentes externas), `X-Content-Type-Options`, `Referrer-Policy: no-referrer`, `Permissions-Policy`, `X-Frame-Options: DENY` y COOP.
- Solo se sirven archivos públicos del frontend (`index.html`, `styles.css`, `dist/`, `assets/`); `src/`, `node_modules/` y `package.json` devuelven 404.
- Caché HTTP (contenido educativo y tablas deterministas; simulaciones `no-store`), caché en servidor y gzip.
- Máximo 2 simulaciones ruidosas (FakeFez) a la vez; si no, 503 con `Retry-After`.
- Funciona sin internet: sin fuentes ni scripts externos.
- Demo pública con Cloudflare Tunnel: ver [docs/DEPLOY.md](docs/DEPLOY.md).

## Accesibilidad (WCAG 2.2 AA)

- Contraste medido por token (tabla en [frontend/UX_AUDIT.md](frontend/UX_AUDIT.md)); bordes de controles a 4,59:1 sobre el panel.
- Todo se puede usar con teclado; foco visible y no tapado; enlace "saltar al contenido".
- Reflow hasta 320 px de ancho.
- Los gráficos SVG llevan `<title>`/`<desc>` y una tabla con los mismos datos.
- Errores por campo asociados con `aria-describedby`; `prefers-reduced-motion` desactiva el movimiento.

## Arquitectura

```text
+---------------------+        HTTP / JSON        +------------------------+        +----------------------+
|  Navegador (TS)     | <-----------------------> |  FastAPI (un proceso)  | -----> |  Qiskit / Aer        |
|  frontend/ (tsc)    |   /api/quantum/*          |  app/main.py           |        |  Statevector,        |
|  sin frameworks     |   /api/learn/*            |  app/api/*.py          |        |  AerSimulator,       |
|  analiza y genera   |   /api/challenge/daily    |  sirve frontend/       |        |  FakeFez, transpile  |
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
pytest -q                 # 42 tests
cd frontend && npm test   # compila con tsc y corre 23 tests de frontend
```

## API

Contrato en [docs/API.md](docs/API.md). Documentación interactiva de FastAPI en http://127.0.0.1:8000/docs.

## Limitaciones

Resumen honesto en [docs/LIMITACIONES.md](docs/LIMITACIONES.md): el oráculo ya conoce la respuesta, la ventaja es solo cuadrática, el ruido mostrado es simulado, y hoy no existe un ataque cuántico práctico a AES ni a contraseñas.

## Resultados medidos

Todos con semilla fija; se pueden reproducir con la app o con los tests.

| Experimento | Configuración | Resultado |
|---|---|---|
| Grover ideal | n=4, estado `1000`, k=3, 2048 shots, seed 7, `AerSimulator` | éxito medido 0,954 frente a 0,961 teórico |
| Curva `Statevector` frente a fórmula | `sin²((2k+1)θ)` | error máximo 6e-14 |
| Grover con ruido | `FakeFez`, n=6, estado `100000`, k=6, 256 shots, seed 7 | profundidad 4447, 1706 puertas de 2 qubits, éxito 0,031, cercano al azar (1/64 = 0,0156): el ruido borra la amplificación |
| Monte Carlo | 10 bits, 5000 ensayos, seed 1 | media 513,3 intentos frente a 512,5 esperados |
| Pruebas | `pytest -q` y `npm test` | 42 y 23 pasan |

Cómo reproducirlos (servidor en marcha en el puerto 8000):

```bash
# Grover ideal n=4, k=3, 2048 shots, seed 7 (cambia "marked_state" y el tercer decimal varía: 0,953 con 1010, 0,957 con 0101)
curl -s -X POST localhost:8000/api/quantum/grover -H 'content-type: application/json' \
  -d '{"n_qubits":4,"marked_state":"1010","iterations":3,"shots":2048,"seed":7}'
# Grover con ruido FakeFez, n=6, k=6, 256 shots, seed 7 (con 101010 sale 0,031 y profundidad 4447: con 256 disparos el éxito oscila entre ~0,02 y ~0,03 según el estado, siempre cerca del azar 1/64)
curl -s -X POST localhost:8000/api/quantum/grover -H 'content-type: application/json' \
  -d '{"n_qubits":6,"marked_state":"101010","iterations":6,"shots":256,"seed":7,"noisy":true}'
# Monte Carlo 10 bits, 5000 ensayos, seed 1
curl -s -X POST localhost:8000/api/quantum/montecarlo -H 'content-type: application/json' \
  -d '{"n_bits":10,"trials":5000,"seed":1}'
```

En la interfaz se obtienen los mismos órdenes de magnitud (la UI no fija la semilla). El Monte Carlo con seed 1 también está en `tests/test_quantum.py`. Contrato completo en [docs/API.md](docs/API.md).

## Créditos de librerías

Qiskit, Qiskit Aer, qiskit-ibm-runtime, NumPy, FastAPI, Uvicorn, Pydantic, TypeScript (solo en compilación).

El frontend no tiene dependencias de runtime: solo `typescript` como herramienta de desarrollo; no carga fuentes, scripts ni imágenes de terceros.

## Equipo

TODO: nombres e integrantes.
