# Microretos de la bóveda · v2 (propuesta)

Preparado el 24 de octubre de 2026 para estudiantes desde 14 años. **Es una propuesta de contenido. No está implementada** y no se ha añadido nada al array `MISSIONS`. Para incorporarla hace falta que el integrador acepte el contrato de datos de la sección 4.

Las contraseñas son el contexto. El experimento es siempre un tablero sintético de Grover (amplificación de amplitudes). No es QAE ni un modelo QML entrenado.

## 1. Principios

- **Cada distractor diagnostica un error concreto.** Si el estudiante lo elige, recibe la pista de *ese* error, no una genérica.
- **Analogías de una frase** (monedas, cartas, encuestas, una pizza), seguidas siempre de un número que se pueda comprobar. Sin fórmulas que memorizar.
- **Tres opciones de longitud y tono parecidos.** La posición correcta cambia de un reto a otro.
- **Todo experimento propuesto se puede ejecutar** con la API actual (`n_qubits` 2–6, `iterations` 0–20, `shots` 1–8192, `noisy` ideal o FakeFez).
- Los valores teóricos citados se calcularon con sin²((2k+1)·θ), donde θ = asin(1/√N).

## 2. Banco de seis microretos

### MR1 · `mr-uniforme` — Dos qubits, cuatro resultados
- **Objetivo:** distinguir la probabilidad de un qubit de la probabilidad de un estado completo en una superposición uniforme.
- **Duración:** 2 min.
- **Enunciado:** Un circuito de 2 qubits en superposición uniforme, sin iteraciones de Grover, se mide una vez. ¿Qué probabilidad tiene el resultado `10`?
- **Opciones:**
  - **A ✔** 25 %: hay 4 resultados igual de probables.
  - **B** 50 %: el primer qubit da 1 la mitad de las veces.
  - **C** Casi 100 % si `10` es el objetivo elegido.
- **Respuesta razonada:** 2 qubits dan 4 estados (00, 01, 10, 11). Con amplitud 1/2 cada uno, |a|² = 1/4 = 25 %. Como dos monedas: «cara-cruz» es una de cuatro combinaciones.
- **Pistas específicas:**
  - B → «50 % es la probabilidad de que el *primer* qubit sea 1. ¿Y de que además el segundo sea 0?»
  - C → «Sin iteraciones, ¿hay algún paso del circuito que distinga al objetivo de los demás?»
- **Error que diagnostica:** B confunde la probabilidad de un qubit con la del estado conjunto. C cree que el objetivo está favorecido desde el inicio.

### MR2 · `mr-muestra` — ¿Quién se acerca más al 25 %?
- **Objetivo:** entender que la frecuencia se acerca a la probabilidad al aumentar las mediciones, pero no son lo mismo.
- **Duración:** 2–3 min (5 si se ejecuta el experimento).
- **Enunciado:** Ana mide 40 veces un circuito uniforme de 4 resultados. Leo mide el mismo circuito 4000 veces. ¿Quién verá frecuencias más cercanas al 25 %?
- **Opciones:**
  - **A** Ana: con menos mediciones hay menos error.
  - **B ✔** Leo: con más mediciones, la frecuencia se acerca a la probabilidad.
  - **C** Los dos igual: la probabilidad es la misma en ambos.
- **Respuesta razonada:** la probabilidad (25 %) es la misma, pero cada tanda de mediciones es una muestra. Con 40 es normal ver un 18 % o un 32 %; con 4000 las desviaciones se reducen mucho. Es como una encuesta a 4 personas frente a una encuesta a 400.
- **Pistas específicas:**
  - A → «Lanza una moneda 4 veces. ¿Es raro que salgan 3 caras (75 %)? ¿Y 300 caras en 400 lanzamientos?»
  - C → «La probabilidad sí es igual. La pregunta es por las *frecuencias* que cada uno ve en su tablero.»
- **Error que diagnostica:** A cree que las muestras pequeñas son más fiables. C identifica frecuencia con probabilidad.
- **Experimento opcional:** en el laboratorio, n=2, k=0, `shots` 40 frente a 4000, sin ruido.

### MR3 · `mr-fase-doble` — Marcar dos veces
- **Objetivo:** fijar que el oráculo cambia la fase (el signo) y no la probabilidad.
- **Duración:** 2 min.
- **Enunciado:** Aplicas dos veces seguidas el mismo oráculo, sin difusor entre medio, a una superposición uniforme de 16 candidatos. ¿Qué pasa con el objetivo?
- **Opciones:**
  - **A** Su probabilidad se duplica: lo marcaste dos veces.
  - **B** Su amplitud queda en cero: dos signos menos se anulan.
  - **C ✔** El signo vuelve a ser +; su probabilidad nunca cambió.
- **Respuesta razonada:** el oráculo multiplica la amplitud del objetivo por −1. Dos veces: (−1)·(−1) = +1. La probabilidad fue (1/4)² = 6,25 % en todo momento. Es como dar la vuelta a una carta dos veces: queda igual que al principio.
- **Pistas específicas:**
  - A → «Marcar no añade probabilidad; solo cambia el signo. Calcula (−0,25)²: ¿es mayor que (0,25)²?»
  - B → «Cambiar el signo es multiplicar por −1, no restar. ¿Cuánto es (−1)·(−1)?»
