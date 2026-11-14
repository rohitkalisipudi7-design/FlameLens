import { esc, fmt, ICON } from "../core/dom.js";
import {
  COMPARISON_FIELDS,
  normalizeExperimentForCompare,
  detectMethodologyDifferences,
  calculateComparisonDeltas,
  exportComparison,
} from "../model/compare.js";

const PRESET_COMPARISONS = [
  {
    id: "hept_vs_meth",
    title: "Heptane vs Methanol Droplets (FLEX)",
    desc: "Contrasts soot-forming hydrocarbon with clean alcohol in microgravity.",
    uidA: "PSI-69:20CAL08", // Methanol
    uidB: "PSI-69:20CAL24", // Heptane
  },
  {
    id: "co2_quench",
    title: "CO₂ Extinguisher Quench vs Air Baseline",
    desc: "Evaluates 40% CO₂ dilution against standard ISS cabin atmosphere.",
    uidA: "PSI-69:20CAL08",
    uidB: "PSI-69:20CAL34",
  },
];

export function mountCompare(root, data, { go }) {
  root.innerHTML = `
    <div class="section-head">
      <div class="eyebrow">Module 03 · Scientific Intelligence Engine</div>
      <h2>Experiment Comparison Studio</h2>
      <p class="lede">Side-by-side scientific comparison of NASA spaceflight and terrestrial combustion trials. Computes quantitative parameter deltas, checks unit normalization, flags methodological discrepancies (e.g. 0g vs 1g, physical families), and exports reproducible evidence packages.</p>
    </div>

    <!-- Presets Bar -->
    <div class="panel stack">
      <div class="panel-title">
        <h3>Benchmark Research Comparisons</h3>
        <span class="dim small">Pre-calibrated empirical pairs for judging review</span>
      </div>
      <div class="chips" id="cmp-presets"></div>
    </div>

    <!-- Selection Bar -->
    <div class="grid-2" style="margin-bottom: 14px;">
      <div class="panel stack">
        <label for="cmp-sel-a" style="font-weight:600; font-size:0.88rem; color:var(--ink);">Experiment A (Baseline)</label>
        <select id="cmp-sel-a" class="exp-search" style="width:100%; padding:8px 12px; background:var(--panel-solid); color:var(--ink); border:1px solid var(--line-2); border-radius:6px;"></select>
      </div>
      <div class="panel stack">
        <label for="cmp-sel-b" style="font-weight:600; font-size:0.88rem; color:var(--flame-b);">Experiment B (Comparison Target)</label>
        <select id="cmp-sel-b" class="exp-search" style="width:100%; padding:8px 12px; background:var(--panel-solid); color:var(--ink); border:1px solid var(--line-2); border-radius:6px;"></select>
      </div>
    </div>

    <!-- Methodology Discrepancies Alert Box -->
    <div id="cmp-alerts" style="margin-bottom: 14px;"></div>

    <!-- Quantitative Delta Summary KPI Cards -->
    <div class="kpis" id="cmp-kpis" style="margin-bottom: 18px;"></div>

    <!-- Detailed Side-by-Side Parameter Matrix -->
    <div class="panel stack">
      <div class="panel-title">
        <h3>Aligned Parameter Matrix</h3>
        <div style="display:flex; gap:8px;">
          <button type="button" class="btn small" id="cmp-exp-json">Export JSON</button>
          <button type="button" class="btn small" id="cmp-exp-csv">Export CSV</button>
        </div>
      </div>
      <div class="tablewrap" style="border:0">
        <table class="inv" id="cmp-table"></table>
      </div>
    </div>
  `;

  const q = (s) => root.querySelector(s);
  let ledger = [];
  let expA = null;
  let expB = null;

  async function loadLedger() {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}data/evidence_ledger.json`);
      if (res.ok) {
        ledger = await res.json();
      }
    } catch (err) {
      console.warn("Could not load evidence_ledger.json, falling back to dashboard data:", err);
      ledger = data.flex.map((r) => ({
        uid: `PSI-69:${r.id}`,
        test_id: r.id,
        campaign: "FLEX",
        family: "droplet",
        fuel: r.fuel,
        pressure_atm: r.P,
        x_o2: r.o2,
        d0_mm: r.d0,
        d_ext_mm: r.dext,
        burning_rate_mm2_s: r.K,
        burn_time_s: r.tb,
        end_mode: r.end,
      }));
    }
  }

  function populateSelects() {
    const selA = q("#cmp-sel-a");
    const selB = q("#cmp-sel-b");

    const options = ledger.map((e) => {
      const mat = e.material_or_fuel || e.fuel || "Unknown";
      const p = e.normalized_measurements?.pressure_atm ?? e.pressure_atm;
      const o2 = e.normalized_measurements?.x_o2 ?? e.x_o2;
      const o2Str = o2 ? `${Math.round(o2 * 100)}% O₂` : "";
      const pStr = p ? `${fmt(p)} atm` : "";
      return `<option value="${esc(e.uid)}">${esc(e.campaign || 'EXP')} · ${esc(e.test_id || e.uid)} (${esc(mat)} ${pStr} ${o2Str})</option>`;
    }).join("");

    selA.innerHTML = options;
    selB.innerHTML = options;

    if (ledger.length >= 2) {
      selA.value = ledger[0].uid;
      selB.value = ledger[1].uid;
      expA = normalizeExperimentForCompare(ledger[0]);
      expB = normalizeExperimentForCompare(ledger[1]);
    }

    selA.addEventListener("change", () => {
      const found = ledger.find((e) => e.uid === selA.value);
      if (found) {
        expA = normalizeExperimentForCompare(found);
        renderComparison();
      }
    });

    selB.addEventListener("change", () => {
      const found = ledger.find((e) => e.uid === selB.value);
      if (found) {
        expB = normalizeExperimentForCompare(found);
        renderComparison();
      }
    });

    // Populate Presets
    const presetBox = q("#cmp-presets");
    presetBox.innerHTML = PRESET_COMPARISONS.map((p, idx) => `
      <button type="button" class="chip" data-idx="${idx}" title="${esc(p.desc)}">${esc(p.title)}</button>
    `).join("");

    presetBox.querySelectorAll(".chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = PRESET_COMPARISONS[parseInt(btn.dataset.idx, 10)];
        if (p) {
          const itemA = ledger.find((e) => e.uid === p.uidA) || ledger[0];
          const itemB = ledger.find((e) => e.uid === p.uidB) || ledger[1];
          if (itemA && itemB) {
            selA.value = itemA.uid;
            selB.value = itemB.uid;
            expA = normalizeExperimentForCompare(itemA);
            expB = normalizeExperimentForCompare(itemB);
            renderComparison();
          }
        }
      });
    });
  }

  function renderComparison() {
    if (!expA || !expB) return;

    // 1. Methodology Differences Alerts
    const methodology = detectMethodologyDifferences(expA, expB);
    const alertBox = q("#cmp-alerts");
    if (methodology.length) {
      alertBox.innerHTML = methodology.map((m) => `
        <div class="panel" style="border-left: 4px solid var(--accent); background: rgba(255,107,53,0.06); padding: 10px 14px; margin-bottom: 8px;">
          <div style="font-weight:600; font-size:0.82rem; color:var(--accent); text-transform:uppercase; letter-spacing:0.04em;">
            ${m.severity === "CRITICAL" ? "⚠️ Critical Physical Regime Discrepancy" : "ℹ️ Methodological Difference Detected"}
          </div>
          <div style="font-size:0.88rem; color:var(--ink); margin-top:2px;">${esc(m.message)}</div>
        </div>
      `).join("");
    } else {
      alertBox.innerHTML = `
        <div class="panel" style="border-left: 4px solid var(--mint); background: rgba(77,208,125,0.06); padding: 8px 14px;">
          <span style="font-size:0.86rem; color:var(--mint); font-weight:500;">✓ Comparable Experimental Regimes: Identical physical family, fuel chemistry, and microgravity environment.</span>
        </div>
      `;
    }

    // 2. Deltas Calculation & KPIs
    const deltas = calculateComparisonDeltas(expA, expB);
    const kpiBox = q("#cmp-kpis");

    const pDelta = deltas["pressure_atm"];
    const o2Delta = deltas["x_o2"];
    const kDelta = deltas["burning_rate_mm2_s"];
    const qDelta = deltas["quality_score"];

    kpiBox.innerHTML = [
      ["Pressure Delta (ΔP)", pDelta && !pDelta.missing ? `${pDelta.diff > 0 ? '+' : ''}${pDelta.diff} atm` : "—", pDelta?.pctChange !== null ? `${pDelta.pctChange}% change` : "Reference parity"],
      ["Oxygen Delta (ΔO₂)", o2Delta && !o2Delta.missing ? `${o2Delta.diff > 0 ? '+' : ''}${(o2Delta.diff * 100).toFixed(1)}% O₂` : "—", o2Delta?.pctChange !== null ? `${o2Delta.pctChange}% change` : "Reference parity"],
      ["Burning Rate Delta (ΔK)", kDelta && !kDelta.missing ? `${kDelta.diff > 0 ? '+' : ''}${kDelta.diff} mm²/s` : "—", kDelta?.pctChange !== null ? `${kDelta.pctChange}% change` : "Outcome not measured"],
      ["Quality Score Delta", qDelta && !qDelta.missing ? `${qDelta.diff > 0 ? '+' : ''}${qDelta.diff} pts` : "—", `${expA.quality_score} vs ${expB.quality_score} / 100`],
    ].map(([title, big, sub]) => `
      <div class="panel kpi">
        <b>${big}</b>
        <span>${title}</span>
        <small class="dim" style="font-size:11px; margin-top:2px;">${sub}</small>
      </div>
    `).join("");

    // 3. Detailed Parameter Matrix Table
    const table = q("#cmp-table");
    table.innerHTML = `
      <thead>
        <tr>
          <th>Parameter Category & Field</th>
          <th>${esc(expA.test_id)} <span class="dim small">(${esc(expA.campaign)})</span></th>
          <th>${esc(expB.test_id)} <span class="dim small">(${esc(expB.campaign)})</span></th>
          <th>Quantitative Delta (B − A)</th>
          <th>Methodological Note</th>
        </tr>
      </thead>
      <tbody>
        ${COMPARISON_FIELDS.map((f) => {
          const valA = expA[f.key];
          const valB = expB[f.key];
          const d = deltas[f.key];

          let deltaStr = "—";
          if (d && !d.missing) {
            deltaStr = `<b>${d.diff > 0 ? '+' : ''}${d.diff} ${f.unit || ''}</b> ${d.pctChange !== null ? `(${d.pctChange}%)` : ''}`;
          } else if (d?.reason) {
            deltaStr = `<span class="dim small">${esc(d.reason)}</span>`;
          }

          let note = "";
          if (valA !== valB && (valA === "Unspecified" || valB === "Unspecified")) {
            note = `<span class="badge warn" style="font-size:10px;">Missing Parameter</span>`;
          } else if (valA !== valB && f.key === "gravity") {
            note = `<span class="badge crit" style="font-size:10px;">0g vs 1g Shift</span>`;
          } else if (valA !== valB && f.numeric) {
            note = `<span class="badge psi" style="font-size:10px;">Shifted Condition</span>`;
          }

          const displayA = f.pct && typeof valA === "number" ? `${(valA * 100).toFixed(1)}%` : (valA ?? "—");
          const displayB = f.pct && typeof valB === "number" ? `${(valB * 100).toFixed(1)}%` : (valB ?? "—");

          return `
            <tr>
              <td>
                <span class="dim small" style="display:block; font-size:10px; text-transform:uppercase;">${esc(f.group)}</span>
                <b>${esc(f.label)}</b>
              </td>
              <td>${esc(String(displayA))}</td>
              <td>${esc(String(displayB))}</td>
              <td>${deltaStr}</td>
              <td>${note}</td>
            </tr>
          `;
        }).join("")}
      </tbody>
    `;

    // Export button actions
    q("#cmp-exp-json").onclick = () => {
      const jsonStr = exportComparison(expA, expB, "json");
      const blob = new Blob([jsonStr], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `comparison_${expA.test_id}_vs_${expB.test_id}.json`;
      a.click();
    };

    q("#cmp-exp-csv").onclick = () => {
      const csvStr = exportComparison(expA, expB, "csv");
      const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8;" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `comparison_${expA.test_id}_vs_${expB.test_id}.csv`;
      a.click();
    };
  }

  return {
    async enter() {
      if (!ledger.length) {
        await loadLedger();
        populateSelects();
      }
      renderComparison();
    },
    leave() {},
  };
}

