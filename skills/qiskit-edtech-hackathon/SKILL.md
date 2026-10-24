---
name: qiskit-edtech-hackathon
description: Úsala para construir un laboratorio educativo de física/cuántica con Qiskit en un hackathon (IBM Quantum / Qiskit Fall Fest), mapear un concepto de estadística o ML a su equivalente cuántico, y entregar repo, demo y pitch bajo presión de tiempo. Incluye la base visual, el método de producto y los criterios de evaluación verificados en QubitGuard.
---

# Skill: laboratorio EdTech con Qiskit para hackathon

Método destilado de QubitGuard (reto 5.3 EdTech, IBM Quantum Hackathon / Qiskit Fall Fest 2026, Lima). Aplica a cualquier equipo que deba entregar un laboratorio web educativo con Qiskit, una demo en vivo y un pitch el mismo día.

## 1. Cuándo usarla y qué entrega

Úsala si el reto pide enseñar un concepto de estadística/ML con computación cuántica y evaluar comprensión, no solo mostrar un circuito.

Entrega mínima, en este orden:

1. **Repo ejecutable** con un solo comando (`uvicorn app.main:app`) y datos de ejemplo.
2. **Demo en vivo** de 60–90 s, con plan B grabado.
3. **Descripción escrita** del proyecto (≤150 palabras) y mapeo concepto clásico → cuántico.
4. **PPT** y **guion cronometrado** con reparto por expositor.
5. **Pendientes honestos**: qué no se ejecutó, qué no se validó.

No empieces por el PPT. Empieza por el circuito y el contrato de API; el material de venta se escribe cuando las cifras ya se pueden medir.

## 2. Lectura de las bases

### Pesos de la rúbrica (verificados en las bases del evento)

| Criterio | Peso | Qué lo demuestra |
|---|---|---|
| Innovación, validación y potencial | 25 % | Predicción + experimento + ruido + contexto real; evidencia de uso |
| Qiskit y claridad de presentación | 25 % | Circuitos que se ejecutan; explicar por qué cada pieza es necesaria |
| EdTech (metodología y ganas de volver) | 20 % | Público, edad, frecuencia, feedback, progreso |
| Rigor y reproducibilidad | 15 % | Fórmulas, semillas, tests, cifras repetibles |
| Solución y arquitectura | 15 % | Un proceso, módulos claros, demo de extremo a extremo |

Reglas que se derivan:

- **Qiskit por sí solo no puntúa.** Un circuito que se dibuja pero no se ejecuta, o que no responde una pregunta pedagógica, no cubre el 25 %. Cada pieza debe justificarse: `Statevector` para la curva exacta, `AerSimulator` para el muestreo, `FakeFez` para el ruido, `transpile` para las métricas de hardware.
- **La honestidad suma, la exageración resta.** Declara "simulado", "no ejecutado", "no validado" donde corresponda. No presentes WCAG AA como certificación ni una demo como piloto con estudiantes.
- **Responde las preguntas EdTech de las bases**: ¿desde qué edad? (QubitGuard: 14+, solo fracciones y porcentajes), ¿uso diario o semanal? (3 minutos al día; también actividad de aula semanal), ¿qué metodología?, ¿por qué volver?
- **Un solo par oficial como eje.** El de QubitGuard es *distribuciones de probabilidad → superposición y amplitudes*. No cambies la etiqueta del proyecto para encajar en otro reto.

### Pares oficiales del reto

| Concepto clásico | Equivalente sugerido |
|---|---|
| Distribuciones de probabilidad | Superposición y amplitudes |
| SVM | QSVM y kernels cuánticos |
| Monte Carlo | Quantum Amplitude Estimation |
| Redes neuronales | QNN y VQC |
| Descenso de gradiente | Quantum Gradient Descent |

Elige **un** par y constrúyelo completo. Si usas un segundo par solo como comparación (QubitGuard: Monte Carlo vs. Grover), dilo explícitamente y no lo llames QAE. No llames QML al proyecto si no hay dataset, entrenamiento ni inferencia.

