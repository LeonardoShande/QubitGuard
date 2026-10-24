// Gráficos SVG propios, dibujados al ancho real del contenedor para que el texto no se deforme.
const NS = "http://www.w3.org/2000/svg";
function el(tag, attrs, parent) {
    const node = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs))
        node.setAttribute(k, String(v));
    parent?.appendChild(node);
    return node;
}
function text(parent, x, y, content, attrs = {}) {
    const t = el("text", { x, y, ...attrs }, parent);
    t.textContent = content;
    return t;
}
const draws = new WeakMap();
const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
        const draw = draws.get(entry.target);
        const width = Math.floor(entry.contentRect.width);
        const host = entry.target;
        if (draw && width > 0 && Number(host.dataset.width) !== width)
            paint(host, draw, width);
    }
});
function paint(host, draw, width) {
    host.dataset.width = String(width);
    host.replaceChildren(draw(width));
}
/** Retira también el redibujado pendiente al pasar a un estado vacío. */
export function unmount(host) {
    observer.unobserve(host);
    draws.delete(host);
    host.removeAttribute("data-width");
    host.replaceChildren();
}
/** Dibuja en `host` y vuelve a dibujar cuando cambia su ancho. */
export function mount(host, draw) {
    if (!draws.has(host))
        observer.observe(host);
    draws.set(host, draw);
    // Ancho real del contenedor: un mínimo fijo desbordaba a 320 px (WCAG 1.4.10).
    paint(host, draw, Math.floor(host.clientWidth) || 240);
}
let uid = 0;
/** Raíz accesible: <title> corto y <desc> con el resumen de los datos, enlazados por id. */
function svgRoot(width, height, title, desc) {
    const id = `chart-${++uid}`;
    const svg = el("svg", {
        width, height, viewBox: `0 0 ${width} ${height}`, role: "img",
        "aria-labelledby": `${id}-t`, "aria-describedby": `${id}-d`,
    });
    el("title", { id: `${id}-t` }, svg).textContent = title;
    el("desc", { id: `${id}-d` }, svg).textContent = desc;
    return svg;
}
function niceTicks(max, count = 4) {
    if (max <= 0)
        return [0];
    const raw = max / count;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
    const steps = Math.ceil(max / step - 1e-9);
    return Array.from({ length: steps + 1 }, (_, i) => Number((i * step).toPrecision(12)));
}
const PAD = { top: 16, right: 12, bottom: 40, left: 48 };
export function barChart(o) {
    return (width) => {
        const height = o.height ?? 240;
        const svg = svgRoot(width, height, o.title, o.label);
        if (!o.values.length)
            return svg;
        const w = width - PAD.left - PAD.right;
        const h = height - PAD.top - PAD.bottom;
        const max = Math.max(1, ...o.values);
        const ticks = niceTicks(max);
        const top = ticks[ticks.length - 1] || 1;
        const g = el("g", { transform: `translate(${PAD.left},${PAD.top})` }, svg);
        const fmt = o.yFormat ?? ((v) => v.toLocaleString("es-PE"));
        for (const t of ticks) {
            const y = h - (t / top) * h;
            el("line", { x1: 0, x2: w, y1: y, y2: y, class: "grid" }, g);
            text(g, -8, y + 4, fmt(t), { class: "tick", "text-anchor": "end" });
        }
        const n = o.values.length;
        const slot = w / n;
        const gap = slot > 8 ? Math.min(4, slot * 0.2) : 0.5;
        const bars = el("g", { class: "bars" }, g);
        o.values.forEach((v, i) => {
            const bh = (v / top) * h;
            const rect = el("rect", {
                x: i * slot + gap / 2, y: h - bh, width: Math.max(1, slot - gap), height: Math.max(0, bh),
                class: i === o.highlight ? "bar bar--hi" : "bar",
            }, bars);
            const title = el("title", {}, rect);
            title.textContent = `${o.labels[i]}: ${fmt(v)}`;
        });
        // Etiquetas del eje X: todas si caben, si no las de los extremos y la resaltada.
        const labelWidth = Math.max(1, ...o.labels.map((l) => l.length)) * 7 + 6;
        const every = Math.max(1, Math.ceil(labelWidth / slot));
        o.labels.forEach((l, i) => {
            const show = i % every === 0 || i === o.highlight;
            if (!show)
                return;
            if (i !== o.highlight && o.highlight !== undefined && Math.abs(i - o.highlight) < every)
                return;
            text(g, i * slot + slot / 2, h + 16, l, {
                class: i === o.highlight ? "tick tick--hi" : "tick", "text-anchor": "middle",
            });
        });
        text(g, w / 2, h + 34, o.xTitle, { class: "axis-title", "text-anchor": "middle" });
        for (const r of o.refLines ?? []) {
            if (!Number.isFinite(r.at))
                continue;
            const x = Math.min(w, Math.max(0, r.at * slot));
            el("line", { x1: x, x2: x, y1: -4, y2: h, class: `ref ${r.cls}` }, g);
        }
        el("line", { x1: 0, x2: w, y1: h, y2: h, class: "axis" }, g);
        return svg;
    };
}
const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const pow10Label = (k) => (k === 0 ? "1" : k === 1 ? "10" : `10${String(k).replace(/\d/g, (d) => SUP[Number(d)])}`);
export function lineChart(o) {
    return (width) => {
        const height = o.height ?? 240;
        const svg = svgRoot(width, height, o.title, o.label);
        const w = width - PAD.left - PAD.right;
        const h = height - PAD.top - PAD.bottom;
        const g = el("g", { transform: `translate(${PAD.left},${PAD.top})` }, svg);
        const all = o.series.flatMap((s) => s.ys).filter(Number.isFinite);
        if (!all.length || !o.xs.length)
            return svg;
        let ticks;
        let top;
        let tickLabel;
        if (o.log10) {
            const maxExp = Math.max(1, Math.ceil(Math.max(...all)));
            const step = Math.ceil(maxExp / 5);
            top = Math.ceil(maxExp / step) * step;
            ticks = [];
            for (let k = 0; k <= top; k += step)
                ticks.push(k);
            tickLabel = pow10Label;
        }
        else {
            ticks = niceTicks(o.yMax ?? Math.max(...all));
            top = ticks[ticks.length - 1] || 1;
            tickLabel = o.yFormat ?? ((v) => v.toLocaleString("es-PE"));
        }
        const minX = o.xs[0] ?? 0;
        const maxX = o.xs[o.xs.length - 1] ?? 1;
        const sx = (x) => (maxX === minX ? w / 2 : ((x - minX) / (maxX - minX)) * w);
        const sy = (y) => h - (Math.max(0, y) / top) * h;
        for (const t of ticks) {
            el("line", { x1: 0, x2: w, y1: sy(t), y2: sy(t), class: "grid" }, g);
            text(g, -8, sy(t) + 4, tickLabel(t), { class: "tick", "text-anchor": "end" });
        }
        const every = Math.max(1, Math.ceil(o.xs.length / Math.max(2, Math.floor(w / 36))));
        const last = o.xs.length - 1;
        o.xs.forEach((x, i) => {
            if ((i % every === 0 && (i === last || last - i >= every)) || i === last || x === o.highlightX) {
                text(g, sx(x), h + 16, String(x), { class: x === o.highlightX ? "tick tick--hi" : "tick", "text-anchor": "middle" });
            }
        });
        text(g, w / 2, h + 34, o.xTitle, { class: "axis-title", "text-anchor": "middle" });
        el("line", { x1: 0, x2: w, y1: h, y2: h, class: "axis" }, g);
        if (o.highlightX !== undefined && o.highlightX >= minX && o.highlightX <= maxX) {
            el("line", { x1: sx(o.highlightX), x2: sx(o.highlightX), y1: 0, y2: h, class: "ref ref--hi" }, g);
        }
        for (const s of o.series) {
            const d = s.ys.map((y, i) => `${i ? "L" : "M"}${sx(o.xs[i]).toFixed(1)},${sy(y).toFixed(1)}`).join("");
            el("path", { d, class: `line ${s.cls}` }, g);
            s.ys.forEach((y, i) => {
                const x = o.xs[i];
                const dot = el("circle", {
                    cx: sx(x), cy: sy(y), r: x === o.highlightX ? 5.5 : 3,
                    class: x === o.highlightX ? `dot ${s.cls} dot--hi` : `dot ${s.cls}`,
                }, g);
                const title = el("title", {}, dot);
                title.textContent = `${s.name}, ${x}: ${o.log10 ? `10^${y.toFixed(1)}` : tickLabel(y)}`;
            });
        }
        return svg;
    };
}
