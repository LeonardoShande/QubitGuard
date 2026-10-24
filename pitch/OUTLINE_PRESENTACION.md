# Estructura de la presentación detallada de QubitGuard

Especificación compartida para el PPT (`pitch/QubitGuard_presentacion.pptx`) y el guion de exposición (`pitch/GUION_EXPOSICION.docx`). Cuatro expositores: **A** (contexto y cierre), **B** (Qiskit y física), **C** (la aplicación), **D** (hardware, seguridad y validación). Versión completa: unos 12 minutos. Las slides marcadas con ★ forman la versión corta del pitch (2:30 a 3:00).

| # | Título | Expositor | Idea clave (una frase) | Palabras clave | Visual principal |
|---|---|---|---|---|---|
| 1 ★ | QubitGuard | A | Un laboratorio para aprender probabilidad cuántica prediciendo y ejecutando circuitos Qiskit. | EdTech, Qiskit, Grover | Logo ASCII IBM, captura `01_intro` o `02_inicio` |
| 2 ★ | El reto y el problema | A | La probabilidad cuántica no se intuye y la amenaza cuántica se explica con alarmismo. | Reto 5.3, intuición, criptografía | Captura `03_problema` |
| 3 | Lo mínimo de computación cuántica | A | Un qubit está en superposición; al medir, sale 0 o 1 con probabilidad = amplitud². | qubit, superposición, amplitud, medición | Diagrama propio (esfera simplificada o barras de amplitud) |
| 4 ★ | ¿Qué es Qiskit? | B | El kit de IBM, de código abierto, para construir, optimizar y ejecutar circuitos. | SDK, circuito, transpilar, Aer, Runtime | Diagrama de flujo: construir → transpilar → ejecutar → medir |
| 5 ★ | De Monte Carlo a Grover | B | Adivinar al azar cuesta (N+1)/2 intentos; Grover necesita ~π/4·√N iteraciones. | Monte Carlo, ventaja cuadrática | Gráfico propio clásico vs Grover (escala log) o captura `06_azar` |
| 6 | Grover paso a paso | B | Superposición, oráculo que marca, difusor que amplifica; se repite k veces. | H, oráculo, difusor, iteración | Captura `05_circuito` + esquema de 3 bloques |
| 7 | La curva sin² | B | La probabilidad sube hasta el óptimo y vuelve a bajar: más iteraciones no siempre es mejor. | sin²((2k+1)θ), k óptimo, Statevector | Captura `04_laboratorio_resultado` (curva) |
| 8 | Recorrido por la app | C | Nueve secciones en la barra, del problema a las limitaciones. | ruta, laboratorio, explorador, reto | Captura `02_inicio` con anotaciones |
| 9 ★ | Predice → Observa → Explica | C | Antes de ejecutar te comprometes con una predicción; luego comparas con teoría y medida. | POE, metacognición, XP | Capturas `04_laboratorio_prediccion` y `04_laboratorio_resultado` |
| 10 | Explorador de amplitudes en vivo | C | Mueves k y ves girar el estado y crecer la amplitud del marcado. | amplitudes, media, rotación 2θ | Captura `07_explorador` |
| 11 ★ | El ruido borra la amplificación | C | Con el modelo de ruido FakeFez, el éxito cae del 80 % (n=3) al azar (n=6). | NISQ, FakeFez, profundidad | Gráfico propio con la tabla n=3..6 y captura `08_ruido` |
| 12 | Hacia una computadora cuántica real de IBM | D | El mismo circuito se transpila para el chip y se envía con SamplerV2. | QiskitRuntimeService, SamplerV2, job, cola | Diagrama: laptop → IBM Quantum Platform → QPU → resultados |
| 13 | Contraseñas y criptografía poscuántica | D | Grover reduce a la mitad los bits efectivos; Shor rompe RSA; NIST ya publicó reemplazos. | entropía, CSPRNG, ML-KEM, ML-DSA | Captura `09_generador` + `10_pqc` |
| 14 | Arquitectura y seguridad | D | Un solo proceso FastAPI sirve la API y la web; nada de contraseñas sale del navegador. | FastAPI, TypeScript, CSP, privacidad | Diagrama de arquitectura propio |
| 15 ★ | Validación y limitaciones | D | 72 pruebas Python y 37 de frontend; no corrimos hardware real ni el piloto con alumnos. | reproducible, honestidad, límites | Tabla de cifras medidas + lista de límites |
| 16 ★ | Impacto EdTech y cierre | A | Desde 14 años, 3 minutos al día, con racha y retos: aprender jugando y midiendo. | adictivo, diario, próximos pasos | Captura `11_reto_diario` + llamada a la acción |

Cifras que se pueden citar (medidas en este repositorio, no en hardware real):

- Grover ideal, n=4, estado `1010`, k=3, 2048 shots, seed 7: éxito 0,953 frente a 0,961 teórico.
- Curva `Statevector` frente a `sin²((2k+1)θ)` para n=2..6: error máximo 6,15·10⁻¹⁴ (test `test_grover_curve_matches_formula_at_every_k`).
- FakeFez con el CLI (seed 7, 1024 shots), éxito medido frente al azar 1/N: n=3 → 0,802 (0,125), profundidad 137, 39 puertas de 2 qubits; n=4 → 0,662 (0,0625), 448, 111; n=5 → 0,184 (0,031), 1456, 517; n=6 → 0,0166 (0,0156), 4447, 1706.
- Monte Carlo, 10 bits, 5000 ensayos, seed 1: media 513,3 frente a 512,5 esperado.
- Pruebas: 72 de pytest y 37 de frontend, todas pasan.
- Generador: lista de 2072 palabras, 11,02 bits por palabra; meta ≥128 bits (≈64 efectivos frente a Grover idealizado).

Capturas: `pitch/capturas/*.png` (1440 px de ancho, generadas desde la app real).
