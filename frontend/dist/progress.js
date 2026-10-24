// Progreso del jugador (XP, nivel, racha) guardado en este navegador.
const KEY = "qubitguard.progress.v1";
const EMPTY = {
    xp: 0, streak: 0, bestStreak: 0, lastChallengeDate: null, answers: {}, activity: {},
};
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
        return { ...structuredClone(EMPTY), ...data };
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
export function rewardActivity(p, activity, xp, reason) {
    const today = todayUTC();
    if (p.activity[activity] === today)
        return null;
    p.activity[activity] = today;
    p.xp += xp;
    save(p);
    return { xp, reason };
}
