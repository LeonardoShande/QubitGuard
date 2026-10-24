# Piloto «Protege la bóveda»

Preparado el 24 de octubre de 2026. **El piloto no se ha realizado todavía.** Este documento no contiene resultados; la plantilla del final está vacía a propósito.

## 1. Qué queremos saber

1. ¿Distinguen los estudiantes desde 14 años la **probabilidad** (lo que predice el modelo) de la **frecuencia** (lo que muestra el tablero tras 512 mediciones)?
2. ¿Entienden que el oráculo cambia la **fase** (el signo) de una amplitud sin cambiar |a|², y que la amplificación necesita el difusor?
3. ¿Pueden transferir la idea de que el número de iteraciones útil depende del número de candidatos (más no siempre es mejor)?
4. ¿Es el flujo preparar → predecir → observar → explicar comprensible sin ayuda del facilitador?

Con cinco participantes esto es una **prueba de usabilidad y comprensión cualitativa**: sirve para encontrar textos confusos, no para demostrar aprendizaje ni retención.

## 2. Encaje con el reto «distribuciones de probabilidad → superposición y amplitudes»

| Misión | Concepto que trabaja | Qué ve el estudiante | Encaje |
|---|---|---|---|
| 1 · patterns (n=3, k=0) | Distribución uniforme; amplitud 1/√8 → probabilidad 1/8; frecuencia ≠ probabilidad | Tablero de 8 casillas con frecuencias cercanas a 12,5 % | Bueno. Es el puente directo de «distribución» a «superposición». |
| 2 · amplify (n=4, k=3) | Fase vs. probabilidad; oráculo + difusor redistribuyen amplitudes | El objetivo se lleva casi todas las mediciones | Bueno en el texto; **la fase no se ve en la UI** (solo hay frecuencias). |
| 3 · overshoot (n=4, k=5) | Interferencia como rotación; óptimo ≈ (π/4)·√N | El objetivo vuelve a una frecuencia baja | Bueno; contradice la intuición «más es mejor». |

Huecos detectados (no se resuelven con texto):

- El tablero solo muestra frecuencias. Las amplitudes y su signo se mencionan, pero no se ven. La misión 2 pide razonar sobre algo invisible.
- La campaña enseña Grover (amplificación de amplitudes). **No es QAE** (estimación de amplitudes) ni un modelo QML entrenado, y no debe presentarse así.
- La narrativa de contraseñas es solo un marco. Qiskit no recibe ni evalúa la clave de práctica, y los umbrales de longitud y bits son reglas del juego, no una certificación.

Valores de referencia para el facilitador (motor local, seed 42, 512 mediciones, sin ruido; verificación técnica del 24/10/2026, **no datos del piloto**): misión 1, el objetivo sale el 11,7 % de las veces y las casillas van del 10,9 % al 15,8 %; misión 2, 97,7 % (teórico 96,1 %); misión 3, 10,7 % (teórico 12,5 %).

## 3. Cambios de contenido y por qué

Solo se editaron los textos de `MISSIONS` en `frontend/src/vault-model.ts` (`story`, `prediction`, `predictions`, `question`, `answers`, `hint`, `lesson`). Ids, claves, n/k, umbrales, número de opciones, índices correctos, puntuación y rangos no cambian (comprobado comparando el módulo compilado antes y después).

- **Misión 1:** la pregunta final ahora comprueba frecuencia vs. probabilidad, que la versión anterior no evaluaba. Los distractores recogen errores reales: «50 % porque cada qubit da 0 o 1», «el objetivo ya está elegido» y «los porcentajes son error del simulador» (la simulación es ideal). La pista usa la analogía de la moneda sin decir la respuesta.
- **Misión 2:** la pregunta aísla el oráculo («¿qué verías si midieras sin difusor?»). Los distractores recogen dos errores típicos: «el oráculo ya lo marcó, así que sale siempre» y «una amplitud negativa da probabilidad cero o negativa». La pista pide calcular (0,25)² y (−0,25)², en lugar de dar la regla.
- **Misión 3:** se sustituyó el distractor «una buena contraseña hace que Grover deje de funcionar», que mezclaba criptografía con el experimento, por «el ruido borra el efecto», que pone a prueba si entienden que la bajada ocurre sin ruido. La lección añade la regla (π/4)·√N.
- **General:** se dice «sintético» y «tu clave no entra en el circuito» en las historias. Se distingue «probabilidad teórica» de «frecuencia medida». Las tres opciones de cada pregunta tienen longitud y tono parecidos: la correcta nunca es claramente la más larga, y ninguna es una broma.

