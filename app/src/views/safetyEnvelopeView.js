import { esc, fmt, ICON } from "../core/dom.js";
import { createSafetyEnvelopeFacility } from "../render/lab/safetyEnvelopeFacility.js";

const CLASS_COLORS = {
  IN_DOMAIN: { hex: 0x10b981, css: "#10b981", bg: "rgba(16, 185, 129, 0.25)", border: "#10b981", label: "In-Domain (≥3 Flights)" },
  MODEL_SUPPORTED: { hex: 0x0284c7, css: "#38bdf8", bg: "rgba(2, 132, 199, 0.25)", border: "#0284c7", label: "Model-Supported (k-NN < 0.40)" },
  FRONTIER: { hex: 0xf59e0b, css: "#fbbf24", bg: "rgba(245, 158, 11, 0.25)", border: "#f59e0b", label: "Exploration Frontier (0.57 atm)" },
  UNSUPPORTED: { hex: 0xef4444, css: "#f87171", bg: "rgba(239, 68, 68, 0.25)", border: "#ef4444", label: "Extrapolation Void (0g Gap)" },
  PHYSICAL_IMPOSSIBILITY: { hex: 0x1e293b, css: "#94a3b8", bg: "rgba(30, 41, 59, 0.45)", border: "#475569", label: "Physical Impossibility Guard" },
};

