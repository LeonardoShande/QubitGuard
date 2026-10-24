import test from "node:test";
import assert from "node:assert/strict";

const preference = { matches: false };
globalThis.window = { matchMedia: () => preference };
const { motion } = await import("../dist/dom.js");

test("una nueva transición cancela la anterior del mismo elemento", () => {
  let cancelled = 0;
  const node = { animate: () => ({ cancel() { cancelled++; } }) };
  motion(node, [{ opacity: 0 }, { opacity: 1 }], 240);
  motion(node, [{ opacity: 0 }, { opacity: 1 }], 240);
  assert.equal(cancelled, 1);
});

test("movimiento reducido cancela una transición activa y no inicia otra", () => {
  let cancelled = 0;
  let started = 0;
  const node = { animate: () => { started++; return { cancel() { cancelled++; } }; } };
  motion(node, [{ opacity: 0 }, { opacity: 1 }], 240);
  preference.matches = true;
  assert.equal(motion(node, [{ opacity: 0 }, { opacity: 1 }], 240), null);
  assert.equal(started, 1);
  assert.equal(cancelled, 1);
  preference.matches = false;
});

test("sin Web Animations el contenido conserva el estado final del DOM", () => {
  assert.equal(motion({}, [{ opacity: 0 }, { opacity: 1 }], 240), null);
});
