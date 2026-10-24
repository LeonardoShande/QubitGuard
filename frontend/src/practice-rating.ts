import type { Analysis } from "./password.js";

/** Estilo del ejemplo en el juego; nunca equivale a una certificación ni concede XP por teclear. */
export function practiceRating(analysis: Pick<Analysis, "length" | "bits" | "penalties">) {
  if (analysis.length === 0) return { score: 0, tier: "empty", title: "Tu clave empieza aquí", tip: "Inventa un ejemplo o crea uno aleatorio para ver cómo mejora." };
  let score = Math.min(100, Math.floor(Math.max(0, analysis.bits) * 100 / 128));
  if (analysis.length < 15) score = Math.min(score, 35);
  if (analysis.penalties.length) score = Math.min(score, 39);
  if (analysis.length < 24) score = Math.min(score, 89);
  if (score < 40) return { score, tier: "meh", title: "Meh… podemos mejorarla", tip: analysis.penalties.length ? "Hay patrones fáciles de anticipar. Cambia la idea completa; añadir un signo no borra el patrón." : "Prueba un ejemplo más largo y menos predecible." };
  if (score < 70) return { score, tier: "good", title: "Buena: ya toma forma", tip: "Vas bien. Más elecciones aleatorias y longitud pueden mejorar el ejemplo." };
  if (score < 90) return { score, tier: "epic", title: "Épica: subiste el nivel", tip: "Buen ejemplo para practicar. Comprueba las metas de esta misión y prepara tu predicción." };
  return { score, tier: "aura", title: "Nivel dios: tu clave tiene aura", tip: "Llegaste al tramo superior del modelo del juego. Ahora demuestra que entiendes el experimento." };
}
