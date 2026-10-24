import { api, describeError, type CompareRow, type DailyChallenge, type GroverCurve } from "./api.js";
import { barChart, lineChart, mount } from "./charts.js";
import { analyze, formatDuration, formatPow10, STRENGTH_LABEL, type Strength } from "./password.js";
import * as progress from "./progress.js";

// Utilidades DOM ---------------------------------------------------------

function $<T extends HTMLElement = HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Falta #${id} en index.html`);
  return node as T;
}

function h<K extends keyof HTMLElementTagNameMap>(
  tag: K, props: Partial<Record<string, string>> = {}, ...children: Array<Node | string>
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) if (v !== undefined) node.setAttribute(k, v);
  node.append(...children);
  return node;
}

/** Mensaje de estado; con `retry` añade un botón para reintentar. */
function setState(node: HTMLElement, message: string, retry?: () => void): void {
  node.classList.toggle("is-error", Boolean(retry));
  node.replaceChildren(message);
  if (retry) {
    const btn = h("button", { type: "button", class: "btn btn--ghost retry" }, "Reintentar");
    btn.addEventListener("click", retry);
    node.append(btn);
  }
}

function setBusy(btn: HTMLButtonElement, busy: boolean, label: string): void {
  btn.disabled = busy;
  btn.classList.toggle("is-busy", busy);
  btn.textContent = label;
}

const pct = (x: number) => `${(x * 100).toLocaleString("es-PE", { maximumFractionDigits: 1 })} %`;

/** Números grandes en notación científica legible. */
function fmtBig(x: number): string {
  if (!Number.isFinite(x)) return "∞";
  if (Math.abs(x) < 1e6) return x.toLocaleString("es-PE", { maximumFractionDigits: 1 });
  return formatPow10(Math.log10(x));
}

function intIn(input: HTMLInputElement, min: number, max: number): number | null {
  const v = Number(input.value);
  const ok = input.value.trim() !== "" && Number.isInteger(v) && v >= min && v <= max;
  input.setAttribute("aria-invalid", String(!ok));
  return ok ? v : null;
}

const optimalIterations = (n: number) => Math.floor(Math.PI / (4 * Math.asin(1 / Math.sqrt(2 ** n))));

// Progreso y HUD ---------------------------------------------------------

const player = progress.load();
const toastEl = $("toast");
let toastTimer = 0;

function renderHud(): void {
  const info = progress.levelInfo(player.xp);
  const streak = progress.currentStreak(player);
  $("hud-level").textContent = String(info.level);
  $("hud-name").textContent = info.name;
  $("hud-xp").textContent = player.xp.toLocaleString("es-PE");
  $("hud-streak").textContent = String(streak);
  $("hud-streak-unit").textContent = streak === 1 ? "día" : "días";
  const percent = Math.round(info.fraction * 100);
  $("hud-xpfill").style.width = `${percent}%`;
  const bar = $("hud-xpbar");
  bar.setAttribute("aria-valuenow", String(percent));
  bar.setAttribute("aria-valuetext", `${player.xp} de ${info.next} XP para el nivel ${info.level + 1}`);
  $("stat-streak").textContent = String(streak);
  $("stat-best").textContent = String(player.bestStreak);
  $("stat-xp").textContent = player.xp.toLocaleString("es-PE");
  $("stat-next").textContent = `${(info.next - player.xp).toLocaleString("es-PE")} XP`;
}

function celebrate(award: progress.Award | null): void {
  if (!award) return;
  const before = progress.levelInfo(player.xp - award.xp).level;
  const after = progress.levelInfo(player.xp);
  toastEl.replaceChildren(h("b", {}, `+${award.xp} XP`), ` ${award.reason}`);
  if (after.level > before) toastEl.append(h("br"), `Subiste al nivel ${after.level}: ${after.name}`);
  toastEl.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl.classList.remove("is-on"), 3200);
  renderHud();
}

// Hero: carrera azar frente a Grover (cálculo local) ---------------------

