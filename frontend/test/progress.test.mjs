// Ruta, logros y tope diario de XP por predicción: node --test test/progress.test.mjs (tras npm run build).
import test from "node:test";
import assert from "node:assert/strict";
import { completeStep, levelInfo, PREDICTIONS_PER_DAY, rewardPrediction, unlock } from "../dist/progress.js";

const fresh = () => ({
  xp: 0, streak: 0, bestStreak: 0, lastChallengeDate: null, answers: {}, activity: {},
  path: [], achievements: [], predictions: { date: "", count: 0 },
});

test("la XP por predicción tiene tope diario y no puntúa 0", () => {
  const p = fresh();
  assert.equal(rewardPrediction(p, 0, "nada"), null);
  for (let i = 0; i < PREDICTIONS_PER_DAY; i++) assert.ok(rewardPrediction(p, 25, "exacta"));
  assert.equal(rewardPrediction(p, 25, "exacta"), null);
  assert.equal(p.xp, 25 * PREDICTIONS_PER_DAY);
});

test("pasos y logros solo cuentan una vez y guardan identificadores", () => {
  const p = fresh();
  assert.equal(completeStep(p, "ruido"), true);
  assert.equal(completeStep(p, "ruido"), false);
  assert.equal(unlock(p, "pw128"), true);
  assert.equal(unlock(p, "pw128"), false);
  assert.deepEqual(p.path, ["ruido"]);
  assert.deepEqual(p.achievements, ["pw128"]);
});

test("niveles", () => {
  assert.equal(levelInfo(0).level, 1);
  assert.equal(levelInfo(60).level, 2);
});