## 3. Método de producto

### Concepto clásico → equivalente cuántico

1. Escribe la pregunta en lenguaje de estudiante: "¿cuántos intentos hacen falta para encontrar un secreto entre N?".
2. Escribe la referencia clásica con su fórmula: búsqueda aleatoria sin repetición, `(N+1)/2` intentos esperados.
3. Escribe el equivalente cuántico con su fórmula: Grover, `P(k) = sin²((2k+1)θ)`, `θ = asin(1/√N)`, `k_opt = floor(π/(4θ))`.
4. Haz visible la diferencia: con `N=16`, clásico 8,5 intentos; Grover 3 iteraciones; teoría 96,1 %.
5. Declara el límite: la ventaja es **cuadrática**, no exponencial.

### Predice → Observa → Explica (POE)

- **Predice** antes de ejecutar: obliga a comprometerse con una probabilidad o con `k`. Sin predicción no hay aprendizaje; el XP se gana por cercanía.
- **Observa**: muestra en la misma escala la predicción, la teoría y lo medido. Añade el histograma, la curva y las métricas del circuito transpilado.
- **Explica**: texto breve que interpreta el resultado, corrige el error y compara con el azar (`k/N`).
- El explorador de amplitudes se desbloquea tras la primera predicción, pero permite "explorar sin predecir": no bloquees el acceso.

### Bucle adictivo, sin trampas

- **Reto diario determinista por fecha local**: SHA-256 de la fecha ISO alimenta `random.Random`; misma fecha, mismo reto, sin base de datos. El cliente envía `?date=YYYY-MM-DD` con la fecha local; la API sin fecha usa UTC.
- **Racha** de días locales consecutivos; la misma fecha no puntúa dos veces.
- **XP y niveles** (QubitGuard: 7 niveles, tope de 5 predicciones puntuables al día).
- **Logros** ligados a acciones que enseñan (6 en QubitGuard: primera predicción, predicción exacta, ver el ruido, generar 128+ bits, racha de 3 días, ruta completa). No se compran repitiendo.
- **Progreso local** en `localStorage` (`qubitguard.progress.v1`), tolerante a datos corruptos o almacenamiento bloqueado. Sin cuentas, sin ranking, sin antitrampa.
- **Público 14+**: nada de álgebra lineal; fracciones, porcentajes y la idea de probabilidad.

## 4. Arquitectura base

### Un proceso, contrato primero

```text
frontend/ (TypeScript, tsc) -> app/api/ -> app/quantum/ -> Qiskit / Aer / FakeFez
UI, explorador, contraseñas      routers     experimentos    simulación
                                app/content/*.json
scripts/run_ibm_hardware.py -> mismo circuito -> FakeFez local o IBM Quantum (CLI aparte)
```

- **Fija `docs/API.md` antes de paralelizar.** Endpoints, campos, rangos, errores (422/503/500) y convención de bits. Con el contrato cerrado, frontend y backend trabajan sin bloquearse.
- **FastAPI sirve API y frontend estático** en el mismo origen. Un comando, sin CORS, sin servidor Node en producción; `dist/` va versionado.
- **Valida dos veces**: Pydantic con `extra="forbid"` y rangos en el router, y otra vez en el motor (`app/quantum/experiments.py`) para que sea seguro llamarlo directo desde Python.

### Qiskit: cuatro piezas, cuatro preguntas

```python
# app/quantum/experiments.py
import qiskit          # import a nivel de módulo, antes de los hilos del servidor
import qiskit_aer

@lru_cache(maxsize=1)
def _noisy_backend() -> AerSimulator:
    return AerSimulator.from_backend(FakeFez())

compiled = transpile(circuit, **target, seed_transpiler=seed,
                     optimization_level=3 if noisy else 1)
raw = simulator.run(compiled, shots=shots, seed_simulator=seed).result().get_counts(compiled)
```

