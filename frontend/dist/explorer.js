import { $, h } from "./dom.js";
// Explorador de amplitudes: cálculo local exacto, sin red. Un único ángulo φ = (2k+1)θ
// describe el estado tras k iteraciones; barras, vector y lecturas salen de él, así que
// todo lo que se dibuja durante una transición es coherente entre sí.
/** θ con sin θ = 1/√N: ángulo inicial entre |s⟩ y el eje |s'⟩ (resto de estados). */
export const groverAngle = (n) => Math.asin(1 / Math.sqrt(2 ** n));
export const optimalIterations = (n) => Math.floor(Math.PI / (4 * groverAngle(n)));
export const theoreticalSuccess = (n, k) => Math.sin((2 * k + 1) * groverAngle(n)) ** 2;
/** Búsqueda al azar sin repetir con las mismas k consultas al oráculo. */
export const randomSuccess = (n, k) => Math.min(1, k / 2 ** n);
/** Mayor k del control: dos veces el óptimo más dos, para ver cómo se pasa de largo. */
export const maxIterations = (n) => 2 * optimalIterations(n) + 2;
/** Amplitudes reales tras rotar a φ: la del marcado, la de cada uno de los otros N−1 y su media. */
export function amplitudesAt(n, phi) {
    const N = 2 ** n;
    const marked = Math.sin(phi);
    const other = Math.cos(phi) / Math.sqrt(N - 1);
    return { marked, other, mean: (marked + (N - 1) * other) / N };
}
const pct = (x) => `${(x * 100).toLocaleString("es-PE", { maximumFractionDigits: Math.abs(x) < 0.1 ? 2 : 1 })} %`;
const num = (x) => x.toLocaleString("es-PE", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const deg = (rad) => `${(rad * 180 / Math.PI).toLocaleString("es-PE", { maximumFractionDigits: 1 })}°`;
const BAR_HALF = 84; // px: amplitud 1 (la mitad de .amp__plot, 168 px)
const O = 130; // centro del plano en el viewBox 260×260
const R = 104;
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
export function initExplorer(startUnlocked) {
    const nInput = $("amp-n");
    const kInput = $("amp-k");
    const stepBtn = $("amp-step");
    const resetBtn = $("amp-reset");
    const plot = $("amp-bars");
    const meanLine = $("amp-mean");
    const phase = $("amp-phase");
    const live = $("amp-live");
    const svg = $("amp-geo");
    const geo = (id) => svg.querySelector(`#${id}`);
    const vec = geo("geo-vec");
    const tip = geo("geo-tip");
    const projW = geo("geo-proj-w");
    const projS = geo("geo-proj-s");
    const guideW = geo("geo-guide-w");
    const ghost = geo("geo-s");
    let n = Number(nInput.value);
    let k = Number(kInput.value);
    let phi = (2 * k + 1) * groverAngle(n);
    let bars = [];
    let token = 0; // invalida tweens y pasos en curso al llegar otra orden (interrumpible)
    let liveTimer = 0;
    const buildBars = () => {
        const count = Math.min(2 ** n, 8);
        if (bars.length === count)
            return;
        bars = Array.from({ length: count }, (_, i) => h("span", { class: i === 0 ? "amp__bar amp__bar--hi" : "amp__bar" }));
        plot.querySelectorAll(".amp__col").forEach((c) => c.remove());
        plot.prepend(...bars.map((b, i) => h("span", { class: "amp__col" }, b, h("span", { class: "amp__lbl mono" }, i === 0 ? "ω" : ""))));
    };
    const set = (node, attrs) => {
        for (const [a, v] of Object.entries(attrs))
            node.setAttribute(a, v.toFixed(2));
    };
    /** Dibuja el estado de ángulo `p`: barras, media y vector. Solo transform y atributos SVG. */
    const render = (p) => {
        const a = amplitudesAt(n, p);
        bars.forEach((b, i) => { b.style.transform = `scaleY(${(i === 0 ? a.marked : a.other).toFixed(4)})`; });
        meanLine.style.transform = `translateY(${(-a.mean * BAR_HALF).toFixed(2)}px)`;
        const x = O + R * Math.cos(p);
        const y = O - R * Math.sin(p);
        set(vec, { x2: x, y2: y });
        set(tip, { cx: x, cy: y });
        set(projW, { y2: y });
        set(projS, { x2: x });
        set(guideW, { x1: x, y1: y, y2: y });
    };
    /** Lleva φ al objetivo con ease-out; con movimiento reducido salta. Resuelve false si otra orden lo interrumpe. */
    const tween = (to, duration, id) => new Promise((resolve) => {
        const from = phi;
        if (reduce.matches || duration <= 0 || typeof requestAnimationFrame !== "function") {
            phi = to;
            render(phi);
            resolve(true);
            return;
        }
        const t0 = performance.now();
        const frame = (now) => {
            if (id !== token) {
                resolve(false);
                return;
            }
            const t = Math.min(1, (now - t0) / duration);
            phi = from + (to - from) * (1 - (1 - t) ** 3);
            render(phi);
            if (t < 1)
                requestAnimationFrame(frame);
            else
                resolve(true);
        };
        requestAnimationFrame(frame);
    });
    /** Texto de lectura inmediato; el resumen para lectores de pantalla espera a que pares. */
    const readout = () => {
        const N = 2 ** n;
        const theta = groverAngle(n);
        const opt = optimalIterations(n);
        const pg = theoreticalSuccess(n, k);
        const pr = randomSuccess(n, k);
        const a = amplitudesAt(n, (2 * k + 1) * theta);
        $("amp-n-out").textContent = String(n);
        $("amp-k-out").textContent = String(k);
        $("amp-N").textContent = N.toLocaleString("es-PE");
        $("amp-theta").textContent = deg(theta);
        $("amp-opt").textContent = String(opt);
        $("amp-p").textContent = pct(pg);
        $("amp-r").textContent = pct(pr);
        $("amp-phi").textContent = deg((2 * k + 1) * theta);
        $("amp-fill-g").style.transform = `scaleX(${pg})`;
        $("amp-fill-r").style.transform = `scaleX(${pr})`;
        nInput.setAttribute("aria-valuetext", `${n} qubits, ${N} estados`);
        kInput.setAttribute("aria-valuetext", `${k} ${k === 1 ? "iteración" : "iteraciones"}; el óptimo es ${opt}`);
        stepBtn.disabled = k >= Number(kInput.max);
        resetBtn.disabled = k === 0;
        const verdict = k === opt ? "Es el óptimo." : k < opt ? `Faltan ${opt - k} para el óptimo.` : `Te pasaste del óptimo (${opt}): la flecha siguió girando.`;
        $("amp-verdict").textContent = verdict;
        $("amp-bars-note").textContent =
            `Marcado: amplitud ${num(a.marked)}, probabilidad ${pct(a.marked ** 2)}. Cada uno de los otros ${(N - 1).toLocaleString("es-PE")}: ${num(a.other)}. Media: ${num(a.mean)}.` +
                (N > 8 ? ` Se dibujan 7 de los ${(N - 1).toLocaleString("es-PE")} restantes: todos valen lo mismo.` : "");
        $("amp-geo-d").textContent =
            `La flecha del estado forma ${deg((2 * k + 1) * theta)} con el eje del resto. Su sombra sobre el eje del marcado mide ${num(a.marked)}; al cuadrado, ${pct(pg)}.`;
        clearTimeout(liveTimer);
        liveTimer = window.setTimeout(() => {
            live.textContent = `${n} qubits, ${k} ${k === 1 ? "iteración" : "iteraciones"}: Grover acierta con ${pct(pg)}; al azar con ${k} consultas, ${pct(pr)}. ${verdict}`;
        }, 450);
    };
    const syncN = () => {
        n = Number(nInput.value);
        const max = maxIterations(n);
        kInput.max = String(max);
        if (k > max) {
            k = max;
            kInput.value = String(k);
        }
        const theta = groverAngle(n);
        set(ghost, { x2: O + R * Math.cos(theta), y2: O - R * Math.sin(theta) });
        buildBars();
    };
    const goTo = (nextK, duration = 320) => {
        k = nextK;
        kInput.value = String(k);
        phase.textContent = "";
        plot.classList.remove("is-oracle", "is-diffusing");
        readout();
        void tween((2 * k + 1) * groverAngle(n), duration, ++token);
    };
    /** Una iteración en dos tiempos: el oráculo refleja sobre |s'⟩ (φ → −φ) y el difusor sobre |s⟩ (−φ → φ + 2θ). */
    const step = async () => {
        if (k >= Number(kInput.max))
            return;
        const id = ++token;
        const theta = groverAngle(n);
        const start = (2 * k + 1) * theta;
        phase.textContent = "1/2 Oráculo: cambia el signo de ω";
        plot.classList.add("is-oracle");
        if (!(await tween(-start, 380, id)))
            return;
        phase.textContent = "2/2 Difusor: refleja todo respecto a la media";
        plot.classList.replace("is-oracle", "is-diffusing");
        if (!(await tween(start + 2 * theta, 420, id)))
            return;
        plot.classList.remove("is-diffusing");
        phase.textContent = "";
        k += 1;
        kInput.value = String(k);
        readout();
        if (k >= Number(kInput.max))
            kInput.focus();
    };
    nInput.addEventListener("input", () => { syncN(); goTo(k, 260); });
    kInput.addEventListener("input", () => goTo(Number(kInput.value)));
    stepBtn.addEventListener("click", () => { void step(); });
    resetBtn.addEventListener("click", () => goTo(0, 420));
    syncN();
    render(phi);
    readout();
    const gate = $("amp-gate");
    const body = $("amp-body");
    const unlock = () => { gate.hidden = true; body.hidden = false; };
    $("amp-open").addEventListener("click", () => { unlock(); nInput.focus(); });
    if (startUnlocked)
        unlock();
    return { unlock };
}
