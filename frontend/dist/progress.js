// Progreso del jugador (XP, nivel, racha) guardado en este navegador.
import { MISSIONS, missionUnlocked, normalizeVault } from "./vault-model.js";
const KEY = "qubitguard.progress.v1";
const BACKUP_KEY = `${KEY}.backup`;
let storageState = "saved";
const EMPTY = {
    xp: 0, streak: 0, bestStreak: 0, lastChallengeDate: null, answers: {}, activity: {},
    path: [], achievements: [], predictions: { date: "", count: 0 }, vault: {},
};
export const STEPS = [
    { id: "superposicion", title: "Superposición", task: "Ejecuta con 0 iteraciones: todos los estados salen casi por igual." },
    { id: "oraculo", title: "Oráculo", task: "Ejecuta con 1 iteración: una sola consulta al oráculo ya favorece al marcado." },
    { id: "amplificacion", title: "Amplificación", task: "Predice y ejecuta con el número óptimo de iteraciones." },
    { id: "ruido", title: "Ruido", task: "Activa el ruido de FakeFez y compara con el resultado ideal." },
    { id: "criptografia", title: "Criptografía", task: "Consigue una contraseña de 128 bits o más (≥128 bits ⇒ ~64 efectivos frente a Grover idealizado; no es una certificación)." },
];
export const ACHIEVEMENTS = [
    { id: "prediccion", title: "Primera predicción", detail: "Te comprometiste con un número antes de mirar." },
    { id: "prediccion-exacta", title: "Primera predicción exacta", detail: "A 3 puntos o menos, o las iteraciones justas." },
    { id: "ruido", title: "Viste el ruido borrar a Grover", detail: "Con ruido, la medida cayó muy por debajo de la teoría." },
    { id: "pw128", title: "Contraseña de 128+ bits generada", detail: "Meta educativa: ≥128 bits ⇒ ~64 bits efectivos frente a Grover idealizado; no es una certificación." },
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
function normalizeProgress(value) {
    if (!value || typeof value !== "object" || Array.isArray(value))
        return structuredClone(EMPTY);
    const data = value;
    // Construir desde campos conocidos evita conservar información ajena al progreso.
    const p = { ...structuredClone(EMPTY), xp: data.xp ?? 0, streak: data.streak ?? 0,
        bestStreak: data.bestStreak ?? 0, lastChallengeDate: data.lastChallengeDate ?? null,
        answers: data.answers ?? {}, activity: data.activity ?? {}, path: data.path ?? [],
        achievements: data.achievements ?? [], predictions: data.predictions ?? { date: "", count: 0 }, vault: data.vault ?? {} };
    // Datos de una versión anterior o editados a mano: se normalizan en vez de romper la página.
    if (!Array.isArray(p.path))
        p.path = [];
    if (!Array.isArray(p.achievements))
        p.achievements = [];
    if (typeof p.predictions?.count !== "number")
        p.predictions = { date: "", count: 0 };
    const count = (v) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);
    const dict = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
    p.xp = count(p.xp);
    p.streak = count(p.streak);
    p.bestStreak = count(p.bestStreak);
    p.answers = dict(p.answers);
    p.activity = dict(p.activity);
    const isDate = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));
    p.answers = Object.fromEntries(Object.entries(p.answers).filter(([day, answer]) => isDate(day) && answer &&
        Number.isInteger(answer.choice) && answer.choice >= 0 && answer.choice <= 3 && typeof answer.correct === "boolean")
        .sort(([a], [b]) => a.localeCompare(b)).slice(-60).map(([day, answer]) => [day, { choice: answer.choice, correct: answer.correct }]));
    p.activity = Object.fromEntries(Object.entries(p.activity).filter(([key, day]) => ["grover", "grover-noisy", "montecarlo"].includes(key) && isDate(day)));
    p.path = p.path.filter((id) => STEPS.some((step) => step.id === id));
    p.achievements = p.achievements.filter((id) => ACHIEVEMENTS.some((achievement) => achievement.id === id));
    p.predictions = { date: isDate(p.predictions.date) ? p.predictions.date : "", count: Math.min(5, count(p.predictions.count)) };
    p.vault = normalizeVault(p.vault);
    p.xp = Math.max(p.xp, Object.values(p.vault).reduce((sum, n) => sum + n, 0));
    if (!isDate(p.lastChallengeDate))
        p.lastChallengeDate = null;
    return p;
}
export function load() {
    storageState = "saved";
    try {
        for (const key of [KEY, BACKUP_KEY]) {
            const raw = localStorage.getItem(key);
            if (!raw)
                continue;
            try {
                const data = JSON.parse(raw);
                if (!data || typeof data !== "object" || Array.isArray(data))
                    continue;
                if (key === BACKUP_KEY)
                    storageState = "recovered";
                return normalizeProgress(data);
            }
            catch { /* La copia redundante permite recuperar un JSON principal dañado. */ }
        }
    }
    catch {
        storageState = "blocked";
    }
    return structuredClone(EMPTY);
}
export function storageStatus() {
    return storageState;
}
/** Prueba de escritura al abrir la UI. No toca puntuaciones ni cuenta como actividad. */
export function checkStorage() {
    const probe = `${KEY}.probe`;
    try {
        localStorage.setItem(probe, "1");
        localStorage.removeItem(probe);
        if (storageState !== "recovered")
            storageState = "saved";
    }
    catch {
        storageState = "blocked";
    }
}
/** Copia portable con campos permitidos. Las contraseñas no forman parte de Progress. */
export function exportProgress(p) {
    return JSON.stringify({ app: "QubitGuard", version: 1, progress: normalizeProgress(p) }, null, 2);
}
export function importProgress(p, source) {
    if (source.length > 131072)
        throw new Error("La copia es demasiado grande. Elige un archivo de progreso de QubitGuard.");
    let data;
    try {
        data = JSON.parse(source);
    }
    catch {
        throw new Error("El archivo no contiene una copia JSON válida.");
    }
    if (!data || data.app !== "QubitGuard" || data.version !== 1 || !data.progress || typeof data.progress !== "object" || Array.isArray(data.progress)) {
        throw new Error("Esta copia no tiene el formato de progreso de QubitGuard.");
    }
    const incoming = normalizeProgress(data.progress);
    // Restaurar suma lo recuperable y nunca reduce XP, mejores marcas ni logros actuales.
    const vault = normalizeVault(Object.fromEntries(MISSIONS.map(({ id }) => [id, Math.max(p.vault?.[id] ?? 0, incoming.vault[id] ?? 0)])));
    const existingVaultXp = Object.values(p.vault ?? {}).reduce((sum, n) => sum + n, 0);
    const incomingVaultXp = Object.values(incoming.vault).reduce((sum, n) => sum + n, 0);
    p.xp = Math.max(p.xp - existingVaultXp, incoming.xp - incomingVaultXp, 0) + Object.values(vault).reduce((sum, n) => sum + n, 0);
    p.vault = vault;
    p.path = [...new Set([...p.path, ...incoming.path])];
    p.achievements = [...new Set([...p.achievements, ...incoming.achievements])];
    // Si ambas copias contienen la fecha, conserva la respuesta local ya puntuada.
    p.answers = { ...incoming.answers, ...p.answers };
    for (const [key, date] of Object.entries(incoming.activity))
        if (!p.activity[key] || date > p.activity[key])
            p.activity[key] = date;
    p.bestStreak = Math.max(p.bestStreak, incoming.bestStreak);
    if (incoming.lastChallengeDate && (!p.lastChallengeDate || incoming.lastChallengeDate > p.lastChallengeDate)) {
        p.lastChallengeDate = incoming.lastChallengeDate;
        p.streak = incoming.streak;
    }
    if (incoming.predictions.date > p.predictions.date)
        p.predictions = incoming.predictions;
    else if (incoming.predictions.date === p.predictions.date)
        p.predictions.count = Math.max(p.predictions.count, incoming.predictions.count);
    save(p);
}
function save(p) {
    try {
        const serialized = JSON.stringify(normalizeProgress(p));
        localStorage.setItem(KEY, serialized);
        storageState = "saved";
        try {
            localStorage.setItem(BACKUP_KEY, serialized);
        }
        catch { /* El guardado principal sigue siendo válido. */ }
    }
    catch {
        storageState = "blocked";
    }
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
        window.dispatchEvent(new Event("qubitguard:progress-saved"));
    }
}
/** Fecha LOCAL del navegador (AAAA-MM-DD): el reto, la racha y los topes diarios cambian a medianoche local. */
export function todayLocal(now = new Date()) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
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
export function currentStreak(p, today = todayLocal()) {
    if (!p.lastChallengeDate)
        return 0;
    return p.lastChallengeDate === today || p.lastChallengeDate === previousDay(today) ? p.streak : 0;
}
/** Registra la respuesta del reto de una fecha local. Solo puntúa la primera vez. */
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
    const today = todayLocal();
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
    const today = todayLocal();
    if (p.activity[activity] === today)
        return null;
    p.activity[activity] = today;
    p.xp += xp;
    save(p);
    return { xp, reason };
}
/** Solo la mejora sobre la mejor marca da XP. No altera las rachas ni los topes anteriores. */
export function awardVaultMission(p, id, score) {
    p.vault = normalizeVault(p.vault);
    const index = MISSIONS.findIndex((mission) => mission.id === id);
    if (!missionUnlocked(index, p.vault) || (score !== 75 && score !== 100))
        return null;
    const delta = score - (p.vault[id] ?? 0);
    if (delta <= 0)
        return null;
    p.vault[id] = score;
    p.xp += delta;
    save(p);
    return { xp: delta, reason: "Mejor marca en Protege la bóveda" };
}