| Pieza | Pregunta que responde | Detalle de QubitGuard |
|---|---|---|
| `Statevector` | ¿Cuál es la probabilidad exacta en cada `k`? | Circuito con `measure=False`; curva ideal aunque el histograma use ruido |
| `AerSimulator` | ¿Qué se mide con `shots`? | Base `cx/rz/sx/x`, optimización 1, `seed_simulator` |
| `AerSimulator.from_backend(FakeFez())` | ¿Qué hace el ruido NISQ? | Optimización 3, backend simulado, `lru_cache(maxsize=1)` |
| `transpile` | ¿Cuánto cuesta en hardware? | `depth` y `two_qubit_gates` **después** de transpilar |

Notas que ahorran horas:

- **Importa `qiskit` a nivel de módulo.** Con Qiskit 2.6.1 + Python 3.13, importarlo dentro de un hilo efímero del servidor falla; el import temprano lo evita.
- **Semilla acotada** a `0 .. 2^32 - 1`; valores mayores desbordan enteros de 64 bits en Aer/transpile.
- **Cachés en memoria** para curva, comparación y ejecuciones con semilla; devuelve `copy.deepcopy` para que nadie mute el resultado cacheado.
- **Límite de recursos**: semáforo de 2 simulaciones ruidosas por proceso, espera máxima 10 s, `503` con `Retry-After: 2`. No es rate limiting.
- **CLI de hardware separado**: `SamplerV2(mode=backend).run([compiled], shots=shots)`, `generate_preset_pass_manager`, credenciales solo por entorno o cuenta guardada, nunca por argumento ni por la web. Imprime `job_id` antes de esperar y permite recuperar con `--job-id`.
- **No implementes QAE, QML ni Shor si el producto no los necesita.** Añadirlos sin diseño científico debilita el rigor.

## 5. Base de diseño visual

### Paleta semántica (tokens reales de `frontend/styles.css`)

| Token | Hex | Significado |
|---|---|---|
| `--bg` | `#080c14` | Fondo azul negro |
| `--panel` | `#0e1520` | Superficie de datos |
| `--panel-2` | `#131e2c` | Superficie elevada |
| `--line` | `#223044` | Separadores |
| `--line-2` | `#30425a` | Bordes secundarios |
| `--text` | `#dce5ee` | Texto principal |
| `--muted` | `#a1b0c2` | Texto secundario |
| `--cyan` | `#46d9e8` | **Cuántico**: Grover, enlaces, foco |
| `--magenta` | `#ea6bbd` | **Clásico / azar**: Monte Carlo, racha |
| `--ok` | `#6ee39a` | Correcto |
| `--err` | `#ff8080` | Error |
| `--warn` | `#f0a35e` | Contraseña débil |
| `--edge` | `#6b7f94` | Bordes de controles y barras (≥3:1) |

El color **nunca va solo**: cian y magenta se acompañan de etiqueta textual. Fondo oscuro, paneles opacos, datos legibles por encima del arte ASCII.

### Tipografía sin red

```css
--mono: ui-monospace, "SF Mono", SFMono-Regular, "Cascadia Mono",
        "Segoe UI Mono", "Roboto Mono", Menlo, Consolas, monospace;
--sans: system-ui, -apple-system, "Segoe UI Variable Text", "Segoe UI",
        Roboto, "Noto Sans", "Helvetica Neue", Arial, sans-serif;
```

Monoespaciado para títulos, cifras y datos (`font-variant-numeric: tabular-nums slashed-zero`); sans para texto. Sin Google Fonts: en la sede puede no haber internet y la CSP `'self'` bloquea la hoja externa.

### Dial de dirección

**ENERGY 2 / RHYTHM 2 / MOTION 2.** Contenido denso pero calmado: sin canvas, sin WebGL, sin framework. Una entrada de marca, animaciones de datos una sola vez y nada que compita con la lectura.

### Motion

