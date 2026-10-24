import test from "node:test";
import assert from "node:assert/strict";

globalThis.window = { matchMedia: () => ({ matches: false }) };
const { amplitudesAt, groverAngle, maxIterations, optimalIterations, randomSuccess, theoreticalSuccess } = await import("../dist/explorer.js");

test("las amplitudes del explorador están normalizadas y dan sin²((2k+1)θ)", () => {
  for (let n = 2; n <= 10; n++) {
    const N = 2 ** n;
    for (let k = 0; k <= maxIterations(n); k++) {
      const a = amplitudesAt(n, (2 * k + 1) * groverAngle(n));
      assert.ok(Math.abs(a.marked ** 2 + (N - 1) * a.other ** 2 - 1) < 1e-12);
      assert.ok(Math.abs(a.marked ** 2 - theoreticalSuccess(n, k)) < 1e-12);
    }
  }
});

test("una iteración = oráculo (cambia el signo de ω) + reflexión sobre la media", () => {
  const n = 4;
  const N = 2 ** n;
  const before = amplitudesAt(n, groverAngle(n));
  const flipped = -before.marked;
  const mean = (flipped + (N - 1) * before.other) / N;
  const after = amplitudesAt(n, 3 * groverAngle(n));
  assert.ok(Math.abs(2 * mean - flipped - after.marked) < 1e-12);
  assert.ok(Math.abs(2 * mean - before.other - after.other) < 1e-12);
});

test("óptimo y búsqueda al azar coinciden con los valores conocidos", () => {
  assert.equal(optimalIterations(2), 1);
  assert.equal(optimalIterations(4), 3);
  assert.equal(optimalIterations(10), 25);
  assert.equal(theoreticalSuccess(2, 1).toFixed(12), "1.000000000000");
  assert.equal(randomSuccess(4, 3), 3 / 16);
  assert.equal(randomSuccess(2, 9), 1);
});
