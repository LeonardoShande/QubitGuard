// Utilidades DOM compartidas por main.ts y password-ui.ts.

export function $<T extends HTMLElement = HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Falta #${id} en index.html`);
  return node as T;
}

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K, props: Partial<Record<string, string>> = {}, ...children: Array<Node | string>
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) if (v !== undefined) node.setAttribute(k, v);
  node.append(...children);
  return node;
}

/** Escribe el error de un campo en #<id>-error (enlazado por aria-describedby). Devuelve true si es válido. */
export function fieldError(input: HTMLElement, message: string): boolean {
  const slot = document.getElementById(`${input.id}-error`);
  if (slot) slot.textContent = message;
  input.setAttribute("aria-invalid", String(Boolean(message)));
  return !message;
}

const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const animations = new WeakMap<Element, Animation>();

/** Web Animations API con la curva del sistema; no hace nada si el usuario pidió menos movimiento. */
export function motion(node: Element, keyframes: Keyframe[], duration: number, delay = 0): Animation | null {
  animations.get(node)?.cancel();
  if (reduceQuery.matches || typeof node.animate !== "function") return null;
  const animation = node.animate(keyframes, { duration, delay, easing: "cubic-bezier(0.23, 1, 0.32, 1)", fill: "backwards" });
  animations.set(node, animation);
  return animation;
}