| Token / pieza | Valor real |
|---|---|
| `--ease` (salida) | `cubic-bezier(0.23, 1, 0.32, 1)` |
| `--ease-in-out` (en pantalla) | `cubic-bezier(0.77, 0, 0.175, 1)` |
| `--dur-fast` / `--dur` / `--dur-slow` | `160ms` / `240ms` / `450ms` |
| Intro IBM | 2900 ms; colapso por glifo ~26 ms/columna + 40 ms/fila; sheen escalonado 28 ms/fila |
| Reveal de sección | 450 ms, escalonado 70 ms, una vez por sección (IntersectionObserver) |
| Histograma entre ejecuciones | WAAPI 440 ms, emparejando barras por etiqueta |
| Cifras que cuentan | rAF transitorio 420 ms, se cancela si llega otro valor |
| Explorador | tween rAF 260–420 ms; paso en dos tiempos oráculo/difusor |
| Carga → resultado | opacidad a 0.45 con transición de 240 ms |

Reglas:

1. **Solo anima datos nuevos.** Marca la generación con `data-animate="1"`; los repintados por `ResizeObserver` llegan quietos.
2. **Solo `transform`, `opacity` y atributos SVG.** Nunca `width`, `height`, `top` ni `left`. Barras con `transform-box: fill-box; transform-origin: bottom`.
3. **Nada de bucles rAF permanentes.** Los tweens terminan en ≤450 ms o al llegar otro valor. El fondo es CSS.
4. **`prefers-reduced-motion`**: sin intro, sin reveal, sin WAAPI y transiciones a `0.01ms`; los datos siguen disponibles. El reveal tampoco puede dejar contenido transparente al imprimir.
5. **La intro no bloquea**: se retira sola, con clic/toque, `Esc` o el primer `focusin`; es `aria-hidden`.
6. **El ASCII es decorativo y local.** 8 filas × 32 columnas constantes (I=8, B=8, M=12, separación 2), `z-index: -1`, opacidad de lluvia ≤0.15, viñeta para legibilidad y botón para ocultarlo. No copies logotipos oficiales; una marca textual ASCII no implica patrocinio.

### WCAG 2.2 AA: checklist verificable

- [ ] Contraste de texto ≥4.5:1; controles y barras ≥3:1. Valores de QubitGuard: `--text` 14.38:1 sobre panel, `--muted` 8.29:1, `--cyan` 10.77:1, `--magenta` 6.40:1, `--edge` 4.44:1.
- [ ] Foco visible: `outline: 2px solid var(--cyan); outline-offset: 2px`, nunca `outline: none` sin reemplazo.
- [ ] Objetivo táctil ≥24×24 px (2.5.8) y sin `position: sticky` que tape el foco (2.4.11).
- [ ] Reflow a 320 px sin scroll horizontal; tablas y circuitos con scroll interno.
- [ ] Cada SVG con `<title>`, `<desc>` y `aria-labelledby`/`aria-describedby`, más tabla de datos equivalente.
- [ ] Errores por campo con `aria-describedby` y `aria-invalid`; el foco salta al primer campo inválido.
- [ ] Un solo `h1`, jerarquía de encabezados, skip link, `aria-live` para resultados y copia.
- [ ] No usar color como única señal: añadir texto ("−x bits", "cuántico", "clásico").
- [ ] Probar teclado, 200 % de texto, 320/375/768/1440 px y movimiento reducido. No afirmar conformidad completa sin lectores de pantalla ni dispositivos reales.

## 6. Seguridad y privacidad

