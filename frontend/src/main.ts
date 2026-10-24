import { api, ApiError, describeError, type CompareRow, type DailyChallenge, type GroverCurve, type GroverResult } from "./api.js";
import { barChart, lineChart, mount, unmount } from "./charts.js";
import { $, fieldError, h, motion } from "./dom.js";
import { formatPow10 } from "./password.js";
import { initPasswordUI } from "./password-ui.js";
import * as progress from "./progress.js";
import { initAmbience } from "./ambience.js";

// Utilidades -------------------------------------------------------------

/** Segundos que pide esperar el servidor (Retry-After de un 503), o 0. */
const retryWait = (err: unknown) => (err instanceof ApiError ? err.retryAfter : 0);

const retryButtons = new WeakMap<HTMLElement, HTMLButtonElement>();

/**
 * Mensaje de estado. Con `retry` añade "Reintentar" como hermano, fuera de la región role="status"
 * (un control dentro de una live region confunde a los lectores). Si el error trae Retry-After,
 * el botón espera con cuenta atrás.
 */
function setState(node: HTMLElement, message: string, retry?: () => void, err?: unknown): void {
  node.classList.toggle("is-error", Boolean(retry));
  node.replaceChildren(message);
  retryButtons.get(node)?.remove();
  if (!retry) return;
  const btn = h("button", { type: "button", class: "btn btn--ghost btn--sm retry" }, "Reintentar");
  btn.addEventListener("click", () => { btn.remove(); retry(); });
  node.after(btn);
  retryButtons.set(node, btn);
  let wait = retryWait(err);
  const tick = () => {
    btn.disabled = wait > 0;
    btn.textContent = wait > 0 ? `Reintentar en ${wait} s` : "Reintentar";
    if (wait-- > 0) window.setTimeout(tick, 1000);
  };
  tick();
}

function setBusy(btn: HTMLButtonElement, busy: boolean, label: string): void {
  btn.disabled = busy;
  btn.classList.toggle("is-busy", busy);
  btn.textContent = label;
}

/** Libera un formulario tras una petición; con 503 mantiene el botón deshabilitado lo que pida Retry-After. */
function release(btn: HTMLButtonElement, label: string, err: unknown, done: () => void): void {
  setBusy(btn, false, label);
  const wait = retryWait(err);
  btn.disabled = wait > 0;
  window.setTimeout(() => { btn.disabled = false; done(); }, wait * 1000);
}

/** Porcentaje con 1 decimal, o 2 por debajo del 10 % para que 1/16 se lea 6,25 % y no 6,3 %. */
const pct = (x: number) => `${(x * 100).toLocaleString("es-PE", { maximumFractionDigits: Math.abs(x) < 0.1 ? 2 : 1 })} %`;
/** Diferencia entre probabilidades en puntos porcentuales. */
const pts = (x: number) => {
  const v = Math.round(x * 1000) / 10;
  return `${v.toLocaleString("es-PE")} ${v === 1 ? "punto" : "puntos"}`;
};

/** Números grandes en notación científica legible. */
function fmtBig(x: number): string {
  if (!Number.isFinite(x)) return "∞";
  if (Math.abs(x) < 1e6) return x.toLocaleString("es-PE", { maximumFractionDigits: 1 });
  return formatPow10(Math.log10(x));
}

/** Entero en [min, max] o null; escribe el error del campo si no lo es. */
function intIn(input: HTMLInputElement, min: number, max: number, message: string): number | null {
  const v = Number(input.value);
  const ok = input.value.trim() !== "" && Number.isInteger(v) && v >= min && v <= max;
  fieldError(input, ok ? "" : message);
  return ok ? v : null;
}

/** Lleva el foco al primer campo inválido del formulario (recuperación de errores). */
function focusFirstInvalid(form: HTMLFormElement): void {
  form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
}

/** Tabla de datos alternativa a un gráfico. */
function fillTable(id: string, rows: string[][]): void {
  $(id).querySelector("tbody")!.replaceChildren(...rows.map((r) => h("tr", {}, ...r.map((c) => h("td", {}, c)))));
}

const optimalIterations = (n: number) => Math.floor(Math.PI / (4 * Math.asin(1 / Math.sqrt(2 ** n))));
const theoreticalSuccess = (n: number, k: number) => Math.sin((2 * k + 1) * Math.asin(1 / Math.sqrt(2 ** n))) ** 2;

/** Entero uniforme en [0, 2^bits) con crypto.getRandomValues. 2^32 es múltiplo de 2^bits: sin sesgo. */
function randomBits(bits: number): number {
  const sample = new Uint32Array(1);
  crypto.getRandomValues(sample);
  return sample[0]! % 2 ** bits;
}

