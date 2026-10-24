# Revisión didáctica de «Protege la bóveda» · v2

Revisión del 24 de octubre de 2026 sobre el estado actual de `vault-model.ts`, `vault-ui.ts`, `practice-rating.ts`, el bloque `#boveda` de `index.html` y `docs/PILOTO_BOVEDA.md`. **No se ha hecho ninguna sesión con estudiantes**: los hallazgos salen de leer el código y de cálculos reproducibles, no de observar a nadie.

## 1. Cambios aplicados en esta entrega

Solo cambian textos de `MISSIONS` en `frontend/src/vault-model.ts`. Ids, campos, n/k, umbrales, opciones, índices correctos, puntuación y rangos no cambian (comprobado comparando el módulo compilado con la versión original y con la anterior).

| Misión | Campo | Cambio | Motivo |
|---|---|---|---|
| `patterns` | `story` | Aclara que la etiqueta de «Meh» a «aura» es una puntuación del juego y no una prueba de seguridad | Es la primera vez que el estudiante ve la etiqueta (objetivo 3) |
| `amplify` | `lesson` | Analogía del rebote respecto a la media: «el objetivo, que quedó por debajo, rebota muy por encima» | Explica *por qué* el difusor amplifica, no solo *que* lo hace. Coincide con los números: con N=16 tras el oráculo, la media es 0,219 y el objetivo pasa de −0,25 a 0,69 |
| `overshoot` | `story` | «aura» significa el tramo alto del juego, no seguridad fuera de él; termina con «¿cuándo conviene parar?» | Refuerza el límite de la etiqueta y anticipa la idea de la misión |

Se mantienen de la entrega anterior: frecuencia frente a probabilidad (misión 1), oráculo sin difusor (misión 2), ruido frente a sobreiteración (misión 3), analogías de moneda, cuadrados con signo y flecha que gira, y opciones de longitud parecida.

## 2. Hallazgos

### Ciencia y puente EdTech

- **El puente distribución → superposición → amplitud está bien cubierto en el texto:** distribución uniforme y muestreo (M1), fase frente a |a|² (M2) e interferencia como rotación (M3). Las tres misiones usan el tablero sintético como experimento; la clave es solo el contexto.
- **La fase no se ve.** El tablero muestra frecuencias; las amplitudes y su signo solo aparecen en el texto. La misión 2 pide razonar sobre algo invisible. Es lo que más limita el objetivo 1, y se resuelve en la UI, no en el texto (propuesta para GLM e integrador).
- **No aparece QAE ni QML** en las misiones, y la página dice explícitamente que Qiskit no recibe la clave. Correcto.
- **Valores verificados** (motor local, seed 42, 512 mediciones, sin ruido): el objetivo sale 11,7 % (teórico 12,5 %), 97,7 % (96,1 %) y 10,7 % (12,5 %). La diferencia entre teórico y medido es visible y sirve para la idea de frecuencia.

### Etiquetas «Meh / Buena / Épica / aura»

- La página ya dice que la etiqueta «no es XP ni una garantía de seguridad» y que «no podemos saber la entropía real de una clave solo por verla». Las misiones ahora lo repiten en el momento de uso.
- **Riesgo concreto, medido:** la frase de cuatro palabras comunes `correcto caballo pila grapa` obtiene 158,8 bits estimados y «Nivel dios: tu clave tiene aura». Su entropía real, si las palabras se eligen al azar de un diccionario de unas 2000 palabras, ronda los 44 bits; si se eligen a mano, es aún menor. La heurística cuenta caracteres, no cómo se eligió la clave. Precisamente por eso la etiqueta no puede leerse como seguridad. El microreto MR6 y la explicación 3 de la sesión 7 trabajan esta idea.
- **Falsos positivos:** de 200 claves aleatorias de 28 caracteres hechas con el generador del juego, 197 obtienen «aura» y 3 obtienen «Meh» por patrones detectados en una cadena aleatoria. Un estudiante puede concluir «la máquina se equivoca» o «lo aleatorio es malo». Conviene que el texto de la pista diga que el detector es simple y puede marcar coincidencias por azar (lo decide el dueño de `practice-rating.ts`; no se ha tocado).
- Con el botón de generar se llega a «aura» de inmediato desde la misión 1, así que la etiqueta no indica progreso de aprendizaje. Esto está bien siempre que no se use como evidencia.

