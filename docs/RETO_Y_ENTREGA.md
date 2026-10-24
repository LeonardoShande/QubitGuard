# Encaje de QubitGuard y preparación de la entrega

Revisión del 24 de octubre de 2026 a partir de la [página oficial de retos](https://ibmquantumhackathon.ieeecspucp.com/retos), las [bases compartidas](https://docs.google.com/document/d/1JeujD9DjXX9LicDgUC1vA-t1rEGOlN73z_1mmKynDcI/edit?tab=t.0) y la imagen de cronograma proporcionada por el equipo. No se seleccionó un reto ni se enviaron materiales mediante el portal.

## Qué cambia con la página oficial

La página muestra pares sugeridos más específicos que el resumen inicial de las bases:

| Concepto clásico | Equivalente sugerido |
|---|---|
| Distribuciones de probabilidad | Superposición y amplitudes |
| SVM | QSVM y kernels cuánticos |
| Monte Carlo | Quantum Amplitude Estimation |
| Redes neuronales | QNN y VQC |
| Descenso de gradiente | Quantum Gradient Descent |

El eje más directo para QubitGuard es **distribuciones de probabilidad → superposición y amplificación de amplitudes**. Con cero iteraciones se observa una distribución uniforme; al aplicar el oráculo y el difusor, Grover concentra probabilidad en el estado marcado. El ruido permite discutir la diferencia entre ideal y observado.

La búsqueda clásica muestreada con NumPy sigue siendo una referencia útil. Sin embargo, no debe presentarse como una implementación de Quantum Amplitude Estimation: el motor actual no contiene QAE. Añadir una lección de QAE sería un alcance nuevo, con diseño científico y pruebas propios; no hace falta fingirlo para explicar el experimento actual.

## Comparación de los tres retos

| Reto | Relación con QubitGuard | Decisión sugerida |
|---|---|---|
| 5.1 Industria, NTT DATA | La categoría necesita la consigna y datos de industria. La carpeta oficial consultada no devolvió archivos visibles en ese momento. | No se dispone de evidencia suficiente para evaluar esa alternativa. No afirmar que el proyecto resuelve su reto confidencial. |
| 5.2 Algoritmos y aplicaciones, QuantumHub | Pide representar rutas/conexiones, restricciones y costos y comparar soluciones de optimización. QubitGuard no modela rutas ni realiza esa optimización. | No cambiar la etiqueta del proyecto para encajarlo aquí; exigiría otro producto. |
| 5.3 EdTech, IEEE CS PUCP | Tiene predicción, interacción visual, circuito ejecutable, explicación y práctica con progreso. | Mantener este enfoque y demostrar el aprendizaje, la claridad y la motivación para volver. |

La página indica que la elección oficial se habilita el **24 de octubre a las 09:00, hora de Perú (UTC−5)**, para el líder y de forma definitiva. Es una operación del equipo; este análisis no la realiza ni verifica que ya se haya elegido.

## Cronograma compartido del primer día

La imagen del horario sitúa estas actividades en el 24 de octubre. Las comunicaciones oficiales posteriores pueden modificarlo.

| Hora Perú | Actividad |
|---|---|
| 10:00–10:30 | Registro y recepción. |
| 10:30–10:40 | Ceremonia de apertura y explicación de desafíos, entregables y evaluación. |
| 10:40–10:50 | Presentación de mentores. |
| 10:50–11:00 | Redireccionamiento a salones. |
| 11:00–12:30 | Desarrollo, bloque 1. |
| 12:30–13:00 | Almuerzo. |
| 13:00–15:00 | Desarrollo, bloque 2. |
| 15:00–16:40 | Entrega de proyectos y deliberación del jurado. |
| 16:40–17:00 | Anuncio de finalistas y foto final. |

El documento de bases añade que al menos dos integrantes deben llegar como máximo a las 10:30, y los cuatro deben estar en la presentación de 15:00–16:40. El segundo día figura el 25 de octubre, 08:30–13:00, en NTT DATA Tower Bloom. El documento enlazado es el de bases; el desglose por bloques de desarrollo procede de la imagen, no de una tabla encontrada en ese Google Doc.

## Plan de trabajo sugerido

Antes del bloque de evaluación, asegurar el circuito ideal y ruidoso, la demo accesible al jurado, un video de respaldo, el PPT revisado y los datos del equipo. Reservar el primer bloque de desarrollo para un piloto breve y corregir obstáculos de comprensión; usar el segundo para integrar cambios ya verificados y ensayar el pitch. Es una propuesta de organización, no un cambio del horario oficial.

Presentación sugerida del producto: «QubitGuard permite predecir cómo cambia una distribución de probabilidades al aplicar amplificación de amplitud. Construimos y ejecutamos circuitos Qiskit, comparamos teoría, mediciones y ruido, y usamos retos breves para practicar».

Para aprovechar otros modelos sin chocar con la interfaz, usar los [encargos GLM](TAREAS_GLM.md): revisión científica y piloto con MAX; guion y verificaciones acotadas con FLASH MAX. No tratar opiniones de agentes como validación con usuarios ni atribuir resultados que no se ejecutaron.
