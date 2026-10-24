# Fondo ASCII dinámico, intro IBM y motion de gráficos

Documento para cualquier agente que edite el frontend de QubitGuard. Describe qué se
implementó, por qué está diseñado así y qué invariantes hay que respetar para no romper
el funcionamiento. La dirección general sigue en `DESIGN.md`; los contrastes medidos, en
`frontend/UX_AUDIT.md`.

## Qué se cambió (rama `feat/global-ascii-ibm-intro`)

| Archivo | Cambio |
|---|---|
| `frontend/index.html` | El backdrop `.quantum-backdrop` gana dos capas: `.quantum-backdrop__glow` (halos radiales) y `.quantum-backdrop__rain` (`#quantum-rain`, contenedor de la lluvia). |
| `frontend/styles.css` | Backdrop en 3 capas + viñeta; lluvia ASCII con columnas animadas por CSS; intro IBM con colapso por glifo, franjas alternas y sheen; titular del hero con barrido `clip-path`; bloque de animación de entrada de gráficos `svg.is-entering`. |
| `frontend/src/ambience.ts` | Genera las columnas de lluvia, re-siembra glifos cada 900 ms y ejecuta el decode de la intro. |
| `frontend/src/charts.ts` | `mount()` marca la generación nueva con `data-animate` → la SVG entra con `.is-entering`; barras y puntos llevan `style="--i: índice"` para el escalonado; los paths llevan `pathLength="1"`. |
| `frontend/src/main.ts` | Se retiraron los fades WAAPI redundantes sobre `.bars` (los cubre el CSS de entrada). |

## Arquitectura del fondo ASCII

Tres capas fijas detrás del contenido (`z-index: -1`), ninguna dibuja por frame con JS:

1. **Textura** `.quantum-backdrop__matrix`: el SVG `assets/quantum-ascii.svg` repetido, opacidad 0.09, derivando con `transform` en un ciclo alterno de 46 s.
2. **Halos** `.quantum-backdrop__glow`: dos gradientes radiales fijos (cian arriba, magenta abajo a la derecha) que dan profundidad sin JS.
3. **Lluvia** `#quantum-rain`: 8–16 columnas `<span>` (según el ancho de la ventana) con kets y puertas `01+·:|ψθφ⊗⊕π√`. Cada columna cae con una animación CSS propia (`transform: translate3d`), duración 13–25 s y retardo negativo para que nunca estén sincronizadas. Un `setInterval` de 900 ms cambia hasta 6 glifos por tic para que el bucle no se note.

Legibilidad (invariante): la lluvia usa `mask-image` con degradado vertical, opacidades
0.15/0.11, y una viñeta radial (`::after` del backdrop) oscurece los bordes. Los paneles
siguen siendo opacos y el contenido siempre gana. Si se toca el fondo, re-verificar a 375 px
y con el titular sobre fondo directo.

El botón `ASCII` de la cabecera oculta todo el backdrop y detiene el re-siembra; la pestaña
oculta y `prefers-reduced-motion` pausan la animación CSS y detienen el ticker (`sync()`).

## Intro IBM que se forma

`decodeIntro()` en `ambience.ts` convierte el `<pre>` de `ibm-intro__letters` en spans por
carácter. Cada glifo nace en superposición (cian, con ψ θ φ ⊗ π…) y "colapsa" al carácter
final (blanco; filas alternas en gris, como las franjas de la marca IBM) en una onda de
izquierda a derecha (~26 ms por columna + 40 ms por fila). El bloque ASCII replica la
referencia del usuario: 8 filas de 32 columnas constantes (I = 8, B = 8, M = 12, separación 2),
con la B de dos vientres y la M con diagonal. Cada fila es un bloque con su propio barrido de
luz, escalonado 28 ms por fila (eco del `ascii-sheen` del portfolio thealejo-dev.cc), que
refuerza las franjas horizontales. Duración total 2,9 s: el colapso acaba hacia 1,8 s, los
barridos van de 1,55 a ~2,4 s y el desvanecido empieza en el 72 % (~2,1 s). Escape o un
clic/toque la retiran, el foco en un control la oculta y con `prefers-reduced-motion` no llega
a ejecutarse. Detalle del arte en `docs/ACTUALIZACION_INTRO_IBM.md`.

## Animación de gráficos

Regla clave: **solo entra animada la generación nueva de datos**. `mount()` pone
`data-animate="1"`; `paint()` lo consume, añade `.is-entering` a esa SVG y los repintados
por `ResizeObserver` (cambio de ancho) llegan quietos. Nunca marcar animación por CSS sin
pasar por este flag o cada redibujado re-animaría.

- Barras: `bar-rise` escala desde la base con `transform-box: fill-box`, escalonadas con
  `animation-delay: calc(min(var(--i) * 14ms, 680ms))`. La resaltada pasa ligeramente de
  largo (`bar-rise-hi`).
- Líneas: trazo dibujado con `stroke-dasharray: 1` + `pathLength="1"`; los puntos estallan
  después con su propio escalonado.
- Rejilla, ticks y ejes hacen fade; las líneas de referencia caen desde arriba; una línea
  de escaneo cruza el gráfico una vez (pseudo-elemento de `.chart:has(> svg.is-entering)`).

Con `prefers-reduced-motion`, el bloque global de reducción colapsa todas las duraciones a
0,01 ms: no hace falta código extra por animación.

