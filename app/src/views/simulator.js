import { esc, fmt, ICON, END, FLEX_DOI } from "../core/dom.js";
import { METRICS } from "../model/knn.js";
import { createFlame2D } from "../render/flame2d.js";
import { drawD2 } from "../charts/d2law.js";
import { gravitySwitch } from "../ui/chips.js";
import { createSnapshot } from "../model/reproducibility.js";

export function statusLine(sim) {
  const { cov } = sim;
  return `<span class="status st-${cov.level}">${ICON[cov.level]}${cov.title}</span><span class="dim small">${cov.text}</span>`;
}

export function mountSimulator(root, data, { controls, scenario, gravity }) {
  root.innerHTML = `
    <div class="section-head">
      <div class="eyebrow">Module 04 · Evidence-Based Simulator & Uncertainty Engine</div>
      <h2>How Does a Fuel Droplet Burn Under These Conditions?</h2>
      <p class="lede">Empirical k-NN model trained on 257 NASA FLEX spaceflight test runs. Computes standard error of the mean, 95% confidence intervals, and explicit warnings when conditions move beyond measured space (such as 0.57 atm exploration atmosphere).</p>
    </div>
    <div class="grid-sim">
      <div data-slot="controls"></div>
      <div style="display:grid;gap:14px;min-width:0">
        <div class="statusline" id="sim-cov"></div>
        <div id="sim-extrap-alert"></div>
        <div class="outputs" id="sim-out"></div>
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <button type="button" class="btn small" id="sim-btn-snapshot" style="display:inline-flex; align-items:center; gap:6px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Save Reproducibility Snapshot
            </button>
            <span id="sim-snapshot-msg" class="dim small"></span>
          </div>
          <div style="font-size:0.8rem; color:var(--dim);" id="sim-model-tag">Model: k-NN (k=7) + d² Law</div>
        </div>
        <div class="stage-bar"><h3>Combustion Chamber</h3><div id="sim-g"></div></div>
        <div class="stage stage-2d">
          <canvas id="sim-flame" aria-label="Droplet and flame animation"></canvas>
          <div class="hud" id="sim-hud"></div>
          <div class="note" id="sim-note"></div>
        </div>
      </div>
    </div>
    <div class="grid-2">
      <div class="panel stack">
        <h3>d² Law: Measured Trajectories vs. Prediction</h3>
        <div class="legend" id="d2-legend"></div>
        <svg class="chart" id="d2" viewBox="0 0 520 300" role="img" aria-label="Squared diameter vs time for neighbor runs and predicted trajectory"></svg>
        <p class="dim small">Thin lines: frame-by-frame measured diameter from video analysis of each neighbor run (PSI DropletData archives).</p>
      </div>
      <div class="panel stack">
        <h3>Supporting Spaceflight Runs (k=7)</h3>
        <div class="tablewrap"><table id="sim-nb"></table></div>
        <p class="dim small">Model: ${7} nearest neighbors of identical fuel type, distance-weighted. Leave-one-out validation over ${METRICS.n} runs: R² = ${METRICS.r2} and MAE = ${METRICS.mae} mm²/s in K; correctly predicts extinction in ${Math.round(METRICS.acc * 100)}% of trials (${Math.round(METRICS.base * 100)}% majority-class baseline).</p>
      </div>
    </div>`;

  const q = (s) => root.querySelector(s);
  q("#sim-g").appendChild(gravitySwitch(gravity));

  let currentSim = null;

  q("#sim-btn-snapshot").addEventListener("click", () => {
    if (!currentSim) return;
    const snap = createSnapshot({
      module: "simulator",
      query: currentSim.q,
      result: {
        K: currentSim.pr.K,
        sd: currentSim.pr.sd,
        se: currentSim.pr.se,
        ci95: currentSim.pr.ci95,
        tBurn: currentSim.tBurn,
        pExt: currentSim.pr.pExt,
        inDomain: currentSim.pr.inDomain,
        coverage_status: currentSim.cov.status,
      },
      title: `${currentSim.q.fuel} Droplet (${currentSim.q.P} atm, ${Math.round(currentSim.q.o2 * 100)}% O₂) Prediction`,
    });
    const msg = q("#sim-snapshot-msg");
    msg.innerHTML = `<span style="color:var(--good); font-weight:500;">✓ Snapshot ${esc(snap.snapshot_id)} recorded in Evidence Center</span>`;
    setTimeout(() => { if (msg) msg.textContent = ""; }, 4500);
  });

  function render({ sim }) {
    if (!sim) return;
    currentSim = sim;
    const { pr, tBurn, ext, dEnd, cov } = sim;
    q("#sim-cov").innerHTML = statusLine(sim);

    // Extrapolation Alert for Exploration Atmosphere or Out-of-Domain
    const alertEl = q("#sim-extrap-alert");
    if (cov.status === "EXPLORATION_EXTRAPOLATION") {
      alertEl.innerHTML = `
        <div class="panel" style="border-left: 4px solid var(--crit); background: rgba(255, 75, 75, 0.08); padding: 12px 16px;">
          <div style="font-weight: 600; color: var(--crit); display: flex; align-items: center; gap: 6px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            NASA Exploration Atmosphere Extrapolation Alert
          </div>
          <p style="font-size: 0.88rem; margin: 6px 0 0 0; color: var(--ink);">
            <strong>0.57 atm / 34% O₂ (Lunar/Mars Habitat Specification)</strong>: Below minimum pressure tested by FLEX (0.69 atm). The model is extrapolating beyond empirical spaceflight data.
          </p>
          <div style="font-size: 0.82rem; margin-top: 6px; color: var(--warn); font-style: italic;">
            ${esc(cov.hypothesisNotice || "Proposed follow-up test: Run drop-tower tests at 0.57 atm to establish baseline burning rate before habitat qualification.")}
          </div>
        </div>`;
    } else {
      alertEl.innerHTML = "";
    }

    q("#sim-out").innerHTML = [
      ["Burning Rate K", fmt(pr.K), `95% CI: [${fmt(pr.ci95[0])}, ${fmt(pr.ci95[1])}] mm²/s`],
      ["Std Error (SE)", `± ${fmt(pr.se, 3)}`, "mm²/s (k=7 avg)"],
      ["Flame Lifetime", fmt(tBurn, 1), "seconds · d² law"],
      ["Extinction Prob.", `${Math.round(pr.pExt * 100)}%`, ext ? `extinguishes at ~${fmt(dEnd, 1)} mm` : "burns to completion"],
      ["Domain Status", pr.inDomain ? "In-Domain" : "Extrapolation", `Nearest d = ${pr.dmin.toFixed(2)}`],
    ].map(([l, b, s]) => `<div class="out"><span class="lbl">${l}</span><b>${b}</b><small>${s}</small></div>`).join("");

    q("#sim-nb").innerHTML =
      `<thead><tr><th>Run</th><th class="num">O₂</th><th class="num">atm</th><th class="num">CO₂</th><th class="num">He</th><th class="num">d₀</th><th class="num">K</th><th>Outcome</th></tr></thead><tbody>` +
      pr.nb.map(({ r }) => `<tr><td style="white-space:nowrap"><a href="${FLEX_DOI}" target="_blank" rel="noopener">FLEX #${r.n}</a><div class="dim" style="font-size:11.5px">${esc(r.date)}</div></td><td class="num">${fmt(r.o2)}</td><td class="num">${fmt(r.P)}</td><td class="num">${fmt(r.co2)}</td><td class="num">${fmt(r.he)}</td><td class="num">${fmt(r.d0, 1)}</td><td class="num">${fmt(r.K)}</td><td>${END[r.end] || r.end}</td></tr>`).join("") +
      "</tbody>";

    const lg = drawD2(q("#d2"), sim, data.curves);
    q("#d2-legend").innerHTML =
      `<span><svg width="20" height="8"><line x1="1" y1="4" x2="19" y2="4" stroke="${lg.color}" stroke-width="2.5" stroke-linecap="round"/></svg>Prediction</span>` +
      `<span><svg width="20" height="8"><line x1="1" y1="4" x2="19" y2="4" stroke="${lg.muted}" stroke-width="1.3"/></svg>${lg.count} measured neighbor runs</span>`;
  }

  const flame = createFlame2D(q("#sim-flame"), {
    getSim: () => scenario.get().sim,
    getG: () => gravity.get().g,
    bg: "#03050b",
    onHud: ({ t, d, label, note }) => {
      q("#sim-hud").innerHTML = `<span>t = <b>${t.toFixed(1)} s</b> · d = <b>${d.toFixed(2)} mm</b></span><span>${label}</span>`;
      q("#sim-note").textContent = note;
    },
  });

  let unsub = null;
  return {
    enter() {
      q('[data-slot="controls"]').appendChild(controls);
      render(scenario.get());
      unsub = scenario.subscribe(render);
      flame.start();
    },
    leave() {
      unsub?.();
      flame.stop();
    },
  };
}