## 4. Participantes y consentimiento

- **Cinco participantes** de 14 años o más, con mezcla de cursos si es posible. No hace falta saber física cuántica; sí haber visto porcentajes.
- **Menores de edad:** consentimiento informado firmado por madre, padre o tutor legal **y** asentimiento del propio estudiante, ambos antes de la sesión. Reclutamiento a través del centro educativo y con permiso de su dirección. Para participantes de 18 años o más, solo su consentimiento. Si el centro o la normativa local (por ejemplo, la ley de protección de datos del país) exigen más pasos, se aplican esos.
- La hoja informativa, en lenguaje sencillo, explica: qué se hace (probar un minijuego unos 35 minutos), que se evalúa el juego y no a la persona, que no cuenta para notas, que pueden parar en cualquier momento sin explicar por qué, qué se anota y cuánto tiempo se guarda.
- **Datos que NO se recogen:** nombre en las hojas de trabajo, fecha de nacimiento, centro concreto, correo, fotos, audio o vídeo, capturas con datos de la persona ni contraseñas. **Se pide expresamente no escribir ninguna contraseña real**: se usa el botón de generar o una frase inventada. El progreso del navegador se borra al terminar cada sesión.
- Cada participante recibe un código (P1–P5). La única relación código-persona son los consentimientos en papel, que guarda el centro aparte. Las notas se destruyen al cerrar el informe (plazo propuesto: 3 meses).
- Siempre hay un adulto del centro presente. El facilitador no da pistas de contenido: si alguien se bloquea más de 3 minutos, lo apunta y le ayuda con el manejo de la interfaz, no con la respuesta.

## 5. Protocolo de sesión (≈ 35 min, individual)

1. Bienvenida, recordatorio del asentimiento y aviso de que no hay que usar contraseñas reales (2 min).
2. **Prueba previa**: las tres preguntas de la sección 6, en papel y sin ayuda (5 min).
3. Las tres misiones en orden, pensando en voz alta. El facilitador solo observa y anota (20 min).
4. **Prueba posterior**: las mismas tres preguntas (5 min).
5. Dos preguntas abiertas: «¿Qué frase del juego te confundió?» y «Explica con tus palabras qué hace el oráculo» (3 min).

Se usan las mismas preguntas antes y después para poder comparar. Con esto se acepta el riesgo de que mejoren por repetir el ítem, y así se indica en el informe.

## 6. Preguntas antes / después

Cada una tiene opción múltiple y un «¿por qué?» breve. Usan números distintos de los del juego para comprobar transferencia y no memoria.

**P1 · Probabilidad vs. frecuencia.** Un circuito tiene 4 resultados igual de probables (25 % cada uno). Se mide 100 veces: A 22, B 27, C 25, D 26. ¿Qué es correcto?
- a) El circuito favorece a B, porque salió más veces.
- b) Las probabilidades siguen siendo 25 %; los conteos varían porque 100 mediciones son una muestra. ✔
- c) Si las probabilidades fueran 25 %, habría salido exactamente 25 de cada uno.

**P2 · Fase vs. probabilidad.** La amplitud de un resultado pasa de +0,5 a −0,5 y nada más cambia. Al medir, su probabilidad…
- a) pasa a ser negativa, así que nunca saldrá.
- b) sigue siendo 0,25, porque (−0,5)² = (+0,5)². ✔
- c) se duplica, porque el resultado ha quedado marcado.

**P3 · Iteraciones y tamaño del problema.** En una búsqueda tipo Grover, con 16 candidatos el éxito es máximo tras 3 iteraciones. ¿Qué esperas con 6 iteraciones?
- a) Un éxito mayor, porque se amplifica el doble.
- b) Un éxito parecido, porque ya llegó al máximo.
- c) Un éxito menor, porque se pasa del punto óptimo. ✔

Puntuación: 1 punto por opción correcta. El «¿por qué?» se codifica como *correcto / parcial / error conceptual / en blanco*.

## 7. Tareas observables