// Progreso, HUD, ruta y logros ------------------------------------------------

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
  $("hud-xpfill").style.transform = `scaleX(${info.fraction})`;
  const bar = $("hud-xpbar");
  bar.setAttribute("aria-valuenow", String(Math.round(info.fraction * 100)));
  bar.setAttribute("aria-valuetext", `${player.xp} de ${info.next} XP para el nivel ${info.level + 1}`);
  $("stat-streak").textContent = String(streak);
  $("stat-best").textContent = String(player.bestStreak);
  $("stat-xp").textContent = player.xp.toLocaleString("es-PE");
  $("stat-next").textContent = `${(info.next - player.xp).toLocaleString("es-PE")} XP`;
}

/** Aviso breve. Si ya hay uno visible, la línea nueva se suma en vez de pisarlo. */
function toast(...line: Array<Node | string>): void {
  if (toastEl.classList.contains("is-on")) toastEl.append(h("br"));
  else toastEl.replaceChildren();
  toastEl.append(...line);
  toastEl.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl.classList.remove("is-on"), 4200);
}

function celebrate(award: progress.Award | null): void {
  if (!award) return;
  const before = progress.levelInfo(player.xp - award.xp).level;
  const after = progress.levelInfo(player.xp);
  toast(h("b", {}, `+${award.xp} XP`), ` ${award.reason}`);
  if (after.level > before) toast(`Subiste al nivel ${after.level}: ${after.name}`);
  renderHud();
  motion($("hud-xp"), [{ transform: "translateY(-6px)", opacity: 0.4 }, { transform: "none", opacity: 1 }], 260);
}

function unlock(id: progress.AchievementId): void {
  if (!progress.unlock(player, id)) return;
  const a = progress.ACHIEVEMENTS.find((x) => x.id === id)!;
  toast(h("b", {}, "Logro"), ` ${a.title}`);
  renderAchievements();
  const li = document.querySelector(`[data-achievement="${id}"]`);
  if (li) motion(li, [{ transform: "scale(0.96)", opacity: 0.5 }, { transform: "none", opacity: 1 }], 280);
}

function completeStep(id: progress.StepId): void {
  if (!progress.completeStep(player, id)) return;
  const step = progress.STEPS.find((s) => s.id === id)!;
  toast(h("b", {}, "Ruta"), ` Paso completado: ${step.title}`);
  renderPath();
  if (progress.STEPS.every((s) => player.path.includes(s.id))) unlock("ruta");
}

/** Configuración del laboratorio para cada paso; el último lleva al generador. */
const STEP_SETUP: Record<progress.StepId, { auto: boolean; iterations?: number; noisy: boolean } | null> = {
  superposicion: { auto: false, iterations: 0, noisy: false },
  oraculo: { auto: false, iterations: 1, noisy: false },
  amplificacion: { auto: true, noisy: false },
  ruido: { auto: true, noisy: true },
  criptografia: null,
};

let prepareLab: (setup: { auto: boolean; iterations?: number; noisy: boolean }) => void = () => {};

function renderPath(): void {
  const done = (id: progress.StepId) => player.path.includes(id);
  const currentId = progress.STEPS.find((s) => !done(s.id))?.id;
  const count = progress.STEPS.filter((s) => done(s.id)).length;
  $("path-count").textContent = `${count} de ${progress.STEPS.length} pasos completados`;
  $("path-list").replaceChildren(...progress.STEPS.map((s, i) => {
    const isDone = done(s.id);
    const btn = h("button", { type: "button", class: "btn btn--ghost btn--sm", "aria-describedby": `step-${s.id}-t` },
      s.id === "criptografia" ? "Ir al generador" : "Preparar el laboratorio");
    btn.addEventListener("click", () => {
      const setup = STEP_SETUP[s.id];
      if (setup) prepareLab(setup);
      else {
        $("gen-title").scrollIntoView({ block: "start" });
        $<HTMLButtonElement>("gen-new").focus({ preventScroll: true });
      }
    });
    return h("li", {
      class: `step${isDone ? " is-done" : ""}${s.id === currentId ? " is-current" : ""}`,
      ...(s.id === currentId ? { "aria-current": "step" } : {}),
    },
      h("p", { class: "step__n mono", "aria-hidden": "true" }, String(i + 1)),
      h("h3", { class: "step__t", id: `step-${s.id}-t` }, s.title),
      h("p", { class: "step__task" }, s.task),
      h("p", { class: "step__state" }, isDone ? "Completado" : s.id === currentId ? "Siguiente paso" : "Pendiente"),
      btn);
  }));
}

