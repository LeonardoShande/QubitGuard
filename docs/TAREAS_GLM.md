# Tareas para delegar a GLM

Estos encargos están preparados para que el usuario los ejecute en GLM 5.3 MAX o GLM 5.3-FLASH MAX. No se ejecutaron esos modelos en esta revisión. La asignación propone distribuir trabajo por complejidad; no presupone capacidades verificadas o disponibilidad concreta de cada modelo.

Antes de empezar, indicar la ruta del checkout y el commit base. No permitir que varias tareas escriban sobre los mismos archivos. El responsable de integración revisa el diff y decide qué incorporar; ningún agente publica, hace push o fusiona por su cuenta.

## GLM 5.3 MAX para razonamiento y diseño científico

### Encargo 1 Revisar el encaje EdTech y la física

```text
Trabaja en modo solo lectura en QubitGuard. No estás solo en el código: otros agentes pueden estar editando la interfaz; no reviertas ni modifiques sus cambios.

Lee app/quantum/experiments.py, app/api/quantum.py, docs/GUIA_DEL_CODIGO.md y docs/REVISION_PROMPT_Y_BASES.md. Contrasta con las referencias primarias de Qiskit y Grover citadas en esos documentos.

El reto oficial sugiere distribuciones de probabilidad → superposición y amplitudes, y Monte Carlo → Quantum Amplitude Estimation. Determina qué implementa exactamente el proyecto. Revisa oráculo, difusor, bit ordering, selección de k, significado de speedup y comparación ideal/ruido con distinto objetivo y optimización.

Entrega un informe con ubicación, problema, evidencia y corrección mínima. Separa errores demostrados, límites aceptables y mejoras opcionales. No llames QML al proyecto sin explicar qué modelo se entrena, y no confundas Grover con QAE. No inventes pruebas ni hardware ejecutado. No hagas cambios, commits, push o PR.
```

### Encargo 2 Diseñar una ampliación opcional de QAE

```text
Planifica, sin implementar, una lección opcional de Quantum Amplitude Estimation para QubitGuard. No estás solo en el código; no edites archivos existentes.

Objetivo: estimar una probabilidad pequeña conocida, comparar estimación clásica con QAE y mostrar error frente a número de consultas, sin contraseñas ni acceso obligatorio a hardware. Verifica en fuentes oficiales qué API y paquetes serían necesarios para las versiones instaladas; no presupongas que qiskit_algorithms está instalado.

Propón la variante mínima adecuada, preparación A, estado bueno, operador de Grover, referencia exacta, métrica justa de consultas, límites de qubits, contrato de endpoint y pruebas de aceptación. Explica coste de dependencias y riesgo de implementarlo antes del evento. No afirmes ventaja de tiempo real a partir de simulación.

Entrega un diseño y criterios para decidir si conviene hacerlo después de asegurar la entrega actual. No escribas código ni hagas commits, push o PR.
```

### Encargo 3 Preparar un piloto de aprendizaje

```text
Prepara un protocolo de validación para QubitGuard, para una sesión de 5–8 minutos con cinco participantes como piloto exploratorio. No estás solo en el proyecto; tu único archivo de salida será docs/PILOTO_EDTECH_PROPUESTA.md.

Lee la guía y el reto EdTech. Define tres preguntas antes y después, tareas de predicción y explicación, criterio de comprensión, registro de dificultades y pregunta sobre regreso voluntario. Diseña una tabla vacía; no inventes participantes, respuestas, notas ni porcentajes. No recopiles contraseñas ni datos personales innecesarios. Distingue intención de volver de retención observada.

Incluye una explicación para el jurado y los límites del tamaño del piloto. No cambies interfaz, API ni otros documentos. No hagas commits, push o PR.
```

## GLM 5.3-FLASH MAX para tareas acotadas y comprobaciones

### Encargo 4 Sincronizar guion y entregables

```text
Tu responsabilidad se limita a pitch/GUION.md y pitch/ENTREGABLES.md. No estás solo en el código: no reviertas cambios ajenos ni edites frontend, backend, README o el PPT.

Contrasta las cifras con la salida real de las pruebas proporcionada por el integrador. No ejecutes instalaciones ni inventes resultados. Actualiza recuentos obsoletos, explica el mapeo distribuciones → amplitudes y elimina afirmaciones de certificación WCAG o hardware no demostrado. Mantén los datos desconocidos del equipo como pendientes.

El pitch debe durar 2:30–3:00. Propón una demostración de 60–90 segundos con 4 qubits, cero iteraciones, óptimo y ruido. Incluye respuestas a por qué Qiskit, qué significa el oráculo conocido y por qué el reto invita a volver. Entrega diff y asuntos que requieren confirmación; no hagas commits, push o PR.
```

### Encargo 5 Revisar interfaz y accesibilidad sin editar

```text
Realiza una revisión de QubitGuard en modo solo lectura. No estás solo en el proyecto; no cambies archivos ni estados de usuarios reales.

Con la demo local, comprueba 320, 375, 768 y 1440 px, navegación con teclado, texto al 200 %, movimiento reducido, errores de formulario, estados de carga y tabla vacía. Revisa el comparador, la alineación de la ruta, gráficas, contraseñas y fuente de datos. Usa únicamente contraseñas de prueba inventadas.

Por cada hallazgo entrega selector, ancho/estado, pasos de reproducción, captura si tienes herramientas y efecto para el usuario. No afirmes que probaste una interacción que no pudiste ejecutar. Distingue contraste de texto de arte ASCII decorativo aria-hidden. No sugieras nuevas librerías sin necesidad concreta. No hagas cambios, commits, push o PR.
```

### Encargo 6 Comprobar documentación y enlaces

```text
Revisa README.md y docs/*.md en modo solo lectura. No estás solo en el código; no modifiques archivos.

Comprueba enlaces relativos, anclas, nombres de comandos, requisitos y coherencia con package.json, requirements.txt y CI. Señala recuentos obsoletos, afirmaciones absolutas de privacidad/seguridad, confusiones UTC/local y referencias a ramas antiguas. No uses memoria para declarar el estado de GitHub; verifica las referencias actuales cuando tengas acceso.

Entrega una lista corta de diferencias demostradas con ruta y línea. No ejecutes scripts de despliegue ni cambies cuentas, archivos, commits, push o PR.
```

## Orden recomendado para integrar

Primero revisar física y encaje (MAX) en paralelo con el guion (FLASH, dos Markdown propios). La revisión visual debe esperar a una compilación estable; no pedirle cambios de CSS mientras otro agente trabaja allí. El diseño de QAE es investigación posterior y no bloquea la demo actual. Integrar un diff por vez y volver a ejecutar únicamente las comprobaciones afectadas.