function initRace(): void {
  const input = $<HTMLInputElement>("race-bits");
  const update = () => {
    const n = Number(input.value);
    const N = 2 ** n;
    const classic = (N + 1) / 2;
    const grover = Math.max(1, optimalIterations(n));
    $("race-bits-out").textContent = String(n);
    $("race-n").textContent = fmtBig(N);
    $("race-classic").textContent = fmtBig(classic);
    $("race-grover").textContent = fmtBig(grover);
    input.setAttribute("aria-valuetext", `${n} bits`);
    const quantumRow = $("race-grover").parentElement!;
    const classicRow = $("race-classic").parentElement!;
    classicRow.style.setProperty("--w", "100%");
    quantumRow.style.setProperty("--w", `${Math.max(1.5, (Math.log10(grover + 1) / Math.log10(classic + 1)) * 100)}%`);
    $("race-note").textContent =
      `Grover necesita unas ${fmtBig(Math.round(classic / grover))} veces menos consultas al oráculo. Las barras usan escala logarítmica.`;
  };
  input.addEventListener("input", update);
  update();
}

// Reto diario ------------------------------------------------------------

const KIND_LABEL: Record<DailyChallenge["kind"], string> = {
  optimal_iterations: "Iteraciones óptimas",
  success_probability: "Probabilidad de éxito",
  classical_vs_grover: "Clásico frente a Grover",
};

async function loadChallenge(): Promise<void> {
  const box = $("challenge");
  const state = $("challenge-state");
  box.setAttribute("aria-busy", "true");
  setState(state, "Cargando el reto de hoy…");
  try {
    const c = await api.daily();
    renderChallenge(c);
    state.replaceChildren();
    $("challenge-body").hidden = false;
  } catch (err) {
    setState(state, describeError(err), loadChallenge);
  } finally {
    box.setAttribute("aria-busy", "false");
  }
}

function renderChallenge(c: DailyChallenge): void {
  $("challenge-date").textContent = c.date;
  $("challenge-n").textContent = `${KIND_LABEL[c.kind] ?? c.kind}, n = ${c.n_qubits} qubits`;
  $("challenge-q").textContent = c.question;
  const options = $("challenge-options");
  const buttons = c.options.map((text, i) => {
    const btn = h("button", { type: "button", class: "option", "aria-label": `Opción ${String.fromCharCode(65 + i)}: ${text}` },
      h("span", { class: "option__key", "aria-hidden": "true" }, String.fromCharCode(65 + i)),
      h("span", {}, text),
      h("span", { class: "option__mark" }));
    btn.addEventListener("click", () => {
      const correct = i === c.answer_index;
      const award = progress.answerChallenge(player, c.date, i, correct);
      showAnswer(c, buttons, i);
      celebrate(award);
      renderHud();
    });
    return btn;
  });
  options.replaceChildren(...buttons);
  const previous = player.answers[c.date];
  if (previous) showAnswer(c, buttons, previous.choice, true);
}

function showAnswer(c: DailyChallenge, buttons: HTMLButtonElement[], choice: number, repeat = false): void {
  const correct = choice === c.answer_index;
  buttons.forEach((btn, i) => {
    btn.disabled = true;
    const mark = btn.querySelector(".option__mark")!;
    const base = `Opción ${String.fromCharCode(65 + i)}: ${c.options[i]}`;
    if (i === c.answer_index) { btn.classList.add("is-correct"); mark.textContent = "Correcta"; btn.setAttribute("aria-label", `${base}, correcta`); }
    else if (i === choice) { btn.classList.add("is-wrong"); mark.textContent = "Tu respuesta"; btn.setAttribute("aria-label", `${base}, tu respuesta`); }
  });
  const title = correct ? "¡Correcto!" : `La respuesta era ${c.options[c.answer_index]}.`;
  const extra = repeat ? " Ya respondiste el reto de hoy; vuelve mañana para mantener la racha." : "";
  $("challenge-feedback").replaceChildren(
    h("p", { class: `feedback__title ${correct ? "is-ok" : "is-bad"}` }, title),
    h("p", { class: "feedback__text" }, c.explanation + extra),
  );
}

// Laboratorio Grover ------------------------------------------------------

const curves = new Map<number, GroverCurve>();