function renderAchievements(): void {
  const got = new Set(player.achievements);
  $("ach-count").textContent = `${got.size} de ${progress.ACHIEVEMENTS.length}`;
  $("ach-list").replaceChildren(...progress.ACHIEVEMENTS.map((a) => h("li", {
    class: `badge${got.has(a.id) ? " is-on" : ""}`, "data-achievement": a.id,
  },
    h("span", { class: "badge__icon", "aria-hidden": "true" }),
    h("span", { class: "badge__body" },
      h("b", {}, a.title),
      h("span", {}, a.detail)),
    h("span", { class: "badge__state" }, got.has(a.id) ? "Desbloqueado" : "Bloqueado"))));
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
    const ratio = Math.max(0.015, Math.log10(grover + 1) / Math.log10(classic + 1));
    $("race-grover-bar").style.transform = `scaleX(${ratio})`;
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

/** Fecha local del reto mostrado; si la pestaña cruza medianoche se pide el nuevo al volver a ella. */
let challengeDate = "";

async function loadChallenge(): Promise<void> {
  const box = $("challenge");
  const state = $("challenge-state");
  const today = progress.todayLocal();
  box.setAttribute("aria-busy", "true");
  setState(state, "Cargando el reto de hoy…");
  try {
    const c = await api.daily(today);
    challengeDate = today;
    renderChallenge(c);
    state.replaceChildren();
    $("challenge-body").hidden = false;
  } catch (err) {
    setState(state, describeError(err), loadChallenge, err);
  } finally {
    box.setAttribute("aria-busy", "false");
  }
}

function renderChallenge(c: DailyChallenge): void {
  $("challenge-date").textContent = c.date;
  $("challenge-n").textContent = `${KIND_LABEL[c.kind] ?? c.kind}, n = ${c.n_qubits} qubits`;
  $("challenge-q").textContent = c.question;
  $("challenge-feedback").replaceChildren();
  const buttons = c.options.map((text, i) => {
    const btn = h("button", { type: "button", class: "option", "aria-label": `Opción ${String.fromCharCode(65 + i)}: ${text}` },
      h("span", { class: "option__key", "aria-hidden": "true" }, String.fromCharCode(65 + i)),
      h("span", {}, text),
      h("span", { class: "option__mark" }));
    btn.addEventListener("click", () => {
      const award = progress.answerChallenge(player, c.date, i, i === c.answer_index);
      showAnswer(c, buttons, i);
      celebrate(award);
      if (progress.currentStreak(player) >= 3) unlock("racha3");
      renderHud();
      // El foco estaba en un botón que ahora está deshabilitado: llévalo a la explicación.
      $("challenge-feedback").focus();
    });
    return btn;
  });
  $("challenge-options").replaceChildren(...buttons);
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

// Laboratorio Grover: Predice → Observa → Explica -----------------------------

interface Prediction { mode: "prob" | "iter"; value: number }

function initLab(): void {
  const form = $<HTMLFormElement>("lab-form");
  const nInput = $<HTMLInputElement>("lab-n");
  const marked = $<HTMLInputElement>("lab-marked");
  const auto = $<HTMLInputElement>("lab-auto");
  const iter = $<HTMLInputElement>("lab-iter");
  const shots = $<HTMLInputElement>("lab-shots");
  const noisy = $<HTMLInputElement>("lab-noisy");
  const run = $<HTMLButtonElement>("lab-run");
  const state = $("lab-state");
  const predProb = $<HTMLInputElement>("pred-prob");
  const predIter = $<HTMLInputElement>("pred-iter");
  let lastRunIterations: number | null = null;
  /** Guarda contra doble envío: Enter en un campo dispara submit aunque el botón esté deshabilitado. */
  let running = false;
  /** Sube con cada envío y con cada cambio de qubits: una respuesta con otro número llega obsoleta y se descarta. */
  let runId = 0;
  /** Tamaños para los que ya se ejecutó: la curva teórica y el óptimo solo se muestran tras observar. */
  const revealed = new Set<number>();

  const n = () => Number(nInput.value);
  const predMode = () => (form.elements.namedItem("pred-mode") as RadioNodeList).value as Prediction["mode"];
  const chosenIterations = () => {
    const manual = Number(iter.value);
    return auto.checked || !Number.isInteger(manual) || manual < 0 || manual > 20 ? optimalIterations(n()) : manual;
  };

  const syncPrediction = () => {
    const iterMode = predMode() === "iter";
    $("pred-prob-box").hidden = iterMode;
    $("pred-iter-box").hidden = !iterMode;
    $("pred-prob-out").textContent = `${predProb.value} %`;
    predProb.setAttribute("aria-valuetext", `${predProb.value} por ciento`);
    // Mostrar el óptimo antes de ejecutar delataría la respuesta de la predicción de iteraciones.
    $("lab-opt").textContent = iterMode && !revealed.has(n()) ? "se revela al ejecutar" : String(optimalIterations(n()));
  };

  const syncN = () => {
    const bits = n();
    $("lab-n-out").textContent = String(bits);
    $("lab-N").textContent = String(2 ** bits);
    $("lab-bits").textContent = String(bits);
    $("pred-uniform").textContent = pct(1 / 2 ** bits);
    $("pred-sqrt").textContent = (Math.PI / 4 * Math.sqrt(2 ** bits)).toLocaleString("es-PE", { maximumFractionDigits: 2 });
    marked.maxLength = bits;
    marked.value = marked.value.replace(/[^01]/g, "").padStart(bits, "0").slice(-bits);
    fieldError(marked, ""); // tras ajustar la longitud el valor vuelve a ser válido
    if (auto.checked) iter.value = String(optimalIterations(bits));
    nInput.setAttribute("aria-valuetext", `${bits} qubits, ${2 ** bits} estados`);
    syncPrediction();
  };

  const drawCurve = () => {
    const bits = n();
    const curve = curves.get(bits);
    const host = $("lab-curve");
    const note = $("lab-curve-note");
    note.classList.remove("is-error");
    if (!revealed.has(bits)) {
      host.replaceChildren(h("p", { class: "chart__locked" }, "La curva teórica se revela después de ejecutar: primero predice."));
      host.removeAttribute("data-width");
      note.textContent = "";
      $("lab-curve-data").hidden = true;
      return;
    }
    if (!curve) return;
    const k = lastRunIterations ?? chosenIterations();
    mount(host, lineChart({
      xs: curve.iterations,
      series: [{ ys: curve.probability, cls: "s-quantum", name: "Probabilidad" }],
      title: `Probabilidad de acierto según las iteraciones, ${curve.n_qubits} qubits`,
      label: `Sube desde ${pct(curve.probability[0] ?? 0)} con 0 iteraciones hasta un máximo en k = ${curve.optimal_iterations} y vuelve a bajar. Marcado k = ${k}.`,
      xTitle: "Iteraciones k",
      yMax: 1,
      yFormat: (v) => `${Math.round(v * 100)} %`,
      highlightX: k,
    }));
    fillTable("lab-curve-table", curve.iterations.map((x, i) => [String(x), pct(curve.probability[i] ?? 0)]));
    $("lab-curve-data").hidden = false;
    const max = curve.iterations[curve.iterations.length - 1] ?? 0;
    note.textContent = k > max
      ? `La curva muestra k = 0 a ${max}; elegiste ${k} iteraciones, fuera del rango dibujado.`
      : `Con k = ${k}, la teoría da ${pct(curve.probability[k] ?? 0)}. Pasarse de iteraciones también empeora: la amplitud gira de más.`;
  };

  const loadCurve = async () => {
    const bits = n();
    if (!curves.has(bits)) {
      try {
        curves.set(bits, await api.groverCurve(bits));
      } catch (err) {
        if (bits === n() && revealed.has(bits)) {
          $("lab-curve").replaceChildren();
          setState($("lab-curve-note"), `No se pudo cargar la curva. ${describeError(err)}`, loadCurve, err);
        }
        return;
      }
    }
    if (bits === n()) drawCurve();
  };

  prepareLab = (setup) => {
    auto.checked = setup.auto;
    iter.disabled = setup.auto;
    iter.value = String(setup.iterations ?? optimalIterations(n()));
    noisy.checked = setup.noisy;
    lastRunIterations = null;
    fieldError(iter, "");
    syncN();
    drawCurve();
    form.scrollIntoView({ block: "start" });
    (predMode() === "prob" ? predProb : predIter).focus({ preventScroll: true });
    state.textContent = setup.noisy
      ? "Laboratorio listo: ruido activado. Predice y ejecuta."
      : `Laboratorio listo con ${setup.auto ? "el óptimo de" : setup.iterations} iteraciones. Predice y ejecuta.`;
  };

  nInput.addEventListener("input", () => { runId++; syncN(); });
  nInput.addEventListener("change", () => { lastRunIterations = null; drawCurve(); void loadCurve(); });
  $("lab-random").addEventListener("click", () => {
    const bits = n();
    marked.value = randomBits(bits).toString(2).padStart(bits, "0");
    fieldError(marked, "");
  });
  marked.addEventListener("input", () => { marked.value = marked.value.replace(/[^01]/g, ""); });
  auto.addEventListener("change", () => {
    iter.disabled = auto.checked;
    if (auto.checked) { iter.value = String(optimalIterations(n())); fieldError(iter, ""); }
    lastRunIterations = null;
    drawCurve();
  });
  iter.addEventListener("input", () => { lastRunIterations = null; drawCurve(); });
  form.addEventListener("input", (e) => {
    const t = e.target as HTMLInputElement;
    if (t.name === "pred-mode" || t === predProb) syncPrediction();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (running) return;
    const bits = n();
    const validMarked = new RegExp(`^[01]{${bits}}$`).test(marked.value);
    fieldError(marked, validMarked ? "" : `Escribe exactamente ${bits} bits (solo 0 y 1), o pulsa Aleatorio.`);
    const iterations = auto.checked ? null : intIn(iter, 0, 20, "Escribe un entero entre 0 y 20, o marca Usar el óptimo.");
    const shotCount = intIn(shots, 1, 8192, "Escribe un entero entre 1 y 8192.");
    const prediction: Prediction = predMode() === "prob"
      ? { mode: "prob", value: Number(predProb.value) / 100 }
      : { mode: "iter", value: intIn(predIter, 0, 20, "Predice un entero entre 0 y 20.") ?? -1 };
    if (predMode() === "prob") fieldError(predIter, "");
    if (!validMarked || (!auto.checked && iterations === null) || shotCount === null || prediction.value < 0) {
      focusFirstInvalid(form);
      return;
    }

    running = true;
    const id = ++runId;
    let failure: unknown = null;
    setBusy(run, true, "Ejecutando…");
    setState(state, noisy.checked ? "Transpilando para FakeFez y simulando con ruido…" : "Simulando el circuito ideal…");
    try {
      const r = await api.grover({
        n_qubits: bits, marked_state: marked.value, iterations, shots: shotCount, seed: null, noisy: noisy.checked,
      });
      if (id !== runId) {
        setState(state, "Cambiaste los qubits mientras corría la simulación; ese resultado se descartó. Ejecuta de nuevo.");
        return;
      }
      renderResult(r);
      lastRunIterations = r.iterations;
      revealed.add(r.n_qubits);
      syncPrediction();
      if (curves.has(r.n_qubits)) drawCurve(); else void loadCurve();
      const summary = observe(r, prediction);
      setState(state, summary);
      afterRun(r);
    } catch (err) {
      failure = err;
      setState(state, describeError(err), () => form.requestSubmit(), err);
    } finally {
      release(run, "Ejecutar circuito", failure, () => { running = false; });
    }
  });

  syncN();
  drawCurve();
  // Precarga la curva del tamaño inicial para que aparezca al instante tras la primera ejecución.
  void api.groverCurve(n()).then((c) => curves.set(c.n_qubits, c)).catch(() => {});
}

const curves = new Map<number, GroverCurve>();

function renderResult(r: GroverResult): void {
  const labels = Array.from({ length: 2 ** r.n_qubits }, (_, i) => i.toString(2).padStart(r.n_qubits, "0"));
  const values = labels.map((l) => r.counts[l] ?? 0);
  const hi = parseInt(r.marked_state, 2);
  const host = $("lab-hist");
  mount(host, barChart({
    values, labels, highlight: hi,
    title: `Histograma de ${r.shots} mediciones, ${r.n_qubits} qubits`,
    label: `El estado marcado ${r.marked_state} aparece ${values[hi]} veces de ${r.shots}; el resto de los ${labels.length - 1} estados se reparte ${r.shots - (values[hi] ?? 0)}.`,
    xTitle: "Estado medido",
  }));
  const sorted = labels.map((l, i) => [l, values[i]!] as const).sort((a, b) => b[1] - a[1]);
  fillTable("lab-hist-table", sorted.map(([l, v]) => [l === r.marked_state ? `${l} (marcado)` : l, v.toLocaleString("es-PE"), pct(v / r.shots)]));
  $("lab-hist-data").hidden = false;
  $("lab-hist-note").textContent =
    `${r.marked_state} apareció ${(values[hi] ?? 0).toLocaleString("es-PE")} de ${r.shots.toLocaleString("es-PE")} veces. Al azar esperarías ${pct(1 / labels.length)}.`;
  $("m-measured").textContent = pct(r.measured_success);
  $("m-theory").textContent = pct(r.theoretical_success);
  $("m-iters").textContent = `${r.iterations} (${r.optimal_iterations})`;
  $("m-depth").textContent = r.depth.toLocaleString("es-PE");
  $("m-2q").textContent = r.two_qubit_gates.toLocaleString("es-PE");
  $("m-backend").textContent = r.backend;
  $("lab-circuit").textContent = r.circuit_text;
}

/** Compara la predicción con lo teórico y lo medido, da XP y explica. Devuelve un resumen para aria-live. */
function observe(r: GroverResult, p: Prediction): string {
  const N = 2 ** r.n_qubits;
  const k = r.iterations;
  const opt = r.optimal_iterations;
  $("ppo").hidden = false;

  let score: string;
  let xp = 0;
  let exact = false;
  const scale = $("ppo-scale");
  if (p.mode === "prob") {
    // Con ruido se compara con lo medido, que es lo que de verdad ocurre; sin ruido, con la teoría exacta.
    const target = r.noisy ? r.measured_success : r.theoretical_success;
    const diff = Math.abs(p.value - target);
    exact = diff <= 0.03;
    xp = exact ? 25 : diff <= 0.10 ? 15 : diff <= 0.25 ? 5 : 0;
    const ref = r.noisy ? "lo medido" : "la teoría";
    score = exact ? `A ${pts(diff)} de ${ref}: predicción exacta.`
      : diff <= 0.10 ? `A ${pts(diff)} de ${ref}: muy cerca.`
      : diff <= 0.25 ? `A ${pts(diff)} de ${ref}: vas bien encaminado.`
      : `A ${pts(diff)} de ${ref}. Mira la explicación y vuelve a intentarlo.`;
    $("ppo-pred").textContent = pct(p.value);
    $("ppo-scale-max").textContent = "100 %";
    placeMarkers(scale, p.value, r.theoretical_success, r.measured_success);
  } else {
    const diff = Math.abs(p.value - opt);
    exact = diff === 0;
    xp = exact ? 25 : diff === 1 ? 10 : 0;
    score = exact ? `Exacto: el óptimo para N = ${N} es ${opt}.`
      : `El óptimo para N = ${N} es ${opt}; dijiste ${p.value}. Sale de π/4·√N = ${(Math.PI / 4 * Math.sqrt(N)).toFixed(2)}, redondeado hacia abajo.`;
    $("ppo-pred").textContent = `${p.value} it.`;
    const max = Math.max(2 * opt, p.value, k, 1);
    $("ppo-scale-max").textContent = `${max} it.`;
    placeMarkers(scale, p.value / max, opt / max, k / max, true);
  }
  $("ppo-theory").textContent = p.mode === "prob" ? pct(r.theoretical_success) : `${opt} it.`;
  $("ppo-measured").textContent = p.mode === "prob" ? pct(r.measured_success) : `${k} it. → ${pct(r.measured_success)}`;
  $("ppo-theory-k").textContent = p.mode === "prob" ? "Teoría" : "Óptimo";
  $("ppo-measured-k").textContent = p.mode === "prob" ? "Medido" : "Ejecutaste";

  const award = progress.rewardPrediction(player, xp, exact ? "Predicción exacta" : "Predicción cercana");
  const capped = xp > 0 && !award;
  $("ppo-score").textContent = score + (award ? ` +${award.xp} XP.` : capped ? ` (Ya sumaste las ${progress.PREDICTIONS_PER_DAY} predicciones con XP de hoy.)` : "");
  $("ppo-explain").replaceChildren(...explain(r).map((t) => h("li", {}, t)));
  celebrate(award);
  unlock("prediccion");
  if (exact) unlock("prediccion-exacta");
  const said = p.mode === "prob" ? pct(p.value) : `${p.value} iteraciones`;
  return `Predijiste ${said}. Teoría ${pct(r.theoretical_success)}, medido ${pct(r.measured_success)}. ${score}`;
}

function placeMarkers(scale: HTMLElement, pred: number, theory: number, measured: number, iterScale = false): void {
  const clamp = (x: number) => Math.min(1, Math.max(0, x));
  const marks: Array<[string, number]> = [["pred", pred], ["theory", theory], ["measured", measured]];
  scale.dataset.mode = iterScale ? "iter" : "prob";
  for (const [name, at] of marks) {
    const m = scale.querySelector<HTMLElement>(`.mark--${name}`)!;
    m.style.left = `${clamp(at) * 100}%`;
  }
  // Teoría y medida salen desde tu predicción: se ve cuánto te separaste.
  const width = scale.clientWidth;
  for (const [name, at] of marks.slice(1)) {
    const dx = (clamp(pred) - clamp(at)) * width;
    motion(scale.querySelector(`.mark--${name}`)!, [{ transform: `translateX(${dx}px)`, opacity: 0 }, { transform: "none", opacity: 1 }], 240);
  }
}

/** Explicación breve en tres partes: dónde quedó k, el equivalente clásico y por qué difiere lo medido. */
function explain(r: GroverResult): string[] {
  const N = 2 ** r.n_qubits;
  const k = r.iterations;
  const opt = r.optimal_iterations;
  const out: string[] = [];
  if (k === 0) out.push(`Con 0 iteraciones solo hay superposición: cada uno de los ${N} estados sale con 1/N = ${pct(1 / N)}. Es exactamente una búsqueda a ciegas.`);
  else if (k < opt) out.push(`Cada iteración gira la amplitud un ángulo 2θ hacia el marcado. Con ${k} todavía no llega al máximo, que está en ${opt}.`);
  else if (k === opt) out.push(`k = ${opt} es el óptimo: tras ${opt} giros la amplitud queda casi alineada con el estado marcado.`);
  else out.push(`Te pasaste del óptimo (${opt}): la amplitud siguió girando y se alejó de la respuesta. Por eso la teoría baja a ${pct(theoreticalSuccess(r.n_qubits, k))}.`);
  if (k > 0) out.push(`Con las mismas ${k} consultas al oráculo, una búsqueda al azar sin repetir acertaría con k/N = ${pct(Math.min(1, k / N))}. Grover logra ${pct(r.theoretical_success)}.`);
  const gap = r.theoretical_success - r.measured_success;
  if (r.noisy) {
    out.push(`El ruido de FakeFez llevó la medida de ${pct(r.theoretical_success)} a ${pct(r.measured_success)}: el circuito transpilado tiene ${r.two_qubit_gates.toLocaleString("es-PE")} puertas de dos qubits y cada una añade un poco de error.`);
  } else {
    const sigma = Math.sqrt(Math.max(r.theoretical_success * (1 - r.theoretical_success), 1e-9) / r.shots);
    out.push(`Sin ruido, la diferencia con la teoría (${pts(Math.abs(gap))}) es azar de muestreo: con ${r.shots.toLocaleString("es-PE")} disparos, lo normal es ±${pct(2 * sigma)}.`);
  }
  return out;
}

/** Ruta y logros que dependen del resultado. */
function afterRun(r: GroverResult): void {
  celebrate(progress.rewardActivity(player, "grover", 15, "Primera simulación de Grover del día"));
  if (r.iterations === 0) completeStep("superposicion");
  if (r.iterations === 1) completeStep("oraculo");
  if (r.iterations === r.optimal_iterations && !r.noisy) completeStep("amplificacion");
  if (r.noisy) {
    celebrate(progress.rewardActivity(player, "grover-noisy", 10, "Primera simulación con ruido del día"));
    completeStep("ruido");
    if (r.theoretical_success - r.measured_success >= 0.25 || r.measured_success < 2 / 2 ** r.n_qubits) unlock("ruido");
  }
}

// Monte Carlo y comparación ----------------------------------------------

function initMonteCarlo(): void {
  const form = $<HTMLFormElement>("mc-form");
  const bitsInput = $<HTMLInputElement>("mc-bits");
  const trialsInput = $<HTMLInputElement>("mc-trials");
  const run = $<HTMLButtonElement>("mc-run");
  const state = $("mc-state");
  let running = false;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (running) return;
    const bits = intIn(bitsInput, 2, 20, "Escribe un entero entre 2 y 20.");
    const trials = intIn(trialsInput, 1, 5000, "Escribe un entero entre 1 y 5000.");
    if (bits === null || trials === null) { focusFirstInvalid(form); return; }

    running = true;
    let failure: unknown = null;
    setBusy(run, true, "Simulando…");
    setState(state, "Buscando secretos al azar…");
    try {
      const r = await api.monteCarlo(bits, trials);
      const { bins, counts } = r.histogram;
      if (!bins.length || bins.length !== counts.length) {
        setState(state, "El servidor devolvió un histograma vacío.", () => form.requestSubmit());
        return;
      }
      const width = bins.length > 1 ? bins[1]! - bins[0]! : 1;
      const at = (v: number) => (width === 1 ? v - bins[0]! + 0.5 : (v - bins[0]!) / width);
      const draw = barChart({
        values: counts,
        labels: bins.map(String),
        title: `Intentos necesarios en ${r.trials} búsquedas al azar`,
        label: `Entre ${fmtBig(r.N)} posibilidades, el histograma es casi plano de 1 a N. Media medida ${r.mean_attempts.toFixed(1)}, esperada (N+1)/2 = ${r.expected_attempts}.`,
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
      fillTable("mc-table", bins.map((b, i) => [width === 1 ? String(b) : `${b}–${b + width - 1}`, (counts[i] ?? 0).toLocaleString("es-PE")]));
      $("mc-data").hidden = false;
      $("mc-mean").textContent = fmtBig(r.mean_attempts);
      $("mc-exp").textContent = fmtBig(r.expected_attempts);
      $("mc-legend").hidden = false;
      const grover = Math.max(1, optimalIterations(r.n_bits));
      setState(state,
        `Con N = ${fmtBig(r.N)}, la media salió ${fmtBig(r.mean_attempts)} intentos frente a ${fmtBig(r.expected_attempts)} esperados. Grover necesitaría unas ${grover} iteraciones.`);
      celebrate(progress.rewardActivity(player, "montecarlo", 10, "Primera simulación Monte Carlo del día"));
    } catch (err) {
      failure = err;
      setState(state, describeError(err), () => form.requestSubmit(), err);
    } finally {
      release(run, "Simular", failure, () => { running = false; });
    }
  });
}

function initCompare(): void {
  const form = $<HTMLFormElement>("cmp-form");
  const maxInput = $<HTMLInputElement>("cmp-max");
  const run = $<HTMLButtonElement>("cmp-run");
  const state = $("cmp-state");

  let running = false;
  const load = async () => {
    if (running) return;
    const max = intIn(maxInput, 2, 256, "Escribe un entero entre 2 y 256.");
    if (max === null) { maxInput.focus(); return; }
    running = true;
    setBusy(run, true, "Cargando…");
    setState(state, "Cargando la comparación…");
    try {
      const { rows } = await api.compare(max);
      renderCompare(rows);
      state.replaceChildren();
    } catch (err) {
      setState(state, describeError(err), load, err);
    } finally {
      setBusy(run, false, "Actualizar");
      running = false;
    }
  };
  form.addEventListener("submit", (event) => { event.preventDefault(); void load(); });
  void load();
}

function renderCompare(rows: CompareRow[]): void {
  if (!rows.length) {
    unmount($("cmp-chart"));
    $("cmp-chart").replaceChildren(h("p", { class: "chart__locked" }, "No hay filas para ese rango. Prueba con 4 bits o más."));
    $("cmp-legend").hidden = true;
    fillTable("cmp-table", []);
    return;
  }
  const first = rows[0]!;
  const last = rows[rows.length - 1]!;
  mount($("cmp-chart"), lineChart({
    xs: rows.map((r) => r.bits),
    series: [
      { ys: rows.map((r) => Math.log10(Math.max(1, r.classical_expected))), cls: "s-classic", name: "Intentos clásicos" },
      { ys: rows.map((r) => Math.log10(Math.max(1, r.grover_iterations))), cls: "s-quantum", name: "Iteraciones de Grover" },
    ],
    title: "Intentos clásicos frente a iteraciones de Grover (escala logarítmica)",
    label: `De ${first.bits} a ${last.bits} bits. Con ${last.bits} bits: ${fmtBig(last.classical_expected)} intentos clásicos frente a ${fmtBig(last.grover_iterations)} iteraciones de Grover. Los datos completos están en la tabla siguiente.`,
    xTitle: "Bits del secreto",
    log10: true,
  }));
  $("cmp-legend").hidden = false;
  fillTable("cmp-table", rows.map((r) => [String(r.bits), fmtBig(r.classical_expected), fmtBig(r.grover_iterations), `${fmtBig(r.speedup)}×`]));
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
        return href ? h("a", { href, target: "_blank", rel: "noopener noreferrer" }, s.label, h("span", { class: "visually-hidden" }, " (abre en otra pestaña)")) : h("span", {}, s.label);
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
    setState(state, describeError(err), loadPqc, err);
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
    setState(state, describeError(err), loadLimitations, err);
  }
}

// Navegación: marca la sección visible ------------------------------------

function initNav(): void {
  const links = new Map<string, HTMLAnchorElement>();
  document.querySelectorAll<HTMLAnchorElement>(".nav__list a").forEach((a) => links.set(a.hash.slice(1), a));
  const sections = [...links.keys()].map((id) => document.getElementById(id)).filter((s): s is HTMLElement => s !== null);
  // Activa la sección que cruza la línea del 40 % de la ventana, sin medir el layout en cada scroll.
  const crossing = new Set<Element>();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) (e.isIntersecting ? crossing.add(e.target) : crossing.delete(e.target));
    const current = sections.filter((s) => crossing.has(s)).pop();
    // Ya en el pie: se mantiene marcada la última sección.
    if (!current && sections.at(-1)!.getBoundingClientRect().bottom < innerHeight * 0.4) return;
    links.forEach((a, id) => (id === current?.id ? a.setAttribute("aria-current", "location") : a.removeAttribute("aria-current")));
  }, { rootMargin: "-40% 0px -60% 0px" });
  sections.forEach((s) => io.observe(s));
}

initAmbience();
renderHud();
renderPath();
renderAchievements();
initRace();
initNav();
initLab();
initMonteCarlo();
initCompare();
initPasswordUI({
  onStrong(kind) {
    completeStep("criptografia");
    if (kind === "generada") unlock("pw128");
  },
});
void loadChallenge();
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible" || !challengeDate || challengeDate === progress.todayLocal()) return;
  renderHud();
  void loadChallenge();
});
void loadPqc();
void loadLimitations();
