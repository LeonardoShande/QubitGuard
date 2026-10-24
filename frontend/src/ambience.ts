import { $ } from "./dom.js";

export function initAmbience(): void {
  const backdrop = $("quantum-backdrop");
  const toggle = $<HTMLButtonElement>("ascii-toggle");
  const state = $("ascii-toggle-state");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const sync = () => {
    const enabled = toggle.getAttribute("aria-pressed") === "true";
    backdrop.hidden = !enabled;
    backdrop.classList.toggle("is-animated", enabled && !document.hidden && !reduced.matches);
    toggle.title = enabled ? "Ocultar fondo ASCII" : "Mostrar fondo ASCII";
    state.textContent = enabled ? "ON" : "OFF";
  };
  toggle.hidden = false;
  toggle.addEventListener("click", () => {
    toggle.setAttribute("aria-pressed", String(toggle.getAttribute("aria-pressed") !== "true"));
    sync();
  });
  document.addEventListener("visibilitychange", sync);
  reduced.addEventListener("change", sync);
  sync();

  const intro = $("ibm-intro");
  const skip = (event: KeyboardEvent) => { if (event.key === "Escape") finish(); };
  const finish = () => {
    intro.remove();
    document.removeEventListener("keydown", skip);
  };
  intro.addEventListener("animationend", (event) => { if (event.target === intro) finish(); });
  document.addEventListener("keydown", skip);
  if (reduced.matches) finish();
}
