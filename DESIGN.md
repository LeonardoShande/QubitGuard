# Dirección visual de QubitGuard

Interfaz educativa para un laboratorio de probabilidades y amplificación de amplitud, presentado al IBM Quantum Hackathon / Qiskit Fall Fest 2026 de Lima. Referencias solicitadas por el usuario: ASCII y [su portfolio](https://www.thealejo-dev.cc/). No se copian logotipos ni se implica patrocinio del proyecto.

Dial: ENERGY 2 / RHYTHM 2 / MOTION 2.

- Fondo azul negro y superficies opacas para leer datos con claridad. Cian identifica el método cuántico; magenta, la referencia clásica. Son colores semánticos y se acompañan de etiquetas.
- Título y cifras monoespaciados con fuentes del sistema: conexión con el lenguaje de código y funcionamiento sin descargar fuentes. Texto explicativo en sans serif.
- Motivo ASCII con estados `|0>` y `|1>`, decorativo y oculto a tecnologías de asistencia. Su bajo contraste evita competir con el contenido; no representa datos medidos.
- Contexto del evento en texto enlazado, seguido de presentación asimétrica y comparador funcional. Evitar una portada que retrase el acceso al laboratorio.
- Tarjeta de comparación sin líneas detrás de las cifras. Separadores, filas y alturas de texto estables mantienen el orden al cambiar la escala.
- Entrada inicial breve de título y tarjeta; el ASCII se asienta en 2,4 s y no se repite. Resultados con fundido de 240 ms y barras del comparador con transición de 160 ms. Propiedades animadas: transform y opacity, sin bucle JS ni renderizado 3D.
- Con movimiento reducido no se ejecuta la entrada ni WAAPI. Los datos y los controles siguen disponibles sin animación.
- Mantener enlaces reales, foco visible, tablas equivalentes a los gráficos, estados de carga/error/vacío y reflow a 320 px. Las tablas y circuitos pueden desplazarse dentro de su propio contenedor.

La decisión es conservar HTML/CSS/TypeScript, CSS y Web Animations. React, Three.js, Motion o anime.js solo se justificarían si aparece una interacción que la base actual no pueda resolver con claridad. No se añadió ninguna dependencia de ejecución para este cambio.
