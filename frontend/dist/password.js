// Análisis de fortaleza de contraseñas: funciones puras, sin efectos secundarios.
// Recibe un texto y devuelve números; no guarda ni transmite nada.
// Lista corta embebida: contraseñas y palabras muy usadas (es/en). Se comparan en minúsculas
// y tras deshacer el leet básico.
const COMMON = [
    "password", "contrasena", "contraseña", "clave", "secreto", "admin", "administrador", "usuario",
    "qwerty", "iloveyou", "teamo", "amor", "hola", "welcome", "bienvenido", "letmein", "dragon",
    "monkey", "master", "login", "princess", "princesa", "sunshine", "football", "futbol", "alianza",
    "universitario", "cristal", "peru", "lima", "mexico", "colombia", "chile", "argentina", "maria",
    "jose", "juan", "carlos", "pokemon", "minecraft", "batman", "superman", "shadow", "starwars",
    "abc", "qubit", "quantum", "ibm", "test", "prueba",
].sort((a, b) => b.length - a.length);
const KEYBOARD_ROWS = ["1234567890", "qwertyuiop", "asdfghjklñ", "zxcvbnm"];
const LEET = {
    "4": "a", "@": "a", "3": "e", "1": "i", "!": "i", "0": "o", "5": "s", "$": "s", "7": "t", "8": "b",
};
const LOG2_10 = Math.log2(10);
function detectAlphabet(pw) {
    let size = 0;
    const parts = [];
    if (/[a-z]/.test(pw)) {
        size += 26;
        parts.push("minúsculas (26)");
    }
    if (/[A-Z]/.test(pw)) {
        size += 26;
        parts.push("mayúsculas (26)");
    }
    if (/[0-9]/.test(pw)) {
        size += 10;
        parts.push("dígitos (10)");
    }
    if (/[ -/:-@[-`{-~]/.test(pw)) {
        size += 33;
        parts.push("símbolos ASCII (33)");
    }
    if (/[^\x20-\x7e]/.test(pw)) {
        size += 100;
        parts.push("otros caracteres (≈100)");
    }
    return { size, parts };
}
function unleet(s) {
    let out = "";
    for (const ch of s.toLowerCase())
        out += LEET[ch] ?? ch;
    return out;
}
/** Marca un tramo como cubierto si ninguno de sus caracteres lo estaba ya. */
function claim(covered, start, len) {
    for (let i = start; i < start + len; i++)
        if (covered[i])
            return false;
    for (let i = start; i < start + len; i++)
        covered[i] = true;
    return true;
}
function strengthOf(bits, length) {
    if (length === 0)
        return "vacia";
    if (bits < 28)
        return "muy-debil";
    if (bits < 40)
        return "debil";
    if (bits < 64)
        return "razonable";
    if (bits < 128)
        return "fuerte";
    return "muy-fuerte";
}
export const STRENGTH_LABEL = {
    "vacia": "Sin analizar",
    "muy-debil": "Muy débil",
    "debil": "Débil",
    "razonable": "Razonable",
    "fuerte": "Fuerte",
    "muy-fuerte": "Muy fuerte",
};
/**
 * Entropía estimada = longitud × log2(alfabeto) menos penalizaciones por patrones.
 * Cada patrón sustituye el coste de sus caracteres por un coste pequeño (lo que costaría
 * adivinar el patrón en sí), sin contar dos veces el mismo carácter.
 */
export function analyze(pw, attemptsPerSecond) {
    const chars = Array.from(pw);
    const length = chars.length;
    const { size: alphabet, parts } = detectAlphabet(pw);
    const perChar = alphabet > 0 ? Math.log2(alphabet) : 0;
    const rawBits = length * perChar;
    const covered = new Array(length).fill(false);
    const penalties = [];
    const add = (kind, label, n, residualBits) => {
        const bits = Math.max(0, n * perChar - residualBits);
        if (bits > 0)
            penalties.push({ kind, label, chars: n, bits });
    };
    const lower = chars.map((c) => c.toLowerCase());
    const plain = Array.from(unleet(pw));
    // 1. Palabras comunes (también con leet básico: p4ssw0rd).
    for (const word of COMMON) {
        const w = Array.from(word);
        for (let i = 0; i + w.length <= length; i++) {
            const direct = w.every((c, j) => lower[i + j] === c);
            const leet = !direct && w.every((c, j) => plain[i + j] === c);
            if ((direct || leet) && claim(covered, i, w.length)) {
                add("palabra", leet ? "Palabra común con leet básico" : "Palabra o contraseña común", w.length, Math.log2(COMMON.length) + (leet ? 1 : 0));
            }
        }
    }
    // 2. Años (1900–2099).
    for (let i = 0; i + 4 <= length; i++) {
        const s = lower.slice(i, i + 4).join("");
        if (/^(19|20)\d\d$/.test(s) && claim(covered, i, 4))
            add("anio", "Año reconocible", 4, Math.log2(200));
    }
    // 3. Recorridos de teclado de 4 o más teclas (en ambos sentidos).
    for (let i = 0; i < length;) {
        let best = 0;
        for (const row of KEYBOARD_ROWS) {
            for (const r of [row, Array.from(row).reverse().join("")]) {
                const pos = r.indexOf(lower[i]);
                if (pos < 0)
                    continue;
                let len = 0;
                while (i + len < length && r[pos + len] === lower[i + len])
                    len++;
                best = Math.max(best, len);
            }
        }
        if (best >= 4 && claim(covered, i, best)) {
            add("teclado", "Recorrido de teclado", best, 4);
            i += best;
        }
        else
            i++;
    }
    // 4. Secuencias de 3+ caracteres consecutivos (abc, 987).
    for (let i = 0; i + 2 < length;) {
        const step = (chars[i + 1].codePointAt(0) - chars[i].codePointAt(0));
        let len = 1;
        if (step === 1 || step === -1) {
            while (i + len < length && chars[i + len].codePointAt(0) - chars[i + len - 1].codePointAt(0) === step)
                len++;
        }
        if (len >= 3 && claim(covered, i, len)) {
            add("secuencia", "Secuencia consecutiva", len, perChar + 1);
            i += len;
        }
        else
            i++;
    }
    // 5. Repeticiones de un mismo carácter (aaa, 111).
    for (let i = 0; i < length;) {
        let len = 1;
        while (i + len < length && chars[i + len] === chars[i])
            len++;
        if (len >= 3 && claim(covered, i, len)) {
            add("repeticion", "Carácter repetido", len, perChar + Math.log2(len));
        }
        i += len;
    }
    const penaltyBits = penalties.reduce((s, p) => s + p.bits, 0);
    const bits = Math.max(0, rawBits - penaltyBits);
    const rate = attemptsPerSecond > 0 ? attemptsPerSecond : 1;
    const log10Rate = Math.log10(rate);
    // Ataque clásico promedio: la mitad del espacio, 2^bits / 2 = 2^(bits-1) intentos.
    const classicalLog10Seconds = Math.max(0, bits - 1) / LOG2_10 - log10Rate;
    // Grover: ≈ π/4 · √(2^bits) iteraciones del oráculo.
    const groverLog10Iterations = Math.log10(Math.PI / 4) + bits / 2 / LOG2_10;
    const groverLog10Seconds = groverLog10Iterations - log10Rate;
    return {
        length, alphabet, alphabetParts: parts, rawBits, penalties, bits,
        classicalLog10Seconds, groverLog10Iterations, groverLog10Seconds,
        strength: strengthOf(bits, length),
    };
}
const SUPERSCRIPT = "⁰¹²³⁴⁵⁶⁷⁸⁹";
function sup(n) {
    return String(n).replace(/\d/g, (d) => SUPERSCRIPT[Number(d)]).replace("-", "⁻");
}
/** 10^x con formato legible ("3,2 × 10¹⁵") a partir de su log10. */
export function formatPow10(log10) {
    if (!Number.isFinite(log10))
        return "∞";
    if (log10 < 6)
        return Math.round(10 ** log10).toLocaleString("es-PE");
    const exp = Math.floor(log10);
    const mant = 10 ** (log10 - exp);
    return `${mant.toLocaleString("es-PE", { maximumFractionDigits: 1 })} × 10${sup(exp)}`;
}
const UNITS = [
    [1, "segundo", "segundos"],
    [60, "minuto", "minutos"],
    [3600, "hora", "horas"],
    [86400, "día", "días"],
    [31557600, "año", "años"],
];
/** Duración legible a partir del log10 de los segundos. */
export function formatDuration(log10Seconds) {
    if (log10Seconds < 0)
        return "menos de un segundo";
    let unit = UNITS[0];
    for (const u of UNITS)
        if (log10Seconds >= Math.log10(u[0]))
            unit = u;
    const log10Value = log10Seconds - Math.log10(unit[0]);
    if (unit[1] === "año" && log10Value >= 6) {
        const ages = log10Value - Math.log10(1.38e10);
        const suffix = ages >= 0 ? ` (≈ ${formatPow10(ages)} veces la edad del universo)` : "";
        return `${formatPow10(log10Value)} años${suffix}`;
    }
    const value = 10 ** log10Value;
    const rounded = value < 10 ? Math.round(value * 10) / 10 : Math.round(value);
    return `${rounded.toLocaleString("es-PE")} ${rounded === 1 ? unit[1] : unit[2]}`;
}
