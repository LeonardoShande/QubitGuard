// Comprobación mínima del análisis local: node --test test/password.test.mjs (tras npm run build).
import test from "node:test";
import assert from "node:assert/strict";
import { analyze, formatDuration } from "../dist/password.js";

test("alfabeto y entropía bruta", () => {
  const a = analyze("xK9#mQ2v", 1e10);
  assert.equal(a.alphabet, 26 + 26 + 10 + 33);
  assert.ok(Math.abs(a.rawBits - 8 * Math.log2(95)) < 1e-9);
  assert.equal(a.penalties.length, 0);
});

test("patrones penalizan", () => {
  for (const pw of ["password", "p4ssw0rd", "qwerty", "abcdef", "aaaaaa", "lima2024"]) {
    const a = analyze(pw, 1e10);
    assert.ok(a.penalties.length > 0, pw);
    assert.ok(a.bits < a.rawBits, pw);
  }
});

test("Grover reduce los bits a la mitad", () => {
  const a = analyze("Tr0mb0n-Galaxia-Ceviche-77!", 1e10);
  assert.ok(a.groverLog10Seconds < a.classicalLog10Seconds / 1.5);
  assert.equal(analyze("", 1e10).strength, "vacia");
  assert.equal(formatDuration(-1), "menos de un segundo");
});
