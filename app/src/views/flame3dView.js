import "../styles/lab3d.css";
import { esc, fmt, FUEL } from "../core/dom.js";
import { conditions, gravity, scenario } from "../state.js";
import { PRESETS } from "../model/flame.js";
import { ENVS, HOTSPOTS, VIEWS, LEVELS, STEPS, matchPreset, narrate, stepOf } from "../model/lab.js";
import { statusLine } from "./simulator.js";

const ICON = {
  play: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5v11l9-5.5z" fill="currentColor"/></svg>',
  pause: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 2h3v10H3zM8 2h3v10H8z" fill="currentColor"/></svg>',
  restart: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 7a4.5 4.5 0 1 0 1.4-3.2M2.2 1.6v2.6h2.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  full: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M1.5 5V1.5H5M9 1.5h3.5V5M12.5 9v3.5H9M5 12.5H1.5V9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  sliders: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M1.5 4h6M11 4h1.5M1.5 10h1.5M6.5 10h6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="9" cy="4" r="1.8" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="4.7" cy="10" r="1.8" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
};

const GAS = [
  ["o2", "O₂", "#6da7ec"],
  ["co2", "CO₂", "#d5d9e2"],
  ["he", "He", "#b58ae6"],
  ["n2", "N₂", "#2c3654"],
];

const FEEDS = VIEWS.filter((v) => v.id !== "free");

function seg(box, options, value, onPick) {
  box.innerHTML = options
    .map((o) => `<button type="button" data-v="${o.id}" title="${esc(o.name || o.label)}">${o.label}</button>`)
    .join("");
  const sync = (v) => box.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.v === v));
  box.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    sync(b.dataset.v);
    onPick(b.dataset.v);
  });
  sync(value);
  return sync;
}

function labGravitySwitch(store) {
  const seg = document.createElement("div");
  seg.className = "seg";
  seg.setAttribute("role", "group");
  seg.setAttribute("aria-label", "Gravity");
  seg.innerHTML = `
    <button type="button" data-g="0" title="Microgravity (0g · ISS Reference)">0g</button>
    <button type="button" data-g="0.16" title="Lunar Gravity (0.16g · Qualitative)">0.16g</button>
    <button type="button" data-g="0.38" title="Martian Gravity (0.38g · Qualitative)">0.38g</button>
    <button type="button" data-g="1" title="Earth Gravity (1g · Terrestrial)">1g</button>
  `;
  const sync = ({ g }) => {
    const activeG = typeof g === "number" ? g : Number(g) || 0;
    seg.querySelectorAll("button").forEach((b) => {
      b.setAttribute("aria-pressed", Math.abs(+b.dataset.g - activeG) < 0.01);
    });
  };
  seg.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b) store.set({ g: +b.dataset.g });
  });
  store.subscribe(sync);
  sync(store.get());
  return seg;
}

