// Utilidades DOM compartidas por main.ts y password-ui.ts.
export function $(id) {
    const node = document.getElementById(id);
    if (!node)
        throw new Error(`Falta #${id} en index.html`);
    return node;
}
export function h(tag, props = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props))
        if (v !== undefined)
            node.setAttribute(k, v);
    node.append(...children);
    return node;
}
/** Escribe el error de un campo en #<id>-error (enlazado por aria-describedby). Devuelve true si es válido. */
export function fieldError(input, message) {
    const slot = document.getElementById(`${input.id}-error`);
    if (slot)
        slot.textContent = message;
    input.setAttribute("aria-invalid", String(Boolean(message)));
    return !message;
}
const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const animations = new WeakMap();
/** Web Animations API con la curva del sistema; no hace nada si el usuario pidió menos movimiento. */
export function motion(node, keyframes, duration, delay = 0) {
    animations.get(node)?.cancel();
    if (reduceQuery.matches || typeof node.animate !== "function")
        return null;
    const animation = node.animate(keyframes, { duration, delay, easing: "cubic-bezier(0.23, 1, 0.32, 1)", fill: "backwards" });
    animations.set(node, animation);
    return animation;
}