### Interacción que afecta a la evaluación (no se ha tocado la UI)

- **Acertar por eliminación:** tras una respuesta incorrecta, esa opción se desactiva. Con tres opciones, todo el mundo acaba acertando en tres intentos como máximo y recibe los 30 puntos de explicación. Para el juego está bien (no castiga), pero **«misión completada» no es evidencia de comprensión**. La señal útil es el *primer* intento, que hoy no se registra.
- **Una pista para dos errores distintos:** `hint` es única por misión. Las pistas actuales están escritas para servir a ambos distractores, pero una pista por distractor diagnosticaría mejor (cambio de contrato; ver sección 4).
- **Orden fijo de opciones:** al repetir una misión para pasar de 75 a 100, la posición se puede recordar sin entender. Desordenar en la UI lo evitaría sin cambiar `correctAnswer`.
- **Longitud de las historias:** las historias de M1 y M3 tienen ahora tres frases, unos 290 caracteres. En 320 px puede ser mucho texto antes de actuar; conviene que GLM lo compruebe en su QA.

### Razones para volver

- Hoy los motivos para volver son el XP, el rango y la racha del reto diario. Tras las tres misiones, la bóveda no ofrece nada nuevo.
- La propuesta (`docs/MICRORETOS_BOVEDA_V2.md`) añade:
  - una pregunta abierta «para la próxima vez» al cerrar cada sesión;
  - repaso amable de lo fallado a partir del día siguiente, sin caducidad;
  - una lista de conceptos «dominados» separada del XP.
- Nada de esto depende de la racha, ni resta XP al fallar.

## 3. Límites

- Revisión de contenido sin estudiantes: no se sabe si las analogías funcionan a los 14 años.
- El XP, los rangos, las marcas y la etiqueta de la clave **no son evidencia de aprendizaje**: se pueden obtener por eliminación, generando claves o repitiendo.
- Las misiones enseñan Grover ideal con N=8 y N=16. No cubren la estimación de amplitudes (QAE), el aprendizaje automático cuántico ni hardware real (salvo la comparación con FakeFez del laboratorio).
- El analizador de contraseñas es heurístico. Ni las misiones ni los microretos lo convierten en una medida de entropía ni de seguridad.
- `frontend/dist` no se ha recompilado: lo que se ve en el navegador aún tiene textos anteriores hasta que el integrador compile.

## 4. Propuestas para el integrador y para GLM (no aplicadas)

1. **Registrar el primer intento** de la explicación de cada misión (hook en `answer()`). Es la base del repaso y de cualquier medición. Contrato en `MICRORETOS_BOVEDA_V2.md`, sección 4.
2. **Mostrar las amplitudes con signo** en la misión 2 (antes y después del oráculo, después del difusor). Le corresponde a GLM; es la mejora con más impacto en comprensión.
3. **Desordenar las opciones** en cada intento (solo UI).
4. **Cambio de contrato, para acordar:** `hints: readonly [string, string, string]`, con una pista por opción (vacía en la correcta), en lugar de `hint`. Las pistas por distractor ya están redactadas en los microretos y se pueden escribir también para las tres misiones. **No se ha tocado `hint`.**
5. **Microretos:** si se aceptan, pueden ir en un array aparte (`MICRO_CHALLENGES`) para no alterar `MISSIONS`, `normalizeVault` ni el desbloqueo.

## 5. Revisión del piloto existente (`docs/PILOTO_BOVEDA.md`)

Sigue siendo válido: cinco participantes, consentimiento de familia y asentimiento del estudiante, sin datos sensibles, tres preguntas antes/después, tareas observables y criterios de decisión fijados de antemano. **No se ha realizado** y no tiene resultados. Ajustes propuestos para la v2:

### Medir comprensión (no XP)

