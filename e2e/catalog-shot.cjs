"use strict";
/*
 * catalog-shot.cjs
 *
 * Produces the portfolio-tabs catalog screenshot for IronLog.
 *
 * It logs into (or registers) a demo account on the running instance, seeds a
 * realistic block of training history through the public API so the dashboard
 * charts are populated, stores the session token, reloads the SPA, and captures
 * the dashboard.
 *
 * Run against the live deploy (service may be asleep; warm it first):
 *   CATALOG_SHOT=.../shots/ironlog.png node lulla/e2e/cdp-run-real.cjs \
 *     https://ironlog-llgm.onrender.com ironlog/e2e/catalog-shot.cjs \
 *     --timeout-ms 180000 --settle-ms 3000 --width 1280 --height 800
 */
const path = require("path");

const DEMO = {
  email: "demo@ironlog.dev",
  password: "demo-password-123",
  displayName: "Jordan Avery",
};

const OUT = process.env.CATALOG_SHOT || path.join(__dirname, "ironlog-dashboard.png");

const waitFor = async (t, expr, timeoutMs = 20000, step = 250) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await t.eval(expr)) return true;
    await t.wait(step);
  }
  return false;
};

module.exports = async (t) => {
  // ---- 1. Auth on the same origin (login, else register) ------------------
  const auth = await t.evalAsync(`(async () => {
    const post = (url, body) => fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));
    let r = await post('/api/auth/login', { email: ${JSON.stringify(DEMO.email)}, password: ${JSON.stringify(DEMO.password)} });
    if (r.status >= 400) {
      r = await post('/api/auth/register', { email: ${JSON.stringify(DEMO.email)}, password: ${JSON.stringify(DEMO.password)}, displayName: ${JSON.stringify(DEMO.displayName)}, unit: 'KG' });
    }
    return r;
  })()`);
  t.check("1. demo auth", !!(auth && auth.status < 400 && auth.body && auth.body.token), `status=${auth && auth.status}`);
  const token = auth.body.token;

  // ---- 2. Seed history so the dashboard has data --------------------------
  const seeded = await t.evalAsync(`(async () => {
    const H = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + ${JSON.stringify(token)} };
    const ex = await fetch('/api/exercises', { headers: H }).then((r) => r.json());
    const pick = (m) =>
      (ex.find((e) => e.primaryMuscle === m && e.equipment === 'BARBELL') ||
        ex.find((e) => e.primaryMuscle === m) ||
        ex[0]).id;
    const M = {
      chest: pick('CHEST'), back: pick('BACK'), quads: pick('QUADS'),
      hams: pick('HAMSTRINGS'), shoulders: pick('SHOULDERS'),
      biceps: pick('BICEPS'), triceps: pick('TRICEPS'), core: pick('CORE'),
    };
    const plans = [
      { title: 'Push day', ids: [M.chest, M.shoulders, M.triceps], base: 50 },
      { title: 'Pull day', ids: [M.back, M.biceps], base: 60 },
      { title: 'Leg day', ids: [M.quads, M.hams, M.core], base: 70 },
    ];
    const sum = await fetch('/api/stats/summary', { headers: H }).then((r) => r.json());
    if (sum.totalWorkouts >= 8) return { skipped: true, total: sum.totalWorkouts };
    let created = 0;
    const now = Date.now();
    for (let w = 9; w >= 0; w--) {
      const perWeek = w < 6 ? 2 : 1;
      for (let k = 0; k < perWeek; k++) {
        const plan = plans[(w + k) % 3];
        const started = new Date(now - w * 7 * 864e5 - k * 2 * 864e5 - 15 * 3600e3);
        const completed = new Date(started.getTime() + 55 * 60e3);
        const prog = 9 - w;
        const body = {
          title: plan.title,
          startedAt: started.toISOString(),
          completedAt: completed.toISOString(),
          notes: null,
          status: 'COMPLETED',
          exercises: plan.ids.map((id, idx) => ({
            exerciseId: id,
            notes: null,
            sets: [0, 1, 2].map((s) => ({
              reps: 8 - s,
              weightKg: plan.base + prog * 2.5 + idx * 5,
              durationSeconds: null,
              distanceMeters: null,
              rpe: 7 + s,
              type: 'NORMAL',
            })),
          })),
        };
        const r = await fetch('/api/workouts', { method: 'POST', headers: H, body: JSON.stringify(body) });
        if (r.ok) created++;
      }
    }
    return { skipped: false, created };
  })()`);
  t.check("2. seed history", !!(seeded && (seeded.skipped || seeded.created > 0)), JSON.stringify(seeded));

  // ---- 3. Store the token and render the dashboard ------------------------
  await t.eval(`localStorage.setItem('ironlog.token', ${JSON.stringify(token)})`);
  await t.reload();

  const ready = await waitFor(
    t,
    `location.pathname === '/' && document.querySelectorAll('.metric').length >= 6 && document.querySelectorAll('.charts svg').length >= 1`,
    25000,
  );
  const metrics = await t.eval("document.querySelectorAll('.metric').length");
  const charts = await t.eval("document.querySelectorAll('.charts svg').length");
  t.check("3. dashboard rendered", ready, `pathname=${await t.eval("location.pathname")} metrics=${metrics} charts=${charts}`);

  await t.wait(1200);
  await t.shot(OUT);

  const errs = JSON.parse((await t.eval("JSON.stringify(window.__irErrs || [])")) || "[]");
  t.check("4. no recorded page errors", errs.length === 0, JSON.stringify(errs));
};
