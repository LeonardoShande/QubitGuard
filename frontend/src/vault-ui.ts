import { api, ApiError, describeError, type GroverResult } from "./api.js";
import { $, h, countTo, motion } from "./dom.js";
import { generateChars } from "./generator.js";
import { analyze } from "./password.js";
import { practiceRating } from "./practice-rating.js";
import { awardVaultMission, type Award, type Progress } from "./progress.js";
import { MISSIONS, RANKS, missionScore, missionUnlocked, vaultRank, vaultTotal } from "./vault-model.js";

/** Campaña aislada: el texto de práctica solo vive en el input; la API recibe parámetros sintéticos. */
export function initVaultUI(player: Progress, onAward: (award: Award | null) => void): void {
  const root = $("boveda");
  const input = $<HTMLInputElement>("vault-password");
  const prepare = $<HTMLFieldSetElement>("vault-prepare");
  const predict = $<HTMLFieldSetElement>("vault-predict");
  const runButton = $<HTMLButtonElement>("vault-run");
  const runHint = $("vault-run-hint");
  const status = $("vault-status");
  const phases = $("vault-phases");
  const next = $<HTMLButtonElement>("vault-next");
  let selected = 0;
  let prediction: number | null = null;
  let ready = false;
  let busy = false;
  let result: GroverResult | null = null;
  let completed = false;
  let retryUntil = 0;
  let retryTimer = 0;
  let runToken = 0;
  let announcedTier = "empty";
  const pct = (n: number) => `${(100 * n).toLocaleString("es-PE", { maximumFractionDigits: 1 })} %`;
  const PHASES = ["prepare", "predict", "observe", "explain"] as const;
  type Phase = (typeof PHASES)[number];

  /** Mensaje de estado con color de error y entrada suave; las salidas son instantáneas. */
  function setStatus(message: string, error = false): void {
    status.classList.toggle("is-error", error);
    const changed = status.textContent !== message;
    status.textContent = message;
    if (changed && message) motion(status, [{ opacity: 0, transform: "translateY(4px)" }, { opacity: 1, transform: "none" }], 200);
  }

  function currentPhase(): Phase | null {
    if (completed) return null;
    if (result) return "explain";
    if (ready && prediction !== null) return "observe";
    if (ready) return "predict";
    return "prepare";
  }

  /** Franja preparar → predecir → observar → explicar y marcas de los bloques 1 y 2. */
  function updatePhases(): void {
    const current = currentPhase();
    root.dataset.phase = current ?? "done";
    phases.querySelectorAll<HTMLElement>("li").forEach((li, i) => {
      const done = completed || (current !== null && PHASES.indexOf(current) > i);
      li.dataset.state = done ? "done" : current === PHASES[i] ? "current" : "todo";
    });
    prepare.dataset.done = String(ready);
    predict.dataset.done = String(prediction !== null);
  }

  /** Dice siempre por qué el botón de ejecutar no está disponible (o qué puntos da). */
  function updateRunHint(): void {
    if (busy) runHint.textContent = "Qiskit está midiendo el circuito en Aer local.";
    else if (result) runHint.textContent = "Experimento completado: observa el tablero y explica.";
    else if (!ready) runHint.textContent = "Termina tu defensa de práctica para habilitar el experimento.";
    else if (prediction === null) runHint.textContent = "Elige una predicción para habilitar el experimento.";
    else runHint.textContent = "20 puntos al ejecutar y comparar.";
  }

  function renderProgress(): void {
    const total = vaultTotal(player.vault);
    const rank = vaultRank(total);
    $("vault-rank").textContent = rank.name;
    countTo($("vault-points"), total, (v) => `${Math.round(v)} / 300 puntos`);
    $("vault-rank-hint").textContent = rank.next ? `${rank.remaining} puntos para ${rank.next}.` : "Tres misiones dominadas. Puedes volver a experimentar.";
    $<HTMLProgressElement>("vault-progress").value = total;
    $("vault-ranks").replaceChildren(...RANKS.map((r) => h("li", { "aria-current": String(r.name === rank.name) }, `${r.minimum} · ${r.name}`)));
    $("vault-missions").replaceChildren(...MISSIONS.map((mission, index) => {
      const unlocked = missionUnlocked(index, player.vault);
      const best = player.vault?.[mission.id];
      const button = h("button", { type: "button", "aria-pressed": String(index === selected), "data-state": unlocked ? (best ? "done" : "open") : "locked" },
        h("span", { class: "mono" }, `MISIÓN ${index + 1}`),
        h("b", {}, mission.title),
        h("span", {}, !unlocked ? "Completa la anterior" : best ? `Mejor marca: ${best}/100` : mission.concept));
      button.disabled = busy || !unlocked;
      button.addEventListener("click", () => selectMission(index));
      return button;
    }));
  }

  function updatePreparation(): void {
    const mission = MISSIONS[selected];
    const analysis = analyze(input.value, 1);
    // Umbrales del juego, no una política de autenticación ni una certificación.
    const checks = [analysis.length >= mission.minLength, analysis.penalties.length === 0, analysis.bits >= mission.minBits];
    const wasReady = ready;
    ready = checks.every(Boolean);
    const labels = [
      `Longitud: ${analysis.length} de ${mission.minLength} caracteres como mínimo`,
      !analysis.length ? "Escribe un ejemplo para revisar sus patrones" : analysis.penalties.length ? `Cambia estos patrones: ${[...new Set(analysis.penalties.map((p) => p.label))].join(", ")}` : "No encontramos los patrones comunes que revisa el juego",
      checks[2] ? "Impredecibilidad: meta del modelo alcanzada" : "Impredecibilidad: prueba una clave más larga y con elecciones aleatorias",
    ];
    $("vault-checks").replaceChildren(...labels.map((label, i) => h("li", { "data-ok": String(checks[i] && analysis.length > 0) }, label)));
    $("vault-technical-score").textContent = `${analysis.bits.toFixed(1)} de ${mission.minBits} bits estimados por la heurística. La longitud y la lista de patrones son comprobaciones separadas.`;
    $("vault-length-goal").textContent = String(mission.minLength);
    const rating = practiceRating(analysis);
    $("vault-rating").dataset.tier = rating.tier;
    $("vault-rating-title").textContent = rating.title;
    $("vault-rating-score").textContent = `${rating.score}/100`;
    $<HTMLProgressElement>("vault-rating-meter").value = rating.score;
    $("vault-rating-tip").textContent = rating.tip;
    if (rating.tier !== announcedTier) {
      announcedTier = rating.tier;
      $("vault-rating-live").textContent = rating.tier === "empty" ? "" : `${rating.title}. ${rating.score} de 100 en el juego.`;
    }
    $("vault-prepare-points").textContent = ready ? "Preparación lista: aporta 25 XP cuando completes y expliques la misión." : "Cumple las tres metas para obtener los 25 XP de preparación al completar la misión.";
    $("vault-defense-state").textContent = ready ? "Preparación lista" : "Defensa en construcción";
    root.dataset.ready = String(ready);
    runButton.disabled = !ready || prediction === null || busy || result !== null;
    updateRunHint();
    updatePhases();
    if (ready && !wasReady && !result && !completed) {
      setStatus(prediction === null ? "Defensa de práctica lista. Ahora elige tu predicción." : "Defensa de práctica lista. Ya puedes ejecutar el experimento.");
    }
  }

  function clearRetry(): void {
    if (retryTimer) {
      window.clearTimeout(retryTimer);
      retryTimer = 0;
    }
  }

  /**
   * Cuenta atrás visible tras un fallo. El botón no se deshabilita durante la espera:
   * conservar el foco vale más que bloquear un clic que ya está guardado por retryUntil.
   */
  function countRetry(idleLabel: string): void {
    clearRetry();
    const tick = (): void => {
      if (busy || result || retryUntil === 0) return;
      const left = Math.ceil((retryUntil - Date.now()) / 1000);
      if (left > 0) {
        runButton.textContent = `Reintentar en ${left} s`;
        retryTimer = window.setTimeout(tick, 400);
      } else {
        retryUntil = 0;
        runButton.textContent = idleLabel;
      }
    };
    tick();
  }

  function selectMission(index: number): void {
    if (busy || !missionUnlocked(index, player.vault)) return;
    selected = index;
    runToken++;
    clearRetry();
    retryUntil = 0;
    prediction = null;
    result = null;
    completed = false;
    input.value = "";
    prepare.disabled = false;
    predict.disabled = false;
    runButton.disabled = true;
    runButton.textContent = "Ejecutar experimento con Qiskit";
    $("vault-result").hidden = true;
    $("vault-finish").hidden = true;
    root.dataset.complete = "false";
    const mission = MISSIONS[index];
    $("vault-title").textContent = mission.title;
    $("vault-story").textContent = mission.story;
    $("vault-concept").textContent = mission.concept;
    $("vault-model").textContent = `${2 ** mission.n} candidatos · ${mission.k} iteraciones · 512 mediciones`;
    $("vault-prediction-question").textContent = mission.prediction;
    $("vault-predictions").replaceChildren(...mission.predictions.map((label, i) => {
      const radio = h("input", { type: "radio", name: "vault-prediction", value: String(i) });
      radio.addEventListener("change", () => {
        prediction = i;
        updatePreparation();
        if (!result && !completed) {
          setStatus(ready ? "Predicción anotada. Ejecuta el experimento con Qiskit." : "Predicción anotada. Termina tu defensa de práctica para ejecutar.");
        }
      });
      return h("label", { class: "vault-choice" }, radio, h("span", {}, label));
    }));
    setStatus("Prepara una clave ficticia y elige tu predicción. No uses una contraseña personal.");
    renderProgress();
    updatePreparation();
  }

  function renderResult(r: GroverResult): void {
    $("vault-result").hidden = false;
    countTo($("vault-theory"), 100 * r.theoretical_success, (v) => pct(v / 100));
    countTo($("vault-measured"), 100 * r.measured_success, (v) => pct(v / 100));
    $("vault-backend").textContent = `${r.backend} · ${r.shots} mediciones · objetivo ${r.marked_state}`;
    $("vault-circuit").textContent = r.circuit_text;
    const board = $("vault-board");
    board.replaceChildren(...Array.from({ length: 2 ** r.n_qubits }, (_, i) => {
      const state = i.toString(2).padStart(r.n_qubits, "0");
      const hits = r.counts[state] ?? 0;
      const cell = h("div", { class: "vault-cell", role: "listitem", "data-target": String(state === r.marked_state) },
        h("span", { class: "mono" }, state), h("b", {}, pct(hits / r.shots)),
        h("span", { class: "vault-cell__label" }, `${state === r.marked_state ? "Objetivo" : "Candidato"} · ${hits} de ${r.shots}`));
      cell.style.setProperty("--frequency", "0");
      cell.style.setProperty("--i", String(i));
      return cell;
    }));
    // Las barras crecen desde cero tras insertarse; sin la doble rAF el navegador pintaría el valor final directo.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      board.querySelectorAll<HTMLElement>(".vault-cell").forEach((cell, i) => {
        const state = i.toString(2).padStart(r.n_qubits, "0");
        cell.style.setProperty("--frequency", String((r.counts[state] ?? 0) / r.shots));
      });
    }));
    $("vault-question").textContent = MISSIONS[selected].question;
    $("vault-answer-feedback").textContent = "Elige una explicación para completar la misión. Si te equivocas, tendrás una pista y otro intento.";
    $("vault-answers").replaceChildren(...MISSIONS[selected].answers.map((label, i) => {
      const button = h("button", { type: "button", class: "vault-answer" }, label);
      button.addEventListener("click", () => answer(i));
      return button;
    }));
    motion($("vault-result"), [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], 240);
  }

  function answer(choice: number): void {
    if (!result || completed) return;
    const mission = MISSIONS[selected];
    const buttons = Array.from($("vault-answers").querySelectorAll<HTMLButtonElement>("button"));
    const chosen = buttons[choice];
    if (!chosen || chosen.getAttribute("aria-disabled") === "true") return;
    if (choice !== mission.correctAnswer) {
      chosen.dataset.state = "wrong";
      chosen.setAttribute("aria-disabled", "true");
      $("vault-answer-feedback").textContent = `Todavía no. ${mission.hint} Vuelve a elegir; puedes aprender con pistas.`;
      motion(chosen, [{ opacity: 0.55 }, { opacity: 1 }], 200);
      return;
    }
    completed = true;
    const correct = prediction === mission.correctPrediction;
    const score = missionScore(correct);
    const award = awardVaultMission(player, mission.id, score);
    chosen.dataset.state = "correct";
    $("vault-answer-feedback").textContent = `Correcto. ${mission.lesson}`;
    buttons.forEach((b) => { b.disabled = true; });
    $("vault-finish").hidden = false;
    $("vault-score").textContent = `${score}/100 puntos`;
    $("vault-breakdown").textContent = `Preparación 25 · Predicción ${correct ? 25 : 0} · Experimento 20 · Explicación 30. ${award ? `Sumaste ${award.xp} XP al progreso general.` : "Conservas tu mejor marca; repetir no duplica XP."}`;
    $("vault-prediction-feedback").textContent = correct ? "Tu predicción coincide con el modelo." : `La predicción esperada era: ${mission.predictions[mission.correctPrediction]}. Repite para mejorar tu marca.`;
    next.hidden = selected === MISSIONS.length - 1;
    root.dataset.complete = "true";
    $("vault-defense-state").textContent = "Misión comprendida";
    setStatus(`Misión completada: ${score}/100 puntos.`);
    updatePhases();
    renderProgress();
    onAward(award);
    $("vault-score").focus();
  }

  input.addEventListener("input", updatePreparation);
  window.addEventListener("pagehide", () => { input.value = ""; });
  window.addEventListener("qubitguard:progress-restored", () => { renderProgress(); });
  $("vault-generate").addEventListener("click", () => {
    // Muestra aleatoria local de entrenamiento. Nunca se guarda ni viaja a la API.
    input.value = generateChars({ length: Math.max(28, MISSIONS[selected].minLength), lower: true, upper: true, digits: true, symbols: false, avoidAmbiguous: true }).value;
    updatePreparation();
  });
  runButton.addEventListener("click", async () => {
    if (!ready || prediction === null || busy || result) return;
    if (Date.now() < retryUntil) {
      setStatus(`El simulador sigue ocupado; reintenta en ${Math.ceil((retryUntil - Date.now()) / 1000)} s.`, true);
      return;
    }
    clearRetry();
    busy = true;
    const token = ++runToken;
    prepare.disabled = true;
    predict.disabled = true;
    runButton.disabled = true;
    runButton.classList.add("is-busy");
    runButton.setAttribute("aria-busy", "true");
    runButton.textContent = "Midiendo el circuito…";
    root.dataset.busy = "true";
    root.setAttribute("aria-busy", "true");
    setStatus("Ejecutando Grover en Aer local. La clave de práctica permanece en tu navegador.");
    updateRunHint();
    updatePhases();
    renderProgress();
    try {
      const mission = MISSIONS[selected];
      const r = await api.grover({ n_qubits: mission.n, marked_state: "1".repeat(mission.n), iterations: mission.k, shots: 512, seed: 42, noisy: false });
      if (token !== runToken) return;
      result = r;
      input.value = "";
      runButton.textContent = "Experimento completado";
      setStatus("Experimento listo. La clave ficticia se ha borrado. Compara el tablero y explica qué ocurrió.");
      renderResult(r);
      $("vault-result-heading").focus();
    } catch (error) {
      if (token !== runToken) return;
      const wait = error instanceof ApiError && error.retryAfter > 0 ? error.retryAfter : 2;
      retryUntil = Date.now() + wait * 1000;
      prepare.disabled = false;
      predict.disabled = false;
      setStatus(`${describeError(error)} Tu defensa y tu predicción siguen aquí.`, true);
      countRetry("Reintentar experimento con Qiskit");
    } finally {
      busy = false;
      runButton.classList.remove("is-busy");
      runButton.removeAttribute("aria-busy");
      delete root.dataset.busy;
      root.removeAttribute("aria-busy");
      runButton.disabled = result !== null || !ready || prediction === null;
      updateRunHint();
      updatePhases();
      renderProgress();
    }
  });
  next.addEventListener("click", () => { selectMission(selected + 1); $("vault-title").focus(); });
  $("vault-replay").addEventListener("click", () => { selectMission(selected); $("vault-title").focus(); });
  const firstIncomplete = MISSIONS.findIndex((m) => !player.vault?.[m.id]);
  selectMission(firstIncomplete < 0 ? 0 : firstIncomplete);
}