- **Error que diagnostica:** A ve el oráculo como un amplificador. B trata el cambio de signo como una resta.

### MR4 · `mr-conservacion` — Si uno sube, otros bajan
- **Objetivo:** entender que la amplificación redistribuye probabilidad (la suma sigue siendo 100 %) y que el difusor actúa sobre todas las amplitudes.
- **Duración:** 2–3 min.
- **Enunciado:** Con 16 candidatos y 1 iteración, el objetivo pasa de 6,25 % a cerca de 47 %. ¿Qué tuvo que pasar con los otros 15?
- **Opciones:**
  - **A ✔** Bajaron: entre todos siguen sumando 100 %.
  - **B** Siguen en 6,25 %: el difusor solo toca al objetivo.
  - **C** Subieron un poco: el difusor amplifica a todos.
- **Respuesta razonada:** 47 % + 15 × 6,25 % = 141 %, que es imposible. Los demás bajan a unos 3,5 % cada uno (teórico 47,3 % para el objetivo y 52,7 % repartido entre 15). Es como repartir una pizza: si un trozo crece, otros encogen.
- **Pistas específicas:**
  - B → «Suma: 47 % + 15 × 6,25 %. ¿Puede el total pasar de 100 %?»
  - C → «Si todos suben a la vez, ¿cuánto suman? La probabilidad no se fabrica: se redistribuye.»
- **Error que diagnostica:** B cree que el difusor solo actúa sobre el objetivo. C ve la probabilidad como un recurso que se crea.

### MR5 · `mr-transfer-64` — Transferencia: explicar un caso nuevo
- **Objetivo:** aplicar «el número útil de iteraciones depende de N» a un tablero que el estudiante no ha visto.
- **Duración:** 4 min (2 para elegir y 2 para escribir una frase).
- **Enunciado:** Con 6 qubits hay 64 candidatos. Sofía usa 3 iteraciones «porque con 16 funcionó». Elige qué esperas y escribe una frase de consejo para Sofía.
- **Opciones:**
  - **A** Cerca de 96 %: 3 es el número correcto para Grover.
  - **B ✔** Cerca de 59 %: le faltan vueltas; con unas 6 subiría.
  - **C** Menos de 2 %: con tantos candidatos Grover no funciona.
- **Respuesta razonada:** con más candidatos, cada iteración gira el estado un ángulo menor. Valores teóricos para N=64: k=3 → 59 %, k=6 → 99,7 %. El número útil crece como √N: √64 / √16 = 2, así que hacen falta aproximadamente el doble de iteraciones. Es como buscar entre 64 cartas: se necesitan más pasos que con 16, aunque no 4 veces más.
- **Pistas específicas:**
  - A → «¿Darías los mismos pasos para buscar entre 16 cartas que entre 64?»
  - C → «Grover sigue funcionando con 64; menos de 2 % es lo que sale con 0 iteraciones. ¿Bastan 3 vueltas para un tablero 4 veces mayor?»
- **Rúbrica de la frase:** *correcta* si dice que el número depende de cuántos candidatos hay **y** propone más iteraciones; *parcial* si solo dice «más»; *error* si mantiene 3 o habla de ruido.
- **Error que diagnostica:** A trata el óptimo como una constante. C cree que Grover deja de funcionar con N grande.
- **Experimento de comprobación:** n=6, k=3 frente a k=6, sin ruido.

### MR6 · `mr-experimento-ruido` — Transferencia: escoger un experimento
- **Objetivo:** diseñar una comparación que aísle una causa (el control de variables) y separar la clave de práctica del circuito.
- **Duración:** 3–4 min (más 3 si se ejecuta).
- **Enunciado:** Un compañero dice: «En la misión 3 salió peor con 5 iteraciones por culpa del ruido». ¿Qué experimento pone a prueba mejor su idea?
- **Opciones:**
  - **A** 5 iteraciones con ruido, pero con 4096 mediciones.
  - **B** Repetir 5 iteraciones con una clave que tenga aura.
  - **C ✔** Comparar 3 y 5 iteraciones, ambas sin ruido.
- **Respuesta razonada:** si sin ruido también baja (96 % → 12,5 %), el ruido no explica la bajada: es la sobreiteración. Para medir el efecto del ruido después, se compara k=5 ideal con k=5 FakeFez, cambiando una sola cosa cada vez.
- **Pistas específicas:**
  - A → «Más mediciones dan una frecuencia más precisa, pero el ruido sigue ahí. ¿Separa este experimento las dos causas?»
  - B → «¿Entra tu clave de práctica en el circuito de Qiskit? (Mira «¿Qué hace Qiskit con mi clave?»)»
- **Error que diagnostica:** A no controla variables. B cree que la clave o su etiqueta influyen en el experimento.

## 3. Secuencia de siete sesiones

Las «sesiones» son **pasos, no fechas**. Si alguien falta un día, la secuencia le espera en el mismo punto. Ninguna sesión caduca ni se pierde, y no hay bonus por hacerlas en días seguidos. Cada sesión dura menos de 12 minutos.