## Motion de la interfaz (rama `feat/motion-ibm-casaos`)

| Pieza | Dónde | Cómo |
|---|---|---|
| Entrada de secciones | `dom.ts` `initReveal()` + CSS `.reveal-on [data-reveal]` | IntersectionObserver, una vez por sección; hijos directos con `arrive` 450 ms y escalonado de 70 ms. Solo se activa si hay IO y movimiento permitido (la clase `html.reveal-on` la pone el JS: sin JS todo es visible). El foco por teclado revela la sección al instante. |
| Histograma entre ejecuciones | `charts.ts` `paint()` | Si la generación nueva tiene las mismas barras, cada barra transiciona (WAAPI, 440 ms) desde su altura anterior en píxeles (`.is-morphing`); si cambia el número de barras, entra desde cero (`.is-entering`). |
| Cifras que cuentan | `dom.ts` `countTo()` | rAF transitorio de 420 ms desde el valor anterior; se cancela si llega otro valor. HUD de XP, métricas del laboratorio, POE y medias Monte Carlo. La primera pintura del HUD es instantánea. |
| Carga → resultado | `.is-stale` | El resultado anterior se atenúa a 0,45 mientras llega el nuevo (transición CSS interrumpible). |
| Paneles y mensajes | `main.ts` `setState`, `observe`; `dom.ts` `fieldError` | Estado, botón Reintentar, panel POE y errores de campo aparecen con opacidad + desplazamiento corto (180–320 ms). Las salidas son instantáneas: un mensaje que se quita no debe quedarse visible. |
| Comparación en vivo | `main.ts` `initCompare`, `initMonteCarlo` | El gráfico clásico/Grover se recalcula 300 ms después de dejar de escribir (caché de `api.ts`); los bits Monte Carlo muestran al instante la expectativa teórica. |
| Explorador de amplitudes | `explorer.ts` | Un solo ángulo φ alimenta barras, media, vector y proyecciones con un tween rAF de 260–420 ms: lo dibujado siempre es coherente. «Siguiente iteración» anima en dos tiempos: oráculo (φ → −φ) y difusor (−φ → φ + 2θ). Cualquier control nuevo interrumpe el tween. |

Tokens en `:root`: `--ease` (salida), `--ease-in-out` (movimiento en pantalla), `--dur-fast` 160 ms,
`--dur` 240 ms, `--dur-slow` 450 ms. Solo se animan `transform`, `opacity` y atributos SVG del
explorador; nada de layout.

## Invariantes que no se deben romper

1. **Sin canvas ni WebGL ni dependencias nuevas.** El proyecto corre sin internet; CSS y
   Web Animations alcanzan. React/Three.js/anime.js siguen descartados (ver `DESIGN.md`).
2. **Azar solo con `crypto.getRandomValues`.** El test `frontend/test/generator.test.mjs`
   rechaza `Math.random` en todo `src/*.ts`. Usar el helper `rand()` de `ambience.ts`.
3. **Contratos de `ambience.ts`** (tests `frontend/test/ambience.test.mjs`): los mocks de
   node no tienen `document.createElement` ni `querySelector`; el código del navegador está
   protegido con guardas (`rainHost && typeof document.createElement === "function"`,
   `typeof intro.querySelector === "function"`). Si se añaden accesos a DOM nuevos en
   `initAmbience`, protégelos igual o adapta el mock.
4. **Accesibilidad**: el backdrop y la intro son `aria-hidden`; las animaciones decorativas
   no tocan datos ni foco; se mantiene la salida con Escape y el bloqueo con foco.
5. **Legibilidad sobre el fondo**: opacidad de lluvia ≤ 0.15 y máscara activa; los paneles
   (`--panel`) opacos; nada del fondo por encima de `z-index: -1`.
6. **`--i` en barras y puntos**: si se cambia el generador de gráficos, mantener la variable
   o quitar el escalonado; un `--i` ausente hace delay 0 (aceptable, no rompe).
7. **Los bucles rAF son transitorios** (`countTo`, tween del explorador): terminan en ≤ 450 ms o al
   llegar otro valor. No añadir bucles permanentes por frame; el fondo sigue siendo CSS.
8. **Reveal sin trampas**: nunca ocultar contenido sin `html.reveal-on`; mantener el revelado por
   `focusin`; no aplicar `[data-reveal]` al hero (ya tiene su entrada).
9. **Transición de barras**: `.bar` lleva `transform-box: fill-box; transform-origin: bottom`. Si se
   cambia `barChart`, mantener `class="bar"` y el atributo `height` en píxeles, que es lo que
   `paint()` compara.
10. **Explorador**: `.amp__plot` mide 168 px y `BAR_HALF` (84) en `explorer.ts` debe ser su mitad.
    Las fórmulas exactas están probadas en `test/explorer.test.mjs` (normalización, oráculo +
    reflexión sobre la media = una iteración, óptimos conocidos).

## Cómo verificar tras tocar esto

```bash
cd frontend && npm test      # tsc + 36 tests node
cd .. && ../.venv/bin/uvicorn app.main:app --port 8010   # abrir http://127.0.0.1:8010
```

Comprobar: intro se forma y se retira sola (y con Escape), toggle ASCII oculta/muestra el
fondo, ejecutar el laboratorio Grover y ver barras/curva animarse una vez (el reencuadre de
ventana NO debe re-animar), 375 px sin scroll horizontal y texto legible sobre el fondo.
