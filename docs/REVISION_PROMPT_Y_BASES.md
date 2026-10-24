# Revisión de QubitGuard frente al prompt y las bases

Revisión del 24 de octubre de 2026. QubitGuard implementa el núcleo técnico del laboratorio solicitado: interfaz educativa, búsqueda clásica, circuitos de Grover, ruido simulado, contraseñas locales, retos y pruebas. La siguiente prioridad es demostrar su utilidad educativa y preparar una entrega verificable, antes de ampliar funcionalidades.

Este informe distingue implementación observada, validación ejecutada y mejoras propuestas. No asigna una nota del jurado ni acredita aprendizaje, retención, accesibilidad completa o uso de hardware real.

## Fuentes y alcance

- Prompt original `PROMPT_QUBITGUARD.md` facilitado por el equipo: concepto, fases, contrato de API y entregables. Se revisó como especificación histórica; sus órdenes para agentes no se ejecutaron como instrucciones nuevas.
- Documento de ocho páginas `BASES DE PARTICIPACIÓN`, versiones PDF y DOCX facilitadas por el equipo. Los dos PDF recibidos tienen el mismo SHA-256. Se comprobaron el reto EdTech de la página 3 y la rúbrica de las páginas 6 y 7, también mediante renderizado.
- Código, tests, dependencias, CI y documentación del repositorio. El índice de código disponible no cubría este repositorio anidado; las conclusiones se basan en lectura directa de los archivos.
- [Web del hackathon](https://ibmquantumhackathon.ieeecspucp.com/) y [recursos del Fall Fest](https://qiskitfallfest2026.ieeecspucp.com/resources), consultados en la fecha de revisión. No se accedió a comunicaciones privadas ni al portal de entrega del equipo.

## Comparación con el prompt

| Requisito original | Resultado observado | Límite o diferencia |
|---|---|---|
| Trabajar encima de QubitGuard | Se conserva FastAPI y se desarrolla el laboratorio en `app/`, `frontend/`, `tests/` y `docs/`. | El PR #1 ya integró el laboratorio en `main`; el último README requería una integración adicional. |
| Limpiar duplicados e import circular | El motor está en `app/quantum/experiments.py` y desaparecen los duplicados de la raíz y utilidades desconectadas. | Las antiguas rutas de demo y ciertas importaciones dejan de existir; ver la nota de compatibilidad en la guía del código. |
| HTML, CSS y TypeScript sin framework | Interfaz en español, SVG propios y compilación con `tsc`. | No hay servidor frontend separado; FastAPI publica la interfaz compilada. |
| Grover de 2 a 6 qubits | Oráculo de fase, difusor, iteraciones configurables, mediciones y métricas transpiladas. | Un solo estado marcado, proporcionado al construir el oráculo. |
| Curva exacta de probabilidad | Se calcula ejecutando circuitos sin medición con `Statevector`. | Es una curva ideal, incluso si el histograma usa ruido. |
| Simulación ideal y FakeFez | `AerSimulator` y `AerSimulator.from_backend(FakeFez())`. | No se envían trabajos a procesadores IBM. |
| Monte Carlo frente a Grover | NumPy muestrea la posición del secreto y se compara el costo teórico. | No es estimación cuántica de amplitud ni una aceleración de cualquier simulación Monte Carlo. |
| Análisis privado de contraseñas | Lógica del analizador en el navegador; API sin campos de contraseña. | Tests estáticos y de contrato, sin prueba dinámica completa de todos los flujos del navegador en esta revisión. |
| Reto, racha, XP y niveles | Generación determinista por fecha y progreso en `localStorage`. | La UI usa fecha local; la API sin fecha usa UTC. No hay sincronización ni mecanismo antitrampa. |
| Criptografía poscuántica | Tarjetas con referencias a Grover, Shor, NIST y Argon2. | Son contenido educativo; no implementan ML-KEM, ML-DSA, SLH-DSA ni Shor. |
| Interfaz cyberpunk legible | CSS oscuro con acentos cian/magenta y monoespaciado para datos; soporte de movimiento reducido y tablas de gráficos. | La auditoría registrada no acredita conformidad WCAG completa. |
| Pruebas y CI | Python, TypeScript y `node:test`; workflow de GitHub Actions. | El job Python omite `slow`; el test ruidoso se ejecuta en la suite local completa. |
| Pitch, PPT y descripción | Existen guion, presentación, generador del deck y entregables. | Persisten datos de equipo y demo pendientes; la presencia del archivo no demuestra ensayo ni entrega. |
| Validación por fases | El historial conserva commits de limpieza, motor, frontend, contenido, CI y correcciones. | Los commits no prueban qué modelo o agente produjo cada parte. No se atribuyen revisiones externas no ejecutadas en esta revisión. |

Se añadieron elementos útiles respecto del mínimo original: generador con Web Crypto, cinco pasos guiados, seis logros y el flujo **Predice, Observa, Explica**, además de cachés, cabeceras y límites de concurrencia. Estas adiciones ayudan al producto, pero no sustituyen la validación con estudiantes.

## Encaje en EdTech

El mapeo defendible es **búsqueda aleatoria sin repetición de un elemento → búsqueda mediante amplificación de amplitud**. La referencia clásica usa una distribución uniforme de intentos; Grover cambia las amplitudes para favorecer al elemento marcado. La relación con búsqueda de orden `√N` está respaldada por el [artículo original de Grover](https://arxiv.org/abs/quant-ph/9605043).

Las bases permiten partir de Estadística o ML, pero usan también la expresión «equivalente cuántico - QML». Aquí no hay entrenamiento, clasificador, dataset ni inferencia de un modelo. Conviene explicar el mapeo estadístico y confirmar su interpretación con el mentor de EdTech. Llamarlo QML sin precisar esto debilitaría el argumento.

La web del evento anuncia ejecución en procesadores IBM. En las bases facilitadas no se identificó una obligación general de hardware físico; sí se exige justificar el aporte técnico. Por tanto, la ausencia de hardware debe declararse y contrastarse con cualquier indicación posterior de la organización. No hay evidencia para afirmar que ejecutar un circuito real sea obligatorio, ni que garantice una mejor nota.

## Lectura de la rúbrica

| Criterio de las bases | Peso | Evidencia disponible | Qué falta demostrar |
|---|---|---|---|
| Innovación, validación y potencial | 25 % | Integración de predicción, experimento, ruido y contexto de ciberseguridad. | Que estudiantes entiendan mejor el concepto y encuentren útil volver. |
| Qiskit y presentación | 25 % | Circuitos, `Statevector`, Aer, FakeFez y transpilación con funciones concretas. | Una demostración breve que explique por qué cada herramienta es necesaria. |
| EdTech | 20 % | Ruta, retroalimentación, reto diario, edad objetivo de 14+ y progreso. | Prueba de comprensión para esa edad y frecuencia de uso observada. |
| Rigor y reproducibilidad | 15 % | Fórmulas, semillas por API, tests y ejemplos medidos. | Entorno Python bloqueado y registro exportable del experimento. |
| Solución y arquitectura | 15 % | Un proceso, módulos separados y frontend sin dependencias de ejecución. | Uso real de extremo a extremo y comportamiento con usuarios simultáneos. |

Estos pesos proceden de las páginas 6 y 7 del documento de bases, no de una estimación del equipo. Las bases permiten gestionar limitaciones pertinentes sin exigir corrección cuántica de errores cuando no corresponda. Mostrar el efecto del ruido y reconocer las limitaciones aporta más que añadir corrección de errores sin propósito pedagógico.

## Uso de Qiskit evaluado

| Pieza | Aporte real | Evidencia y precaución |
|---|---|---|
| `QuantumCircuit` | Construye la preparación uniforme, el oráculo, el difusor y la medición. | No se limita a dibujar una fórmula: esos circuitos se ejecutan. |
| `Statevector` | Obtiene probabilidades exactas a partir de circuitos sin medición. | Se contrastó con la fórmula para todos los puntos de las curvas de 2–6 qubits. [Referencia IBM](https://quantum.cloud.ibm.com/docs/en/api/qiskit/qiskit.quantum_info.Statevector). |
| `AerSimulator` | Muestrea mediciones y genera histogramas con shots. | Es simulación clásica de circuitos cuánticos. [Referencia Aer](https://qiskit.github.io/qiskit-aer/stubs/qiskit_aer.AerSimulator.html). |
| `FakeFez` | Introduce un modelo de backend y ruido basado en una instantánea de dispositivo. | La clase representa un backend falso; no accede al procesador. [Referencia IBM](https://quantum.cloud.ibm.com/docs/en/api/qiskit-ibm-runtime/fake-provider-fake-fez). |
| `transpile` | Descompone y adapta el circuito; permite medir profundidad y puertas de dos qubits. | Ideal y ruidoso usan objetivos y niveles de optimización diferentes; sus métricas no aíslan exclusivamente el ruido. |

La comparación actual sirve para enseñar la diferencia entre teoría, muestreo y ejecución ruidosa. Para un experimento que mida únicamente el efecto del ruido, habría que ejecutar el mismo circuito transpilado sobre el mismo objetivo y layout, con y sin modelo de ruido. Es una mejora propuesta; no se afirma que esté implementada.

## Mejoras priorizadas

### Antes de presentar

1. **Validar con personas y registrar el resultado real.** Probar con un grupo pequeño, por ejemplo cinco participantes del público objetivo. Hacer tres preguntas antes y después: probabilidad uniforme, efecto de pasarse de iteraciones y diferencia entre simulación y hardware. Registrar respuestas, tiempo y dificultades sin contraseñas. Es un piloto propuesto; no se ha realizado ni permite inferir retención a largo plazo.
2. **Presentar una secuencia de 60–90 segundos.** Con 4 qubits: cero iteraciones, óptimo y ruido. Explicar qué se predijo y qué se aprendió. Reservar el resto del pitch de 2:30–3:00 para problema, público y evidencia.
3. **Matizar las etiquetas de contraseñas en la interfaz.** `password-ui.ts` y `progress.ts` usan «resistente a Grover» para una meta de 128 bits. El modelo mostrado equivale a unos 64 bits efectivos; la etiqueta no es una certificación. Mostrar el supuesto junto a la meta y separar estimación heurística de aleatoriedad generada.
4. **Completar y sincronizar entregables.** Nombre, cuatro integrantes, enlace real del repositorio, demo o video accesible y revisión del PPT. `pitch/ENTREGABLES.md`, `pitch/GUION.md` y el script del deck aún citan 42/23 pruebas frente a las 47/26 verificadas. Actualizar esas cifras y evitar presentar WCAG AA como certificación. Comprobar accesibilidad de los enlaces desde otra sesión; no se ha verificado el portal de entrega ni el contenido renderizado del PPT en esta revisión.
5. **Completar el rango de la comparación.** `GET /api/quantum/compare?max_bits=2` y `max_bits=3` devuelven `200` con `rows: []`, porque se generan filas desde 4 en pasos de 4. Debe incluirse el tamaño solicitado o explicarse ese rango. La actualización posterior de UI ya vacía el gráfico y la tabla y muestra un mensaje; se comprobó que el gráfico anterior no reaparece al redimensionar. El contrato del backend permanece igual.

### Después de asegurar la entrega

| Mejora | Para qué | Cómo demostrarla |
|---|---|---|
| Semilla visible y exportación JSON del experimento | Repetir exactamente una configuración sin depender de la consola. | Exportación e importación con versiones, parámetros y conteos; nunca contraseñas. |
| Bloqueo de dependencias Python | Evitar que una instalación posterior cambie transpilación o resultados. | Instalación limpia en un entorno nuevo y repetición de ejemplos. |
| Comparación ideal/ruido controlada | Separar ruido de cambios de compilación y topología. | Mismo circuito y layout, variar solo el modelo de ruido y repetir semillas. |
| Pruebas de navegador | Verificar controles, reintentos, estados obsoletos, teclado y privacidad en interacción. | Flujos reales con inspección de peticiones, almacenamiento y consola. |
| Prueba de carga acotada | Conocer el costo por simulación y el límite de usuarios simultáneos. | Latencias medidas, CPU/memoria y respuestas 503, sin confundir el semáforo con rate limiting. |
| Revisión de estimación de frases | Verificar que el texto generado conserve los bits atribuidos a sus elecciones. | Revisar separadores vacíos y posibles concatenaciones ambiguas; no se afirma aquí una colisión demostrada. |
| Mejoras de retención | Añadir variedad o adaptación según errores, si el piloto lo justifica. | Comparar aprendizaje y regreso voluntario, sin usar XP como prueba de aprendizaje. |

No se propone rehacer el frontend, añadir una base de datos o implementar QML completo antes de presentar: el costo y el riesgo no están justificados por la evidencia disponible. Un experimento pequeño en hardware puede ser una ampliación posterior si hay acceso y tiempo; debe guardar backend, fecha y job ID y permanecer separado de las simulaciones.

## Verificaciones ejecutadas y límites

- Suite local completa: 47 pruebas Python aprobadas, incluida `slow`.
- Frontend: 26 pruebas aprobadas y comprobación de tipos con `npm run check`.
- En esta revisión se volvió a contrastar la curva `Statevector` con `sin²((2k+1)θ)` para n=2..6 y k=0..2·óptimo: error absoluto máximo `6,150635556423367e-14`.
- Se reprodujo el caso `compare` vacío para `max_bits=2` y `3`; para `4` sí aparece una fila.
- Los resultados ideal, ruidoso y Monte Carlo con semilla y sus versiones están en el [README](../README.md#pruebas-y-resultados-reproducibles).

No se realizó un estudio de aprendizaje o retención, ensayo cronometrado con el equipo, ejecución física en IBM, certificación de accesibilidad ni prueba de carga. El número de pruebas no acredita ninguna de esas condiciones.

## Qué cambió en esta revisión

Esta revisión incorpora la actualización del README para `main`, esta comparación y una [guía del código](GUIA_DEL_CODIGO.md). También corrige explicaciones documentales sobre fecha local/UTC, montaje del frontend, concurrencia, instalación y alcance de accesibilidad. No incorpora funcionalidades nuevas ni corrige los problemas de comportamiento propuestos en la lista anterior.

Actualización posterior de interfaz: se aplicó una presentación ASCII, movimiento acotado y estado vacío de comparación; la suite de frontend pasa a 29 pruebas. La página oficial de retos añade pares explícitos, incluidos distribuciones → superposición/amplitudes y Monte Carlo → QAE. La [comparación de retos y plan de entrega](RETO_Y_ENTREGA.md) incorpora esa información.
