"use strict";
/*
 * session-duration.cjs
 *
 * Regression for the optional "Duration (min)" input (#session-duration) on
 * LogPage (/log). When status is COMPLETED and a duration is entered, the app
 * must persist completedAt = startedAt + duration and surface it on the workout
 * detail page as a non-zero duration metric.
 *
 * Run:
 *   node <skill>/cdp-run.js http://localhost:8090/register ironlog/e2e/session-duration.cjs \
 *     --timeout-ms 120000 --settle-ms 1200
 *
 * The spec uses the native value setter + input/change events so React
 * controlled inputs pick the change up. It also wraps console.error / fetch
 * after load to report console errors and failed requests for the flow.
 */
const path = require("path");

const setField = (t, sel, value) =>
  t.eval(`(() => {
    const el = document.querySelector(${JSON.stringify(sel)});
    if (!el) return "MISSING";
    const proto = Object.getPrototypeOf(el);
    const desc = Object.getOwnPropertyDescriptor(proto, "value");
    if (desc && desc.set) desc.set.call(el, ${JSON.stringify(String(value))});
    else el.value = ${JSON.stringify(String(value))};
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return el.value;
  })()`);

const clickByText = (t, tag, text) =>
  t.eval(`(() => {
    const el = [...document.querySelectorAll(${JSON.stringify(tag)})]
      .find((x) => x.textContent.trim().includes(${JSON.stringify(text)}));
    if (!el) return false;
    el.click();
    return true;
  })()`);

const navTo = (t, text) =>
  t.eval(`(() => {
    const a = [...document.querySelectorAll("a")].find((x) => x.textContent.includes(${JSON.stringify(text)}));
    if (a) { a.click(); return true; }
    return false;
  })()`);

const waitFor = async (t, expr, timeoutMs = 8000, step = 150) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await t.eval(expr)) return true;
    await t.wait(step);
  }
  return false;
};

const metricValue = (t, label) =>
  t.eval(`(() => {
    const m = [...document.querySelectorAll(".metric")].find(
      (x) => x.querySelector(".metric__label") &&
             x.querySelector(".metric__label").textContent.trim() === ${JSON.stringify(label)});
    if (!m) return null;
    const b = m.querySelector(".metric__value b");
    return b ? b.textContent.trim() : null;
  })()`);

