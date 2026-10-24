# Auditoría UX/UI y WCAG 2.2 AA del frontend

Revisión heurística (Nielsen, Krug) y técnica (WCAG 2.2 AA) de la versión anterior a esta fase, ordenada por severidad (0 a 4). Todos los puntos marcados como corregidos están en el código.

| # | Sev. | Problema | Heurística / criterio | Arreglo |
|---|------|----------|-----------------------|---------|
| 1 | 4 | La página cargaba IBM Plex Mono desde Google Fonts: sin internet en la sede se pierde la fuente, y con la CSP `default-src 'self'` la hoja de estilos queda bloqueada. | Robustez; CSP del backend | Se quitaron los `<link>` externos. Pila del sistema: `ui-monospace, "SF Mono", "Cascadia Mono", "Roboto Mono", Menlo, Consolas` para datos y `system-ui` para texto. |
| 2 | 3 | El laboratorio solo pedía pulsar "Ejecutar": se mira el resultado sin comprometerse antes, y el aprendizaje es pasivo. | Metodología Predice → Observa → Explica | Predicción obligatoria (probabilidad 0-100 % o iteraciones óptimas) antes de ejecutar. Después se compara con la teoría y la medida, se da XP según la cercanía y se explica el resultado frente a una búsqueda al azar con las mismas consultas. |
| 3 | 3 | No había un camino que seguir: siete secciones al mismo nivel y ningún indicio de por dónde empezar. | Reconocimiento antes que recuerdo; ley de Hick | Ruta visible de 5 pasos (superposición, oráculo, amplificación, ruido, criptografía). Cada paso prepara el laboratorio con un clic y queda marcado en `localStorage`. |
| 4 | 3 | Los bordes de campos y botones secundarios (`#2a3848`) quedaban en 1,58:1 sobre el panel. No se distinguía dónde escribir. | WCAG 1.4.11 contraste no textual (3:1) | Nuevo token `--edge: #6b7f94`, con 4,59:1 sobre el panel y 4,86:1 sobre el fondo. |
| 5 | 3 | Barras del histograma `#3a4b5c` a 2,11:1 y barras Monte Carlo `#4a3a49` a 1,80:1 sobre el panel. | WCAG 1.4.11 | Barras `#6b7f94` (4,59:1) y `#8a6f84` (4,23:1). |
| 6 | 3 | Los gráficos SVG solo tenían `aria-label`, sin `<title>`/`<desc>` ni datos en texto. | WCAG 1.1.1 y 1.3.1 | Cada SVG lleva `<title>` y `<desc>` enlazados con `aria-labelledby`/`aria-describedby`, y debajo una tabla desplegable con los datos. |
| 7 | 3 | Un único mensaje de error por formulario que no se asociaba al campo. El foco se quedaba en el botón. | Nielsen 9; WCAG 3.3.1 y 1.3.1 | Un error por campo enlazado con `aria-describedby`, más `aria-invalid`. Al enviar, el foco salta al primer campo inválido. |
| 8 | 2 | "Aleatorio" usaba `Math.random`. | Rigor; test del repo | `crypto.getRandomValues`. 2³² es múltiplo de 2ⁿ, así que el módulo no introduce sesgo. |
| 9 | 2 | El reto diario y las fichas de aprendizaje se volvían a pedir en cada recarga o reintento, y la curva podía pedirse dos veces en vuelo al mover el control. | Rendimiento | Caché en memoria por sesión en `api.ts` para GET deterministas y la curva. La promesa compartida evita duplicados en vuelo y se borra si falla, para poder reintentar. |
| 10 | 2 | La barra de XP, el medidor de la contraseña y las barras del hero animaban `width`, que obliga a recalcular el layout. | Rendimiento de animación | Ahora usan `transform: scaleX()`. El movimiento nuevo usa la Web Animations API (solo transform/opacity) y se desactiva con `prefers-reduced-motion`. |
| 11 | 2 | No existía un generador: la sección decía "usa contraseñas largas" sin ofrecer cómo. | Nielsen 2 y 7 | "Genera tu contraseña" en tres modos (caracteres, frase, mejorar la mía), con los bits exactos, los bits efectivos frente a Grover y la meta de 128 bits. Copiar avisa por `aria-live`. |
| 12 | 2 | El progreso se reducía a XP y racha: nada reconocía hitos concretos de aprendizaje. | Motivación y retorno diario | Seis logros ligados a acciones que enseñan algo. No se compran con repetición. |
| 13 | 1 | La lista de penalizaciones usaba un borde izquierdo de color de 2 px como única señal. | WCAG 1.4.1 (no solo color) | Cada penalización ya incluye el texto "−x bits". El borde pasa a 1 px con fondo tintado. |
| 14 | 3 | El panel de controles del laboratorio era `position: sticky` y más alto que la ventana: con resultados largos, la predicción y el botón Ejecutar quedaban fuera de alcance hasta el final de la sección. | WCAG 2.4.11 (foco no tapado); ley de Fitts | Se quitó el sticky. |
| 15 | 2 | Al pasar el ratón por el skip link, la regla global `a:hover` lo dejaba en `#8eeaf3` sobre cian (1,2:1). | WCAG 1.4.3 | `.skip:hover` conserva el texto oscuro (11,35:1). |
| 16 | 1 | El campo de iteraciones manuales tomaba como descripción la etiqueta del grupo, que no añade nada. | WCAG 1.3.1 | Pista propia con el rango 0-20 y su error asociado. |

## Contraste medido (WCAG 2.x, fórmula de luminancia relativa)

Fondos: `--bg #06080c`, `--panel #0c1118`, `--panel-2 #111823`.

| Token | Uso | sobre bg | sobre panel | sobre panel-2 | Requisito |
|-------|-----|----------|-------------|---------------|-----------|
| `--text #dce5ee` | texto | 15,73 | 14,87 | 13,99 | 4,5 ✔ |
| `--muted #95a5b6` | texto secundario | 7,96 | 7,52 | 7,07 | 4,5 ✔ |
| `--cyan #46d9e8` | cuántico, enlaces, foco | 11,79 | 11,14 | 10,48 | 4,5 / foco 3 ✔ |
| `--magenta #ea6bbd` | clásico, racha | 7,00 | 6,62 | 6,22 | 4,5 ✔ |
| `--ok #6ee39a` | correcto | 12,52 | 11,83 | 11,13 | 4,5 ✔ |
| `--err #ff8080` | errores | 8,26 | 7,80 | 7,34 | 4,5 ✔ |
| `--warn #f0a35e` | contraseña débil | 9,64 | 9,11 | 8,57 | 4,5 ✔ |
| `--edge #6b7f94` | bordes de controles, barras | 4,86 | 4,59 | 4,32 | 3 (no textual) ✔ |
| `#8a6f84` | barras Monte Carlo | 4,47 | 4,23 | 3,98 | 3 ✔ |
| `#031216` sobre `--cyan` | botón primario, skip link | 11,21 | | | 4,5 ✔ |

El anillo de foco (2 px `--cyan`, separado 2 px) tiene 11,1:1 o más frente a cualquier fondo de la página.

## Fuera de alcance

- Lazy-render con IntersectionObserver: no se implementó. Las secciones lejanas son texto y dos GET pequeños que ya se piden una sola vez, así que no hay una mejora medible que justifique la complejidad.
- Debounce del analizador: `analyze()` tarda menos de 0,1 ms por pulsación con contraseñas de 63 caracteres (medido en Node: 0,073 ms por llamada). No se añadió.