function initLab(): void {
  const form = $<HTMLFormElement>("lab-form");
  const nInput = $<HTMLInputElement>("lab-n");
  const marked = $<HTMLInputElement>("lab-marked");
  const auto = $<HTMLInputElement>("lab-auto");
  const iter = $<HTMLInputElement>("lab-iter");
  const shots = $<HTMLInputElement>("lab-shots");
  const noisy = $<HTMLInputElement>("lab-noisy");
  const run = $<HTMLButtonElement>("lab-run");
  const error = $("lab-error");
  const state = $("lab-state");
  let lastRunIterations: number | null = null;

  const n = () => Number(nInput.value);
  const chosenIterations = () => (auto.checked ? optimalIterations(n()) : intIn(iter, 0, 20) ?? optimalIterations(n()));

  const syncN = () => {
    const bits = n();
    $("lab-n-out").textContent = String(bits);
    $("lab-N").textContent = String(2 ** bits);
    $("lab-bits").textContent = String(bits);
    $("lab-opt").textContent = String(optimalIterations(bits));
    marked.maxLength = bits;
    marked.pattern = `[01]{${bits}}`;
    marked.value = marked.value.replace(/[^01]/g, "").padStart(bits, "0").slice(-bits);
    if (auto.checked) iter.value = String(optimalIterations(bits));
    nInput.setAttribute("aria-valuetext", `${bits} qubits, ${2 ** bits} estados`);
  };

  const drawCurve = () => {
    const curve = curves.get(n());
    const host = $("lab-curve");
    if (!curve) return;
    const k = lastRunIterations ?? chosenIterations();
    mount(host, lineChart({
      xs: curve.iterations,
      series: [{ ys: curve.probability, cls: "s-quantum", name: "Probabilidad" }],
      label: `Probabilidad de medir el estado marcado según el número de iteraciones, para ${curve.n_qubits} qubits. Óptimo: ${curve.optimal_iterations}.`,
      xTitle: "Iteraciones k",
      yMax: 1,
      yFormat: (v) => `${Math.round(v * 100)} %`,
      highlightX: k,
    }));
    const max = curve.iterations[curve.iterations.length - 1] ?? 0;
    $("lab-curve-note").textContent = k > max
      ? `La curva muestra k = 0 a ${max}; elegiste ${k} iteraciones, fuera del rango dibujado.`
      : `Con k = ${k}, la teoría da ${pct(curve.probability[k] ?? 0)}. Pasarse de iteraciones también empeora: la amplitud gira de más.`;
  };

  const loadCurve = async () => {
    const bits = n();
    if (!curves.has(bits)) {
      try {
        curves.set(bits, await api.groverCurve(bits));
      } catch (err) {
        if (bits === n()) {
          $("lab-curve").replaceChildren();
          const note = $("lab-curve-note");
          setState(note, `No se pudo cargar la curva. ${describeError(err)}`, loadCurve);
        }
        return;
      }
    }
    if (bits === n()) drawCurve();
  };

  nInput.addEventListener("input", syncN);
  nInput.addEventListener("change", () => { lastRunIterations = null; void loadCurve(); });
  $("lab-random").addEventListener("click", () => {
    const bits = n();
    marked.value = Math.floor(Math.random() * 2 ** bits).toString(2).padStart(bits, "0");
    marked.setAttribute("aria-invalid", "false");
  });
  marked.addEventListener("input", () => {
    marked.value = marked.value.replace(/[^01]/g, "");
  });
  auto.addEventListener("change", () => {
    iter.disabled = auto.checked;
    if (auto.checked) iter.value = String(optimalIterations(n()));
    lastRunIterations = null;
    drawCurve();
  });
  iter.addEventListener("input", () => { lastRunIterations = null; drawCurve(); });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const bits = n();
    const problems: string[] = [];
    const validMarked = new RegExp(`^[01]{${bits}}$`).test(marked.value);
    marked.setAttribute("aria-invalid", String(!validMarked));
    if (!validMarked) problems.push(`El estado marcado debe tener ${bits} bits (solo 0 y 1).`);
    const iterations = auto.checked ? null : intIn(iter, 0, 20);
    if (!auto.checked && iterations === null) problems.push("Las iteraciones deben ser un entero entre 0 y 20.");
    const shotCount = intIn(shots, 1, 8192);
    if (shotCount === null) problems.push("Los disparos deben ser un entero entre 1 y 8192.");
    error.textContent = problems.join(" ");
    if (problems.length || shotCount === null) return;

    setBusy(run, true, "Ejecutando…");
    setState(state, noisy.checked ? "Transpilando para FakeFez y simulando con ruido…" : "Simulando el circuito ideal…");
    try {
      const r = await api.grover({
        n_qubits: bits, marked_state: marked.value, iterations, shots: shotCount, seed: null, noisy: noisy.checked,
      });
      const labels = Array.from({ length: 2 ** r.n_qubits }, (_, i) => i.toString(2).padStart(r.n_qubits, "0"));
      const values = labels.map((l) => r.counts[l] ?? 0);
      const hi = parseInt(r.marked_state, 2);
      mount($("lab-hist"), barChart({
        values, labels, highlight: hi,
        label: `Histograma de ${r.shots} mediciones sobre ${labels.length} estados. El estado marcado ${r.marked_state} aparece ${values[hi]} veces.`,
        xTitle: "Estado medido",
      }));
      $("lab-hist-note").textContent =
        `${r.marked_state} apareció ${(values[hi] ?? 0).toLocaleString("es-PE")} de ${r.shots.toLocaleString("es-PE")} veces. Al azar esperarías ${pct(1 / labels.length)}.` +
        (r.noisy && r.measured_success < 2 / labels.length
          ? " El ruido borró casi toda la amplificación: así de difícil es ejecutar Grover en el hardware actual."
          : "");
      $("m-measured").textContent = pct(r.measured_success);
      $("m-theory").textContent = pct(r.theoretical_success);
      $("m-iters").textContent = `${r.iterations} (${r.optimal_iterations})`;
      $("m-depth").textContent = r.depth.toLocaleString("es-PE");
      $("m-2q").textContent = r.two_qubit_gates.toLocaleString("es-PE");
      $("m-backend").textContent = r.backend;
      $("lab-circuit").textContent = r.circuit_text;
      lastRunIterations = r.iterations;
      drawCurve();
      state.replaceChildren();
      celebrate(progress.rewardActivity(player, "grover", 15, "Primera simulación de Grover del día"));
      if (r.noisy) celebrate(progress.rewardActivity(player, "grover-noisy", 10, "Primera simulación con ruido del día"));
    } catch (err) {
      setState(state, describeError(err), () => form.requestSubmit());
    } finally {
      setBusy(run, false, "Ejecutar circuito");
    }
  });

  syncN();
  void loadCurve();
}