export function mountSafetyEnvelope(root, data, { go }) {
  root.innerHTML = `
    <div class="section-head">
      <div class="eyebrow">Module 09 · Atmospheric Exploration Chamber</div>
      <h2>Scientific Safety Envelope — Evidence Explorer</h2>
      <p class="lede">Explore the physical atmospheric pressure vessel and multidimensional evidence landscape. Move the articulated robotic scientific probe across the 15×15 grid to sample empirical flight clusters, model applicability corridors, and 0g extrapolation blind spots.</p>
    </div>

    <!-- Mandatory Legal & Scientific Safeguard Banner -->
    <div class="panel" style="border-left: 4px solid var(--warn); background: rgba(250, 178, 25, 0.08); padding: 12px 18px; margin-bottom: 16px;">
      <div style="font-weight: 600; color: var(--warn); display: flex; align-items: center; gap: 8px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        MANDATORY SCIENTIFIC & SAFETY GOVERNANCE NOTICE
      </div>
      <p style="font-size: 0.86rem; margin: 4px 0 0 0; color: var(--ink);">
        This multidimensional envelope communicates empirical data availability and model applicability. <strong>Evidence availability is NOT proof of safety. Missing data is NOT proof of danger.</strong> Model applicability does NOT establish certified spacecraft fire safety (JSC-29353B compliance required).
      </p>
    </div>

    <!-- Interactive Probe Controls & Filter Toolbar -->
    <div class="panel stack" style="margin-bottom: 16px; padding:14px 18px;">
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:16px; align-items:end;">
        <div>
          <div style="display:flex; justify-content:space-between; font-size:0.82rem; margin-bottom:4px;">
            <span style="font-weight:600; color:var(--ink-2);">Probe Pressure (P):</span>
            <b id="env-slider-p-val" class="font-mono">0.57 atm</b>
          </div>
          <input type="range" id="env-slider-p" min="0.30" max="2.50" step="0.05" value="0.57" style="width:100%;">
        </div>

        <div>
          <div style="display:flex; justify-content:space-between; font-size:0.82rem; margin-bottom:4px;">
            <span style="font-weight:600; color:var(--ink-2);">Probe Oxygen (X_O₂):</span>
            <b id="env-slider-o2-val" class="font-mono">34.0% O₂</b>
          </div>
          <input type="range" id="env-slider-o2" min="0.15" max="0.42" step="0.01" value="0.34" style="width:100%;">
        </div>

        <div style="display:flex; flex-direction:column; gap:4px;">
          <span style="font-size:0.82rem; font-weight:600; color:var(--ink-2);">Target Gravity Regime:</span>
          <div class="chips" id="env-g-chips" style="margin:0;">
            <button type="button" class="chip active" data-g="0.0">0g (ISS)</button>
            <button type="button" class="chip" data-g="0.16">0.16g</button>
            <button type="button" class="chip" data-g="0.38">0.38g</button>
            <button type="button" class="chip" data-g="1.0">1.0g</button>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:4px;">
          <span style="font-size:0.82rem; font-weight:600; color:var(--ink-2);">Probe Camera Mode:</span>
          <div class="chips" id="env-cam-chips" style="margin:0;">
            <button type="button" class="chip active" data-cam="orbit">Chamber Orbit</button>
            <button type="button" class="chip" data-cam="probe">Probe POV</button>
            <button type="button" class="chip" data-cam="cutaway">Cutaway</button>
            <button type="button" class="chip" data-cam="frontier">0.57 atm Frontier</button>
          </div>
        </div>
      </div>

      <!-- Epistemic Layer Visibility Filter Toggles -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-top:12px; border-top:1px solid var(--line-2); padding-top:10px;">
        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
          <div class="seg" id="env-mode-toggle" role="group">
            <button type="button" data-m="3d" aria-pressed="true">3D Evidence Landscape</button>
            <button type="button" data-m="2d">2D Planar Grid</button>
          </div>
          <span class="dim small" style="font-family:var(--f-mono); font-size:11px;">FILTER LAYERS:</span>
          <label style="display:inline-flex; align-items:center; gap:4px; font-size:11.5px; cursor:pointer;">
            <input type="checkbox" id="env-layer-in-domain" checked> In-Domain
          </label>
          <label style="display:inline-flex; align-items:center; gap:4px; font-size:11.5px; cursor:pointer;">
            <input type="checkbox" id="env-layer-model" checked> Model-Supported
          </label>
          <label style="display:inline-flex; align-items:center; gap:4px; font-size:11.5px; cursor:pointer;">
            <input type="checkbox" id="env-layer-frontier" checked> 0.57 atm Frontier
          </label>
          <label style="display:inline-flex; align-items:center; gap:4px; font-size:11.5px; cursor:pointer;">
            <input type="checkbox" id="env-layer-void" checked> Extrapolation Void
          </label>
        </div>
        <div class="legend" id="env-class-legend" style="display:flex; gap:10px; flex-wrap:wrap;"></div>
      </div>
    </div>

    <!-- Main Interactive Stage & Floating Probe Card -->
    <div style="position:relative; width:100%;">
      <!-- 3D Landscape Viewport -->
      <div class="stage-lab" id="env-3d-stage" style="min-height:520px;" aria-label="Interactive 3D Evidence Landscape">
        <div class="stage-hud-top">
          <span class="stage-badge" id="env-badge-info">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10b981;"></span>
            Atmospheric Exploration Chamber · 225 Coordinates
          </span>
          <div class="stage-controls-bar">
            <span style="font-size:11px; color:#cbd5e1; font-family:var(--f-mono);">Robotic Probe: ACTIVE SCARA TRACKING</span>
          </div>
        </div>

        <!-- 3D Canvas injected by Three.js Facility -->

        <div class="stage-hud-bottom">
          <div class="stage-badge" style="font-size:11.5px; text-transform:none;">
            Probe Beam: <b id="env-probe-loc" style="color:#d946ef; margin-left:6px;">0.57 atm · 34.0% O₂</b>
          </div>
          <span class="dim small" style="font-size:11px; color:var(--ink-2);">Drag sliders or click anywhere on the 3D grid to command the robotic probe</span>
        </div>
      </div>

      <!-- 2D Planar Grid Viewport (hidden initially) -->
      <div class="panel stack" id="env-2d-box" hidden style="min-height:520px;">
        <div class="panel-title">
          <h3>Planar Coverage Matrix [P × X_O₂]</h3>
          <span class="dim small">Click cells to reposition scientific probe</span>
        </div>
        <div id="env-grid-table-container" style="overflow-x:auto; padding:10px 0;"></div>
      </div>

      <!-- Floating Science Probe Details Panel -->
      <div class="floating-science-card" id="env-probe-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-size:0.75rem; text-transform:uppercase; color:var(--muted); font-family:var(--f-mono);">Optical Probe Sensor</span>
          <span class="status font-mono" id="env-card-status" style="font-size:10.5px; padding:2px 8px; border-radius:999px;">FRONTIER</span>
        </div>
        <h4 id="env-card-coords" style="margin:0 0 6px 0; font-size:1.15rem; color:var(--ink);">0.57 atm · 34.0% O₂</h4>

        <div class="kpis" style="grid-template-columns:1fr 1fr; gap:6px; margin-bottom:10px;">
          <div class="kpi" style="padding:8px 10px;"><b id="env-card-conf" class="font-mono" style="color:var(--good);">0.68</b><span>Confidence Score</span></div>
          <div class="kpi" style="padding:8px 10px;"><b id="env-card-nearest" class="font-mono">PSI-FLEX-014</b><span>Nearest Flight ID</span></div>
        </div>

        <div id="env-card-warning" style="margin-bottom:8px;"></div>

        <div style="font-size:0.82rem; color:var(--ink-2); line-height:1.45;" id="env-card-text">
          NASA Exploration Atmosphere target (0.57 atm / 34% O₂). Epistemic boundary region: adjacent flight experiments exist but surrogate model variance remains elevated.
        </div>
      </div>
    </div>
  `;

  const q = (s) => root.querySelector(s);
  const stageEl = q("#env-3d-stage");

  let facility3d = null;
  let envelopeData = null;

  q("#env-class-legend").innerHTML = Object.entries(CLASS_COLORS).map(([k, c]) => `
    <span style="display:inline-flex; align-items:center; gap:5px; font-size:11px; color:${c.css};">
      <span style="width:9px; height:9px; border-radius:2px; background:${c.bg}; border:1px solid ${c.border}; display:inline-block;"></span>
      ${c.label}
    </span>
  `).join("");

  function updateProbeDossier(sample) {
    if (!sample) return;
    q("#env-probe-loc").textContent = `${sample.pressure_atm.toFixed(2)} atm · ${(sample.o2_fraction * 100).toFixed(1)}% O₂`;
    q("#env-card-coords").textContent = `${sample.pressure_atm.toFixed(2)} atm · ${(sample.o2_fraction * 100).toFixed(1)}% O₂`;
    q("#env-card-conf").textContent = (sample.confidence_score || 0.65).toFixed(2);
    q("#env-card-nearest").textContent = sample.closest_experiment_id || "PSI-FLEX-014";

    const statusEl = q("#env-card-status");
    const clr = CLASS_COLORS[sample.evidence_class] || CLASS_COLORS.MODEL_SUPPORTED;
    statusEl.textContent = sample.evidence_class;
    statusEl.style.borderColor = clr.border;
    statusEl.style.color = clr.css;
    statusEl.style.background = clr.bg;

    const warnEl = q("#env-card-warning");
    if (sample.evidence_class === "UNSUPPORTED") {
      warnEl.innerHTML = `<span class="badge" style="background:rgba(239,68,68,0.2); color:#ef4444; border:1px solid #ef4444; font-size:10px;">ZERO FLIGHT DATA · EXTRAPOLATION VOID</span>`;
    } else if (sample.evidence_class === "FRONTIER") {
      warnEl.innerHTML = `<span class="badge" style="background:rgba(245,158,11,0.2); color:#f59e0b; border:1px solid #f59e0b; font-size:10px;">EXPLORATION ATMOSPHERE FRONTIER</span>`;
    } else if (sample.evidence_class === "PHYSICAL_IMPOSSIBILITY") {
      warnEl.innerHTML = `<span class="badge" style="background:rgba(100,116,139,0.3); color:#94a3b8; border:1px solid #64748b; font-size:10px;">PHYSICAL IMPOSSIBILITY GUARD</span>`;
    } else {
      warnEl.innerHTML = `<span class="badge" style="background:rgba(16,185,129,0.2); color:#10b981; border:1px solid #10b981; font-size:10px;">VALIDATED BY NASA PSI FLIGHT DATA</span>`;
    }
  }

  function applyLayerFilters() {
    facility3d?.updateLayers({
      IN_DOMAIN: q("#env-layer-in-domain").checked,
      MODEL_SUPPORTED: q("#env-layer-model").checked,
      FRONTIER: q("#env-layer-frontier").checked,
      UNSUPPORTED: q("#env-layer-void").checked,
      PHYSICAL_IMPOSSIBILITY: true,
    });
  }

  fetch("/data/safety_envelope.json")
    .then((r) => r.json())
    .then((json) => {
      envelopeData = json;
      initFacility();
    })
    .catch(() => {
      envelopeData = { grid_size_pressure: 15, grid_size_o2: 15, matrix: [] };
      initFacility();
    });

  function initFacility() {
    facility3d = createSafetyEnvelopeFacility(stageEl, {
      envelopeData,
      onProbeSample: (sample) => {
        updateProbeDossier(sample);
      }
    });

    render2DTable();
  }

  function render2DTable() {
    const container = q("#env-grid-table-container");
    if (!envelopeData?.matrix) return;
    const table = document.createElement("table");
    table.style.cssText = "border-collapse:collapse; font-size:10.5px; font-family:var(--f-mono); width:100%; text-align:center;";

    const matrix = envelopeData.matrix;
    matrix.forEach((row) => {
      const tr = document.createElement("tr");
      row.forEach((cell) => {
        const td = document.createElement("td");
        const clr = CLASS_COLORS[cell.evidence_class] || CLASS_COLORS.MODEL_SUPPORTED;
        td.style.cssText = `
          padding: 8px 4px;
          border: 1px solid rgba(255,255,255,0.06);
          background: ${clr.bg};
          color: ${clr.css};
          cursor: pointer;
        `;
        td.textContent = (cell.confidence_score || 0.6).toFixed(1);
        td.title = `${cell.pressure_atm.toFixed(2)} atm, ${(cell.o2_fraction*100).toFixed(0)}% O2 - ${cell.evidence_class}`;
        td.addEventListener("click", () => {
          q("#env-slider-p").value = cell.pressure_atm;
          q("#env-slider-o2").value = cell.o2_fraction;
          q("#env-slider-p-val").textContent = `${cell.pressure_atm.toFixed(2)} atm`;
          q("#env-slider-o2-val").textContent = `${(cell.o2_fraction * 100).toFixed(1)}% O₂`;
          facility3d?.moveProbeTo(cell.pressure_atm, cell.o2_fraction);
          q("#env-mode-toggle").querySelector("[data-m='3d']").click();
        });
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });
    container.innerHTML = "";
    container.appendChild(table);
  }

  // Interactive Slider Events
  q("#env-slider-p").addEventListener("input", (e) => {
    const p = parseFloat(e.target.value);
    const o2 = parseFloat(q("#env-slider-o2").value);
    q("#env-slider-p-val").textContent = `${p.toFixed(2)} atm`;
    facility3d?.moveProbeTo(p, o2);
  });

  q("#env-slider-o2").addEventListener("input", (e) => {
    const o2 = parseFloat(e.target.value);
    const p = parseFloat(q("#env-slider-p").value);
    q("#env-slider-o2-val").textContent = `${(o2 * 100).toFixed(1)}% O₂`;
    facility3d?.moveProbeTo(p, o2);
  });

  // Layer Checkbox Events
  ["#env-layer-in-domain", "#env-layer-model", "#env-layer-frontier", "#env-layer-void"].forEach((id) => {
    q(id).addEventListener("change", applyLayerFilters);
  });

  // Camera POV mode chips
  q("#env-cam-chips").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    q("#env-cam-chips").querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    facility3d?.setCameraMode(btn.dataset.cam);
  });

  // Gravity Chips
  q("#env-g-chips").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    q("#env-g-chips").querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    const g = parseFloat(btn.dataset.g);
    const p = parseFloat(q("#env-slider-p").value);
    const o2 = parseFloat(q("#env-slider-o2").value);
    facility3d?.moveProbeTo(p, o2);
  });

  // 3D / 2D Toggle
  q("#env-mode-toggle").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    q("#env-mode-toggle").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", "false"));
    btn.setAttribute("aria-pressed", "true");

    const is3d = btn.dataset.m === "3d";
    stageEl.hidden = !is3d;
    q("#env-2d-box").hidden = is3d;
  });

  return {
    enter: () => {},
    leave: () => {
      facility3d?.dispose();
    }
  };
}
