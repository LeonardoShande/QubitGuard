import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import {
  WORDLIST_SIZE, randomInt, countValidLog2, generateChars, generatePassphrase, strengthen,
} from "../dist/generator.js";
import { WORDS } from "../dist/wordlist.js";

const ALL = { length: 24, lower: true, upper: true, digits: true, symbols: true, avoidAmbiguous: false };
const CLASSES = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/];
const AMBIGUOUS = /[0Oo1lI|`'"!ij;:,.]/;

function close(actual, expected, tolerance = 1e-10) {
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);
}

test("randomInt valida limites enteros y alcanza ambos extremos de Uint32", (t) => {
  for (const max of [0, -1, 1.5, NaN, Infinity, 2 ** 32 + 1]) {
    assert.throws(() => randomInt(max), RangeError);
  }
  assert.equal(randomInt(1), 0);
  let next = 0;
  const rng = t.mock.method(globalThis.crypto, "getRandomValues", (buffer) => {
    assert.ok(buffer instanceof Uint32Array);
    buffer[0] = next;
    return buffer;
  });
  assert.equal(randomInt(2 ** 32), 0);
  next = 2 ** 32 - 1;
  assert.equal(randomInt(2 ** 32), next);
  rng.mock.restore();
});

test("randomInt rechaza la cola que produciria sesgo de modulo", (t) => {
  const draws = [2 ** 32 - 1, 2 ** 32 - 4, 13];
  const rng = t.mock.method(globalThis.crypto, "getRandomValues", (buffer) => {
    assert.ok(draws.length > 0);
    buffer[0] = draws.shift();
    return buffer;
  });
  assert.equal(randomInt(7), 6);
  assert.equal(rng.mock.callCount(), 3);
  rng.mock.restore();
});

test("randomInt: 70000 muestras uniformes en siete casillas", () => {
  const counts = Array(7).fill(0);
  for (let i = 0; i < 70000; i++) {
    const value = randomInt(7);
    assert.ok(Number.isInteger(value) && value >= 0 && value < 7);
    counts[value]++;
  }
  assert.ok(counts.every((count) => count > 0));
  const chiSquared = counts.reduce((sum, count) => sum + (count - 10000) ** 2 / 10000, 0);
  assert.ok(chiSquared < 40, `Chi-cuadrado (6 grados de libertad): ${chiSquared}`);
});

test("el fallo del CSPRNG se propaga sin usar otro generador", (t) => {
  const failure = new Error("CSPRNG no disponible");
  const rng = t.mock.method(globalThis.crypto, "getRandomValues", () => { throw failure; });
  assert.throws(() => generateChars(ALL), (error) => error === failure);
  assert.throws(() => generatePassphrase({ words: 3, separator: "-", capitalize: false, addNumber: false }),
    (error) => error === failure);
  assert.throws(() => strengthen("mi base"), (error) => error === failure);
  rng.mock.restore();
});

test("generateChars respeta las 15 combinaciones de clases, longitud y ambiguedad", () => {
  for (let mask = 1; mask < 16; mask++) {
    const enabled = [1, 2, 4, 8].map((bit) => Boolean(mask & bit));
    for (const avoidAmbiguous of [false, true]) {
      for (const length of [8, 128]) {
        const result = generateChars({ length, lower: enabled[0], upper: enabled[1], digits: enabled[2],
          symbols: enabled[3], avoidAmbiguous });
        assert.equal(result.value.length, length);
        assert.match(result.value, /^[!-~]+$/);
        CLASSES.forEach((pattern, i) => assert.equal(pattern.test(result.value), enabled[i]));
        if (avoidAmbiguous) assert.doesNotMatch(result.value, AMBIGUOUS);
        assert.equal(result.method, "chars");
        assert.equal(result.groverBits, result.bits / 2);
        assert.ok(Number.isFinite(result.bits) && result.bits > 0);
      }
    }
  }
  assert.equal(generateChars(ALL).alphabetSize, 94);
  assert.equal(generateChars({ ...ALL, lower: false, upper: false, digits: false }).alphabetSize, 32);
});

test("generateChars regenera toda la cadena cuando falta una clase", (t) => {
  const draws = [...Array(8).fill(0), ...Array(7).fill(1), 26];
  const rng = t.mock.method(globalThis.crypto, "getRandomValues", (buffer) => {
    assert.ok(draws.length > 0);
    buffer[0] = draws.shift();
    return buffer;
  });
  const result = generateChars({ ...ALL, length: 8, upper: false, symbols: false });
  assert.equal(result.value, "bbbbbbb0");
  assert.equal(rng.mock.callCount(), 16);
  rng.mock.restore();
});

test("generateChars rechaza longitudes invalidas y clases vacias", () => {
  for (const length of [7, 129, 8.5, NaN, Infinity]) {
    assert.throws(() => generateChars({ ...ALL, length }), RangeError);
  }
  assert.throws(() => generateChars({ ...ALL, lower: false, upper: false, digits: false, symbols: false }), RangeError);
});

test("1000 generaciones consecutivas no repiten contrasena", () => {
  const values = new Set(Array.from({ length: 1000 }, () => generateChars(ALL).value));
  assert.equal(values.size, 1000);
});

test("countValidLog2 coincide con enumeracion exhaustiva de alfabetos pequenos", () => {
  for (const sizes of [[1], [1, 1], [2, 1], [1, 1, 1], [2, 1, 1]]) {
    const alphabet = sizes.flatMap((size, i) => Array(size).fill(i));
    for (const length of [1, 2, 3, 4, 5]) {
      let valid = 0;
      function enumerate(prefix) {
        if (prefix.length === length) {
          if (sizes.every((_, i) => prefix.includes(i))) valid++;
          return;
        }
        for (const cls of alphabet) enumerate([...prefix, cls]);
      }
      enumerate([]);
      if (valid === 0) assert.equal(countValidLog2(length, sizes), -Infinity);
      else close(countValidLog2(length, sizes), Math.log2(valid));
    }
  }
  for (const [length, sizes] of [[-1, [1]], [1.5, [1]], [3, []], [3, [0]], [3, [1.5]], [3, [NaN]]]) {
    assert.throws(() => countValidLog2(length, sizes), RangeError);
  }
});

test("entropia de caracteres estable hasta 128 contra conteo entero exacto", () => {
  const sizes = [26, 26, 10, 32];
  for (const length of [8, 24, 128]) {
    let count = 0n;
    for (let mask = 0; mask < 16; mask++) {
      let remaining = 94;
      let excluded = 0;
      sizes.forEach((size, i) => { if (mask & (1 << i)) { remaining -= size; excluded++; } });
      count += (excluded % 2 ? -1n : 1n) * BigInt(remaining) ** BigInt(length);
    }
    const binary = count.toString(2);
    const leadingBits = binary.slice(0, 53);
    const exactLog = Math.log2(parseInt(leadingBits, 2)) + binary.length - leadingBits.length;
    close(countValidLog2(length, sizes), exactLog);
    close(generateChars({ ...ALL, length }).bits, exactLog);
  }
});

test("lista real deduplicada: al menos 2048 palabras ASCII de 4 a 8 letras", () => {
  assert.equal(WORDLIST_SIZE, new Set(WORDS).size);
  assert.ok(WORDLIST_SIZE >= 2048);
  for (const word of WORDS) assert.match(word, /^[a-z]{4,8}$/);
  const sorted = [...new Set(WORDS)].sort();
  for (let i = 1; i < sorted.length; i++) {
    assert.equal(sorted[i].startsWith(sorted[i - 1]), false, "Ambiguedad con separador vacio");
  }
});

test("frases: palabras uniformes, una mayuscula, numero y separadores", () => {
  const vocabulary = new Set(WORDS);
  for (const words of [3, 6, 12]) {
    for (const separator of ["-", " ", ":::"]) {
      for (const capitalize of [false, true]) {
        for (const addNumber of [false, true]) {
          const result = generatePassphrase({ words, separator, capitalize, addNumber });
          const tokens = result.value.split(separator);
          assert.equal(tokens.length, words + Number(addNumber));
          const numbers = tokens.filter((token) => /^\d+$/.test(token));
          assert.equal(numbers.length, Number(addNumber));
          if (addNumber) assert.ok(Number(numbers[0]) >= 0 && Number(numbers[0]) <= 999);
          const wordTokens = tokens.filter((token) => !/^\d+$/.test(token));
          assert.ok(wordTokens.every((word) => vocabulary.has(word.toLowerCase())));
          assert.equal(wordTokens.filter((word) => word === word.toUpperCase()).length, Number(capitalize));
          close(result.bits, words * Math.log2(WORDLIST_SIZE) +
            (capitalize ? Math.log2(words) : 0) + (addNumber ? Math.log2(1000) + Math.log2(words + 1) : 0));
          assert.equal(result.groverBits, result.bits / 2);
          assert.equal(result.alphabetSize, WORDLIST_SIZE);
          assert.equal(result.method, "passphrase");
        }
      }
    }
  }
  assert.match(generatePassphrase({ words: 3, separator: "", capitalize: false, addNumber: false }).value, /^[a-z]{12,24}$/);
  for (const words of [2, 13, 3.5, NaN]) {
    assert.throws(() => generatePassphrase({ words, separator: "-", capitalize: false, addNumber: false }), RangeError);
  }
  assert.throws(() => generatePassphrase({ words: 3, separator: "----", capitalize: false, addNumber: false }), RangeError);
});

test("frase: el CSPRNG selecciona palabras, mayuscula, numero y posicion", (t) => {
  const draws = [0, 1, 2, 1, 999, 0];
  const rng = t.mock.method(globalThis.crypto, "getRandomValues", (buffer) => {
    assert.ok(draws.length > 0);
    buffer[0] = draws.shift();
    return buffer;
  });
  const pool = [...new Set(WORDS)];
  const result = generatePassphrase({ words: 3, separator: "-", capitalize: true, addNumber: true });
  assert.equal(result.value, `999-${pool[0]}-${pool[1].toUpperCase()}-${pool[2]}`);
  assert.equal(rng.mock.callCount(), 6);
  rng.mock.restore();
});

test("strengthen conserva la base como subsecuencia y solo cuenta caracteres anadidos", () => {
  for (const base of ["mi base memorable", "aaaaaa", "Mi🌈Clave\u0301", "clave-123"]) {
    for (const target of [1, 80, 128, 256]) {
      const result = strengthen(base, target);
      let position = 0;
      const original = [...base];
      for (const char of result.value) if (char === original[position]) position++;
      assert.equal(position, original.length);
      const added = [...result.value].length - original.length;
      assert.equal(added, Math.ceil(target / Math.log2(94)));
      close(result.bits, added * Math.log2(94));
      assert.ok(result.bits >= target);
      assert.equal(result.groverBits, result.bits / 2);
      assert.equal(result.alphabetSize, 94);
      assert.equal(result.method, "strengthen");
    }
  }
  assert.ok(strengthen("base").bits >= 80);
  assert.ok(strengthen("base", 58.991299665098744).bits >= 58.991299665098744);
  for (const target of [0, -1, NaN, Infinity, Number.MAX_VALUE]) {
    assert.throws(() => strengthen("base", target), RangeError);
  }
});

test("strengthen inserta al inicio y al final y usa los 94 caracteres", (t) => {
  const draws = [0, 0, 93, 2];
  const rng = t.mock.method(globalThis.crypto, "getRandomValues", (buffer) => {
    assert.ok(draws.length > 0);
    buffer[0] = draws.shift();
    return buffer;
  });
  assert.equal(strengthen("a", 7).value, "!a~");
  assert.equal(rng.mock.callCount(), 4);
  rng.mock.restore();
});

test("strengthen de base vacia equivale a caracteres con todas las clases", () => {
  for (const target of [1, 80, 128, 512]) {
    const result = strengthen("", target);
    assert.equal(result.method, "chars");
    assert.ok(result.bits >= target);
    assert.ok(result.value.length >= 8 && result.value.length <= 128);
    for (const pattern of CLASSES) assert.match(result.value, pattern);
    assert.equal(result.alphabetSize, 94);
  }
  assert.throws(() => strengthen("", 1000), RangeError);
});

test("fuentes: sin generador inseguro; modulos privados sin E/S ni persistencia", async () => {
  const sourceDir = new URL("../src/", import.meta.url);
  const files = (await readdir(sourceDir)).filter((file) => file.endsWith(".ts"));
  for (const file of files) {
    const source = await readFile(new URL(file, sourceDir), "utf8");
    assert.equal(/Math\s*\.\s*random\b/.test(source), false, `${file}: generador inseguro`);
    if (file === "generator.ts" || file === "wordlist.ts") {
      assert.equal(/fetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|localStorage|sessionStorage|indexedDB|console/.test(source),
        false, `${file}: E/S o persistencia prohibida`);
    }
  }
});