// Monte Carlo y comparación ----------------------------------------------

function initMonteCarlo(): void {
  const form = $<HTMLFormElement>("mc-form");
  const bitsInput = $<HTMLInputElement>("mc-bits");
  const trialsInput = $<HTMLInputElement>("mc-trials");
  const run = $<HTMLButtonElement>("mc-run");
  const state = $("mc-state");
  const error = $("mc-error");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const bits = intIn(bitsInput, 2, 20);
    const trials = intIn(trialsInput, 1, 5000);
    const problems = [
      bits === null ? "Los bits deben ser un entero entre 2 y 20." : "",
      trials === null ? "Las repeticiones deben ser un entero entre 1 y 5000." : "",
    ].filter(Boolean);
    error.textContent = problems.join(" ");
    if (bits === null || trials === null) return;

    setBusy(run, true, "Simulando…");
    setState(state, "Buscando secretos al azar…");
    try {
      const r = await api.monteCarlo(bits, trials);
      const { bins, counts } = r.histogram;
      const width = bins.length > 1 ? bins[1]! - bins[0]! : 1;
      const at = (v: number) => (width === 1 ? v - bins[0]! + 0.5 : (v - bins[0]!) / width);
      const draw = barChart({
        values: counts,
        labels: bins.map(String),
        label: `Histograma de intentos necesarios en ${r.trials} búsquedas al azar entre ${r.N} posibilidades. Media ${r.mean_attempts.toFixed(1)}, esperada ${r.expected_attempts}.`,
        xTitle: width === 1 ? "Intentos hasta encontrar el secreto" : `Intentos (grupos de ${width})`,
        refLines: [
          { at: at(r.mean_attempts), label: "Media", cls: "ref--mean" },
          { at: at(r.expected_attempts), label: "Esperada", cls: "ref--exp" },
        ],
      });
      const host = $("mc-hist");
      mount(host, (w) => {
        const svg = draw(w);
        svg.querySelector(".bars")?.classList.add("bars--mc");
        return svg;
      });
      $("mc-mean").textContent = fmtBig(r.mean_attempts);
      $("mc-exp").textContent = fmtBig(r.expected_attempts);
      $("mc-legend").hidden = false;
      const grover = Math.max(1, optimalIterations(r.n_bits));
      setState(state,
        `Con N = ${fmtBig(r.N)}, la media salió ${fmtBig(r.mean_attempts)} intentos frente a ${fmtBig(r.expected_attempts)} esperados. Grover necesitaría unas ${grover} iteraciones.`);
      state.classList.remove("is-error");
      celebrate(progress.rewardActivity(player, "montecarlo", 10, "Primera simulación Monte Carlo del día"));
    } catch (err) {
      setState(state, describeError(err), () => form.requestSubmit());
    } finally {
      setBusy(run, false, "Simular");
    }
  });
}

