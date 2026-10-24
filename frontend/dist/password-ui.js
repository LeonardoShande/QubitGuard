// Interfaz del analizador y del generador de contraseñas. Todo ocurre en este navegador:
// este módulo no hace peticiones, no persiste nada y no escribe en la consola. El progreso
// (paso de la ruta, logro de 128 bits) lo registra main.ts a través de `onStrong`, que solo
// recibe el tipo de evento, jamás la contraseña.
import { $, fieldError, h } from "./dom.js";
import { generateChars, generatePassphrase, strengthen, WORDLIST_SIZE, } from "./generator.js";
import { analyze, formatDuration, formatPow10, STRENGTH_LABEL } from "./password.js";
/** Meta educativa de 128 bits; no certifica resistencia a un ataque real. */
export const GROVER_GOAL_BITS = 128;
/** Extremo de la escala del medidor del generador. */
const GOAL_SCALE_BITS = 192;
const STRENGTH_COLOR = {
    "vacia": "var(--edge)", "muy-debil": "var(--err)", "debil": "var(--warn)",
    "razonable": "#e9d26a", "fuerte": "var(--ok)", "muy-fuerte": "var(--cyan)",
};
const fmtBits = (b) => b.toLocaleString("es-PE", { maximumFractionDigits: 1 });
/**
 * Anuncio para lectores de pantalla con espera: al teclear o arrastrar un slider solo se lee el
 * último estado, no uno por pulsación. Nunca recibe la contraseña, solo el veredicto y los bits.
 */