- **CSP de mismo origen**: `default-src 'self'`; permite estilos inline e imágenes `data:`. Sin scripts de terceros, sin CDN.
- **Cabeceras**: `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, COOP `same-origin`, `Permissions-Policy` restrictiva. HSTS solo detrás de HTTPS (Cloudflare o servidor), no en local.
- **Allowlist de archivos públicos** con la misma normalización que usa el servidor:

```python
PUBLIC_FILES = {"/", "/index.html", "/styles.css"}
PUBLIC_PREFIXES = ("/api/", "/dist/", "/assets/")
path = posixpath.normpath(request.url.path)   # '..' se resuelve antes de comparar
```

  Todo lo demás (`/src/`, `/node_modules/`, `/package.json`) devuelve 404, incluido el 500, que debe salir con cabeceras.
- **Límites de recursos**: semáforo de simulaciones ruidosas, `no-store` en simulaciones, caché solo para contenido determinista. Declara que no hay autenticación ni rate limiting por IP.
- **Contraseñas solo en el navegador**: ningún endpoint las recibe; comparar, analizar y generar ocurre en cliente.
- **Aleatoriedad**: `crypto.getRandomValues` con muestreo por rechazo (`randomInt`), nunca `Math.random`, nunca semilla.
- **Tests que lo prohíben**: red (`fetch`, XHR), almacenamiento y `Math.random` en los módulos de contraseñas; contrato sin campos de contraseña.
- **Credenciales IBM**: solo entorno o cuenta guardada por el usuario; el CLI no acepta `--token`, no guarda cuentas y oculta el texto de las excepciones del SDK.
- **Datos**: progreso solo en `localStorage`; sin analítica ni terceros. Un dato local es editable: no lo uses para exámenes ni ranking.

## 7. Calidad

### Tests mínimos que sí valen

1. **Física contra fórmula**: `Statevector` debe coincidir con `sin²((2k+1)θ)` en todos los `k`, `n=2..6` (QubitGuard: error máximo `6.15e-14`, umbral `<1e-12`).
2. **Contrato**: rangos, longitud de `marked_state`, semilla fuera de rango y campo extra → 422.
3. **Privacidad**: ningún endpoint acepta contraseña; módulos de contraseñas sin red/almacenamiento/`Math.random`.
4. **Cabeceras y rutas**: CSP presente, `/src/` da 404, path traversal normalizado.
5. **Frontend**: fórmulas del explorador (normalización, una iteración = oráculo + reflexión, óptimos conocidos), progreso tolerante a datos corruptos, `countTo` con valores no finitos.
6. **Regresión visual/motion**: la animación de gráficos ocurre solo con datos nuevos; reduced-motion deja todo visible.

### CI

```yaml
# .github/workflows/ci.yml (esquema real)
python:  pip install -r requirements.txt && pytest -q -m "not slow"
frontend: npm ci && npx tsc --noEmit && npm test   # tsc + node:test
```

- Ejecuta la suite completa en local (incluye `slow`); la CI omite `slow` por tiempo.
- **Un commit por fase**: motor, contrato, frontend, contenido, seguridad, CI, deploy, docs. Mensajes `feat:`, `fix:`, `docs:`.
- **Revisión cruzada por otro modelo**: un proveedor distinto revisa el diff antes de integrar. Separa hallazgos demostrados, límites aceptables y mejoras opcionales; no aceptes un "todo bien" sin evidencia.
- **No inventes resultados.** Cada cifra del README/pitch debe venir de un comando ejecutado y decir su estado: teórico, medido, simulado o pendiente. Anota `seed`, `shots`, versión y estado marcado. La interfaz no fija semilla: lee la pantalla, no el guion.
- **Actualiza los recuentos de tests** tras cada fase; un número obsoleto en el pitch es un fallo de rigor.

## 8. Orquestación multiagente

- **Un rol por agente**: arquitecto (contrato y esqueleto), builder (implementa), reviewer (solo lectura), integrador (revisa el diff y decide). El que revisa no debe ser el mismo modelo que construyó.
- **Archivos disjuntos por agente**, declarados en un board compartido (`quién tiene qué archivo`). Si dos necesitan el mismo archivo, se serializa; no se resuelve con merges a ciegas.
- **El contrato de API se escribe antes de repartir.** Sin él, frontend y backend inventan campos distintos.
- **Read-only primero**: la revisión científica, la de accesibilidad y la de documentación no editan. Entregan informe con archivo:línea, problema, evidencia y corrección mínima.
- **Integra un diff por vez** y vuelve a ejecutar solo las comprobaciones afectadas. Ningún agente hace push, commit ni PR por su cuenta sin que el integrador lo pida.
- **No delegues la validación con usuarios a un agente.** Un informe de otro modelo no es un piloto.

## 9. Pitch

### Estructura detallada: 16 slides (~12 min)

| # | Bloque | Expositor |
|---|---|---|
| 1 | QubitGuard: qué es | A |
| 2 | El reto y el problema | A |
| 3 | Lo mínimo de computación cuántica | A |
| 4 | ¿Qué es Qiskit? | B |
| 5 | De Monte Carlo a Grover | B |
| 6 | Grover paso a paso | B |
| 7 | La curva `sin²` | B |
| 8 | Recorrido por la app | C |
| 9 | Predice → Observa → Explica | C |
| 10 | Explorador de amplitudes | C |
| 11 | El ruido borra la amplificación | C |
| 12 | Hacia una QPU real de IBM | D |
| 13 | Contraseñas y criptografía poscuántica | D |
| 14 | Arquitectura y seguridad | D |
| 15 | Validación y limitaciones | D |
| 16 | Impacto EdTech y cierre | A |

### Versión de 3 minutos, 4 expositores

Guion real de QubitGuard (`pitch/GUION.md`, 8 slides, 2:45 + 15 s de margen):

| Tiempo | Bloque | Quién |
|---|---|---|
| 0:00–0:12 | Gancho: 8,5 intentos al azar vs. 3 pasos | A |
| 0:12–0:30 | Problema y público (14+, 3 min/día) | A |
| 0:30–0:48 | Mapeo estadístico → cuántico | B |
| 0:48–1:38 | Demo en vivo (50 s) | C |
| 1:38–1:55 | Por qué Qiskit y el ruido | B |
| 1:55–2:08 | Seguridad y arquitectura | D |
| 2:08–2:22 | Validación y límites | D |
| 2:22–2:45 | Impacto EdTech y cierre | A |

Demo de 50 s, en este orden: ruta de 5 pasos → laboratorio (predecir, ejecutar, leer predicción/teoría/medido) → explorador (siguiente iteración y pasarse del óptimo) → ruido a 6 qubits → generador local. Si falta tiempo, recorta el generador.

Prepara respuestas para: ¿por qué cuántico y no una animación?, ¿la contraseña se envía?, ¿por qué volver y para qué edad?, ¿rompe contraseñas reales hoy?, ¿hardware real de IBM?, ¿implementan QAE?, ¿qué harían con más tiempo?, ¿y si hago ingeniería inversa del generador?

## 10. Checklist final antes de entregar

- [ ] `docs/API.md` coincide con la implementación; todos los endpoints responden.
- [ ] Física contrastada con fórmula y test que falla si se rompe.
- [ ] 422, 503 con `Retry-After` y 500 genérico comprobados.
- [ ] Ningún endpoint acepta contraseñas; tests de red/almacenamiento/`Math.random` pasan.
- [ ] CSP, cabeceras y allowlist de rutas verificadas.
- [ ] `pytest -q` y `npm test` en verde; `tsc --noEmit` limpio; recuentos del pitch actualizados.
- [ ] Demo ensayada con cronómetro y plan B grabado.
- [ ] Reduced-motion, teclado, foco y 320 px comprobados.
- [ ] Cifras con `seed`, `shots` y estado (teórico/medido/simulado/pendiente).
- [ ] Hardware real, piloto con estudiantes y WCAG completa declarados como pendientes si no se hicieron.
- [ ] Repo clonable desde cero, `dist/` versionado y un comando de arranque.
- [ ] Nombres del equipo, enlace del repo y video completados (no dejar TODO en la entrega).

## Archivos de referencia en este repo

`README.md`, `DESIGN.md`, `docs/API.md`, `docs/architecture.md`, `docs/UI_ASCII_Y_MOTION.md`, `docs/IBM_HARDWARE.md`, `docs/LIMITACIONES.md`, `docs/REVISION_PROMPT_Y_BASES.md`, `docs/RETO_Y_ENTREGA.md`, `frontend/styles.css`, `frontend/UX_AUDIT.md`, `app/quantum/experiments.py`, `app/main.py`, `pitch/GUION.md`, `pitch/OUTLINE_PRESENTACION.md`.