| Id | Tarea | Qué se observa (sí/no y nota breve) |
|---|---|---|
| T1 | Completar la preparación de la misión 1 | ¿Usa el generador o una frase inventada (nunca una clave real)? ¿Entiende los avisos de patrones? |
| T2 | Elegir la predicción antes de ejecutar | ¿Lee las tres opciones? ¿Verbaliza un motivo? ¿Elige por longitud o tono? |
| T3 | Comparar el teórico y el medido en la misión 1 | ¿Señala por su cuenta que las casillas no son exactamente 12,5 %? |
| T4 | Responder la pregunta de la misión 2 | ¿Necesita la pista? Tras la pista, ¿calcula los cuadrados? |
| T5 | Explicar la bajada de la misión 3 | ¿La atribuye al ruido, al azar o a «pasarse»? |
| T6 | Transferencia oral: «¿Y con 64 candidatos?» | ¿Dice que harían falta más iteraciones (≈ 6)? No se exige el número exacto. |

También se registran el tiempo por misión, el número de pistas mostradas y el número de intentos por pregunta, y se parafrasean (no se transcriben) los comentarios sobre textos confusos.

## 8. Criterios de decisión (fijados antes del piloto)

- Si 3 o más de 5 fallan una pregunta del juego al primer intento, se reescribe esa pregunta o su historia.
- Si 3 o más de 5 siguen fallando P2 en la prueba posterior, la misión 2 necesita una representación visual de la amplitud y su signo (propuesta de UI, ver sección 10).
- Si en T2 alguien dice explícitamente que eligió «la más larga» o «la que suena seria», se revisan las longitudes de esa pregunta.
- Si alguien escribe o intenta escribir una contraseña real, se refuerza el aviso de la UI antes de seguir con el piloto.

## 9. Plantilla de resultados (vacía)

Sin nombres, edades exactas, centros ni citas literales identificables. Edad solo en tramos.

### Por participante

| Código | Tramo de edad (14–15 / 16–17 / 18+) | P1 pre | P2 pre | P3 pre | P1 post | P2 post | P3 post | Pistas M1/M2/M3 | Predicción correcta M1/M2/M3 | Minutos M1/M2/M3 |
|---|---|---|---|---|---|---|---|---|---|---|
| P1 | | | | | | | | | | |
| P2 | | | | | | | | | | |
| P3 | | | | | | | | | | |
| P4 | | | | | | | | | | |
| P5 | | | | | | | | | | |

### Observación de tareas

| Código | T1 | T2 | T3 | T4 | T5 | T6 | Texto confuso señalado (paráfrasis) |
|---|---|---|---|---|---|---|---|
| P1 | | | | | | | |
| P2 | | | | | | | |
| P3 | | | | | | | |
| P4 | | | | | | | |
| P5 | | | | | | | |

### Resumen

| Indicador | Valor |
|---|---|
| Aciertos totales pre (de 15) | |
| Aciertos totales post (de 15) | |
| Participantes que distinguen frecuencia y probabilidad en T3 (de 5) | |
| Errores conceptuales más frecuentes | |
| Incidencias (técnicas, de consentimiento o de privacidad) | |
| Cambios propuestos tras el piloto | |

## 10. Propuestas para el integrador (no aplicadas)

Ninguna requiere cambiar el contrato actual. Si se aceptan, las implementa quien corresponda:

- **UI (GLM):** mostrar en la misión 2 una barra de amplitud con signo antes y después del oráculo. Es lo que más ayudaría a separar fase y probabilidad.
- **UI (GLM):** desordenar las opciones en cada intento para que la posición no se aprenda al repetir. Hoy solo es posible en la UI, porque `correctAnswer` es un índice fijo.
- **Contrato (requiere acuerdo):** una pista por distractor (`hints: string[]`) en lugar de una sola `hint`. Así la pista respondería al error concreto. **No se ha tocado.**

## 11. Riesgos

- **Muestra pequeña y no aleatoria:** cinco personas no permiten generalizar ni medir retención.
- **Efecto test-retest:** mismas preguntas antes y después; parte de la mejora puede deberse a la repetición.
- **Facilitador:** pensar en voz alta y la presencia de un adulto cambian el comportamiento.
- **Contraseñas reales:** aunque la clave no sale del navegador, un menor podría escribir la suya. Por eso se insiste en el aviso y se observa en T1.
- **Sobreinterpretación:** que alguien recite «(π/4)·√N» no prueba que entienda la interferencia. T5 y T6 buscan explicaciones, no fórmulas.
- **Fase invisible:** si la misión 2 falla, el problema probablemente sea de representación y no de redacción.
- **Textos sin compilar:** `frontend/dist` sigue con los textos anteriores hasta que el integrador compile. No se debe pilotar con el `dist` antiguo.
