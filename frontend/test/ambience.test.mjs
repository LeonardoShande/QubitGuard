import test from "node:test";
import assert from "node:assert/strict";

class Element extends EventTarget {
  hidden = false;
  removed = false;
  textContent = "";
  title = "";
  attributes = new Map([["aria-pressed", "true"]]);
  classes = new Set();
  classList = { toggle: (name, on) => on ? this.classes.add(name) : this.classes.delete(name) };
  getAttribute(name) { return this.attributes.get(name); }
  setAttribute(name, value) { this.attributes.set(name, value); }
  remove() { this.removed = true; }
}

function setup(reduced = false) {
  const elements = new Map(["quantum-backdrop", "ascii-toggle", "ascii-toggle-state", "ibm-intro"].map(id => [id, new Element()]));
  const preference = Object.assign(new EventTarget(), { matches: reduced });
  globalThis.window = { matchMedia: () => preference };
  globalThis.document = Object.assign(new EventTarget(), { hidden: false, getElementById: id => elements.get(id) });
  return { elements, preference, document };
}

setup();
const { initAmbience } = await import("../dist/ambience.js");

test("el control ASCII oculta el fondo y permite recuperarlo", () => {
  const { elements } = setup();
  initAmbience();
  const backdrop = elements.get("quantum-backdrop");
  const toggle = elements.get("ascii-toggle");
  assert.ok(backdrop.classes.has("is-animated"));
  toggle.dispatchEvent(new Event("click"));
  assert.equal(backdrop.hidden, true);
  assert.equal(toggle.getAttribute("aria-pressed"), "false");
  toggle.dispatchEvent(new Event("click"));
  assert.equal(backdrop.hidden, false);
  assert.ok(backdrop.classes.has("is-animated"));
});

test("pestaña oculta y movimiento reducido pausan la textura", () => {
  const { elements, preference, document } = setup();
  initAmbience();
  const backdrop = elements.get("quantum-backdrop");
  document.hidden = true;
  document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(backdrop.classes.has("is-animated"), false);
  document.hidden = false;
  document.dispatchEvent(new Event("visibilitychange"));
  assert.ok(backdrop.classes.has("is-animated"));
  preference.matches = true;
  preference.dispatchEvent(new Event("change"));
  assert.equal(backdrop.classes.has("is-animated"), false);
});

test("movimiento reducido omite la entrada IBM", () => {
  const { elements } = setup(true);
  initAmbience();
  assert.equal(elements.get("ibm-intro").removed, true);
  assert.equal(elements.get("quantum-backdrop").classes.has("is-animated"), false);
});

test("Escape o el final de la entrada retiran su capa", () => {
  const { elements, document } = setup();
  initAmbience();
  const key = new Event("keydown");
  key.key = "Escape";
  document.dispatchEvent(key);
  assert.equal(elements.get("ibm-intro").removed, true);
  const next = setup();
  initAmbience();
  next.elements.get("ibm-intro").dispatchEvent(new Event("animationend"));
  assert.equal(next.elements.get("ibm-intro").removed, true);
});
