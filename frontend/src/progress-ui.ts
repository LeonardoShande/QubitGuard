import { $, h } from "./dom.js";
import { checkStorage, exportProgress, importProgress, storageStatus, type Progress } from "./progress.js";

export function initProgressUI(player: Progress, onRestore: () => void): void {
  const message = $("vault-save-status");
  const file = $<HTMLInputElement>("vault-import-file");
  function renderStorage(): void {
    const state = storageStatus();
    message.dataset.state = state;
    message.textContent = state === "blocked"
      ? "Guardado automático bloqueado. Descarga una copia antes de cerrar para conservar tus puntos."
      : state === "recovered"
        ? "Recuperamos tu progreso desde la copia local de respaldo. Tus puntos siguen aquí."
        : "Guardado automático activo en este navegador. Tu XP y tus misiones no se reinician mañana.";
  }
  checkStorage();
  renderStorage();
  window.addEventListener("qubitguard:progress-saved", renderStorage);
  $("vault-export").addEventListener("click", () => {
    const portable = exportProgress(player);
    $<HTMLTextAreaElement>("vault-backup-json").value = portable;
    $("vault-backup-text").hidden = false;
    const blob = new Blob([portable], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = h("a", { href: url, download: "qubitguard-progreso.json" });
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 10000);
    $("vault-backup-feedback").textContent = "Copia preparada para descargar: contiene XP, misiones y logros; ninguna contraseña. Puedes restaurarla desde el archivo.";
  });
  $("vault-import").addEventListener("click", () => file.click());
  file.addEventListener("change", async () => {
    const selected = file.files?.[0];
    if (!selected) return;
    try {
      if (selected.size > 131072) throw new Error("La copia es demasiado grande. Elige qubitguard-progreso.json.");
      importProgress(player, await selected.text());
      onRestore();
      window.dispatchEvent(new Event("qubitguard:progress-restored"));
      $("vault-backup-feedback").textContent = "Progreso restaurado. Conservamos tus mejores marcas y no restamos XP.";
    } catch (error) {
      $("vault-backup-feedback").textContent = error instanceof Error ? error.message : "No pudimos abrir esa copia. El progreso actual sigue intacto.";
    } finally { file.value = ""; }
  });
}