module.exports = async (t) => {
  const email = `dur+${Date.now()}@ironlog.dev`;

  // Capture console errors / uncaught errors / failed fetches from here on.
  // (The runner already records Runtime.exceptionThrown for the whole session.)
  await t.eval(`(() => {
    window.__e2eErrors = [];
    window.__failedReqs = [];
    const ce = console.error.bind(console);
    console.error = (...a) => { window.__e2eErrors.push("console.error: " + a.map(String).join(" ")); ce(...a); };
    window.addEventListener("error", (e) => window.__e2eErrors.push("error: " + (e.message || (e.error && e.error.message) || "unknown")));
    window.addEventListener("unhandledrejection", (e) => window.__e2eErrors.push("unhandledrejection: " + (e.reason && (e.reason.message || String(e.reason)) || "unknown")));
    if (!window.__fetchWrapped) {
      window.__fetchWrapped = true;
      const of = window.fetch.bind(window);
      window.fetch = async (...args) => {
        const url = (args[0] && (args[0].url || args[0])) || "";
        try {
          const r = await of(...args);
          if (!r.ok) window.__failedReqs.push(url + " -> " + r.status);
          return r;
        } catch (err) {
          window.__failedReqs.push(url + " -> network error: " + err.message);
          throw err;
        }
      };
    }
  })()`);

  // ---- 1. Register a unique account --------------------------------------
  await setField(t, "#register-name", "E2E Runner");
  await setField(t, "#register-email", email);
  await setField(t, "#register-password", "password123");
  await t.eval(`document.querySelector('button[type="submit"]').click()`);

  const registered = await waitFor(
    t,
    `!![...document.querySelectorAll("a")].find((a) => a.textContent.includes("Log a session"))`,
    12000,
  );
  t.check("1. register unique account", registered, `email=${email} pathname=${await t.eval("location.pathname")}`);

  const token = await t.eval("localStorage.getItem('ironlog.token')");
  t.check(
    "1b. token stored at localStorage['ironlog.token']",
    typeof token === "string" && token.length > 20,
    `len=${token ? token.length : 0}`,
  );

  // ---- 2. Go to /log -----------------------------------------------------
  t.check("2. navigate to /log via nav link", (await navTo(t, "Log a session")) === true, 'link text "Log a session"');
  const onLog = await waitFor(t, `location.pathname === "/log" && !!document.querySelector("#session-title")`, 8000);
  t.check("2b. log page renders (#session-title)", onLog, `pathname=${await t.eval("location.pathname")}`);

  const statusDefault = await t.eval(`document.querySelector("#session-status").value`);
  t.check("2c. status defaults to COMPLETED (#session-status)", statusDefault === "COMPLETED", `value=${statusDefault}`);
  const durDisabled0 = await t.eval(`document.querySelector("#session-duration").disabled`);
  t.check("2d. duration input enabled while COMPLETED", durDisabled0 === false, `disabled=${durDisabled0}`);

  // ---- 3. Add one exercise via the picker --------------------------------
  await setField(t, 'input[aria-label="Search exercises"]', "Bench Press");
  await t.wait(900);
  const pickerCount = await t.eval(`document.querySelectorAll("button.picker__item").length`);
  t.check("3. picker returns results for 'Bench Press'", pickerCount > 0, `items=${pickerCount}`);

  const picked = await t.eval(`(() => {
    const b = document.querySelector("button.picker__item");
    if (!b) return null;
    const nameEl = b.querySelector(".truncate");
    const name = (nameEl ? nameEl.textContent : b.textContent).trim();
    b.click();
    return name;
  })()`);
  await t.wait(400);
  t.check("3b. exercise added from picker", !!picked && /bench press/i.test(picked), `picked=${picked}`);

  const exName = await t.eval(`(() => {
    const e = document.querySelector(".exercise-editor__title b");
    return e ? e.textContent.trim() : null;
  })()`);
  t.check("3c. exercise editor shows the movement", !!exName && /bench press/i.test(exName), `name=${exName}`);

  // ---- 4. Two sets: 5x100 and 5x105 --------------------------------------
  await setField(t, 'input[aria-label="Set 1 reps"]', "5");
  await setField(t, 'input[aria-label="Set 1 weight in kg"]', "100");
  t.check("4. click 'Add set'", (await clickByText(t, "button", "Add set")) === true, "");
  await t.wait(300);
  await setField(t, 'input[aria-label="Set 2 reps"]', "5");
  await setField(t, 'input[aria-label="Set 2 weight in kg"]', "105");

  const rows = await t.eval(`document.querySelectorAll(".set-table tbody tr").length`);
  const reps1 = await t.eval(`document.querySelector('input[aria-label="Set 1 reps"]').value`);
  const w1 = await t.eval(`document.querySelector('input[aria-label="Set 1 weight in kg"]').value`);
  const reps2 = await t.eval(`document.querySelector('input[aria-label="Set 2 reps"]').value`);
  const w2 = await t.eval(`document.querySelector('input[aria-label="Set 2 weight in kg"]').value`);
  t.check(
    "4b. two sets recorded",
    rows === 2 && reps1 === "5" && w1 === "100" && reps2 === "5" && w2 === "105",
    `rows=${rows} set1=${reps1}x${w1} set2=${reps2}x${w2}`,
  );

  // ---- 5. Duration 45 + title, duration stays enabled --------------------
  await setField(t, "#session-title", "Duration E2E");
  const durVal = await setField(t, "#session-duration", "45");
  const durDisabled1 = await t.eval(`document.querySelector("#session-duration").disabled`);
  t.check(
    "5. duration field accepts 45 and is enabled (COMPLETED)",
    durVal === "45" && durDisabled1 === false,
    `value=${durVal} disabled=${durDisabled1}`,
  );
  const titleVal = await t.eval(`document.querySelector("#session-title").value`);
  t.check('5b. session title is "Duration E2E"', titleVal === "Duration E2E", `value=${titleVal}`);

  // ---- 6. Save; expect /history/<id> -------------------------------------
  t.check("6. click 'Save session'", (await clickByText(t, "button", "Save session")) === true, "");
  const navigated = await waitFor(t, `location.pathname.startsWith("/history/")`, 12000);
  const detailPath = await t.eval("location.pathname");
  t.check(
    "6b. lands on /history/<id>",
    navigated && /^\/history\/[0-9a-fA-F-]{8,}$/.test(detailPath),
    `pathname=${detailPath}`,
  );

  const detailReady = await waitFor(t, `document.querySelectorAll(".metric").length >= 4`, 8000);
  t.check(
    "6c. detail page renders metrics",
    detailReady,
    `metrics=${await t.eval("document.querySelectorAll('.metric').length")}`,
  );

  // ---- 7. Duration / volume on the detail page ---------------------------
  const durMetric = await metricValue(t, "Duration");
  const volMetric = await metricValue(t, "Volume");
  const sub = await t.eval(`(() => {
    const e = document.querySelector(".page-head__sub");
    return e ? e.textContent.trim() : null;
  })()`);
  const finished = await t.eval(`document.body.innerText.includes("Finished")`);

  t.check("7. detail Duration metric is 45m", durMetric === "45m", `Duration=${durMetric}`);
  t.check("7b. detail Duration metric is not zero/empty", !!durMetric && durMetric !== "0m" && durMetric !== "—", `Duration=${durMetric}`);
  t.check("7c. detail Volume metric is 1,025 kg", volMetric === "1,025 kg", `Volume=${volMetric}`);
  t.check("7d. header sub-line shows the 45m duration", !!sub && sub.includes("45m"), `sub=${sub}`);
  t.check("7e. completedAt rendered ('Finished ...')", finished === true, `finished=${finished}`);

  // ---- 8. API cross-check ------------------------------------------------
  if (typeof token === "string" && token.length > 20) {
    let summary = null;
    try {
      const res = await fetch("http://localhost:8090/api/stats/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      summary = await res.json();
    } catch (e) {
      t.check("8. API summary reachable", false, `fetch error: ${e.message}`);
    }
    if (summary) {
      t.check(
        "8. API totalDurationMinutes ~45",
        Math.round(summary.totalDurationMinutes) === 45,
        `totalDurationMinutes=${summary.totalDurationMinutes}`,
      );
      t.check("8b. API totalVolumeKg is 1025", Number(summary.totalVolumeKg) === 1025, `totalVolumeKg=${summary.totalVolumeKg}`);
      t.check("8c. API totalWorkouts is 1", summary.totalWorkouts === 1, `totalWorkouts=${summary.totalWorkouts}`);
    }
  } else {
    t.check("8. API cross-check", false, "skipped: no token captured");
  }

  // ---- Screenshot of the detail page -------------------------------------
  await t.shot(path.join(__dirname, "session-duration-detail.png"));

  // ---- Console errors / failed requests ----------------------------------
  const errs = JSON.parse((await t.eval("JSON.stringify(window.__e2eErrors || [])")) || "[]");
  const fails = JSON.parse((await t.eval("JSON.stringify(window.__failedReqs || [])")) || "[]");
  t.check("9. no console errors during flow", errs.length === 0, `errors=${JSON.stringify(errs)}`);
  t.check("9b. no failed fetch requests during flow", fails.length === 0, `failed=${JSON.stringify(fails)}`);
};
