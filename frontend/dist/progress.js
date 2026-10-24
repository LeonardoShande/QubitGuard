// Progreso del jugador (XP, nivel, racha) guardado en este navegador.
const KEY = "qubitguard.progress.v1";
const EMPTY = {
    xp: 0, streak: 0, bestStreak: 0, lastChallengeDate: null, answers: {}, activity: {},
    path: [], achievements: [], predictions: { date: "", count: 0 },
};
export const STEPS = [
    { id: "superposicion", title: "Superposición", task: "Ejecuta con 0 iteraciones: todos los estados salen casi por igual." },
    { id: "oraculo", title: "Oráculo", task: "Ejecuta con 1 iteración: una sola consulta al oráculo ya favorece al marcado." },
    { id: "amplificacion", title: "Amplificación", task: "Predice y ejecuta con el número óptimo de iteraciones." },
    { id: "ruido", title: "Ruido", task: "Activa el ruido de FakeFez y compara con el resultado ideal." },
    { id: "criptografia", title: "Criptografía", task: "Consigue una contraseña de 128 bits o más: 64 efectivos frente a Grover." },
];
export const ACHIEVEMENTS = [
    { id: "prediccion", title: "Primera predicción", detail: "Te comprometiste con un número antes de mirar." },
    { id: "prediccion-exacta", title: "Primera predicción exacta", detail: "A 3 puntos o menos, o las iteraciones justas." },
    { id: "ruido", title: "Viste el ruido borrar a Grover", detail: "Con ruido, la medida cayó muy por debajo de la teoría." },
    { id: "pw128", title: "Contraseña de 128+ bits generada", detail: "Resistente a Grover: 64 bits efectivos o más." },
    { id: "racha3", title: "Tres días seguidos", detail: "Resolviste el reto diario tres días sin cortar." },
    { id: "ruta", title: "Ruta completa", detail: "Recorriste los cinco pasos, de la superposición a la criptografía." },
];
export const LEVEL_NAMES = [
    "Aprendiz de qubits",
    "Operador de compuertas",
    "Cazador de amplitudes",
    "Ingeniero de oráculos",
    "Analista poscuántico",
    "Arquitecto de Grover",
    "Guardián cuántico",
];
export function load() {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw)
            return structuredClone(EMPTY);
        const data = JSON.parse(raw);
        const p = { ...structuredClone(EMPTY), ...data };
        // Datos de una versión anterior o editados a mano: se normalizan en vez de romper la página.
        if (!Array.isArray(p.path))
            p.path = [];
        if (!Array.isArray(p.achievements))
            p.achievements = [];
        if (typeof p.predictions?.count !== "number")
            p.predictions = { date: "", count: 0 };
        return p;
    }
    catch {
        return structuredClone(EMPTY);
    }
}
function save(p) {
    try {
        localStorage.setItem(KEY, JSON.stringify(p));
    }
    catch { /* modo privado o almacenamiento bloqueado: el progreso vive solo en esta pestaña */ }
}
export function todayUTC() {
    return new Date().toISOString().slice(0, 10);
}
function previousDay(date) {
    const d = new Date(`${date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
}
/** Nivel n (desde 1) requiere 60·(n−1)² XP acumulados. */
export function levelInfo(xp) {
    const level = Math.floor(Math.sqrt(xp / 60)) + 1;
    const floor = 60 * (level - 1) ** 2;
    const next = 60 * level ** 2;
    const name = LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)];
    return { level, name, floor, next, fraction: (xp - floor) / (next - floor) };
}
/** La racha visible se rompe si no se respondió ni hoy ni ayer. */
export function currentStreak(p, today = todayUTC()) {
    if (!p.lastChallengeDate)
        return 0;
    return p.lastChallengeDate === today || p.lastChallengeDate === previousDay(today) ? p.streak : 0;
}
/** Registra la respuesta del reto de una fecha. Solo puntúa la primera vez. */
export function answerChallenge(p, date, choice, correct) {
    if (p.answers[date])
        return null;
    p.answers[date] = { choice, correct };
    // Conserva solo las últimas 60 fechas.
    const dates = Object.keys(p.answers).sort();
    for (const d of dates.slice(0, Math.max(0, dates.length - 60)))
        delete p.answers[d];
    p.streak = p.lastChallengeDate === previousDay(date) ? p.streak + 1 : 1;
    p.bestStreak = Math.max(p.bestStreak, p.streak);
    p.lastChallengeDate = date;
    const bonus = Math.min(p.streak - 1, 5) * 10;
    const xp = (correct ? 50 : 15) + bonus;
    p.xp += xp;
    save(p);
    const reason = correct ? "Reto resuelto" : "Reto intentado";
    return { xp, reason: bonus ? `${reason} (+${bonus} por racha)` : reason };
}
/** XP moderado por la primera vez del día que se usa una actividad del laboratorio. */
/** Marca un paso de la ruta. Devuelve true si es nuevo. */
export function completeStep(p, id) {
    if (p.path.includes(id))
        return false;
    p.path.push(id);
    save(p);
    return true;
}
/** Desbloquea un logro. Devuelve true si es nuevo. */
export function unlock(p, id) {
    if (p.achievements.includes(id))
        return false;
    p.achievements.push(id);
    save(p);
    return true;
}
export const PREDICTIONS_PER_DAY = 5;
/** XP por cercanía de una predicción; solo las primeras PREDICTIONS_PER_DAY del día puntúan. */
export function rewardPrediction(p, xp, reason) {
    const today = todayUTC();
    if (p.predictions.date !== today)
        p.predictions = { date: today, count: 0 };
    if (xp <= 0 || p.predictions.count >= PREDICTIONS_PER_DAY)
        return null;
    p.predictions.count += 1;
    p.xp += xp;
    save(p);
    return { xp, reason };
}
export function rewardActivity(p, activity, xp, reason) {
    const today = todayUTC();
    if (p.activity[activity] === today)
        return null;
    p.activity[activity] = today;
    p.xp += xp;
    save(p);
    return { xp, reason };
}
