import test from "node:test";
import assert from "node:assert/strict";
import { load, awardVaultMission, answerChallenge, rewardPrediction, currentStreak, exportProgress, importProgress, checkStorage, storageStatus } from "../dist/progress.js";
import { practiceRating } from "../dist/practice-rating.js";
import { analyze } from "../dist/password.js";

function storage() {
  const values = new Map();
  globalThis.localStorage = { getItem: (k) => values.get(k) ?? null, setItem: (k, v) => values.set(k, v), removeItem: (k) => values.delete(k) };
  return values;
}

test("cerrar y volver otro día conserva XP, rango y misiones; cambia solo la racha visible", () => {
  storage();
  try {
    const player = load();
    awardVaultMission(player, "patterns", 100);
    answerChallenge(player, "2026-10-24", 0, true);
    const nextDay = load();
    assert.equal(nextDay.xp, 150);
    assert.equal(nextDay.vault.patterns, 100);
    assert.equal(currentStreak(nextDay, "2026-10-25"), 1);
    assert.equal(currentStreak(nextDay, "2026-10-27"), 0);
    assert.equal(nextDay.xp, 150, "perder una racha no resta XP");
    answerChallenge(nextDay, "2026-10-25", 1, true);
    assert.equal(load().xp, 210);
    assert.equal(load().streak, 2);
    assert.equal(awardVaultMission(load(), "patterns", 100), null);
  } finally { delete globalThis.localStorage; }
});

test("renovar el tope diario de predicciones no borra XP previo", () => {
  storage();
  try {
    const player = load();
    player.xp = 200;
    player.predictions = { date: "2000-01-01", count: 5 };
    assert.equal(rewardPrediction(player, 25, "predicción nueva").xp, 25);
    assert.equal(load().xp, 225);
    assert.equal(load().predictions.count, 1);
  } finally { delete globalThis.localStorage; }
});

test("un JSON principal dañado recupera el respaldo más reciente", () => {
  const values = storage();
  try {
    awardVaultMission(load(), "patterns", 75);
    values.set("qubitguard.progress.v1", "{broken");
    const recovered = load();
    assert.equal(recovered.xp, 75);
    assert.equal(recovered.vault.patterns, 75);
    assert.equal(storageStatus(), "recovered");
    checkStorage();
    assert.equal(storageStatus(), "recovered");
  } finally { delete globalThis.localStorage; }
});

test("el bloqueo del navegador se comunica sin impedir jugar ni exportar", () => {
  globalThis.localStorage = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  try {
    const player = load();
    checkStorage();
    assert.equal(storageStatus(), "blocked");
    awardVaultMission(player, "patterns", 100);
    assert.equal(player.xp, 100);
    assert.equal(storageStatus(), "blocked");
    assert.equal(JSON.parse(exportProgress(player)).progress.xp, 100);
  } finally { delete globalThis.localStorage; }
});

test("exportar y restaurar preserva marcas, no duplica XP y filtra campos ajenos", () => {
  storage();
  try {
    const first = load();
    awardVaultMission(first, "patterns", 100);
    awardVaultMission(first, "amplify", 75);
    first.password = "sensitive-never-export";
    first.answers = { "2026-10-24": { choice: 1, correct: true, password: "sensitive-never-export" } };
    const portable = exportProgress(first);
    assert.equal(portable.includes("sensitive-never-export"), false);
    const second = load();
    second.xp = 200;
    importProgress(second, portable);
    const xp = second.xp;
    importProgress(second, portable);
    assert.equal(second.xp, xp);
    assert.equal(second.vault.amplify, 75);
    assert.equal(awardVaultMission(second, "amplify", 100).xp, 25);
    assert.equal(load().xp, xp + 25);
    assert.throws(() => importProgress(second, '{"app":"other"}'));
    assert.throws(() => importProgress(second, "null"));
    assert.throws(() => importProgress(second, "x".repeat(131073)));
    assert.equal(second.xp, xp + 25);
  } finally { delete globalThis.localStorage; }
});

test("las etiquetas lúdicas no dan aura a una clave corta o con patrones detectados", () => {
  assert.equal(practiceRating(analyze("", 1)).tier, "empty");
  assert.equal(practiceRating(analyze("Qwerty2026!", 1)).tier, "meh");
  assert.equal(practiceRating({ length: 40, bits: 200, penalties: [{}] }).tier, "meh");
  assert.equal(practiceRating({ length: 14, bits: 200, penalties: [] }).tier, "meh");
  assert.equal(practiceRating({ length: 20, bits: 70, penalties: [] }).tier, "good");
  assert.equal(practiceRating({ length: 23, bits: 150, penalties: [] }).tier, "epic");
  assert.equal(practiceRating({ length: 28, bits: 150, penalties: [] }).tier, "aura");
  assert.equal(practiceRating({ length: 28, bits: 150, penalties: [] }).score, 100);
});
