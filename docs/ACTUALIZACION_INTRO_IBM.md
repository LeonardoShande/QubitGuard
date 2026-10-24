# Actualización: intro IBM de 8 filas (2026-10-24)

Nota de cambio para agentes. El detalle completo del sistema sigue en
`docs/UI_ASCII_Y_MOTION.md`; este archivo solo registra la última revisión de la entrada.

## Qué cambió

El bloque ASCII de `frontend/index.html` (`pre.ibm-intro__letters`) pasa de 7 filas
compactas a la referencia que pidió el usuario: **8 filas con la separación ancha de la
marca**, B de dos vientres y M con diagonal descendente:

```
IIIIIIII  BBBBBBB   MMM    MMM
   II     BB    BB  MMMM  MMMM
   II     BB    BB  MM MMMM MM
   II     BBBBBBB   MM  MM  MM
   II     BB    BB  MM      MM
   II     BB    BB  MM      MM
   II     BB    BB  MM      MM
IIIIIIII  BBBBBBB   MM      MM
```

Ajustes de `frontend/styles.css` para el bloque más ancho (30 columnas):

- Tamaño: `clamp(0.62rem, 3.2vw, 2rem)` (antes 2,7 vw / 1,75 rem) y peso 700.
- Duración de la intro: 2.900 ms (antes 2.600). El colapso de caracteres en `ambience.ts`
  no cambió: con la onda actual termina hacia 1,8 s, dentro de la ventana visible.
- Sheen: retardo 1.800 ms (antes 1.550).

## Invariantes (sin cambios)

- `decodeIntro()` lee el texto del `<pre>` y genera los spans: si se edita el arte, no hay
  que tocar `ambience.ts`, pero cualquier fila o columna nueva alarga la onda (26 ms por
  columna + 40 ms por fila desde 140 ms). Mantener el colapso por debajo del 72 % de la
  duración total, que es donde empieza el desvanecido.
- Escape retira la intro, el foco en un control la oculta y `prefers-reduced-motion` la
  omite (tests: `frontend/test/ambience.test.mjs`).
- Sin dependencias nuevas, sin canvas/WebGL, azar solo con `crypto.getRandomValues`.

## Verificación

`npm test --prefix frontend`: 33/33. Visual en `http://127.0.0.1:8010` (uvicorn con
`app.main:app`): recargar y mirar la intro completa; el logo se forma fila a fila,
columna a columna, y se retira solo.