| Sesión | Contenido | Para la próxima vez (pregunta abierta, sin puntos) |
|---|---|---|
| 1 | Misión 1 (`patterns`) + MR1 | «¿Qué crees que pasaría si midieras 4000 veces en vez de 512?» |
| 2 | Repaso (si hay) + MR2 + experimento opcional 40 frente a 4000 | «El oráculo cambia un signo. ¿Para qué podría servir eso?» |
| 3 | Misión 2 (`amplify`) + MR3 | «Si una amplitud crece, ¿de dónde sale esa probabilidad?» |
| 4 | Repaso + MR4 | «¿Crees que 10 iteraciones serían mejor que 3?» |
| 5 | Misión 3 (`overshoot`) + MR6 | «¿Cuántas iteraciones harían falta con 64 candidatos?» |
| 6 | Repaso + MR5 + experimento opcional n=6 (k=3 frente a k=6) | «¿Qué dice y qué no dice la etiqueta «aura» de tu clave?» |
| 7 | Cierre: tres explicaciones abiertas, sin opciones (ver abajo) y repaso final | — |

La pregunta «para la próxima vez» sirve de motivo para volver: queda una predicción abierta que la siguiente sesión resuelve. Se muestra al terminar y al volver, sin notificaciones ni recordatorios.

**Sesión 7: explicaciones abiertas.** Cada una se valora como *correcta / parcial / a revisar*, sin XP:
1. «Explica a alguien de 12 años por qué el tablero de la misión 1 no muestra exactamente 12,5 % en cada casilla.»
2. «¿Qué hace el oráculo y qué no hace? Usa la palabra *signo* o *fase*.»
3. «Tu clave de práctica sacó «Nivel dios: tu clave tiene aura». ¿Qué significa eso dentro del juego y qué no garantiza fuera?» Respuesta esperada: es un tramo de la heurística del juego; no mide la entropía real ni comprueba filtraciones; una frase de palabras comunes puede sacar «aura» sin ser difícil de adivinar.

## 4. Repetir lo fallado sin castigar: contrato de datos mínimo

### Comportamiento propuesto

1. **Qué entra en el repaso:** un microreto o una pregunta de misión cuya **primera** respuesta fue incorrecta. Acertar después con pista completa la actividad como hoy, pero la deja marcada para repaso.
2. **Cuándo se muestra:** a partir del día local siguiente a ese fallo, como «Repaso amable: ¿lo intentamos de nuevo?». Sin caducidad: si vuelve una semana después, sigue ahí. Como máximo 2 repasos por sesión.
3. **Variación:** el repaso presenta el mismo concepto con las opciones en otro orden y, si existe, una variante numérica. No repite el texto exacto, para que no se resuelva de memoria.
4. **XP:**
   - Fallar nunca resta XP ni marcas.
   - El repaso **no da XP**: así no compensa fallar a propósito para volver a cobrar.
   - Acertar el repaso a la primera cambia el estado a «dominado», que se ve en una lista de conceptos y no en el XP.
   - El primer acierto de cada microreto podría dar una cantidad moderada (por ejemplo, 20 XP, una sola vez, como la regla de mejor marca). La decide el integrador.
5. **Rachas:** el repaso no lee ni modifica `streak`, `bestStreak` ni `lastChallengeDate`. Volver no depende de una racha.
6. **Mensaje al fallar:** «Todavía no. [pista específica]. Te lo volveremos a proponer otro día; no pierdes nada.»

### Contrato (propuesta para el integrador; **no implementado**)

```ts
type ReviewId = MissionId | "mr-uniforme" | "mr-muestra" | "mr-fase-doble"
  | "mr-conservacion" | "mr-transfer-64" | "mr-experimento-ruido";

interface ReviewEntry {
  /** "review": la primera respuesta fue incorrecta. "mastered": se acertó a la primera en un repaso o en el primer intento. */
  state: "review" | "mastered";
  /** Fecha local AAAA-MM-DD a partir de la cual se puede mostrar el repaso. */
  from: string;
}

// Campo nuevo y opcional dentro de Progress:
review?: Partial<Record<ReviewId, ReviewEntry>>;
```

Reglas de normalización y restauración:

- Solo se guardan los ids de la lista y `from` con formato de fecha válido. Cualquier otro valor se descarta, igual que ya hace `normalizeProgress`. Como máximo 9 entradas (3 misiones y 6 microretos).
- **No se guardan** la opción elegida, el texto escrito en MR5, tiempos, número de intentos ni nada relacionado con la clave de práctica.
- Al restaurar una copia: `mastered` gana a `review`, y entre dos `review` se conserva el `from` más antiguo. Restaurar nunca crea XP.
- Copias antiguas sin `review` siguen siendo válidas (el campo es opcional).

Para las misiones actuales hace falta un hook en la UI que avise de si la **primera** respuesta de explicación fue incorrecta. Hoy `answer()` solo comunica el acierto final. Lo coordina el integrador con GLM; no requiere cambiar `MISSIONS`.