function initCompare(): void {
  const form = $<HTMLFormElement>("cmp-form");
  const maxInput = $<HTMLInputElement>("cmp-max");
  const run = $<HTMLButtonElement>("cmp-run");
  const state = $("cmp-state");

  const load = async () => {
    const max = intIn(maxInput, 2, 256);
    $("cmp-error").textContent = max === null ? "Elige un entero entre 2 y 256." : "";
    if (max === null) return;
    setBusy(run, true, "Cargando…");
    setState(state, "Cargando la comparación…");
    try {
      const { rows } = await api.compare(max);
      renderCompare(rows);
      state.replaceChildren();
    } catch (err) {
      setState(state, describeError(err), load);
    } finally {
      setBusy(run, false, "Actualizar");
    }
  };
  form.addEventListener("submit", (event) => { event.preventDefault(); void load(); });
  void load();
}

function renderCompare(rows: CompareRow[]): void {
  if (!rows.length) return;
  mount($("cmp-chart"), lineChart({
    xs: rows.map((r) => r.bits),
    series: [
      { ys: rows.map((r) => Math.log10(Math.max(1, r.classical_expected))), cls: "s-classic", name: "Intentos clásicos" },
      { ys: rows.map((r) => Math.log10(Math.max(1, r.grover_iterations))), cls: "s-quantum", name: "Iteraciones de Grover" },
    ],
    label: `Intentos clásicos esperados frente a iteraciones de Grover, de ${rows[0]!.bits} a ${rows[rows.length - 1]!.bits} bits, en escala logarítmica.`,
    xTitle: "Bits del secreto",
    log10: true,
  }));
  $("cmp-legend").hidden = false;
  $("cmp-table").querySelector("tbody")!.replaceChildren(...rows.map((r) => h("tr", {},
    h("td", {}, String(r.bits)),
    h("td", {}, fmtBig(r.classical_expected)),
    h("td", {}, fmtBig(r.grover_iterations)),
    h("td", {}, `${fmtBig(r.speedup)}×`),
  )));
}

// Contraseña (todo local) -------------------------------------------------

const STRENGTH_COLOR: Record<Strength, string> = {
  "vacia": "var(--line-2)", "muy-debil": "var(--err)", "debil": "#f0a35e",
  "razonable": "#e9d26a", "fuerte": "var(--ok)", "muy-fuerte": "var(--cyan)",
};

