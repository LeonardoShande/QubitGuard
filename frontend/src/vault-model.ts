// Reglas didácticas de la bóveda. No recibe ni conserva contraseñas.
export const MISSIONS = [
  {
    id: "patterns", title: "Cierra la primera puerta", concept: "Distribución uniforme",
    story: "Una clave predecible deja pistas. Inventa una clave de práctica más larga y sin los patrones señalados; la etiqueta, de «Meh» a «aura», es una puntuación del juego, no una prueba de seguridad. Después, Qiskit pondrá en superposición 8 candidatos sintéticos: tu clave no entra en el circuito.",
    minLength: 15, minBits: 60, n: 3, k: 0,
    prediction: "Hay 8 candidatos y todavía no aplicamos ninguna iteración de Grover. ¿Qué probabilidad tiene cada uno?",
    predictions: ["12,5 % cada uno: es 1 de cada 8", "50 % cada uno: cada qubit da 0 o 1", "Más para el objetivo: ya está elegido"], correctPrediction: 0,
    question: "El modelo dice 12,5 % por candidato. ¿Qué representan los porcentajes de las casillas del tablero?",
    answers: ["La probabilidad exacta, recalculada tras cada medición", "Cuántas veces salió cada uno, de 512 mediciones", "El error que el simulador suma a cada candidato"], correctAnswer: 1,
    hint: "Piensa en una moneda: la probabilidad de cara es 50 %, pero en 10 lanzamientos no siempre salen 5 caras. ¿A qué se parecen más esos 10 lanzamientos?",
    lesson: "Sin iteraciones, cada candidato tiene amplitud 1/√8 y probabilidad |a|² = 1/8 = 12,5 %. El tablero muestra frecuencias: con 512 mediciones se acercan a 12,5 %, pero no tienen por qué coincidir exactamente.",
  },
  {
    id: "amplify", title: "Activa el escudo", concept: "Amplificación de amplitudes",
    story: "Refuerza la clave de práctica. Luego verás cómo Grover concentra la probabilidad en uno de 16 candidatos sintéticos. El circuito no analiza tu clave.",
    minLength: 20, minBits: 80, n: 4, k: 3,
    prediction: "Con 16 candidatos y 3 iteraciones ideales de Grover, ¿qué probabilidad esperas para el objetivo?",
    predictions: ["Cerca de 6 %: igual que al inicio (1/16)", "Cerca de 96 %: su amplitud ha crecido", "100 %: cada medición dará el objetivo"], correctPrediction: 1,
    question: "El oráculo solo cambia el signo (la fase) de la amplitud del objetivo. Si midieras justo después del primer oráculo, sin difusor, ¿qué verías?",
    answers: ["Lo mismo que al inicio: cerca de 1/16 cada uno", "El objetivo casi siempre: el oráculo lo marcó", "El objetivo nunca: su amplitud ahora es negativa"], correctAnswer: 0,
    hint: "Calcula (0,25)² y (−0,25)². ¿Cambia la probabilidad al cambiar el signo? Piensa qué paso del circuito aprovecha ese signo.",
    lesson: "El oráculo invierte la fase del objetivo sin cambiar su |a|². El difusor refleja cada amplitud respecto a la media: el objetivo, que quedó por debajo, rebota muy por encima, y los demás bajan un poco. Tras 3 iteraciones ideales, la probabilidad teórica es ≈ 96 %; el tablero muestra la frecuencia medida.",
  },
  {
    id: "overshoot", title: "Domina la búsqueda", concept: "Más no siempre es mejor",
    story: "Completa tu última defensa de práctica. Si marca «Nivel dios: tu clave tiene aura», significa que llegó al tramo alto del juego, no que sea segura fuera de él. El tablero sigue teniendo 16 candidatos sintéticos, pero ahora hacemos 5 iteraciones en lugar de 3: ¿cuándo conviene parar?",
    minLength: 24, minBits: 100, n: 4, k: 5,
    prediction: "Si pasamos de 3 a 5 iteraciones ideales, ¿qué ocurre con la probabilidad del objetivo?",
    predictions: ["Sube a casi 100 %: más iteraciones, más precisión", "Se queda cerca de 96 %: ya alcanzó su máximo", "Baja mucho: nos pasamos del punto óptimo"], correctPrediction: 2,
    question: "¿Qué conclusión puedes llevar a otro experimento de Grover?",
    answers: ["Conviene repetir el bloque tantas veces como se pueda", "El mejor número depende de cuántos candidatos hay", "A partir de 4 iteraciones el ruido borra el efecto"], correctAnswer: 1,
    hint: "Esta simulación no tiene ruido. Imagina una flecha que gira un ángulo fijo en cada iteración: tras unas 3 vueltas apunta al objetivo. ¿Qué pasa si sigues girando?",
    lesson: "Cada iteración gira el estado un ángulo fijo. Con 16 candidatos, la probabilidad teórica es ≈ 96 % con 3 iteraciones y baja a ≈ 12,5 % con 5, aunque no haya ruido. El número útil crece con √N: unas (π/4)·√N iteraciones para N candidatos.",
  },
] as const;

export type MissionId = typeof MISSIONS[number]["id"];
export type Mission = typeof MISSIONS[number];
export const RANKS = [
  { minimum: 0, name: "Aprendiz de qubits" },
  { minimum: 50, name: "Explorador de probabilidades" },
  { minimum: 100, name: "Constructor de defensas" },
  { minimum: 200, name: "Estratega de amplitudes" },
  { minimum: 300, name: "Guardián cuántico" },
] as const;

export function normalizeVault(value: unknown): Partial<Record<MissionId, number>> {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const safe: Partial<Record<MissionId, number>> = {};
  for (const { id } of MISSIONS) {
    if (source[id] !== 75 && source[id] !== 100) break;
    safe[id] = source[id] as number;
  }
  return safe;
}

export function vaultTotal(scores: unknown): number {
  return Object.values(normalizeVault(scores)).reduce((sum, n) => sum + n, 0);
}

export function vaultRank(points: number) {
  const index = RANKS.reduce((best, rank, i) => points >= rank.minimum ? i : best, 0);
  const current = RANKS[Math.max(0, index)];
  const next = RANKS[index + 1];
  return { name: current.name, remaining: next ? next.minimum - points : 0, next: next?.name };
}

export function missionUnlocked(index: number, scores: unknown): boolean {
  if (!Number.isInteger(index) || index < 0 || index >= MISSIONS.length) return false;
  const safe = normalizeVault(scores);
  return MISSIONS.slice(0, index).every(({ id }) => (safe[id] ?? 0) >= 75);
}

export function missionScore(predictionCorrect: boolean): number {
  // Solo se concede al completar preparación, ejecución y explicación.
  return 25 + (predictionCorrect ? 25 : 0) + 20 + 30;
}
