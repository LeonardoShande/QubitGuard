import { $ } from "./dom.js";

// Alfabeto de superposición: kets y puertas que aparecen en el fondo y en la entrada antes de "medir".
// El azar pasa por crypto.getRandomValues: política del repo (test/generator.test.mjs), aunque aquí solo decora.
const GLYPHS = "01+·:|ψθφ⊗⊕π√";
const randBuf = new Uint32Array(1);
const rand = () => {
  crypto.getRandomValues(randBuf);
  return randBuf[0]! / 2 ** 32;
};
const randomGlyph = () => GLYPHS[Math.floor(rand() * GLYPHS.length)]!;
const randomRow = (len: number) => Array.from({ length: len }, randomGlyph).join("");

interface Rain {
  start(): void;
  stop(): void;
}

/**
 * Lluvia ASCII: columnas estáticas animadas por el compositor (transform, sin JS por frame)
 * y un ticker lento que re-siembra glifos para que el bucle no se note. El CSS la pausa
 * (`.quantum-backdrop:not(.is-animated)`) cuando toca; aquí solo se detiene el ticker.
 */
function buildRain(host: HTMLElement): Rain {
  const cols = Math.max(8, Math.min(16, Math.floor(window.innerWidth / 96)));
  const columns: HTMLElement[] = [];
  for (let i = 0; i < cols; i++) {
    const col = document.createElement("span");
    const duration = 13 + rand() * 12;
    col.className = i % 4 === 2 ? "rain__col rain__col--alt" : "rain__col";
    col.textContent = randomRow(12 + Math.floor(rand() * 12));
    col.style.left = `${(((i + rand() * 0.7) / cols) * 100).toFixed(2)}%`;
    col.style.animationDuration = `${duration.toFixed(1)}s`;
    col.style.animationDelay = `${(-rand() * duration).toFixed(1)}s`;
    host.append(col);
    columns.push(col);
  }
  let timer = 0;
  const reseed = () => {
    for (let k = 0; k < 6; k++) {
      const col = columns[Math.floor(rand() * columns.length)]!;
      const chars = [...col.textContent!];
      chars[Math.floor(rand() * chars.length)] = randomGlyph();
      col.textContent = chars.join("");
    }
  };
  return {
    start() { if (!timer) timer = window.setInterval(reseed, 900); },
    stop() { window.clearInterval(timer); timer = 0; },
  };
}

/**
 * La entrada IBM "se forma" como una medición: cada posición nace con un glifo en
 * superposición (cian) y colapsa, onda de izquierda a derecha, al carácter final.
 * Devuelve la limpieza del ticker para que Escape no deje trabajo pendiente.
 */
function decodeIntro(letters: HTMLElement): () => void {
  const rows = (letters.textContent ?? "").split("\n");
  letters.replaceChildren();
  const pending: Array<{ node: HTMLElement; final: string; start: number; lock: number; set: boolean }> = [];
  rows.forEach((row, r) => {
    const wrap = document.createElement("span");
    // Filas alternas más tenues: las franjas horizontales de la marca IBM. --r escalona el
    // barrido de luz por fila (styles.css), que refuerza esas franjas.
    wrap.className = r % 2 ? "intro__row intro__row--alt" : "intro__row";
    wrap.style.setProperty("--r", String(r));
    [...row].forEach((c, i) => {
      const ch = document.createElement("span");
      ch.className = "intro__ch";
      ch.textContent = c === " " ? " " : randomGlyph();
      wrap.append(ch);
      if (c !== " ") pending.push({ node: ch, final: c, start: 140 + i * 26 + r * 40, lock: 0, set: false });
    });
    letters.append(wrap);
  });
  for (const p of pending) p.lock = p.start + 360 + rand() * 220;
  const t0 = performance.now();
  const tick = window.setInterval(() => {
    const now = performance.now() - t0;
    let alive = 0;
    for (const p of pending) {
      if (p.set) continue;
      if (now >= p.lock) {
        p.node.textContent = p.final;
        p.node.classList.add("is-set");
        p.set = true;
      } else {
        alive++;
        if (now >= p.start && rand() < 0.75) p.node.textContent = randomGlyph();
      }
    }
    if (!alive) window.clearInterval(tick);
  }, 55);
  return () => window.clearInterval(tick);
}

export function initAmbience(): void {
  const backdrop = $("quantum-backdrop");
  const toggle = $<HTMLButtonElement>("ascii-toggle");
  const state = $("ascii-toggle-state");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  // La lluvia vive en #quantum-rain con DOM real; los tests de node usan un mock mínimo sin createElement.
  const rainHost = document.getElementById("quantum-rain");
  const rain = rainHost && typeof document.createElement === "function" && typeof rainHost.append === "function"
    ? buildRain(rainHost)
    : null;

  const intro = $("ibm-intro");
  let stopDecode: (() => void) | null = null;
  const skip = (event: KeyboardEvent) => { if (event.key === "Escape") finish(); };
  const finish = () => {
    intro.remove();
    stopDecode?.();
    stopDecode = null;
    document.removeEventListener("keydown", skip);
  };

  const sync = () => {
    const enabled = toggle.getAttribute("aria-pressed") === "true";
    backdrop.hidden = !enabled;
    const animated = enabled && !document.hidden && !reduced.matches;
    backdrop.classList.toggle("is-animated", animated);
    toggle.title = enabled ? "Ocultar fondo ASCII" : "Mostrar fondo ASCII";
    state.textContent = enabled ? "ON" : "OFF";
    if (animated) rain?.start(); else rain?.stop();
    if (reduced.matches) finish();
  };
  toggle.hidden = false;
  toggle.addEventListener("click", () => {
    toggle.setAttribute("aria-pressed", String(toggle.getAttribute("aria-pressed") !== "true"));
    sync();
  });
  document.addEventListener("visibilitychange", sync);
  reduced.addEventListener("change", sync);
  sync();

  const letters = typeof intro.querySelector === "function" ? intro.querySelector<HTMLElement>(".ibm-intro__letters") : null;
  if (letters && !reduced.matches) stopDecode = decodeIntro(letters);
  intro.addEventListener("animationend", (event) => { if (event.target === intro) finish(); });
  // Saltable con un toque o clic: la capa recibe el clic, así no llega a un control invisible debajo.
  intro.addEventListener("click", finish);
  document.addEventListener("keydown", skip);
  if (reduced.matches) finish();
}
