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
    if (slot) {
        const appearing = Boolean(message) && !slot.textContent;
        slot.textContent = message;
        if (appearing)
            motion(slot, [{ opacity: 0, transform: "translateY(-4px)" }, { opacity: 1, transform: "none" }], 180);
    }
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
const counts = new WeakMap();
/**
 * Cifra que cuenta hasta `to` (ease-out, 420 ms) desde su valor anterior; la primera vez,
 * desde 0. Con `animate=false` o movimiento reducido escribe el valor final al instante.
 * Bucle transitorio de rAF: se cancela si llega otro valor (interrumpible) y muere al terminar.
 */
export function countTo(node, to, format, animate = true) {
    const prev = counts.get(node);
    if (prev)
        cancelAnimationFrame(prev.frame);
    const from = prev?.value ?? 0;
    const state = { value: to, frame: 0 };
    counts.set(node, state);
    if (!animate || reduceQuery.matches || from === to || !Number.isFinite(from) || !Number.isFinite(to) || typeof requestAnimationFrame !== "function") {
        node.textContent = format(to);
        return;
    }
    const t0 = performance.now();
    const tick = (now) => {
        const t = Math.min(1, (now - t0) / 420);
        node.textContent = format(t < 1 ? from + (to - from) * (1 - (1 - t) ** 3) : to);
        if (t < 1)
            state.frame = requestAnimationFrame(tick);
    };
    state.frame = requestAnimationFrame(tick);
}
/**
 * Entrada de secciones al hacer scroll: una sola vez por sección. Solo se activa con
 * IntersectionObserver y movimiento permitido; sin JS ni con movimiento reducido todo
 * queda visible (el CSS oculta solo bajo html.reveal-on).
 */
export function initReveal() {
    if (reduceQuery.matches || typeof IntersectionObserver !== "function")
        return;
    const targets = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
            if (!e.isIntersecting)
                continue;
            e.target.classList.add("is-in");
            io.unobserve(e.target);
        }
    }, { rootMargin: "0px 0px -12% 0px" });
    targets.forEach((t) => io.observe(t));
    // El foco por teclado nunca cae en contenido aún transparente.
    document.addEventListener("focusin", (e) => e.target.closest?.("[data-reveal]")?.classList.add("is-in"));
    document.documentElement.classList.add("reveal-on");
}
