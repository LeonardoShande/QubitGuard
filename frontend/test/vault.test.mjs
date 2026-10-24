import test from "node:test";
import assert from "node:assert/strict";
import { MISSIONS, missionUnlocked, missionScore, normalizeVault, vaultTotal, vaultRank } from "../dist/vault-model.js";
import { load, awardVaultMission } from "../dist/progress.js";

test("el progreso antiguo conserva XP, racha y logros al añadir la bóveda", () => {
  globalThis.localStorage = { getItem: () => JSON.stringify({ xp: 210, streak: 3, achievements: ["prediccion"] }), setItem() {} };
  try {
    const player = load();
    assert.equal(player.xp, 210);
    assert.equal(player.streak, 3);
    assert.deepEqual(player.achievements, ["prediccion"]);
    assert.deepEqual(player.vault, {});
  } finally { delete globalThis.localStorage; }
});

test("no se saltan misiones ni se recuperan marcas corruptas", () => {
  for (const value of [null, [], "password", { patterns: Infinity }, { patterns: 1000 }, { overshoot: 100 }]) {
    assert.equal(vaultTotal(value), 0);
  }
  assert.deepEqual(normalizeVault({ patterns: 75, amplify: 100, overshoot: 100, password: "never-store-this" }), { patterns: 75, amplify: 100, overshoot: 100 });
  assert.equal(missionUnlocked(1, {}), false);
  assert.equal(missionUnlocked(1, { patterns: 75 }), true);
  assert.equal(missionUnlocked(2, { amplify: 100 }), false);
  assert.equal(missionUnlocked(3, {}), false);
});

test("repetir no duplica XP; mejorar una predicción solo suma la diferencia", () => {
  const saved = [];
  globalThis.localStorage = { getItem: () => null, setItem: (key, value) => saved.push({ key, value }) };
  try {
    const player = load();
    assert.equal(awardVaultMission(player, "amplify", 100), null);
    assert.equal(awardVaultMission(player, "patterns", 999), null);
    assert.equal(awardVaultMission(player, "patterns", missionScore(false)).xp, 75);
    assert.equal(awardVaultMission(player, "patterns", 75), null);
    assert.equal(awardVaultMission(player, "patterns", missionScore(true)).xp, 25);
    assert.equal(awardVaultMission(player, "patterns", 75), null);
    assert.equal(player.xp, 100);
    assert.equal(vaultTotal(player.vault), 100);
    const primary = saved.filter(({ key }) => key === "qubitguard.progress.v1");
    assert.equal(primary.length, 2);
    assert.equal(JSON.parse(primary[1].value).vault.patterns, 100);
  } finally { delete globalThis.localStorage; }
});

test("el rango final se puede alcanzar con tres misiones y los límites no se solapan", () => {
  assert.equal(vaultRank(0).name, "Aprendiz de qubits");
  assert.equal(vaultRank(49).remaining, 1);
  assert.equal(vaultRank(50).name, "Explorador de probabilidades");
  assert.equal(vaultRank(100).name, "Constructor de defensas");
  assert.equal(vaultRank(200).name, "Estratega de amplitudes");
  const marks = Object.fromEntries(MISSIONS.map(({ id }) => [id, 100]));
  assert.equal(vaultTotal(marks), 300);
  assert.equal(vaultRank(300).name, "Guardián cuántico");
  assert.equal(vaultRank(300).remaining, 0);
});
