// Ruta, logros y tope diario de XP por predicción: node --test test/progress.test.mjs (tras npm run build).
import test from "node:test";
import assert from "node:assert/strict";
import { answerChallenge, completeStep, currentStreak, levelInfo, load, PREDICTIONS_PER_DAY, rewardPrediction, todayLocal, unlock } from "../dist/progress.js";

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

test("todayLocal usa la fecha local, no la UTC", () => {
  // 23:30 del 24 en hora local sigue siendo el 24, aunque en UTC ya sea otro día.
  assert.equal(todayLocal(new Date(2026, 9, 24, 23, 30)), "2026-10-24");
  assert.equal(todayLocal(new Date(2026, 0, 5, 0, 5)), "2026-01-05");
});

test("días locales consecutivos suman racha; el mismo día no puntúa dos veces", () => {
  const p = fresh();
  assert.ok(answerChallenge(p, "2026-10-23", 0, true));
  assert.equal(answerChallenge(p, "2026-10-23", 1, false), null);
  assert.equal(p.streak, 1);
  const second = answerChallenge(p, "2026-10-24", 0, true);
  assert.equal(p.streak, 2);
  assert.equal(second.xp, 50 + 10);
  assert.equal(currentStreak(p, "2026-10-25"), 2);
  assert.equal(currentStreak(p, "2026-10-26"), 0);
  // Saltarse un día reinicia; el cruce de mes cuenta como consecutivo.
  assert.ok(answerChallenge(p, "2026-10-31", 0, true));
  assert.equal(p.streak, 1);
  assert.ok(answerChallenge(p, "2026-11-01", 0, true));
  assert.equal(p.streak, 2);
});

test("datos corruptos en localStorage no rompen la carga", () => {
  globalThis.localStorage = { getItem: () => '{"xp":"x","streak":-3,"answers":null,"activity":[1],"path":5,"lastChallengeDate":7}', setItem() {} };
  const p = load();
  assert.equal(p.xp, 0);
  assert.equal(p.streak, 0);
  assert.deepEqual(p.answers, {});
  assert.deepEqual(p.activity, {});
  assert.deepEqual(p.path, []);
  assert.equal(p.lastChallengeDate, null);
  delete globalThis.localStorage;
});