export function mountFlame3D(root, data, { controls, scenario, gravity }) {
  root.innerHTML = `
    <!-- AREA A: LABORATORY HEADER -->
    <header class="lab-header" id="v3-header">
      <div class="lab-header-main">
        <div class="lab-header-meta">
          <span class="lab-badge font-mono">
            <span class="pulse-dot"></span>
            FLAMELENS AI · VIRTUAL RESEARCH FACILITY
          </span>
          <div class="lab-header-status-indicator" id="v3-hdr-status">
            <span class="status-label font-mono">ACTIVE SCENARIO:</span>
            <span class="status-name" id="v3-hdr-name">ISS Cabin</span>
            <span class="status-pill status-pill-active" id="v3-hdr-pill">● Simulation Active</span>
          </div>
        </div>
        <h1 class="lab-main-title">3D Combustion Laboratory</h1>
        <p class="lab-main-desc">
          Empirical model-parameterized recreation of the NASA FLEX combustion chamber inside the ISS Combustion Integrated Rack (CIR). Simulates multi-scale droplet combustion across microgravity and partial-gravity regimes with calibrated flight optical diagnostic viewpoints.
        </p>
      </div>
    </header>

    <!-- AREA B: SCENARIO SELECTOR -->
    <section class="lab-scenarios-panel" aria-label="Experiment Scenario Presets">
      <div class="scenarios-panel-bar">
        <div class="scenarios-bar-title font-mono">
          <span class="scenarios-icon">🧪</span>
          FLIGHT & MISSION SCENARIO PRESETS
        </div>
        <div class="scenarios-bar-sub font-mono">SELECT A PRESET TO INSTANTLY INITIALIZE CHAMBER CONDITIONS</div>
      </div>
      <div class="lab-scenes" id="v3-scenes" role="group" aria-label="Scenarios"></div>
    </section>

    <!-- AREA C: MAIN EXPERIMENT WORKSPACE (2-COLUMN DESKTOP) -->
    <div class="lab-workspace-grid">
      <!-- LEFT COLUMN: EXPERIMENT CONFIGURATION -->
      <aside class="panel lab-config-panel" id="lab-config-panel" aria-label="Experiment Configuration">
        <div class="config-panel-head">
          <div class="panel-tag font-mono">FACILITY CONTROLS</div>
          <h2 class="panel-title">Experiment Parameters</h2>
        </div>

        <div class="config-groups-list">
          <!-- Group 1: Fuel Selection -->
          <section class="config-group group-fuel">
            <div class="group-header">
              <span class="group-num font-mono">01</span>
              <span class="group-title">Fuel Selection</span>
            </div>
            <div class="ctl-field">
              <label for="lab-in-fuel">Hydrocarbon Fuel</label>
              <select id="lab-in-fuel" class="lab-select">
                <option value="Heptane">Heptane (C₇H₁₆ · Soot-forming alkane)</option>
                <option value="Methanol">Methanol (CH₃OH · Soot-free alcohol)</option>
              </select>
              <div class="ctl-hint font-mono" id="lab-fuel-hint">Sooting behavior: High soot shell formation</div>
            </div>
          </section>

          <!-- Group 2: Chamber Atmosphere -->
          <section class="config-group group-atmosphere">
            <div class="group-header">
              <span class="group-num font-mono">02</span>
              <span class="group-title">Chamber Atmosphere</span>
            </div>

            <!-- Oxygen -->
            <div class="ctl-field">
              <div class="ctl-label-row">
                <label for="lab-in-o2">Oxygen Mole Fraction (X_O₂)</label>
                <output class="font-mono" id="lab-out-o2">0.21</output>
              </div>
              <input type="range" id="lab-in-o2" min="0.10" max="0.40" step="0.01" value="0.21">
              <div class="ctl-bounds font-mono">
                <span>0.10 (10%)</span>
                <span>0.21 (Air)</span>
                <span>0.40 (40%)</span>
              </div>
            </div>

            <!-- Pressure -->
            <div class="ctl-field">
              <div class="ctl-label-row">
                <label for="lab-in-P">Total Pressure (P)</label>
                <output class="font-mono" id="lab-out-P">1.00 atm</output>
              </div>
              <input type="range" id="lab-in-P" min="0.50" max="3.00" step="0.05" value="1.00">
              <div class="ctl-bounds font-mono">
                <span>0.50 atm</span>
                <span>1.00 atm (Sea level)</span>
                <span>3.00 atm</span>
              </div>
            </div>

            <!-- CO2 Diluent -->
            <div class="ctl-field">
              <div class="ctl-label-row">
                <label for="lab-in-co2">CO₂ Diluent Mole Fraction (X_CO₂)</label>
                <output class="font-mono" id="lab-out-co2">0.00</output>
              </div>
              <input type="range" id="lab-in-co2" min="0" max="0.70" step="0.01" value="0">
              <div class="ctl-bounds font-mono">
                <span>0.00 (0%)</span>
                <span>0.40 (Extinguisher)</span>
                <span>0.70 (70%)</span>
              </div>
            </div>

            <!-- Helium Diluent -->
            <div class="ctl-field">
              <div class="ctl-label-row">
                <label for="lab-in-he">Helium Diluent Mole Fraction (X_He)</label>
                <output class="font-mono" id="lab-out-he">0.00</output>
              </div>
              <input type="range" id="lab-in-he" min="0" max="0.45" step="0.01" value="0">
              <div class="ctl-bounds font-mono">
                <span>0.00 (0%)</span>
                <span>0.20 (Diluent)</span>
                <span>0.45 (45%)</span>
              </div>
            </div>
          </section>

          <!-- Group 3: Droplet Initial Parameters -->
          <section class="config-group group-droplet">
            <div class="group-header">
              <span class="group-num font-mono">03</span>
              <span class="group-title">Droplet Parameters</span>
            </div>
            <div class="ctl-field">
              <div class="ctl-label-row">
                <label for="lab-in-d0">Initial Droplet Diameter (d₀)</label>
                <output class="font-mono" id="lab-out-d0">3.0 mm</output>
              </div>
              <input type="range" id="lab-in-d0" min="1.0" max="5.0" step="0.1" value="3.0">
              <div class="ctl-bounds font-mono">
                <span>1.0 mm (Drop tower)</span>
                <span>3.0 mm (FLEX nominal)</span>
                <span>5.0 mm</span>
              </div>
            </div>
          </section>

          <!-- Group 4: Quick Presets -->
          <section class="config-group group-presets">
            <div class="group-header">
              <span class="group-num font-mono">04</span>
              <span class="group-title">Quick Preset Chips</span>
            </div>
            <div class="chips-grid" id="lab-preset-chips"></div>
          </section>
        </div>
      </aside>

      <!-- RIGHT COLUMN: COMBUSTION VIEWPORT -->
      <main class="lab-viewport-col" aria-label="3D Combustion Viewport and Instruments">
        <!-- Unified Top Toolbar -->
        <div class="lab-unified-toolbar" id="v3-toolbar">
          <div class="toolbar-cluster cluster-gravity">
            <span class="cluster-label font-mono">GRAVITY</span>
            <div id="v3-g"></div>
          </div>
          <div class="toolbar-cluster cluster-camera">
            <span class="cluster-label font-mono">CAMERA</span>
            <div class="seg" id="v3-view" role="group" aria-label="Camera view"></div>
          </div>
          <div class="toolbar-cluster cluster-scale">
            <span class="cluster-label font-mono">SCALE</span>
            <div class="seg" id="v3-level" role="group" aria-label="Visualization scale"></div>
          </div>
          <div class="toolbar-cluster cluster-reading">
            <span class="cluster-label font-mono">READING LEVEL</span>
            <div class="seg" id="v3-aud" role="group" aria-label="Reading mode"></div>
          </div>
        </div>

        <!-- Interactive 3D Stage (Centerpiece) -->
        <div class="stage stage-3d lab" id="v3-stage" data-env="iss" data-view="free" data-aud="plain" aria-label="Interactive 3D laboratory: droplet, flame, and combustion chamber">
          <div class="msg" id="v3-msg">Loading 3D laboratory…</div>
          <div class="lab-fx" aria-hidden="true"></div>
          <div class="lab-frame" id="v3-frame" hidden aria-hidden="true">
            <i class="lab-cross"></i>
            <span class="lab-scale" id="v3-scale"><i></i><b></b></span>
          </div>
          <div class="lab-spots" id="v3-spots"></div>

          <!-- Top Stage Badges & Process Sequence -->
          <div class="lab-top">
            <div class="lab-place">
              <b id="v3-env"></b>
              <span id="v3-place"></span>
              <span class="lab-feed" id="v3-feed" hidden></span>
            </div>
            <ol class="lab-steps" id="v3-steps">${STEPS.map((s) => `<li data-step="${s.id}">${s.label}</li>`).join("")}</ol>
          </div>

          <!-- Fullscreen Floating Telemetry HUD (hidden in normal mode, active in fullscreen) -->
          <aside class="lab-tele" id="v3-tele" aria-live="off"></aside>

          <!-- Immersive Drawer (Fullscreen Mode) -->
          <div class="lab-drawer" id="v3-drawer" hidden>
            <div class="lab-drawer-head">
              <b>Test Conditions</b>
              <button type="button" class="lab-card-x" id="v3-drawer-x" aria-label="Hide conditions">×</button>
            </div>
            <div class="lab-drawer-body" id="v3-drawer-body"></div>
          </div>

          <!-- AREA F: LIVE CAMERA PREVIEWS -->
          <div class="lab-monitors" id="v3-mons" role="group" aria-label="Live camera monitors">
            ${FEEDS.map((f) => `<button type="button" class="lab-mon" data-v="${f.id}" title="View from: ${esc(f.name)}"><span>${f.label}</span></button>`).join("")}
          </div>

          <!-- Interactive Hotspot Info Card -->
          <div class="lab-card" id="v3-card" hidden></div>

          <!-- Bottom Transport & Scrubbing Bar -->
          <div class="lab-bottom">
            <p class="lab-caption" id="v3-note"></p>
            <div class="lab-transport">
              <button type="button" class="lab-btn" id="v3-play" aria-label="Pause"></button>
              <button type="button" class="lab-btn" id="v3-restart" title="Repeat test from deployment">${ICON.restart}<span>Restart</span></button>
              <input type="range" id="v3-scrub" min="0" max="1000" step="1" value="0" aria-label="Test scrub progress">
              <output id="v3-time"></output>
              <button type="button" class="lab-btn" id="v3-rate" title="Playback speed">1×</button>
              <button type="button" class="lab-btn" id="v3-cond" aria-pressed="true" title="Toggle test conditions">${ICON.sliders}<span>Conditions</span></button>
              <button type="button" class="lab-btn" id="v3-monbtn" aria-pressed="true" title="Camera feed thumbnails">Cameras</button>
              <button type="button" class="lab-btn" id="v3-labels" aria-pressed="true">Labels</button>
              <button type="button" class="lab-btn" id="v3-spin" aria-pressed="true">Orbit</button>
              <button type="button" class="lab-btn" id="v3-full" aria-label="Fullscreen" title="Fullscreen">${ICON.full}</button>
            </div>
          </div>
        </div>

        <!-- Viewport Descriptive Subtitle & Operational Guidance -->
        <div class="viewport-meta-footer">
          <p class="lab-envtext" id="v3-envtext"></p>
          <div class="lab-nav-hint font-mono">
            <span>Free Orbit: drag to rotate view · scroll to zoom between scales (Droplet 118mm, Chamber 620mm, Lab).</span>
            <span>Diagnostic cameras: fixed optical axis with calibrated sensor emulation (Color, HiBMS shadowgraphy, LLUV UV).</span>
          </div>
        </div>
      </main>
    </div>

    <!-- AREAS D & E: SIMULATION TELEMETRY & SCIENTIFIC EVIDENCE CONTEXT -->
    <div class="lab-data-grid">
      <!-- AREA D: SIMULATION TELEMETRY PANEL -->
      <section class="panel lab-telemetry-panel" id="lab-telemetry-panel" aria-label="Real-Time Simulation Telemetry">
        <div class="panel-header-row">
          <div>
            <div class="panel-tag font-mono">DIAGNOSTIC INSTRUMENTATION</div>
            <h3 class="panel-heading">Simulation Telemetry</h3>
          </div>
          <div class="telemetry-live-badge font-mono">
            <span class="live-dot"></span> LIVE TELEMETRY
          </div>
        </div>

        <!-- Primary Transient Metrics -->
        <div class="telemetry-primary-grid">
          <div class="tele-metric-box">
            <span class="metric-lbl" data-l="t">Elapsed Time</span>
            <span class="metric-val font-mono" data-v="t">0.0 s</span>
            <span class="metric-sub font-mono">t (burn timeline)</span>
          </div>
          <div class="tele-metric-box">
            <span class="metric-lbl" data-l="d">Droplet Diameter</span>
            <span class="metric-val font-mono" data-v="d">3.00 mm</span>
            <span class="metric-sub font-mono">Instantaneous size d</span>
          </div>
          <div class="tele-metric-box">
            <span class="metric-lbl" data-l="f">Flame Diameter</span>
            <span class="metric-val font-mono" data-v="f">—</span>
            <span class="metric-sub font-mono">Luminous envelope D_f</span>
          </div>
        </div>

        <!-- Derived Combustion Kinetics -->
        <div class="telemetry-secondary-section">
          <div class="sec-label font-mono">DERIVED COMBUSTION KINETICS</div>
          <div class="telemetry-kpi-grid">
            <div class="kpi-cell">
              <span class="kpi-tag font-mono">d²</span>
              <span class="kpi-num font-mono" data-v="d2">9.00 mm²</span>
            </div>
            <div class="kpi-cell">
              <span class="kpi-tag font-mono">(d/d₀)²</span>
              <span class="kpi-num font-mono" data-v="dn">1.000</span>
            </div>
            <div class="kpi-cell">
              <span class="kpi-tag font-mono">D_f / d</span>
              <span class="kpi-num font-mono" data-v="fsr">—</span>
            </div>
            <div class="kpi-cell">
              <span class="kpi-tag font-mono">Burn Rate K</span>
              <span class="kpi-num font-mono" data-v="k">—</span>
            </div>
            <div class="kpi-cell">
              <span class="kpi-tag font-mono">P(extinction)</span>
              <span class="kpi-num font-mono" data-v="pext">—</span>
            </div>
            <div class="kpi-cell">
              <span class="kpi-tag font-mono">Closest FLEX</span>
              <span class="kpi-num font-mono" data-v="nb">—</span>
            </div>
          </div>
        </div>

        <!-- Atmospheric Gas Composition -->
        <div class="telemetry-gas-section">
          <div class="gas-section-header">
            <span class="sec-label font-mono" data-l="atm">Chamber Atmosphere Composition</span>
            <span class="pressure-badge font-mono" data-v="p">1.00 atm</span>
          </div>
          <div class="gasbar" data-v="bar"></div>
          <div class="gaslegend" data-v="gas"></div>
        </div>
      </section>

      <!-- AREA E: SCIENTIFIC CONTEXT AND EVIDENCE COVERAGE -->
      <section class="panel lab-evidence-panel" id="lab-evidence-panel" aria-label="Scientific Context and Evidence Coverage">
        <div class="panel-header-row">
          <div>
            <div class="panel-tag font-mono">EVIDENCE CORRELATION</div>
            <h3 class="panel-heading">Scientific Context & Flight Evidence</h3>
          </div>
          <div class="evidence-source-badge font-mono">NASA PSI-69 FLEX</div>
        </div>

        <!-- Evidence Coverage Classification Banner -->
        <div class="evidence-coverage-box">
          <div class="coverage-statusline" id="v3-cov"></div>
        </div>

        <!-- Empirical Metrics & Confidence -->
        <div class="evidence-details-grid">
          <div class="evidence-card">
            <div class="ev-card-label font-mono">BURNING RATE CONSTANT (K)</div>
            <div class="ev-card-value font-mono" id="ev-k-stat">—</div>
            <div class="ev-card-sub font-mono" id="ev-k-ci">95% Confidence Interval</div>
          </div>
          <div class="evidence-card">
            <div class="ev-card-label font-mono">FLAME DURATION</div>
            <div class="ev-card-value font-mono" id="ev-burn-stat">—</div>
            <div class="ev-card-sub font-mono" id="ev-burn-sub">Calculated via d² law</div>
          </div>
          <div class="evidence-card">
            <div class="ev-card-label font-mono">EXTINCTION PROBABILITY</div>
            <div class="ev-card-value font-mono" id="ev-ext-stat">—</div>
            <div class="ev-card-sub font-mono" id="ev-ext-sub">Radiative loss boundary</div>
          </div>
        </div>

        <!-- Scientific Disclosure & Provenance Qualifications -->
        <div class="evidence-disclosure-box">
          <div class="disc-header font-mono">
            <span class="disc-icon">ℹ️</span>
            SCIENTIFIC DISCLOSURE & RIGOR
          </div>
          <p class="disc-text">
            Chamber hardware geometry and partial-gravity buoyant flame deformation are illustrative qualitative visual heuristics, not a numerical Navier-Stokes or CFD solver. Droplet burning rate constants (d² law), radiative extinction limits, and cool flame transitions are directly driven by empirical NASA flight observations and validated Gaussian Process Regression models.
          </p>
        </div>
      </section>
    </div>
  `;

  const q = (s) => root.querySelector(s);
  const stage = q("#v3-stage");
  q("#v3-g").appendChild(labGravitySwitch(gravity));

  let scene = null;
  let active = false;
  let unsub = null;
  let envId = matchPreset(conditions.get()) || "iss";
  let custom = false;
  let aud = "plain";
  let view = "free";
  let scrubbing = false;
  let last = null;

  // Helper to update elements with data-v across both panels
  function setVals(key, valOrFn) {
    root.querySelectorAll(`[data-v="${key}"]`).forEach((el) => {
      if (typeof valOrFn === "function") valOrFn(el);
      else el.textContent = valOrFn;
    });
  }

  // Helper to update elements with data-l
  function setLabels(key, text) {
    root.querySelectorAll(`[data-l="${key}"]`).forEach((el) => {
      el.textContent = text;
    });
  }

  // ---- AREA B: Scenario Presets Selector ----
  const scenes = q("#v3-scenes");
  scenes.innerHTML = PRESETS.map((p) => {
    const e = ENVS[p.id];
    return `<button type="button" class="lab-scene-card" data-env="${p.id}">
      <div class="scene-card-header">
        <span class="scene-chip font-mono">${p.q.fuel}</span>
        <span class="scene-env-tag font-mono">${Math.round(p.q.o2 * 100)}% O₂ · ${fmt(p.q.P)} atm</span>
      </div>
      <h3 class="scene-card-title">${e.name}</h3>
      <p class="scene-card-place">${e.place}</p>
      <div class="scene-card-meta font-mono">
        <span>${FUEL[p.q.fuel].es}</span>
        ${p.q.co2 ? `<span>${Math.round(p.q.co2 * 100)}% CO₂</span>` : `<span>d₀ = ${p.q.d0.toFixed(1)} mm</span>`}
      </div>
    </button>`;
  }).join("");

  scenes.addEventListener("click", (e) => {
    const b = e.target.closest(".lab-scene-card");
    if (!b) return;
    const p = PRESETS.find((x) => x.id === b.dataset.env);
    if (matchPreset(conditions.get()) === p.id) scene?.restart();
    else conditions.set({ ...p.q });
  });

  // ---- AREA C (Left Column): Experiment Configuration Controls ----
  const inFuel = q("#lab-in-fuel");
  const inO2 = q("#lab-in-o2");
  const inP = q("#lab-in-P");
  const inCO2 = q("#lab-in-co2");
  const inHe = q("#lab-in-he");
  const inD0 = q("#lab-in-d0");

  const outO2 = q("#lab-out-o2");
  const outP = q("#lab-out-P");
  const outCO2 = q("#lab-out-co2");
  const outHe = q("#lab-out-he");
  const outD0 = q("#lab-out-d0");
  const fuelHint = q("#lab-fuel-hint");

  // Quick Preset Chips
  const presetChips = q("#lab-preset-chips");
  presetChips.innerHTML = PRESETS.map((p) => `
    <button type="button" class="chip chip-preset" data-env="${p.id}">${p.label}</button>
  `).join("");

  presetChips.addEventListener("click", (e) => {
    const b = e.target.closest(".chip-preset");
    if (!b) return;
    const p = PRESETS.find((x) => x.id === b.dataset.env);
    if (p) conditions.set({ ...p.q });
  });

  // Sliders binding to conditions store
  inFuel.addEventListener("change", () => conditions.set({ fuel: inFuel.value }));
  inO2.addEventListener("input", () => conditions.set({ o2: +inO2.value }));
  inP.addEventListener("input", () => conditions.set({ P: +inP.value }));
  inCO2.addEventListener("input", () => conditions.set({ co2: +inCO2.value }));
  inHe.addEventListener("input", () => conditions.set({ he: +inHe.value }));
  inD0.addEventListener("input", () => conditions.set({ d0: +inD0.value }));

  function syncControls(qState) {
    inFuel.value = qState.fuel;
    fuelHint.textContent = qState.fuel === "Heptane"
      ? "Sooting behavior: Dense soot shell formation with yellow incandescence"
      : "Sooting behavior: Negligible soot, clean blue chemiluminescence";

    // O2
    inO2.value = qState.o2;
    inO2.style.setProperty("--fill", `${((qState.o2 - 0.10) / (0.40 - 0.10)) * 100}%`);
    outO2.textContent = `${Number(qState.o2).toFixed(2)} (${Math.round(qState.o2 * 100)}%)`;

    // P
    inP.value = qState.P;
    inP.style.setProperty("--fill", `${((qState.P - 0.50) / (3.00 - 0.50)) * 100}%`);
    outP.textContent = `${Number(qState.P).toFixed(2)} atm (${(qState.P * 101.325).toFixed(0)} kPa)`;

    // CO2
    inCO2.value = qState.co2;
    inCO2.style.setProperty("--fill", `${(qState.co2 / 0.70) * 100}%`);
    outCO2.textContent = `${Number(qState.co2).toFixed(2)} (${Math.round(qState.co2 * 100)}%)`;

    // He
    inHe.value = qState.he;
    inHe.style.setProperty("--fill", `${(qState.he / 0.45) * 100}%`);
    outHe.textContent = `${Number(qState.he).toFixed(2)} (${Math.round(qState.he * 100)}%)`;

    // d0
    inD0.value = qState.d0;
    inD0.style.setProperty("--fill", `${((qState.d0 - 1.0) / (5.0 - 1.0)) * 100}%`);
    outD0.textContent = `${Number(qState.d0).toFixed(1)} mm`;
  }

  // Populate floating in-stage HUD for fullscreen mode
  const tele = q("#v3-tele");
  tele.innerHTML = `
    <div class="tele-row big"><span data-l="t">Time</span><b data-v="t">0.0 s</b></div>
    <div class="tele-row big"><span data-l="d">Droplet</span><b data-v="d">3.00 mm</b></div>
    <div class="tele-row big"><span data-l="f">Flame</span><b data-v="f">—</b></div>
    <div class="tele-sci">
      <div class="tele-row"><span>d²</span><b data-v="d2">9.00 mm²</b></div>
      <div class="tele-row"><span>(d/d₀)²</span><b data-v="dn">1.000</b></div>
      <div class="tele-row"><span>D_f/d</span><b data-v="fsr">—</b></div>
      <div class="tele-row"><span>K</span><b data-v="k">—</b></div>
      <div class="tele-row"><span>P(extinction)</span><b data-v="pext">—</b></div>
      <div class="tele-row"><span>Closest Neighbor</span><b data-v="nb">—</b></div>
    </div>
    <div class="tele-gas">
      <div class="tele-head"><span data-l="atm">Chamber Atmosphere</span><b data-v="p">1.00 atm</b></div>
      <div class="gasbar" data-v="bar"></div>
      <div class="gaslegend" data-v="gas"></div>
    </div>`;

  function paintStatic({ sim }) {
    if (!sim) return;
    const sq = sim.q;
    syncControls(sq);

    const m = matchPreset(sq);
    if (m) envId = m;
    custom = !m;
    const env = ENVS[envId];
    stage.dataset.env = envId;

    // Header & Stage metadata
    q("#v3-env").textContent = env.name;
    q("#v3-place").textContent = custom ? `${env.place} · custom conditions` : env.place;
    q("#v3-envtext").innerHTML = `<b>${env.name}.</b> ${aud === "plain" ? env.plain : env.tech}`;
    q("#v3-hdr-name").textContent = custom ? `${env.name} (Customized)` : env.name;

    // Card highlights
    scenes.querySelectorAll(".lab-scene-card").forEach((b) => b.setAttribute("aria-pressed", !custom && b.dataset.env === envId));
    presetChips.querySelectorAll(".chip-preset").forEach((b) => b.setAttribute("aria-pressed", !custom && b.dataset.env === envId));
    q('#v3-steps [data-step="cool"]').hidden = !sim.cool;

    // Status line and coverage
    q("#v3-cov").innerHTML = statusLine(sim) +
      `<span class="dim small">K ${fmt(sim.pr.K)} ± ${fmt(sim.pr.sd)} mm²/s · ${fmt(sim.tBurn, 1)} s flame duration · ${Math.round(sim.pr.pExt * 100)}% extinction</span>`;

    // Evidence panel values
    const kStat = q("#ev-k-stat");
    if (kStat) {
      kStat.textContent = `${fmt(sim.pr.K)} ± ${fmt(sim.pr.se, 3)} mm²/s`;
      q("#ev-k-ci").textContent = `95% CI: [${fmt(sim.pr.ci95[0])}, ${fmt(sim.pr.ci95[1])}] mm²/s`;
    }
    const burnStat = q("#ev-burn-stat");
    if (burnStat) {
      burnStat.textContent = `${fmt(sim.tBurn, 1)} s`;
      q("#ev-burn-sub").textContent = sim.cool ? "Includes hot & cool flame phases" : "Total single-droplet lifetime";
    }
    const extStat = q("#ev-ext-stat");
    if (extStat) {
      const pExt = Math.round(sim.pr.pExt * 100);
      extStat.textContent = `${pExt}%`;
      q("#ev-ext-sub").textContent = sim.ext ? `Radiative extinction at d ≈ ${fmt(sim.dEnd, 1)} mm` : "Complete droplet consumption";
    }

    // Telemetry and Gas mixture updates
    const n2 = Math.max(0, 1 - sq.o2 - sq.co2 - sq.he);
    const mixv = { o2: sq.o2, co2: sq.co2, he: sq.he, n2 };
    setVals("bar", (el) => {
      el.innerHTML = GAS.map(([k, , c]) => `<i style="flex:${mixv[k]};background:${c}"></i>`).join("");
    });
    setVals("gas", (el) => {
      el.innerHTML = GAS.filter(([k]) => mixv[k] > 0.004).map(([k, name, c]) => `<span><i style="background:${c}"></i>${name} ${Math.round(mixv[k] * 100)}%</span>`).join("");
    });
    setVals("p", (el) => {
      el.textContent = aud === "plain" ? `${fmt(sq.P)} atm` : `${fmt(sq.P)} atm · ${(sq.P * 101.325).toFixed(0)} kPa · ${(sq.P * 14.696).toFixed(1)} psia`;
    });
    setVals("k", (el) => {
      el.textContent = `${fmt(sim.pr.K)} ± ${fmt(sim.pr.sd)} mm²/s`;
    });
    setVals("pext", (el) => {
      el.textContent = `${Math.round(sim.pr.pExt * 100)}%${sim.ext ? ` · d≈${fmt(sim.dEnd, 1)} mm` : ""}`;
    });
    const nb = sim.pr.nb[0];
    setVals("nb", (el) => {
      el.textContent = nb ? `FLEX #${nb.r.n} · ${nb.d.toFixed(2)} u` : "—";
    });

    setLabels("t", aud === "plain" ? "Elapsed Time" : "t");
    setLabels("d", aud === "plain" ? "Droplet Diameter" : "d");
    setLabels("f", aud === "plain" ? "Flame Diameter" : "D_f");
    setLabels("atm", aud === "plain" ? "Chamber Atmosphere" : "Atmospheric Composition");

    if (last) paintLive(last);
  }

  const frame = q("#v3-frame");
  function paintLive(h) {
    last = h;
    const { sim } = scenario.get();
    if (!sim) return;

    setVals("t", `${h.t.toFixed(1)} s`);
    setVals("d", `${h.d.toFixed(2)} mm`);
    setVals("f", h.flame ? `${h.flame.toFixed(0)} mm` : "—");
    setVals("d2", `${(h.d * h.d).toFixed(2)} mm²`);
    setVals("dn", ((h.d / sim.q.d0) ** 2).toFixed(3));
    setVals("fsr", h.flame && h.d > 0.05 ? (h.flame / h.d).toFixed(1) : "—");

    const step = stepOf(h.phase, h.stage);
    const order = STEPS.map((s) => s.id);
    q("#v3-steps").querySelectorAll("li").forEach((li) => {
      const i = order.indexOf(li.dataset.step);
      li.className = li.dataset.step === step ? "on" : i < order.indexOf(step) ? "done" : "";
    });
    q("#v3-note").textContent = narrate(sim, h);
    q("#v3-time").textContent = h.stage ? h.label : `${h.label} · t = ${h.t.toFixed(1)} s`;

    if (!scrubbing) {
      const s = q("#v3-scrub");
      s.value = Math.round(h.progress * 1000);
      s.style.setProperty("--fill", `${h.progress * 100}%`);
    }

    const play = q("#v3-play");
    if (play.dataset.on !== String(h.playing)) {
      play.dataset.on = String(h.playing);
      play.innerHTML = h.playing ? ICON.pause : ICON.play;
      play.setAttribute("aria-label", h.playing ? "Pause" : "Play");
    }

    if (stage.dataset.level !== h.level) {
      stage.dataset.level = h.level;
      if (view === "free") syncLevel(h.level);
    }

    frame.hidden = !h.feed;
    if (h.feed) {
      const { x, y, w, h: fh, pxmm } = h.feed;
      frame.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${fh}px`;
      const mm = VIEWS.find((v) => v.id === view)?.bar || 5;
      q("#v3-scale i").style.width = `${Math.max(4, pxmm * mm)}px`;
      q("#v3-scale b").textContent = `${mm} mm`;
    }
  }

  // ---- Hotspots ----
  const spotBox = q("#v3-spots");
  const spots = {};
  for (const [id, s] of Object.entries(HOTSPOTS)) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "spot";
    b.hidden = true;
    b.innerHTML = `<i></i><span>${esc(s.title)}</span>`;
    b.addEventListener("click", () => openCard(id));
    spotBox.appendChild(b);
    spots[id] = b;
  }
  let shown = new Set();
  function paintSpots(list) {
    const now = new Set();
    for (const s of list) {
      const b = spots[s.id];
      if (!b || !s.on) continue;
      now.add(s.id);
      b.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px)`;
      if (b.hidden) b.hidden = false;
    }
    shown.forEach((id) => { if (!now.has(id)) spots[id].hidden = true; });
    shown = now;
  }

  const card = q("#v3-card");
  let cardId = null;
  function openCard(id) {
    cardId = id;
    const s = HOTSPOTS[id];
    card.innerHTML = `
      <button type="button" class="lab-card-x" aria-label="Close">×</button>
      <h4>${esc(s.title)}</h4>
      <p>${esc(aud === "plain" ? s.plain : s.tech)}</p>
      <p class="alt"><b>${aud === "plain" ? "Technical Details" : "Simplified"}:</b> ${esc(aud === "plain" ? s.tech : s.plain)}</p>`;
    card.hidden = false;
    card.querySelector(".lab-card-x").addEventListener("click", closeCard);
  }
  function closeCard() { cardId = null; card.hidden = true; }

  // ---- AREA F: Camera Feeds & Previews ----
  const mons = q("#v3-mons");
  function setView(v) {
    view = v;
    stage.dataset.view = v;
    syncView(v);
    mons.querySelectorAll(".lab-mon").forEach((b) => b.setAttribute("aria-pressed", b.dataset.v === v));
    const info = VIEWS.find((x) => x.id === v);
    const feed = q("#v3-feed");
    feed.hidden = v === "free";
    feed.textContent = v === "free" ? "" : `${info.name} · ${info.spec}`;
    if (v !== "free") closeCard();
    scene?.setView(v);
  }
  const syncView = seg(q("#v3-view"), VIEWS, view, setView);
  mons.addEventListener("click", (e) => {
    const b = e.target.closest(".lab-mon");
    if (b) setView(view === b.dataset.v ? "free" : b.dataset.v);
  });
  const monitorList = () => (mons.hidden ? [] : [...mons.querySelectorAll(".lab-mon")].map((el) => ({ id: el.dataset.v, el })));

  const syncLevel = seg(q("#v3-level"), LEVELS, "drop", (v) => {
    if (view !== "free") setView("free");
    scene?.setLevel(v);
  });
  seg(q("#v3-aud"), [{ id: "plain", label: "Explained" }, { id: "tech", label: "Scientific" }], aud, (v) => {
    aud = v;
    stage.dataset.aud = v;
    paintStatic(scenario.get());
    if (cardId) openCard(cardId);
  });

  // ---- Playback & Transport Controls ----
  q("#v3-play").addEventListener("click", () => scene?.setPlaying(!scene.playing));
  q("#v3-restart").addEventListener("click", () => scene?.restart());
  const scrub = q("#v3-scrub");
  scrub.addEventListener("pointerdown", () => { scrubbing = true; });
  addEventListener("pointerup", () => { scrubbing = false; });
  scrub.addEventListener("input", () => {
    scrub.style.setProperty("--fill", `${scrub.value / 10}%`);
    scene?.setProgress(scrub.value / 1000);
  });
  const RATES = [1, 0.25, 2];
  q("#v3-rate").addEventListener("click", (e) => {
    const r = RATES[(RATES.indexOf(+e.currentTarget.dataset.r || 1) + 1) % RATES.length];
    e.currentTarget.dataset.r = r;
    e.currentTarget.textContent = `${r}×`;
    scene?.setRate(r);
  });
  const toggle = (id, fn) => q(id).addEventListener("click", (e) => {
    const on = e.currentTarget.getAttribute("aria-pressed") !== "true";
    e.currentTarget.setAttribute("aria-pressed", on);
    fn(on);
  });
  toggle("#v3-labels", (on) => { spotBox.hidden = !on; if (!on) closeCard(); });
  toggle("#v3-monbtn", (on) => { mons.hidden = !on; scene?.setMonitors(monitorList()); });
  q("#v3-spin").addEventListener("click", (e) => {
    if (scene) e.currentTarget.setAttribute("aria-pressed", scene.toggleSpin());
  });

  // ---- Immersive Drawer & Fullscreen ----
  const drawer = q("#v3-drawer");
  const drawerBody = q("#v3-drawer-body");
  const immersive = () => document.fullscreenElement === stage || stage.classList.contains("lab-max");
  const configPanel = q("#lab-config-panel");
  const toolbar = q("#v3-toolbar");
  const viewportCol = q(".lab-viewport-col");

  function dock() {
    if (immersive()) {
      drawerBody.append(toolbar, configPanel);
      drawer.hidden = q("#v3-cond").getAttribute("aria-pressed") !== "true";
    } else {
      drawer.hidden = true;
      if (viewportCol && toolbar) viewportCol.prepend(toolbar);
      const wsGrid = q(".lab-workspace-grid");
      if (wsGrid && configPanel) wsGrid.prepend(configPanel);
    }
  }
  document.addEventListener("fullscreenchange", dock);
  toggle("#v3-cond", (on) => { drawer.hidden = !on || !immersive(); });
  q("#v3-drawer-x").addEventListener("click", () => q("#v3-cond").click());
  const maximize = (on) => {
    stage.classList.toggle("lab-max", on);
    if (on) root.closest(".view")?.classList.remove("enter");
    dock();
  };
  function leaveImmersive() {
    if (document.fullscreenElement === stage) document.exitFullscreen();
    if (stage.classList.contains("lab-max")) maximize(false);
  }
  q("#v3-full").addEventListener("click", () => {
    if (immersive()) return leaveImmersive();
    const req = stage.requestFullscreen?.();
    if (!req) maximize(true);
    else req.catch(() => maximize(true));
  });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && stage.classList.contains("lab-max")) maximize(false); });

  return {
    async enter() {
      active = true;
      paintStatic(scenario.get());
      unsub = scenario.subscribe(paintStatic);
      const msg = q("#v3-msg");
      msg.hidden = false;
      msg.textContent = "Loading 3D laboratory…";
      try {
        const { createFlame3D } = await import("../render/flame3d.js");
        if (!active || scene) return;
        scene = await createFlame3D(stage, {
          getSim: () => scenario.get().sim,
          getG: () => gravity.get().g,
          getEnv: () => envId,
          onHud: paintLive,
          onSpots: paintSpots,
        });
        if (!active) { scene.dispose(); scene = null; return; }
        scene.setView(view);
        scene.setMonitors(monitorList());
        scene.setRate(+q("#v3-rate").dataset.r || 1);
        q("#v3-spin").setAttribute("aria-pressed", scene.spinning);
        msg.hidden = true;
      } catch (err) {
        console.error(err);
        msg.textContent = "Could not initialize 3D view (WebGL unavailable or disconnected).";
      }
    },
    leave() {
      active = false;
      unsub?.();
      leaveImmersive();
      scene?.dispose();
      scene = null;
      paintSpots([]);
    },
  };
}
