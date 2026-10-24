import { WORDS } from "./wordlist.js";
const WORD_POOL = [...new Set(WORDS)];
export const WORDLIST_SIZE = WORD_POOL.length;
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = LOWER.toUpperCase();
const DIGITS = "0123456789";
const ASCII = Array.from({ length: 94 }, (_, i) => String.fromCharCode(i + 33)).join("");
const SYMBOLS = ASCII.replace(/[a-zA-Z0-9]/g, "");
const AMBIGUOUS = new Set("0Oo1lI|`'\"!ij;:,.");
const UINT32_RANGE = 2 ** 32;
export function randomInt(maxExclusive) {
    if (!Number.isInteger(maxExclusive) || maxExclusive < 1 || maxExclusive > UINT32_RANGE) {
        throw new RangeError("El limite aleatorio debe ser un entero entre 1 y 2^32.");
    }
    const limit = UINT32_RANGE - (UINT32_RANGE % maxExclusive);
    const sample = new Uint32Array(1);
    do {
        globalThis.crypto.getRandomValues(sample);
    } while (sample[0] >= limit);
    return sample[0] % maxExclusive;
}
/** Inclusion-exclusion normalizada: no se elevan alfabetos grandes a potencias. */
export function countValidLog2(length, classSizes) {
    if (!Number.isSafeInteger(length) || length < 0 || classSizes.length === 0 ||
        classSizes.some((size) => !Number.isSafeInteger(size) || size < 1)) {
        throw new RangeError("La longitud y los tamanos de clase deben ser enteros validos.");
    }
    const total = classSizes.reduce((sum, size) => sum + size, 0);
    if (!Number.isSafeInteger(total))
        throw new RangeError("Alfabeto demasiado grande.");
    if (length < classSizes.length)
        return -Infinity;
    let excluded = 0;
    let correction = 0;
    function visit(start, removed, sign) {
        for (let i = start; i < classSizes.length; i++) {
            const next = removed + classSizes[i];
            const term = next === total ? 0 : Math.exp(length * Math.log1p(-next / total));
            const adjusted = sign * term - correction;
            const sum = excluded + adjusted;
            correction = (sum - excluded) - adjusted;
            excluded = sum;
            visit(i + 1, next, -sign);
        }
    }
    visit(0, 0, 1);
    return length * Math.log2(total) + Math.log1p(-excluded) / Math.LN2;
}
function generated(value, bits, method, alphabetSize) {
    return { value, bits, groverBits: bits / 2, method, alphabetSize };
}
export function generateChars(o) {
    if (!Number.isInteger(o.length) || o.length < 8 || o.length > 128) {
        throw new RangeError("La longitud debe ser un entero entre 8 y 128.");
    }
    const classes = [o.lower ? LOWER : "", o.upper ? UPPER : "", o.digits ? DIGITS : "", o.symbols ? SYMBOLS : ""]
        .filter(Boolean)
        .map((chars) => o.avoidAmbiguous ? [...chars].filter((char) => !AMBIGUOUS.has(char)).join("") : chars);
    if (classes.length === 0)
        throw new RangeError("Activa al menos una clase de caracteres.");
    const alphabet = classes.join("");
    let value;
    do {
        value = Array.from({ length: o.length }, () => alphabet[randomInt(alphabet.length)]).join("");
    } while (!classes.every((chars) => [...value].some((char) => chars.includes(char))));
    return generated(value, countValidLog2(o.length, classes.map((chars) => chars.length)), "chars", alphabet.length);
}
export function generatePassphrase(o) {
    if (!Number.isInteger(o.words) || o.words < 3 || o.words > 12) {
        throw new RangeError("La frase debe contener entre 3 y 12 palabras.");
    }
    if (typeof o.separator !== "string" || [...o.separator].length > 3) {
        throw new RangeError("El separador debe tener entre 0 y 3 caracteres.");
    }
    const words = Array.from({ length: o.words }, () => WORD_POOL[randomInt(WORDLIST_SIZE)]);
    let bits = o.words * Math.log2(WORDLIST_SIZE);
    if (o.capitalize) {
        const index = randomInt(o.words);
        words[index] = words[index].toUpperCase();
        bits += Math.log2(o.words);
    }
    if (o.addNumber) {
        const number = String(randomInt(1000));
        words.splice(randomInt(o.words + 1), 0, number);
        bits += Math.log2(1000) + Math.log2(o.words + 1);
    }
    return generated(words.join(o.separator), bits, "passphrase", WORDLIST_SIZE);
}
export function strengthen(base, targetRandomBits = 80) {
    if (typeof base !== "string")
        throw new TypeError("La base debe ser texto.");
    if (!Number.isFinite(targetRandomBits) || targetRandomBits <= 0) {
        throw new RangeError("El objetivo de bits debe ser un numero positivo finito.");
    }
    if (base.length === 0) {
        let length = Math.max(8, Math.ceil(targetRandomBits / Math.log2(ASCII.length)));
        while (length <= 128 && countValidLog2(length, [26, 26, 10, 32]) < targetRandomBits)
            length++;
        return generateChars({ length, lower: true, upper: true, digits: true, symbols: true, avoidAmbiguous: false });
    }
    let count = Math.ceil(targetRandomBits / Math.log2(ASCII.length));
    if (count * Math.log2(ASCII.length) < targetRandomBits)
        count++;
    const chars = Array.from(base);
    if (!Number.isSafeInteger(count) || count + chars.length >= UINT32_RANGE) {
        throw new RangeError("El objetivo produce una cadena demasiado larga.");
    }
    for (let i = 0; i < count; i++) {
        const char = ASCII[randomInt(ASCII.length)];
        chars.splice(randomInt(chars.length + 1), 0, char);
    }
    // La base conocida y las posiciones de insercion no aportan bits al calculo.
    return generated(chars.join(""), count * Math.log2(ASCII.length), "strengthen", ASCII.length);
}
