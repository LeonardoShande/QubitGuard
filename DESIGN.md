# Dirección visual de QubitGuard

Interfaz educativa para un laboratorio de probabilidades y amplificación de amplitud, presentado al IBM Quantum Hackathon / Qiskit Fall Fest 2026 de Lima. Referencias solicitadas por el usuario: ASCII y [su portfolio](https://www.thealejo-dev.cc/). No se copian logotipos ni se implica patrocinio del proyecto.

Dial: ENERGY 2 / RHYTHM 2 / MOTION 2.

- Fondo azul negro y superficies opacas para leer datos con claridad. Cian identifica el método cuántico; magenta, la referencia clásica. Son colores semánticos y se acompañan de etiquetas.
- Título y cifras monoespaciados con fuentes del sistema: conexión con el lenguaje de código y funcionamiento sin descargar fuentes. Texto explicativo en sans serif.
- Fondo ASCII global en tres capas (textura que deriva, halos de color y lluvia de kets/puertas) con estados `|0>` y `|1>`, circuitos y referencias textuales a Qiskit e IBM Quantum. Es decorativo, local y oculto a tecnologías de asistencia; no representa datos medidos. Un botón ASCII permite ocultarlo y la viñeta garantiza la legibilidad del texto.
- Contexto del evento en texto enlazado, seguido de presentación asimétrica y comparador funcional. Evitar una portada que retrase el acceso al laboratorio.
- Tarjeta de comparación sin líneas detrás de las cifras. Separadores, filas y alturas de texto estables mantienen el orden al cambiar la escala.
- Entrada de 2,9 s en la que la marca IBM se "forma" por medición: cada glifo nace en superposición (cian) y colapsa al carácter final en una onda, con el bloque de 8 filas y separación ancha de la referencia del usuario, franjas alternas tenues y un único barrido de luz. Se retira al finalizar o con Escape y desaparece al enfocar un control. El fondo combina animaciones CSS por columna con un re-siembra de glifos cada 900 ms; se pausa con la pestaña oculta y puede ocultarse con el control ASCII. Los gráficos entran una sola vez por generación de datos (barras escalonadas, trazo dibujado y línea de escaneo) y los repintados por cambio de ancho llegan quietos. Detalles e invariantes en `docs/UI_ASCII_Y_MOTION.md`. No hay bucle JS por frame, canvas ni WebGL.
- Con movimiento reducido no se ejecuta la entrada ni WAAPI. Los datos y los controles siguen disponibles sin animación.
- Mantener enlaces reales, foco visible, tablas equivalentes a los gráficos, estados de carga/error/vacío y reflow a 320 px. Las tablas y circuitos pueden desplazarse dentro de su propio contenedor.

La decisión es conservar HTML/CSS/TypeScript, CSS y Web Animations. React, Three.js, Motion o anime.js solo se justificarían si aparece una interacción que la base actual no pueda resolver con claridad. No se añadió ninguna dependencia de ejecución para este cambio.