function announcer(id) {
    const region = $(id);
    let timer = 0;
    return (text) => {
        clearTimeout(timer);
        timer = window.setTimeout(() => { region.textContent = text; }, 700);
    };
}
export function initPasswordUI(hooks) {
    initAnalyzer(hooks);
    initGenerator(hooks);
}
// Analizador ----------------------------------------------------------------
function initAnalyzer(hooks) {
    const announce = announcer("pw-live");
    const input = $("pw-input");
    const toggle = $("pw-toggle");
    const rateInput = $("pw-rate");
    const render = () => {
        const rate = Number(rateInput.value.replace(",", "."));
        const rateOk = Number.isFinite(rate) && rate >= 1 && rate <= 1e30;
        fieldError(rateInput, rateOk ? "" : "Escribe un número entre 1 y 1e30, por ejemplo 1e10. Mientras tanto se usa 1e10.");
        const a = analyze(input.value, rateOk ? rate : 1e10);
        const empty = a.length === 0;
        const meter = $("pw-meter");
        meter.style.transform = `scaleX(${Math.min(1, a.bits / GROVER_GOAL_BITS)})`;
        meter.style.background = STRENGTH_COLOR[a.strength];
        $("pw-strength").textContent = STRENGTH_LABEL[a.strength];
        $("pw-bits").textContent = empty ? "" : `${a.bits.toFixed(1)} bits de entropía estimada (${(a.bits / 2).toFixed(1)} efectivos frente a Grover)`;
        $("pw-len").textContent = String(a.length);
        $("pw-alpha").textContent = empty ? "—" : `${a.alphabet} símbolos`;
        $("pw-alpha-parts").textContent = empty ? "" : a.alphabetParts.join(", ");
        $("pw-raw").textContent = empty ? "—" : `${a.rawBits.toFixed(1)} bits`;
        $("pw-classic").textContent = empty ? "—" : formatDuration(a.classicalLog10Seconds);
        $("pw-grover").textContent = empty ? "—" : formatDuration(a.groverLog10Seconds);
        $("pw-giter").textContent = empty ? "—" : formatPow10(Math.max(0, a.groverLog10Iterations));
        const list = $("pw-penalties");
        if (empty)
            list.replaceChildren();
        else if (!a.penalties.length)
            list.replaceChildren(h("li", { class: "is-clean" }, "No detectamos patrones obvios (palabras comunes, secuencias, teclado, años o repeticiones)."));
        else
            list.replaceChildren(...a.penalties.map((p) => h("li", {}, h("span", {}, `${p.label} (${p.chars} caracteres)`), h("span", { class: "mono" }, `−${p.bits.toFixed(1)} bits`))));
        announce(empty ? "" : `${STRENGTH_LABEL[a.strength]}: ${a.bits.toFixed(1)} bits estimados.`);
        if (a.bits >= GROVER_GOAL_BITS)
            hooks.onStrong("analizada");
    };
    input.addEventListener("input", render);
    rateInput.addEventListener("input", render);
    toggle.addEventListener("click", () => {
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        toggle.replaceChildren(show ? "Ocultar" : "Mostrar", h("span", { class: "visually-hidden" }, " la contraseña"));
    });
    // Evita que el navegador restaure el valor al volver con el historial.
    window.addEventListener("pagehide", () => { input.value = ""; });
    render();
}
function initGenerator(hooks) {
    const announceGoal = announcer("gen-live");
    const form = $("gen-form");
    const out = $("gen-value");
    const showBtn = $("gen-show");
    const copyBtn = $("gen-copy");
    const status = $("gen-status");
    const length = $("gen-length");
    const words = $("gen-words");
    const classBoxes = ["gen-lower", "gen-upper", "gen-digits", "gen-symbols"].map((id) => $(id));
    // El valor vive solo en esta variable y en el DOM mientras la página está abierta.
    let current = null;
    let visible = false;
    $("gen-wordlist").textContent = WORDLIST_SIZE.toLocaleString("es-PE");
    $("gen-perword").textContent = fmtBits(Math.log2(WORDLIST_SIZE));
    const mode = () => form.elements.namedItem("gen-mode").value;
    const paintValue = () => {
        if (!current) {
            out.replaceChildren(h("span", { class: "gen__empty" }, "Todavía no hay contraseña."));
            return;
        }
        const n = Array.from(current.value).length;
        out.replaceChildren(visible
            ? current.value
            : h("span", { "aria-hidden": "true" }, "•".repeat(Math.min(n, 64))));
        if (!visible)
            out.append(h("span", { class: "visually-hidden" }, `Oculta, ${n} caracteres.`));
        showBtn.disabled = false;
        copyBtn.disabled = false;
    };
    const paintMetrics = () => {
        const bits = current?.bits ?? 0;
        const meets = bits >= GROVER_GOAL_BITS;
        $("gen-bits").textContent = current ? `${fmtBits(bits)} bits` : "—";
        $("gen-grover").textContent = current ? `${fmtBits(current.groverBits)} bits` : "—";
        $("gen-alpha").textContent = !current ? "—"
            : current.method === "passphrase" ? `${current.alphabetSize.toLocaleString("es-PE")} palabras`
                : `${current.alphabetSize} símbolos`;
        const fill = $("gen-meter");
        fill.style.transform = `scaleX(${Math.min(1, bits / GOAL_SCALE_BITS)})`;
        fill.classList.toggle("is-met", meets);
        $("gen-goal").textContent = !current ? "Genera una contraseña para compararla con la meta."
            : meets ? `Cumple la meta educativa: ${fmtBits(current.groverBits)} bits efectivos frente a Grover idealizado (≥ 128 bits ⇒ ~64 efectivos). No es una certificación.`
                : `Le faltan ${fmtBits(GROVER_GOAL_BITS - bits)} bits para la meta educativa.`;
        $("gen-goal").classList.toggle("is-met", meets);
    };
    /** Genera según el modo. `byUser` distingue una acción del usuario de la carga inicial. */
    const generate = (byUser) => {
        const m = mode();
        let next = null;
        let problem = "";
        try {
            if (m === "chars") {
                const any = classBoxes.some((b) => b.checked);
                problem = any ? "" : "Activa al menos un tipo de carácter.";
                if (any) {
                    next = generateChars({
                        length: Number(length.value),
                        lower: classBoxes[0].checked, upper: classBoxes[1].checked,
                        digits: classBoxes[2].checked, symbols: classBoxes[3].checked,
                        avoidAmbiguous: $("gen-ambiguous").checked,
                    });
                }
            }
            else if (m === "passphrase") {
                next = generatePassphrase({
                    words: Number(words.value),
                    separator: $("gen-sep").value,
                    capitalize: $("gen-cap").checked,
                    addNumber: $("gen-num").checked,
                });
            }
            else {
                const base = $("pw-input").value;
                problem = base ? "" : "Escribe primero tu contraseña en el analizador de arriba; se usará como base.";
                if (base)
                    next = strengthen(base, GROVER_GOAL_BITS);
            }
        }
        catch (err) {
            problem = err instanceof Error ? err.message : "No se pudo generar.";
        }
        $("gen-classes-error").textContent = m === "chars" ? problem : "";
        $("gen-strengthen-error").textContent = m === "strengthen" ? problem : "";
        current = next;
        if (!next) {
            showBtn.disabled = true;
            copyBtn.disabled = true;
        }
        status.textContent = byUser && problem ? problem : "";
        paintValue();
        paintMetrics();
        if (byUser && next)
            announceGoal(`${fmtBits(next.bits)} bits. ${$("gen-goal").textContent}`);
        if (byUser && next && next.bits >= GROVER_GOAL_BITS)
            hooks.onStrong("generada");
    };
    const syncMode = () => {
        const m = mode();
        for (const id of ["chars", "passphrase", "strengthen"])
            $(`gen-opts-${id}`).hidden = id !== m;
    };
    form.addEventListener("submit", (e) => { e.preventDefault(); generate(true); });
    form.addEventListener("input", (e) => {
        const t = e.target;
        if (t.name === "gen-mode")
            syncMode();
        if (t.id === "gen-length")
            $("gen-length-out").textContent = t.value;
        if (t.id === "gen-words")
            $("gen-words-out").textContent = t.value;
        generate(true);
    });
    showBtn.addEventListener("click", () => {
        visible = !visible;
        showBtn.replaceChildren(visible ? "Ocultar" : "Mostrar", h("span", { class: "visually-hidden" }, " la contraseña generada"));
        paintValue();
    });
    copyBtn.addEventListener("click", async () => {
        if (!current)
            return;
        const ok = await copyText(current.value);
        // Vaciar y reescribir en el siguiente frame hace que aria-live repita el aviso en cada copia.
        status.textContent = "";
        await new Promise(requestAnimationFrame);
        status.textContent = ok
            ? "Copiada. El portapapeles ya es tu responsabilidad: pégala en tu gestor y copia otra cosa después."
            : "Tu navegador no permitió copiar. Pulsa Mostrar, enfoca la contraseña (con Tab o un clic) y cópiala con Ctrl+C o Cmd+C.";
    });
    // Al enfocarla con teclado se selecciona entera, para copiarla a mano si el portapapeles falla.
    out.addEventListener("focus", () => { if (visible && current)
        getSelection()?.selectAllChildren(out); });
    window.addEventListener("pagehide", () => { current = null; out.replaceChildren(); });
    syncMode();
    generate(false);
}
async function copyText(value) {
    try {
        await navigator.clipboard.writeText(value);
        return true;
    }
    catch {
        // Sin permiso de portapapeles (o sin contexto seguro): área de texto temporal fuera de pantalla.
        const area = h("textarea", { class: "visually-hidden", "aria-hidden": "true", readonly: "" });
        area.value = value;
        document.body.append(area);
        area.select();
        let ok = false;
        try {
            ok = document.execCommand("copy");
        }
        catch {
            ok = false;
        }
        area.remove();
        return ok;
    }
}