- Añadir a la plantilla, por misión, **«correcta al primer intento: sí/no»**. Lo anota el facilitador mientras no exista el hook.
- **Prueba diferida:** repetir P1–P3 (con otros números) en la sesión de regreso, entre 2 y 7 días después. Es la única medida de retención, y con cinco personas es solo orientativa.
- Añadir **una explicación abierta**: la pregunta 3 de la sesión 7 (qué dice y qué no dice «aura»), valorada como correcta / parcial / a revisar.
- Usar MR5 (transferencia a 64 candidatos) y MR6 (escoger experimento) como tareas observables T7 y T8, con la rúbrica del banco.
- **No registrar XP, rango ni etiqueta como resultado.** Si aparecen en las notas, se marcan como «contexto, no evidencia».

### Medir el regreso voluntario

- Al terminar, ofrecer una **segunda sesión opcional** dentro de 2–7 días, en un hueco libre de clase o en casa (con permiso familiar), sin recordatorios, puntos extra ni consecuencias por no venir.
- Registrar solo: *volvió / no volvió / no tuvo ocasión* y, si volvió, *qué eligió hacer primero* (repaso, microreto nuevo o laboratorio).
- Pregunta de salida: «¿Volverías a jugar? ¿Por qué sí o por qué no?». Se parafrasea, sin cita literal identificable.
- **Advertencia de interpretación:** en contexto escolar el regreso puede deberse a la presión del grupo o del docente. Con cinco participantes no se puede separar la motivación propia de otros factores; se reporta como observación, no como tasa.

### Plantilla: columnas añadidas (vacías)

| Código | M1 1.er intento | M2 1.er intento | M3 1.er intento | T7 (MR5) | T8 (MR6) | Explicación «aura» | Regreso (sí/no/sin ocasión) | Qué eligió al volver | P1–P3 diferido |
|---|---|---|---|---|---|---|---|---|---|
| P1 | | | | | | | | | |
| P2 | | | | | | | | | |
| P3 | | | | | | | | | |
| P4 | | | | | | | | | |
| P5 | | | | | | | | | |

### Criterios añadidos (fijados antes del piloto)

- Si 3 o más de 5 fallan al primer intento la misma pregunta de misión, se reescribe esa pregunta. Que acaben acertando con pistas no cuenta como éxito.
- Si 3 o más de 5 dicen que «aura» significa que la clave es segura, se cambia el texto de la etiqueta o de la guía (en coordinación con el dueño de `practice-rating.ts`).
- Si nadie elige C en MR6, se añade a la misión 3 una actividad explícita de control de variables.

## 6. Qué se verificó y qué queda por probar

**Verificado en esta entrega:**
- `tsc --noEmit` sin errores con los textos nuevos.
- Comparación del módulo compilado (original → v1 → v2): mismos ids, campos, n/k, umbrales, 3 opciones por pregunta, índices correctos, `RANKS` y `missionScore`.
- Las pistas actuales sirven para los dos distractores de cada misión (revisado contra el flujo de `answer()`, que desactiva cada opción fallada).
- Valores teóricos citados en los microretos, calculados con sin²((2k+1)θ): N=16, k=1 → 47,3 %; N=64, k=3 → 59,1 %, k=6 → 99,7 %; N=4, k=1 → 100 %.
- Frecuencias reales de las tres misiones con la API local (seed 42) y la prueba Python `tests/test_vault_experiments.py`, en la entrega anterior.
- Etiquetas del juego para 200 claves del generador y para tres ejemplos, compilando `password.ts`, `generator.ts` y `practice-rating.ts` en una carpeta temporal (no en `dist`).

**Queda por probar:**
- Compilación final de `dist`, pruebas de frontend y recorrido en navegador con los textos nuevos (lo hace el integrador, después de GLM).
- Lectura en 320 px de las historias más largas (QA de GLM).
- Que los microretos funcionen con estudiantes reales: no se han implementado ni pilotado.
- El contrato `review` y el hook del primer intento: propuestos, sin implementar.
- El piloto completo: comprensión, transferencia, explicación de «aura» y regreso voluntario.
