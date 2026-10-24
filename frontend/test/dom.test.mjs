import test from "node:test";
import assert from "node:assert/strict";

const preference = { matches: false };
globalThis.window = { matchMedia: () => preference };
const { countTo, motion } = await import("../dist/dom.js");

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

test("countTo escribe NaN e Infinity al instante, sin interpolar ni programar frames", () => {
  const frames = [];
  globalThis.requestAnimationFrame = (cb) => frames.push(cb);
  globalThis.cancelAnimationFrame = () => {};
  const node = { textContent: "" };
  const fmt = (v) => (Number.isFinite(v) ? v.toFixed(2) : "∞/NaN");
  countTo(node, 10, fmt);
  assert.equal(frames.length, 1, "un valor finito sí anima");
  countTo(node, Infinity, fmt);
  assert.equal(node.textContent, "∞/NaN");
  countTo(node, NaN, fmt);
  assert.equal(node.textContent, "∞/NaN");
  countTo(node, 5, fmt);
  assert.equal(node.textContent, "5.00", "desde un valor no finito tampoco interpola");
  assert.equal(frames.length, 1);
  delete globalThis.requestAnimationFrame;
  delete globalThis.cancelAnimationFrame;
});