function initPassword(): void {
  const input = $<HTMLInputElement>("pw-input");
  const toggle = $<HTMLButtonElement>("pw-toggle");
  const rateInput = $<HTMLInputElement>("pw-rate");

  const render = () => {
    const rate = Number(rateInput.value.replace(",", "."));
    const rateOk = Number.isFinite(rate) && rate >= 1 && rate <= 1e30;
    rateInput.setAttribute("aria-invalid", String(!rateOk));
    const a = analyze(input.value, rateOk ? rate : 1e10);
    const empty = a.length === 0;
    const meter = $("pw-meter");
    meter.style.width = `${Math.min(100, (a.bits / 128) * 100)}%`;
    meter.style.background = STRENGTH_COLOR[a.strength];
    $("pw-strength").textContent = STRENGTH_LABEL[a.strength];
    $("pw-bits").textContent = empty ? "" : `${a.bits.toFixed(1)} bits de entropía estimada`;
    $("pw-len").textContent = String(a.length);
    $("pw-alpha").textContent = empty ? "—" : `${a.alphabet} símbolos`;
    $("pw-alpha").title = a.alphabetParts.join(", ");
    $("pw-raw").textContent = empty ? "—" : `${a.rawBits.toFixed(1)} bits`;
    $("pw-classic").textContent = empty ? "—" : formatDuration(a.classicalLog10Seconds);
    $("pw-grover").textContent = empty ? "—" : formatDuration(a.groverLog10Seconds);
    $("pw-giter").textContent = empty ? "—" : formatPow10(Math.max(0, a.groverLog10Iterations));
    const list = $("pw-penalties");
    if (empty) list.replaceChildren();
    else if (!a.penalties.length) list.replaceChildren(h("li", { class: "is-clean" }, "No detectamos patrones obvios (palabras comunes, secuencias, teclado, años o repeticiones)."));
    else list.replaceChildren(...a.penalties.map((p) => h("li", {},
      h("span", {}, `${p.label} (${p.chars} caracteres)`),
      h("span", { class: "mono" }, `−${p.bits.toFixed(1)} bits`),
    )));
  };

  input.addEventListener("input", render);
  rateInput.addEventListener("input", render);
  toggle.addEventListener("click", () => {
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    toggle.setAttribute("aria-pressed", String(show));
    toggle.textContent = show ? "Ocultar" : "Mostrar";
    toggle.setAttribute("aria-label", show ? "Ocultar contraseña" : "Mostrar contraseña");
  });
  // Evita que el navegador restaure el valor al volver con el historial.
  window.addEventListener("pagehide", () => { input.value = ""; });
  render();
}

// Contenido educativo -----------------------------------------------------

const safeUrl = (url: string) => (/^https?:\/\//i.test(url) ? url : undefined);

async function loadPqc(): Promise<void> {
  const state = $("pqc-state");
  setState(state, "Cargando…");
  try {
    const { cards } = await api.pqc();
    $("pqc-cards").replaceChildren(...cards.map((c) => {
      const threat = c.threat.toLowerCase();
      const chipCls = threat.includes("grover") ? "chip chip--grover" : threat.includes("shor") ? "chip chip--shor" : "chip";
      const sources = c.sources.map((s) => {
        const href = safeUrl(s.url);
        return href ? h("a", { href, target: "_blank", rel: "noopener noreferrer" }, s.label) : h("span", {}, s.label);
      });
      return h("article", { class: "panel card" },
        h("div", { class: "card__top" },
          h("span", { class: chipCls }, `Amenaza: ${c.threat}`),
          ...c.targets.map((t) => h("span", { class: "chip" }, t))),
        h("h3", {}, c.title),
        h("p", {}, c.summary),
        h("dl", {},
          h("div", {}, h("dt", {}, "Impacto"), h("dd", {}, c.impact)),
          h("div", {}, h("dt", {}, "Cómo protegerse"), h("dd", {}, c.mitigation))),
        ...(sources.length ? [h("p", { class: "card__sources" }, h("span", {}, "Fuentes:"), ...sources)] : []));
    }));
    state.replaceChildren();
  } catch (err) {
    setState(state, describeError(err), loadPqc);
  }
}

async function loadLimitations(): Promise<void> {
  const state = $("lim-state");
  setState(state, "Cargando…");
  try {
    const { items } = await api.limitations();
    $("lim-list").replaceChildren(...items.map((it) => h("li", {}, h("h3", {}, it.title), h("p", {}, it.detail))));
    state.replaceChildren();
  } catch (err) {
    setState(state, describeError(err), loadLimitations);
  }
}

// Navegación: marca la sección visible ------------------------------------

function initNav(): void {
  const links = new Map<string, HTMLAnchorElement>();
  document.querySelectorAll<HTMLAnchorElement>(".nav__list a").forEach((a) => links.set(a.hash.slice(1), a));
  const sections = [...links.keys()].map((id) => document.getElementById(id)).filter((s): s is HTMLElement => s !== null);
  let queued = false;
  const update = () => {
    queued = false;
    // La sección activa es la última cuyo borde superior ya pasó el 40 % de la ventana.
    const line = window.innerHeight * 0.4;
    const current = sections.filter((s) => s.getBoundingClientRect().top <= line).pop();
    links.forEach((a, id) => (id === current?.id ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current")));
  };
  window.addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}

renderHud();
initRace();
initNav();
initLab();
initMonteCarlo();
initCompare();
initPassword();
void loadChallenge();
void loadPqc();
void loadLimitations();
