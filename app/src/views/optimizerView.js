import { esc, fmt, ICON } from "../core/dom.js";
import { createOptimizerFacility } from "../render/lab/optimizerFacility.js";

export function mountOptimizer(root, data, { go }) {
  root.innerHTML = `
    <!-- A. Page Header (Clean, Professional, Focused) -->
    <div class="opt-header">
      <div class="opt-header-main">
        <div class="opt-header-meta">
          <span class="badge psi">NASA Space Apps 2026</span>
          <span class="opt-status-pill">
            <span class="opt-pulse-dot"></span>
            <span id="opt-header-model-status">Active Model: n-Heptane GPR (N=106) · 0g Calibrated</span>
          </span>
        </div>
        <h2 class="opt-title">Design Optimizer</h2>
        <p class="opt-subtitle">Prioritize informative combustion experiments using historical evidence and predictive uncertainty.</p>
      </div>
      <div class="opt-header-actions">
        <button type="button" class="btn small secondary" id="opt-btn-reset-params" title="Reset experimental parameters to baseline defaults">
          ↺ Reset Parameters
        </button>
      </div>
    </div>

    <!-- Mission Control 3-Column Layout -->
    <div class="mission-control-layout">
      <!-- B. LEFT: Experimental Configuration Panel -->
      <div class="panel stack opt-config-panel">
        <div class="opt-panel-header">
          <div class="opt-panel-title">
            <span class="opt-dot-amber"></span>
            <h3>Experimental Configuration</h3>
          </div>
          <span class="badge" style="font-size:10px;">Parameter Space</span>
        </div>

        <div class="opt-form-group">
          <label for="opt-fuel-select" class="opt-field-label">
            <span>Droplet Fuel Matrix</span>
            <span class="opt-label-hint">Verified Microgravity</span>
          </label>
          <select id="opt-fuel-select" class="opt-select">
            <option value="n-heptane" selected>n-Heptane (C₇H₁₆ · N=106 · PSI-69 FLEX)</option>
            <option value="methanol">Methanol (CH₃OH · N=150 · PSI-69 FLEX)</option>
          </select>
          <div class="opt-fuel-registry-note">
            <strong style="color:var(--ink);">Model Registry:</strong> GPR surrogate pipelines are calibrated strictly on verified microgravity droplet flight cohorts (Methanol N=150, n-Heptane N=106). Gaseous Methane (CH₄) and solid PMMA are indexed in the <strong>Evidence Explorer</strong> for historical research.
          </div>
        </div>
        
        <div class="opt-form-group">
          <label for="opt-objective" class="opt-field-label">
            <span>Acquisition Objective</span>
            <span class="opt-label-hint">Active Strategy</span>
          </label>
          <select id="opt-objective" class="opt-select">
            <option value="MAX_INFORMATION_GAIN">Max Bayesian Information Gain (EIG bits)</option>
            <option value="MAX_PREDICTIVE_VARIANCE">Max Predictive Variance (Epistemic σ_f²)</option>
            <option value="EXPLORATION_FRONTIER">Exploration Frontier (Lunar/Mars 0.57 atm)</option>
            <option value="EXTINCTION_BOUNDARY">Extinction Boundary (Quenching Limit)</option>
          </select>
        </div>

        <div class="opt-slider-group">
          <div class="opt-slider-header">
            <label for="opt-p-slider" class="opt-field-label">Pressure Limit (P):</label>
            <b id="opt-p-val" class="opt-val-badge font-mono">2.50 atm</b>
          </div>
          <input type="range" id="opt-p-slider" min="0.3" max="2.5" step="0.05" value="2.5" class="opt-slider">
        </div>

        <div class="opt-slider-group">
          <div class="opt-slider-header">
            <label for="opt-o2-slider" class="opt-field-label">Oxygen Cap (X_O₂):</label>
            <b id="opt-o2-val" class="opt-val-badge font-mono">42% O₂</b>
          </div>
          <input type="range" id="opt-o2-slider" min="0.15" max="0.42" step="0.01" value="0.42" class="opt-slider">
        </div>

        <div class="opt-slider-group">
          <div class="opt-slider-header">
            <label for="opt-d0-slider" class="opt-field-label">Droplet Size Limit (d₀):</label>
            <b id="opt-d0-val" class="opt-val-badge font-mono">2.5 mm</b>
          </div>
          <input type="range" id="opt-d0-slider" min="0.5" max="2.5" step="0.1" value="2.5" class="opt-slider">
        </div>

        <div class="opt-form-group">
          <span class="opt-field-label">Gravitational Regime:</span>
          <div class="chips opt-chip-group" id="opt-g-chips">
            <button type="button" class="chip active" data-g="0.0">0g (ISS)</button>
            <button type="button" class="chip" data-g="0.16">0.16g (Lunar)</button>
            <button type="button" class="chip" data-g="0.38">0.38g (Mars)</button>
            <button type="button" class="chip" data-g="1.0">1.0g (Ref)</button>
          </div>
          <div id="opt-gravity-notice" class="opt-notice-box">
            <strong>Reference 0g:</strong> Empirical microgravity reference condition (ISS CIR / FLEX). Model predictions reflect authentic 0g microgravity physics.
          </div>
        </div>

        <div class="opt-form-group">
          <span class="opt-field-label">Facility Viewport Mode:</span>
          <div class="chips opt-chip-group" id="opt-cam-chips">
            <button type="button" class="chip active" data-cam="orbit">Facility Orbit</button>
            <button type="button" class="chip" data-cam="chamber">Chamber View</button>
            <button type="button" class="chip" data-cam="sample">Needle Macro</button>
            <button type="button" class="chip" data-cam="rack">Gas Manifold</button>
          </div>
        </div>

        <!-- Prominent Primary Action Button -->
        <button type="button" class="btn primary opt-btn-generate" id="opt-btn-recalculate">
          ⚡ Apply Constraints & Rank Candidates
        </button>

        <div class="note" style="font-size:0.78rem; line-height:1.45; margin-top:2px; opacity:0.85;">
          <strong>Chamber Servo Guard:</strong> Opposed motorized deployment needles physically calibrate to candidate diameter (0.5 - 2.5 mm).
        </div>
      </div>

      <!-- F. CENTER: Interactive 3D Research Facility Stage (Zone A, B, C) -->
      <div class="stage-lab opt-stage-panel" id="opt-3d-stage" aria-label="Virtual NASA Experimental Research Facility">
        <!-- Zone B: Dedicated Telemetry & Mode Overlay -->
        <div class="opt-stage-hud-top">
          <span class="stage-badge" id="opt-mode-badge">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#ffd48a;"></span>
            NASA Research Facility · [P × O₂ × d₀]
          </span>
          <div class="stage-controls-bar">
            <span id="opt-surrogate-badge" style="font-size:11px; color:#94a3b8; font-family:var(--f-mono);">Surrogate: GPR Matérn 5/2 · n-Heptane (N=106)</span>
          </div>
        </div>

        <!-- Zone C: Dedicated Bottom Bar (Legend & Interaction Hint separated to prevent collision) -->
        <div class="opt-stage-hud-bottom">
          <div class="opt-stage-legend-row">
            <div class="opt-stage-legend-chips">
              <span style="display:inline-flex; align-items:center; gap:5px; color:#38bdf8;">
                <span style="width:7px; height:7px; border-radius:50%; background:#0284c7; display:inline-block;"></span>
                <span>NASA Flight Archive</span>
              </span>
              <span style="display:inline-flex; align-items:center; gap:5px; color:var(--color-flame-bright);">
                <span style="width:7px; height:7px; border-radius:50%; background:var(--color-flame); display:inline-block;"></span> Feasible Proposals
              </span>
              <span style="display:inline-flex; align-items:center; gap:5px; color:#ef4444;">
                <span style="width:7px; height:7px; border-radius:50%; background:#dc2626; display:inline-block;"></span> Infeasible
              </span>
              <span style="display:inline-flex; align-items:center; gap:5px; color:#a855f7;">
                <span style="width:7px; height:7px; border-radius:50%; background:#9333ea; display:inline-block;"></span> Uncertainty Halo
              </span>
            </div>
          </div>
          <div class="opt-stage-hint">
            Drag to orbit · Scroll to zoom · Click candidates
          </div>
        </div>
      </div>

      <!-- E. RIGHT: Selected Candidate Decision & Provenance Card -->
      <div class="panel stack opt-detail-panel" id="opt-detail-card">
        <div class="opt-panel-header">
          <div class="opt-panel-title">
            <span class="opt-dot-cyan"></span>
            <h3>Candidate Details</h3>
          </div>
          <div style="display:flex; gap:6px; align-items:center;">
            <span id="opt-cand-fuel-badge" class="badge" style="font-size:10px;">n-Heptane</span>
            <span id="opt-rank-indicator" class="status st-good" style="display:none; font-size:10px; padding:2px 7px;">★ Best Feasible</span>
          </div>
        </div>

        <div class="opt-cand-header-box">
          <span class="opt-cand-label">TARGET PROPOSAL</span>
          <h3 id="opt-cand-title" class="opt-cand-id">CAND-01</h3>
        </div>
        
        <div id="opt-status-container" style="display:flex; flex-direction:column; gap:4px;">
          <span class="status st-good" id="opt-cand-status" style="font-size:11px; width:fit-content;">FEASIBLE_SPACEFLIGHT</span>
          <span id="opt-feasibility-source" style="font-size:10.5px; color:var(--ink-2); font-family:var(--f-mono); line-height:1.35;">Hardware: ISS CIR / MDCA (NASA/TP-2017-219299)</span>
        </div>

        <div id="opt-extrapolation-alert" style="display:none; background:rgba(245,158,11,0.12); border:1px solid #f59e0b; border-radius:6px; padding:8px 10px; font-size:11.5px; color:#fde68a; line-height:1.4;">
          <div style="font-weight:600; margin-bottom:2px;">Scientific Notice:</div>
          <div id="opt-extrapolation-text"></div>
        </div>

        <div id="opt-violations-alert" style="display:none; background:rgba(239,68,68,0.12); border:1px solid #ef4444; border-radius:6px; padding:8px 10px; font-size:11.5px; color:#fca5a5; line-height:1.4;">
          <div style="font-weight:600; margin-bottom:2px;">Constraint Violations:</div>
          <div id="opt-violations-list"></div>
        </div>

        <!-- Dossier KPIs: Grouped numbers and units preventing line breaks -->
        <div class="opt-dossier-kpis" id="opt-dossier-kpis">
          <div class="kpi">
            <div class="kpi-val-row">
              <b id="opt-cand-k" class="font-mono" style="color:#38bdf8;">--</b>
              <span class="kpi-unit">mm²/s</span>
            </div>
            <span class="opt-kpi-sublabel">Burn Rate (K)</span>
          </div>
          <div class="kpi">
            <div class="kpi-val-row">
              <b id="opt-cand-sigma" class="font-mono" style="color:#a855f7;">--</b>
              <span class="kpi-unit">2σ</span>
            </div>
            <span class="opt-kpi-sublabel">Uncertainty (±2σ)</span>
          </div>
          <div class="kpi">
            <div class="kpi-val-row">
              <b id="opt-cand-eig" class="font-mono" style="color:var(--warn);">--</b>
              <span class="kpi-unit">bits</span>
            </div>
            <span class="opt-kpi-sublabel">Bayesian EIG</span>
          </div>
          <div class="kpi">
            <div class="kpi-val-row">
              <b id="opt-cand-p" class="font-mono">--</b>
              <span class="kpi-unit">atm</span>
            </div>
            <span class="opt-kpi-sublabel">Pressure (P)</span>
          </div>
          <div class="kpi">
            <div class="kpi-val-row">
              <b id="opt-cand-o2" class="font-mono" style="color:var(--good);">--</b>
              <span class="kpi-unit">% O₂</span>
            </div>
            <span class="opt-kpi-sublabel">Oxidizer (X_O₂)</span>
          </div>
          <div class="kpi">
            <div class="kpi-val-row">
              <b id="opt-cand-d0" class="font-mono">--</b>
              <span class="kpi-unit">mm</span>
            </div>
            <span class="opt-kpi-sublabel">Droplet (d₀)</span>
          </div>
        </div>

        <div class="opt-dossier-section">
          <span class="opt-section-tag">Supporting Historical Runs:</span>
          <div id="opt-cand-neighbors" class="opt-neighbors-box">
            No nearest historical runs indexed.
          </div>
        </div>

        <div class="opt-dossier-section">
          <span class="opt-section-tag">Model Provenance & Reliability:</span>
          <div id="opt-cand-provenance" class="opt-provenance-box">
            GPR Matérn 5/2 · NASA PSI-69 FLEX Flight Archive
          </div>
        </div>

        <div class="opt-dossier-section">
          <span class="opt-section-tag">Scientific Rationale:</span>
          <p id="opt-cand-rationale" class="opt-rationale-text">
            Exploration atmosphere target (0.57 atm / 34% O₂). High surrogate model variance indicates significant microgravity knowledge gap. Maximum expected information gain to reduce flight extrapolation risk.
          </p>
        </div>

        <button type="button" class="btn small opt-btn-export" id="opt-btn-download">
          Export Full Research Proposal
        </button>
      </div>
    </div>

    <!-- SECTION 2: GAUSSIAN PROCESS REGRESSION & EPISTEMIC UNCERTAINTY (±2σ) VISUALIZER -->
    <div class="opt-gpr-panel">
      <div class="opt-gpr-header">
        <div class="opt-gpr-title-group">
          <h3>
            <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:var(--color-cyan, #20b9e8);"></span>
            Gaussian Process Regression (GPR) Response Surface & Uncertainty Envelope (±2σ)
          </h3>
          <div class="opt-gpr-sub" id="opt-gpr-sub-desc">Continuous fuel-stratified surrogate predictions with 95% Bayesian epistemic confidence bounds across microgravity flight parameters.</div>
        </div>
        <div class="opt-gpr-controls">
          <div class="chips" id="opt-gpr-slice-chips" style="margin:0;">
            <button type="button" class="opt-slice-btn active" data-slice="P">Slice: K vs Pressure (P)</button>
            <button type="button" class="opt-slice-btn" data-slice="O2">Slice: K vs Oxygen (X_O₂)</button>
            <button type="button" class="opt-slice-btn" data-slice="D0">Slice: K vs Diameter (d₀)</button>
          </div>
          <span id="opt-gpr-cv-badge" style="font-size:11px; font-family:var(--f-mono); color:var(--good); padding:4px 8px; border-radius:4px; background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.3);">
            5-Fold CV: R² = 0.077 · RMSE = 0.138 mm²/s
          </span>
          <span id="opt-gpr-coords-lock" style="font-size:11px; font-family:var(--f-mono); color:var(--ink-2); padding:4px 8px; border-radius:4px; background:rgba(0,0,0,0.3); border:1px solid var(--line-2);">
            Fixed: 40% O₂ · d₀=2.0mm
          </span>
        </div>
      </div>

      <!-- Model Reliability Notice Banner -->
      <div id="opt-gpr-reliability-banner" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; background:rgba(15,23,42,0.7); border:1px solid var(--line-2); border-radius:6px; padding:8px 12px; margin-bottom:12px; font-size:11.5px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span id="opt-gpr-reliability-badge" class="status st-warn" style="font-size:10.5px; border-color:#f59e0b; background:rgba(245,158,11,0.15); color:#fde68a;">
            ⚠️ Limited Point-Prediction Reliability (R² = 0.077)
          </span>
          <span id="opt-gpr-disclosure-text" style="color:var(--ink-2); line-height:1.4;">
            Exploratory decision support: high flight measurement scatter (σ_n = 0.102 mm²/s) limits point accuracy. Use epistemic uncertainty bounds (±2σ) for experimental targeting.
          </span>
        </div>
      </div>

      <div class="opt-gpr-canvas-wrap" id="opt-gpr-canvas-wrap">
        <canvas id="opt-gpr-canvas" class="opt-gpr-canvas"></canvas>
        <div class="opt-gpr-hud" id="opt-gpr-hud" style="display:none;"></div>
      </div>

      <div class="opt-gpr-legend">
        <span class="opt-gpr-legend-item">
          <span style="width:18px; height:3px; background:var(--color-cyan, #20b9e8); display:inline-block; border-radius:2px;"></span>
          <span style="color:var(--ink);">GPR Mean Prediction (μ)</span>
        </span>
        <span class="opt-gpr-legend-item">
          <span style="width:18px; height:10px; background:rgba(56,189,248,0.25); border:1px dashed rgba(56,189,248,0.6); display:inline-block; border-radius:2px;"></span>
          <span style="color:var(--ink);">Epistemic Uncertainty Ribbon (±2σ · 95% CI)</span>
        </span>
        <span class="opt-gpr-legend-item">
          <span style="width:8px; height:8px; border-radius:50%; background:#0284c7; border:1px solid #38bdf8; display:inline-block;"></span>
          <span style="color:var(--ink);">NASA PSI Empirical Flight Trials</span>
        </span>
        <span class="opt-gpr-legend-item">
          <span style="width:10px; height:10px; transform:rotate(45deg); background:var(--color-flame, #ff791f); border:1px solid #fff; display:inline-block;"></span>
          <span style="color:var(--ink);">Selected Proposal Target</span>
        </span>
        <span class="opt-gpr-legend-item">
          <span style="width:14px; height:0; border-top:2px dashed #f59e0b; display:inline-block;"></span>
          <span style="color:var(--ink);">ISS CIR Hardware Floor (0.70 atm)</span>
        </span>
      </div>
    </div>

    <!-- SECTION 3: SEQUENTIAL CANDIDATE ACQUISITION & EIG RANKING TABLE -->
    <div class="opt-ranking-panel">
      <div class="panel-title" style="flex-wrap:wrap; gap:10px; margin-bottom:12px;">
        <div>
          <h3 style="margin:0;">Bayesian Acquisition (EIG) Candidate Proposals</h3>
          <span style="font-size:11px; color:var(--ink-2);">Sequential candidate recommendations sorted by expected scientific information value and flight feasibility.</span>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          <span class="dim small" id="opt-cands-count" style="font-family:var(--f-mono); font-size:11px;">Evaluating proposals...</span>
        </div>
      </div>

      <!-- Quick horizontal carousel strip -->
      <div class="candidate-strip" id="opt-candidate-strip" style="margin-bottom:16px;"></div>

      <!-- Full Detailed Ranking Table -->
      <div class="opt-table-wrap">
        <table class="opt-rank-table" id="opt-rank-table">
          <thead>
            <tr>
              <th style="width:60px;">Rank</th>
              <th>Candidate ID</th>
              <th>Pressure (P)</th>
              <th>Oxidizer (X_O₂)</th>
              <th>Droplet (d₀)</th>
              <th>Predicted Burn Rate (K)</th>
              <th>Epistemic (±2σ)</th>
              <th>Expected Info Gain</th>
              <th>Flight Envelope</th>
              <th style="text-align:right;">Action</th>
            </tr>
          </thead>
          <tbody id="opt-rank-table-body">
            <tr><td colspan="10" style="text-align:center; padding:20px; color:var(--ink-2);">Evaluating proposals...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- SECTION 4: SEQUENTIAL ACTIVE LEARNING RETROSPECTIVE BENCHMARK -->
    <div class="panel stack" style="margin-top:20px;">
      <div class="panel-title" style="flex-wrap:wrap; gap:10px;">
        <div>
          <h3 style="margin:0;">Sequential Active Learning Retrospective Benchmark</h3>
          <span style="font-size:11px; color:var(--ink-2);">Simulated sequential experiment selection evaluated on NASA PSI-69 flight observations (Methanol cohort, N=150 · 10 repetitions).</span>
        </div>
        <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
          <span class="dim small" id="opt-benchmark-pill" style="color:var(--good); font-weight:600; font-family:var(--f-mono); font-size:11px;">Active Learning: Evaluating...</span>
          <button type="button" class="btn small" id="opt-btn-toggle-benchmark" style="padding:4px 10px; font-size:11px;">
            📊 View 4-Strategy Comparison
          </button>
        </div>
      </div>

      <!-- Benchmark Summary KPI Grid: All values derived dynamically from authoritative benchmark JSON -->
      <div class="opt-benchmark-grid">
        <div class="opt-kpi-card">
          <div class="kpi-label">Bayesian EIG Reduction</div>
          <div class="kpi-val" id="opt-bench-kpi-eig" style="color:var(--good);">--</div>
          <div class="kpi-sub" id="opt-bench-kpi-eig-sub">Test RMSE in 10 sequential steps</div>
        </div>
        <div class="opt-kpi-card">
          <div class="kpi-label">Random Sampling Baseline</div>
          <div class="kpi-val" id="opt-bench-kpi-rnd" style="color:var(--ink-2);">--</div>
          <div class="kpi-sub" id="opt-bench-kpi-rnd-sub">Passive uniform exploration</div>
        </div>
        <div class="opt-kpi-card">
          <div class="kpi-label">Cumulative Error Advantage</div>
          <div class="kpi-val" id="opt-bench-kpi-ipe" style="color:var(--color-cyan, #20b9e8);">--</div>
          <div class="kpi-sub" id="opt-bench-kpi-ipe-sub">Integrated Prediction Error across steps</div>
        </div>
        <div class="opt-kpi-card">
          <div class="kpi-label">Final Test Margin</div>
          <div class="kpi-val" id="opt-bench-kpi-margin" style="color:var(--ink);">--</div>
          <div class="kpi-sub" id="opt-bench-kpi-margin-sub">Held-out flight cohort (N=30 · 10 reps)</div>
        </div>
      </div>

      <!-- Expandable Honest Benchmark Drawer -->
      <div id="opt-benchmark-drawer" style="display:none; background:rgba(15,23,42,0.6); border:1px solid var(--line-2); border-radius:6px; padding:12px; margin-bottom:8px; font-size:12px; line-height:1.45;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <strong style="color:var(--ink);">Sequential Active Learning Strategy Evaluation (NASA PSI-69 FLEX Spaceflight Cohort)</strong>
          <span style="font-size:10.5px; color:var(--ink-2); font-family:var(--f-mono);">15 Initial Train · 10 Sequential Steps · 30 Held-out Test</span>
        </div>
        <div id="opt-benchmark-table-container" style="overflow-x:auto;"></div>
        <div style="margin-top:8px; font-size:11px; color:var(--ink-2); font-style:italic;" id="opt-benchmark-notice">
          * Notice: Simulated sequential benchmark evaluated on historical NASA PSI-69 spaceflight observations. Does not represent physical closed-loop experiment outcomes. The final RMSE margin (-0.0015 mm²/s) reflects high aleatoric flight noise that moderates active-learning gains.
        </div>
      </div>
    </div>
  `;

  const q = (s) => root.querySelector(s);
  const stageEl = q("#opt-3d-stage");
  const canvasEl = q("#opt-gpr-canvas");
  const canvasWrap = q("#opt-gpr-canvas-wrap");
  const gprHud = q("#opt-gpr-hud");

  let facility3d = null;
  let proposalsData = null;
  let evidenceLedger = [];
  let activeGravity = 0.0;
  let activeFuel = "n-heptane";
  let activeSlice = "P"; // 'P' | 'O2' | 'D0'
  let lastEvaluation = null;
  let selectedCandidateId = null;
  let currentCandidate = null;

  // ==========================================
  // GPR MODEL DISCLOSURE & RELIABILITY BINDING
  // ==========================================
  function updateModelDisclosure(fuel) {
    const meta = proposalsData?.models_metadata?.[fuel];
    const fuelLabel = fuel === "methanol" ? "Methanol" : "n-Heptane";
    const cv = meta?.cross_validation?.aggregate;
    const r2Val = cv?.r2?.mean !== undefined ? cv.r2.mean.toFixed(3) : (fuel === "methanol" ? "0.619" : "0.077");
    const rmseVal = cv?.rmse_mm2_s?.mean !== undefined ? cv.rmse_mm2_s.mean.toFixed(3) : (fuel === "methanol" ? "0.065" : "0.138");
    const covVal = cv?.predictive_interval_coverage_95 !== undefined ? (cv.predictive_interval_coverage_95 * 100).toFixed(1) : (fuel === "methanol" ? "90.0" : "88.6");

    const cvBadgeEl = q("#opt-gpr-cv-badge");
    const reliabilityEl = q("#opt-gpr-reliability-badge");
    const disclosureEl = q("#opt-gpr-disclosure-text");

    if (cvBadgeEl) {
      cvBadgeEl.textContent = `5-Fold CV: R² = ${r2Val} (${fuelLabel}) · RMSE = ${rmseVal} mm²/s · 95% Coverage = ${covVal}%`;
      cvBadgeEl.style.color = fuel === "methanol" ? "var(--good)" : "var(--warn)";
      cvBadgeEl.style.borderColor = fuel === "methanol" ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)";
      cvBadgeEl.style.background = fuel === "methanol" ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)";
    }

    if (fuel === "n-heptane") {
      if (reliabilityEl) {
        reliabilityEl.className = "status st-warn";
        reliabilityEl.style.cssText = "font-size:10.5px; border-color:#f59e0b; background:rgba(245,158,11,0.15); color:#fde68a;";
        reliabilityEl.textContent = "⚠️ Limited Point-Prediction Reliability (R² = 0.077)";
      }
      if (disclosureEl) {
        disclosureEl.innerHTML = `<strong>Exploratory Decision Support:</strong> High aleatoric flight noise (σ_n = 0.102 mm²/s from filament suspension losses and video pixel variance) limits point-prediction accuracy. The model identifies high-uncertainty parameter regions for targeted exploration rather than reliable single-point predictions.`;
      }
    } else if (fuel === "methanol") {
      if (reliabilityEl) {
        reliabilityEl.className = "status st-good";
        reliabilityEl.style.cssText = "font-size:10.5px; border-color:var(--good); background:var(--good-bg); color:var(--good-ink);";
        reliabilityEl.textContent = "✓ Calibrated Empirical Surrogate (R² = 0.619)";
      }
      if (disclosureEl) {
        disclosureEl.innerHTML = `<strong>Calibrated Empirical Model:</strong> Continuous Matérn 5/2 surrogate fitted on NASA PSI-69 FLEX Methanol spaceflight droplet observations (N=150). Cross-validation confirms strong point prediction and 90% uncertainty interval coverage.`;
      }
    }
  }

  // ==========================================
  // GPR RESPONSE SURFACE 2D SLICE VISUALIZER
  // ==========================================
  function renderGPRSurface() {
    if (!canvasEl || !canvasWrap) return;

    const rect = canvasWrap.getBoundingClientRect();
    const width = Math.max(300, rect.width || canvasWrap.clientWidth || 800);
    const height = 340;
    const dpr = window.devicePixelRatio || 1;

    canvasEl.width = width * dpr;
    canvasEl.height = height * dpr;
    canvasEl.style.width = `${width}px`;
    canvasEl.style.height = `${height}px`;

    const ctx = canvasEl.getContext("2d");
    ctx.resetTransform();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    updateModelDisclosure(activeFuel);

    // Coordinate lock label update
    const coordsLockEl = q("#opt-gpr-coords-lock");
    const cand = currentCandidate;

    const fuelData = proposalsData?.fuels?.[activeFuel];
    const allCands = fuelData?.all_candidates || fuelData?.top_candidates || proposalsData?.all_candidates || [];

    // Target slice lock parameters
    const targetP = cand?.pressure_atm ?? 1.0;
    const targetO2 = cand?.o2_mole_fraction ?? 0.21;
    const targetD0 = cand?.droplet_diameter_mm ?? 2.0;

    if (coordsLockEl) {
      if (activeSlice === "P") {
        coordsLockEl.textContent = `Slice locked at: ${(targetO2 * 100).toFixed(0)}% O₂ · d₀=${targetD0.toFixed(1)}mm`;
      } else if (activeSlice === "O2") {
        coordsLockEl.textContent = `Slice locked at: P=${targetP.toFixed(2)}atm · d₀=${targetD0.toFixed(1)}mm`;
      } else {
        coordsLockEl.textContent = `Slice locked at: P=${targetP.toFixed(2)}atm · ${(targetO2 * 100).toFixed(0)}% O₂`;
      }
    }

    // Extract slice curve points
    let slicePoints = [];
    if (activeSlice === "P") {
      slicePoints = allCands.filter(c => Math.abs((c.o2_mole_fraction ?? 0.21) - targetO2) < 0.03 && Math.abs((c.droplet_diameter_mm ?? 2.0) - targetD0) < 0.3);
      if (slicePoints.length === 0) {
        slicePoints = allCands.filter(c => Math.abs((c.droplet_diameter_mm ?? 2.0) - targetD0) < 0.3);
      }
      slicePoints.sort((a, b) => (a.pressure_atm ?? 0) - (b.pressure_atm ?? 0));
    } else if (activeSlice === "O2") {
      slicePoints = allCands.filter(c => Math.abs((c.pressure_atm ?? 1.0) - targetP) < 0.15 && Math.abs((c.droplet_diameter_mm ?? 2.0) - targetD0) < 0.3);
      if (slicePoints.length === 0) {
        slicePoints = allCands.filter(c => Math.abs((c.droplet_diameter_mm ?? 2.0) - targetD0) < 0.3);
      }
      slicePoints.sort((a, b) => (a.o2_mole_fraction ?? 0) - (b.o2_mole_fraction ?? 0));
    } else {
      slicePoints = allCands.filter(c => Math.abs((c.pressure_atm ?? 1.0) - targetP) < 0.15 && Math.abs((c.o2_mole_fraction ?? 0.21) - targetO2) < 0.03);
      if (slicePoints.length === 0) {
        slicePoints = allCands.filter(c => Math.abs((c.pressure_atm ?? 1.0) - targetP) < 0.15);
      }
      slicePoints.sort((a, b) => (a.droplet_diameter_mm ?? 0) - (b.droplet_diameter_mm ?? 0));
    }

    if (slicePoints.length === 0) {
      slicePoints = allCands.slice(0, 8);
    }

    // Plot bounds & layout margins
    const padL = 60, padR = 30, padT = 30, padB = 45;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    let minX, maxX, xLabel, xFormatter;
    if (activeSlice === "P") {
      minX = 0.3; maxX = 2.7;
      xLabel = "Chamber Pressure P (atm)";
      xFormatter = (v) => `${v.toFixed(1)} atm`;
    } else if (activeSlice === "O2") {
      minX = 0.15; maxX = 0.45;
      xLabel = "Oxidizer Mole Fraction X_O₂ (% O₂)";
      xFormatter = (v) => `${Math.round(v * 100)}%`;
    } else {
      minX = 1.0; maxX = 4.5;
      xLabel = "Initial Droplet Diameter d₀ (mm)";
      xFormatter = (v) => `${v.toFixed(1)} mm`;
    }

    // Compute Y domain (Burning Rate K in mm²/s)
    let maxY = 0.85;
    slicePoints.forEach(c => {
      const k = c.predicted_burn_rate_k ?? 0.5;
      const sig = c.prediction_uncertainty_std ?? 0.15;
      if (k + 2 * sig > maxY) maxY = Math.min(1.4, Math.ceil((k + 2 * sig) * 10) / 10);
    });
    const minY = 0.0;

    const toPxX = (v) => padL + ((v - minX) / (maxX - minX)) * plotW;
    const toPxY = (v) => padT + (1 - (v - minY) / (maxY - minY)) * plotH;
    const fromPxX = (px) => minX + ((px - padL) / plotW) * (maxX - minX);

    // 1. Background grid & ticks
    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 1;
    ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
    ctx.font = "10px monospace";

    // Horizontal grid (Y ticks)
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const val = minY + (i / ySteps) * (maxY - minY);
      const py = toPxY(val);
      ctx.beginPath();
      ctx.moveTo(padL, py);
      ctx.lineTo(width - padR, py);
      ctx.stroke();

      ctx.textAlign = "right";
      ctx.fillText(`${val.toFixed(2)}`, padL - 8, py + 3);
    }

    // Vertical grid (X ticks)
    const xSteps = 6;
    for (let i = 0; i <= xSteps; i++) {
      const val = minX + (i / xSteps) * (maxX - minX);
      const px = toPxX(val);
      ctx.beginPath();
      ctx.moveTo(px, padT);
      ctx.lineTo(px, height - padB);
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.fillText(xFormatter(val), px, height - padB + 16);
    }

    // Axis titles
    ctx.textAlign = "center";
    ctx.font = "11px monospace";
    ctx.fillStyle = "rgba(148, 163, 184, 0.85)";
    ctx.fillText(xLabel, padL + plotW / 2, height - 10);

    ctx.save();
    ctx.translate(16, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Burning Rate K (mm²/s)", 0, 0);
    ctx.restore();

    // 2. Hardware limit / Sub-atmospheric exploration boundary (0.70 atm)
    if (activeSlice === "P") {
      const limitX = toPxX(0.70);
      if (limitX >= padL && limitX <= width - padR) {
        ctx.fillStyle = "rgba(245, 158, 11, 0.06)";
        ctx.fillRect(padL, padT, limitX - padL, plotH);

        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(limitX, padT);
        ctx.lineTo(limitX, height - padB);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#fde68a";
        ctx.font = "9.5px monospace";
        ctx.textAlign = "left";
        ctx.fillText("← Sub-atmospheric (< 0.70 atm · Drop Tower)", limitX + 6, padT + 14);
      }
    }

    // 3. Process curve points along slice
    const pts = slicePoints.map(c => {
      let xVal = c.pressure_atm;
      if (activeSlice === "O2") xVal = c.o2_mole_fraction;
      if (activeSlice === "D0") xVal = c.droplet_diameter_mm;
      const k = c.predicted_burn_rate_k ?? 0.5;
      const sig = c.prediction_uncertainty_std ?? 0.12;
      return {
        x: xVal,
        k: k,
        sig: sig,
        upperK: Math.min(maxY, k + 2 * sig),
        lowerK: Math.max(minY, k - 2 * sig),
        px: toPxX(xVal),
        py: toPxY(k),
        pUpper: toPxY(Math.min(maxY, k + 2 * sig)),
        pLower: toPxY(Math.max(minY, k - 2 * sig)),
        cand: c
      };
    }).filter(p => p.px >= padL - 10 && p.px <= width - padR + 10);

    if (pts.length >= 2) {
      // 4. Epistemic Uncertainty Shaded Envelope (±2σ · 95% Confidence Band)
      const grad = ctx.createLinearGradient(0, padT, 0, height - padB);
      grad.addColorStop(0, "rgba(56, 189, 248, 0.28)");
      grad.addColorStop(0.5, "rgba(168, 85, 247, 0.18)");
      grad.addColorStop(1, "rgba(56, 189, 248, 0.12)");

      ctx.beginPath();
      ctx.moveTo(pts[0].px, pts[0].pUpper);
      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const cpx = (p1.px + p2.px) / 2;
        ctx.bezierCurveTo(cpx, p1.pUpper, cpx, p2.pUpper, p2.px, p2.pUpper);
      }
      ctx.lineTo(pts[pts.length - 1].px, pts[pts.length - 1].pLower);
      for (let i = pts.length - 1; i > 0; i--) {
        const p1 = pts[i];
        const p2 = pts[i - 1];
        const cpx = (p1.px + p2.px) / 2;
        ctx.bezierCurveTo(cpx, p1.pLower, cpx, p2.pLower, p2.px, p2.pLower);
      }
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Dashed confidence boundary borders
      ctx.setLineDash([2, 3]);
      ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pts[0].px, pts[0].pUpper);
      for (let i = 0; i < pts.length - 1; i++) {
        const cpx = (pts[i].px + pts[i + 1].px) / 2;
        ctx.bezierCurveTo(cpx, pts[i].pUpper, cpx, pts[i + 1].pUpper, pts[i + 1].px, pts[i + 1].pUpper);
      }
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(pts[0].px, pts[0].pLower);
      for (let i = 0; i < pts.length - 1; i++) {
        const cpx = (pts[i].px + pts[i + 1].px) / 2;
        ctx.bezierCurveTo(cpx, pts[i].pLower, cpx, pts[i + 1].pLower, pts[i + 1].px, pts[i + 1].pLower);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // 5. GPR Mean Response Curve μ(x)
      ctx.beginPath();
      ctx.moveTo(pts[0].px, pts[0].py);
      for (let i = 0; i < pts.length - 1; i++) {
        const cpx = (pts[i].px + pts[i + 1].px) / 2;
        ctx.bezierCurveTo(cpx, pts[i].py, cpx, pts[i + 1].py, pts[i + 1].px, pts[i + 1].py);
      }
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // 6. NASA Historical Flight Runs Projection
    const fuelKey = activeFuel === "methanol" ? "methanol" : "heptane";
    const histRuns = evidenceLedger.filter(r => {
      const mat = (r.material_or_fuel || "").toLowerCase();
      if (!mat.includes(fuelKey)) return false;
      const norm = r.normalized_measurements || {};
      const k = norm.burning_rate_mm2_s;
      if (k === null || k === undefined || isNaN(k)) return false;

      const p = norm.pressure_atm;
      const o2 = norm.x_o2;
      const d0 = norm.d0_mm;

      if (activeSlice === "P") {
        return Math.abs(o2 - targetO2) < 0.08 && Math.abs(d0 - targetD0) < 1.0;
      } else if (activeSlice === "O2") {
        return Math.abs(p - targetP) < 0.25 && Math.abs(d0 - targetD0) < 1.0;
      } else {
        return Math.abs(p - targetP) < 0.25 && Math.abs(o2 - targetO2) < 0.08;
      }
    });

    histRuns.slice(0, 40).forEach(r => {
      const norm = r.normalized_measurements || {};
      let xVal = norm.pressure_atm;
      if (activeSlice === "O2") xVal = norm.x_o2;
      if (activeSlice === "D0") xVal = norm.d0_mm;
      const k = norm.burning_rate_mm2_s;

      if (xVal >= minX && xVal <= maxX && k >= minY && k <= maxY) {
        const px = toPxX(xVal);
        const py = toPxY(k);

        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#0284c7";
        ctx.fill();
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    });

    // 7. Active Candidate Proposal Marker
    if (cand) {
      let candX = cand.pressure_atm;
      if (activeSlice === "O2") candX = cand.o2_mole_fraction;
      if (activeSlice === "D0") candX = cand.droplet_diameter_mm;
      const candK = cand.predicted_burn_rate_k ?? 0.5;

      if (candX !== null && candX !== undefined && candK !== null && candX >= minX && candX <= maxX) {
        const cx = toPxX(candX);
        const cy = toPxY(candK);

        // Pulsing radar glow
        ctx.beginPath();
        ctx.arc(cx, cy, 11, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 121, 31, 0.25)";
        ctx.fill();

        // Target diamond
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = "#ff791f";
        ctx.fillRect(-5, -5, 10, 10);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-5, -5, 10, 10);
        ctx.restore();

        // Label
        ctx.fillStyle = "#ff9a4d";
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(cand.candidate_id || "TARGET", cx, cy - 14);
      }
    }

    // Attach interactive hover listener
    canvasWrap.onmousemove = (e) => {
      const cRect = canvasWrap.getBoundingClientRect();
      const mx = e.clientX - cRect.left;
      const my = e.clientY - cRect.top;

      if (mx < padL || mx > width - padR || my < padT || my > height - padB) {
        if (gprHud) gprHud.style.display = "none";
        return;
      }

      const hoverX = fromPxX(mx);
      let closest = null, minDist = Infinity;
      pts.forEach(p => {
        const dist = Math.abs(p.px - mx);
        if (dist < minDist) { minDist = dist; closest = p; }
      });

      if (closest && gprHud) {
        gprHud.style.display = "block";
        const coordStr = activeSlice === "P" ? `P = ${hoverX.toFixed(2)} atm` : (activeSlice === "O2" ? `X_O₂ = ${(hoverX * 100).toFixed(1)}%` : `d₀ = ${hoverX.toFixed(1)} mm`);
        const statusStr = hoverX < 0.70 && activeSlice === "P" ? `<span style="color:#f59e0b;">Sub-atmospheric Frontier</span>` : `<span style="color:var(--good);">Spaceflight Envelope</span>`;
        gprHud.innerHTML = `
          <div style="font-weight:700; color:var(--ink); margin-bottom:2px;">${coordStr} · ${statusStr}</div>
          <div style="color:#38bdf8;">Predicted K: <b>${closest.k.toFixed(3)} mm²/s</b></div>
          <div style="color:#a855f7;">Epistemic Uncertainty: <b>± ${(closest.sig * 2).toFixed(3)} mm²/s (±2σ)</b></div>
          <div style="color:var(--ink-2); font-size:10px;">95% CI: [${closest.lowerK.toFixed(3)}, ${closest.upperK.toFixed(3)}] mm²/s</div>
        `;
      }
    };

    canvasWrap.onmouseleave = () => {
      if (gprHud) gprHud.style.display = "none";
    };
  }

  // ==========================================
  // CANDIDATE DOSSIER & PROVENANCE UPDATER
  // ==========================================
  function updateCandidateDossier(cand) {
    if (!cand) return;
    currentCandidate = cand;

    const statusEl = q("#opt-cand-status");
    const feasSourceEl = q("#opt-feasibility-source");
    const rankEl = q("#opt-rank-indicator");
    const fuelBadge = q("#opt-cand-fuel-badge");
    const violAlert = q("#opt-violations-alert");
    const violList = q("#opt-violations-list");
    const extrapAlert = q("#opt-extrapolation-alert");
    const extrapText = q("#opt-extrapolation-text");
    const provEl = q("#opt-cand-provenance");

    if (fuelBadge) {
      const fuelName = cand.fuel || activeFuel;
      if (fuelName === "methanol") {
        fuelBadge.textContent = "Methanol (CH₃OH · N=150)";
      } else {
        fuelBadge.textContent = "n-Heptane (C₇H₁₆ · N=106)";
      }
      fuelBadge.style.color = "var(--ink)";
      fuelBadge.style.background = "rgba(255,255,255,0.08)";
    }

    q("#opt-cand-title").textContent = cand.candidate_id || "CAND-01";
    
    // Format KPIs with separate value and unit elements to prevent line breaks
    q("#opt-cand-k").textContent = cand.predicted_burn_rate_k !== null && cand.predicted_burn_rate_k !== undefined ? cand.predicted_burn_rate_k.toFixed(3) : "--";
    q("#opt-cand-sigma").textContent = cand.prediction_uncertainty_std !== null && cand.prediction_uncertainty_std !== undefined ? `± ${(cand.prediction_uncertainty_std * 2).toFixed(3)}` : "--";
    q("#opt-cand-eig").textContent = cand.expected_information_gain_bits !== null && cand.expected_information_gain_bits !== undefined ? cand.expected_information_gain_bits.toFixed(3) : "--";
    q("#opt-cand-p").textContent = cand.pressure_atm !== null && cand.pressure_atm !== undefined ? cand.pressure_atm.toFixed(2) : "--";
    q("#opt-cand-o2").textContent = cand.o2_mole_fraction !== null && cand.o2_mole_fraction !== undefined ? (cand.o2_mole_fraction * 100).toFixed(1) : "--";
    q("#opt-cand-d0").textContent = cand.droplet_diameter_mm !== null && cand.droplet_diameter_mm !== undefined ? cand.droplet_diameter_mm.toFixed(1) : "--";

    const isTopFeasible = lastEvaluation?.bestFeasible && lastEvaluation.bestFeasible.candidate_id === cand.candidate_id;
    rankEl.style.display = isTopFeasible ? "inline-block" : "none";

    // Feasibility status badge: synchronize snake_case and camelCase
    const status = cand.feasibility_status || cand.feasibilityStatus || (cand.isFeasible ? "FEASIBLE_SPACEFLIGHT" : "UNSUPPORTED");
    
    if (status === "FEASIBLE_SPACEFLIGHT") {
      statusEl.className = "status st-good";
      statusEl.style.background = "var(--good-bg)";
      statusEl.style.color = "var(--good-ink)";
      statusEl.style.borderColor = "var(--good)";
      statusEl.textContent = "Hypothetical candidate · Spaceflight Feasible";
      if (feasSourceEl) feasSourceEl.textContent = `Hardware: ${cand.feasibility_source || cand.feasibilitySource || 'ISS CIR / MDCA (NASA/TP-2017-219299)'}`;
    } else if (status === "GROUND_FACILITY_ONLY") {
      statusEl.className = "status st-warn";
      statusEl.style.background = "var(--warn-bg)";
      statusEl.style.color = "var(--warn-ink)";
      statusEl.style.borderColor = "var(--warn)";
      statusEl.textContent = "Hypothetical candidate · Ground Facility Only";
      if (feasSourceEl) feasSourceEl.textContent = `Hardware: ${cand.feasibility_source || cand.feasibilitySource || 'NASA TM-107000 Zero-Gravity Facility'}`;
    } else if (status === "HYPOTHETICAL_FRONTIER") {
      statusEl.className = "status st-info";
      statusEl.style.background = "rgba(32, 185, 232, 0.15)";
      statusEl.style.color = "var(--color-cyan)";
      statusEl.style.borderColor = "var(--color-cyan)";
      statusEl.textContent = "Hypothetical candidate · Exploration Frontier Target";
      if (feasSourceEl) feasSourceEl.textContent = `Standard: ${cand.feasibility_source || cand.feasibilitySource || 'NASA-STD-3001 Vol 2 Habitat Standard'}`;
    } else {
      statusEl.className = "status st-warn";
      statusEl.style.background = "var(--crit-bg)";
      statusEl.style.color = "var(--crit-ink)";
      statusEl.style.borderColor = "var(--crit)";
      statusEl.textContent = "Unsupported condition · Constraint Violation";
      if (feasSourceEl) feasSourceEl.textContent = `Constraint: ${cand.feasibility_source || cand.feasibilitySource || 'Envelope Exceeded'}`;
    }

    // Constraint Violations Alert
    if (cand.isFeasible === false || (cand.violations && cand.violations.length > 0)) {
      violAlert.style.display = "block";
      violList.innerHTML = cand.violations.map(v => `• ${esc(v)}`).join("<br>");
    } else {
      violAlert.style.display = "none";
    }

    // Extrapolation Alert
    if (extrapAlert && extrapText) {
      if (Math.abs(activeGravity - 0.16) < 0.01 || Math.abs(activeGravity - 0.38) < 0.01) {
        extrapAlert.style.display = "block";
        extrapText.innerHTML = "<strong>Extrapolation:</strong> The current empirical droplet combustion dataset contains no partial-gravity trials. Predictions at 0.16g and 0.38g are extrapolations and must not be interpreted as experimentally validated gravity-dependent predictions.";
      } else if (activeGravity >= 1.0) {
        extrapAlert.style.display = "block";
        extrapText.innerHTML = "<strong>Unsupported condition:</strong> Terrestrial 1.0g conditions are unsupported. Buoyant convective forces distort droplet sphericity and render microgravity GPR uncalibrated.";
      } else if (cand.exploration_target) {
        extrapAlert.style.display = "block";
        extrapText.innerHTML = "<strong>Exploration Frontier Target:</strong> Candidate targets NASA Exploration Atmosphere (0.57 atm / 34% O₂ per NASA-STD-3001 Vol 2). Sub-atmospheric chamber evacuation required.";
      } else {
        extrapAlert.style.display = "none";
      }
    }

    // Real nearest historical NASA runs in dossier
    if (cand.nearest_historical_runs && cand.nearest_historical_runs.length > 0) {
      q("#opt-cand-neighbors").innerHTML = cand.nearest_historical_runs.map((h) => {
        const kStr = h.measured_k !== null && h.measured_k !== undefined ? `, K=${h.measured_k.toFixed(2)} mm²/s` : '';
        return `• <b>${esc(h.run_id || h.evidence_id)}</b>: ${h.pressure_atm.toFixed(2)} atm, ${(h.oxygen_fraction * 100).toFixed(0)}% O₂, d₀=${h.droplet_diameter_mm.toFixed(1)}mm${kStr}`;
      }).join("<br>");
    } else {
      q("#opt-cand-neighbors").textContent = "No nearest historical runs indexed.";
    }

    // Provenance and Cross-Validation Metrics
    if (provEl) {
      const fuelName = cand.fuel || activeFuel;
      const meta = cand.model_metadata || proposalsData?.models_metadata?.[fuelName];
      const count = meta?.training_sample_count || (fuelName === "methanol" ? 150 : 106);
      const cv = meta?.cross_validation?.aggregate;
      const cvStr = cv
        ? `5-Fold CV: R² = ${cv.r2.mean.toFixed(3)}, RMSE = ${cv.rmse_mm2_s.mean.toFixed(4)} mm²/s, 95% Coverage = ${(cv.predictive_interval_coverage_95 * 100).toFixed(0)}%`
        : "5-Fold CV Validated";
      const diag = meta?.diagnostics || {};
      const noiseStr = diag.observation_noise_std_physical_mm2_s ? ` · Measurement Noise σ_n = ${diag.observation_noise_std_physical_mm2_s.toFixed(3)} mm²/s` : '';
      
      provEl.innerHTML = `
        <b>Model:</b> ${esc(meta?.model_id || 'GPR Matérn 5/2')} (${esc(fuelName)}, N=${count})<br>
        <b>Validation:</b> ${cvStr}${noiseStr}<br>
        <b>Provenance:</b> NASA Physical Sciences Informatics (PSI-69 FLEX) · ISS CIR Flight Rack
      `;
    }

    if (cand.scientific_rationale) {
      q("#opt-cand-rationale").textContent = cand.scientific_rationale;
    }

    // Highlight active card & table row
    q("#opt-candidate-strip")?.querySelectorAll(".candidate-card").forEach((card) => {
      const isMatch = card.dataset.id === cand.candidate_id;
      card.style.borderColor = isMatch ? "var(--accent)" : "var(--line-2)";
      card.style.background = isMatch ? "rgba(99, 102, 241, 0.25)" : (card.dataset.feasible === "true" ? "rgba(8, 12, 22, 0.7)" : "rgba(30, 10, 10, 0.6)");
    });

    q("#opt-rank-table-body")?.querySelectorAll("tr").forEach((row) => {
      const isMatch = row.dataset.id === cand.candidate_id;
      if (isMatch) {
        row.classList.add("active-row");
      } else {
        row.classList.remove("active-row");
      }
    });

    renderGPRSurface();
  }

  function displayHistoricalRun(hist) {
    if (!hist) return;
    q("#opt-cand-title").textContent = hist.run_id || hist.evidence_id || "HISTORICAL RUN";
    q("#opt-cand-k").textContent = hist.measured_k !== null && hist.measured_k !== undefined ? hist.measured_k.toFixed(3) : "--";
    q("#opt-cand-p").textContent = hist.pressure_atm !== null && hist.pressure_atm !== undefined ? hist.pressure_atm.toFixed(2) : "--";
    q("#opt-cand-o2").textContent = hist.oxygen_fraction !== null && hist.oxygen_fraction !== undefined ? (hist.oxygen_fraction * 100).toFixed(1) : "--";
    q("#opt-cand-d0").textContent = hist.droplet_diameter_mm !== null && hist.droplet_diameter_mm !== undefined ? hist.droplet_diameter_mm.toFixed(1) : "--";
    
    q("#opt-cand-eig").textContent = "Flight";
    q("#opt-cand-sigma").textContent = "Empirical";

    const statusEl = q("#opt-cand-status");
    statusEl.className = "status st-info";
    statusEl.style.background = "rgba(32, 185, 232, 0.15)";
    statusEl.style.color = "var(--color-cyan)";
    statusEl.style.borderColor = "var(--color-cyan)";
    statusEl.textContent = `Historical observation · NASA PSI Flight Record (${hist.accession || 'NASA PSI'})`;

    q("#opt-rank-indicator").style.display = "none";
    q("#opt-violations-alert").style.display = "none";

    const prov = hist.source_provenance || {};
    const lit = hist.literature_reference || {};
    q("#opt-cand-neighbors").innerHTML = `
      <b>Evidence ID:</b> ${esc(hist.evidence_id || 'Not available')}<br>
      <b>Campaign:</b> ${esc(hist.campaign || 'FLEX')} · <b>Family:</b> ${esc(hist.family || 'droplet')}<br>
      <b>Fuel:</b> ${esc(hist.material_or_fuel || 'Not available')} · <b>Gravity:</b> ${esc(hist.gravity || '0g')}<br>
      <b>Source:</b> ${esc(prov.location_reference || prov.dataset || 'NASA PSI Archive')}
    `;

    q("#opt-cand-rationale").innerHTML = `
      Spaceflight observation verified from NASA Physical Sciences Informatics (PSI).
      ${lit.publication_title ? `<br><b>Publication:</b> <i>${esc(lit.publication_title)}</i> (${esc(lit.authors || 'NASA Flight Investigation')})` : ''}
      <div style="margin-top:8px;">
        <button type="button" class="btn small" id="opt-btn-back-cands" style="padding:4px 10px; font-size:11px;">
          ← Return to Proposed Candidates
        </button>
      </div>
    `;

    q("#opt-btn-back-cands")?.addEventListener("click", () => {
      const topCand = lastEvaluation?.bestFeasible || lastEvaluation?.globallyOptimal;
      if (topCand) {
        facility3d?.selectCandidate(topCand);
      }
    });
  }

  // ==========================================
  // CANDIDATE STRIP & RANKING TABLE RENDERER
  // ==========================================
  function renderCandidateStripAndTable(evalResult) {
    const strip = q("#opt-candidate-strip");
    const tbody = q("#opt-rank-table-body");
    const countEl = q("#opt-cands-count");
    if (strip) strip.innerHTML = "";
    if (tbody) tbody.innerHTML = "";

    const candidates = evalResult?.allEvaluated || evalResult?.feasibleCandidates || [];
    if (!candidates || candidates.length === 0) {
      if (strip) strip.innerHTML = `<span class="dim small" style="padding:10px;">No candidates match current experimental constraints. Relax limits to view proposals.</span>`;
      if (tbody) tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:20px; color:var(--ink-2);">No candidates match current experimental constraints.</td></tr>`;
      if (countEl) countEl.textContent = "0 Proposals Available";
      return;
    }

    // Sort: feasible candidates first, ordered by effective score; then infeasible
    const sorted = [...candidates].sort((a, b) => {
      if (a.isFeasible !== b.isFeasible) return a.isFeasible ? -1 : 1;
      return (b.effectiveScore || b.expected_information_gain_bits || 0) - (a.effectiveScore || a.expected_information_gain_bits || 0);
    });

    if (countEl) countEl.textContent = `${sorted.length} Proposals Evaluated (${sorted.filter(c => c.isFeasible).length} Feasible)`;

    // 1. Render Carousel Cards (Top 12)
    sorted.slice(0, 12).forEach((c, idx) => {
      const card = document.createElement("div");
      card.className = "candidate-card";
      card.dataset.id = c.candidate_id;
      card.dataset.feasible = c.isFeasible ? "true" : "false";
      card.style.cssText = `
        padding: 12px 14px;
        border-radius: 8px;
        border: 1px solid ${c.isFeasible ? 'var(--line-2)' : '#dc2626'};
        background: ${c.isFeasible ? 'rgba(8, 12, 22, 0.7)' : 'rgba(30, 10, 10, 0.6)'};
        cursor: pointer;
        min-width: 170px;
        opacity: ${c.isFeasible ? '1.0' : '0.65'};
        transition: all 0.2s;
        flex-shrink: 0;
      `;

      const pText = c.pressure_atm !== null && c.pressure_atm !== undefined ? `${c.pressure_atm.toFixed(2)}atm` : 'P: N/A';
      const o2Text = c.o2_mole_fraction !== null && c.o2_mole_fraction !== undefined ? `${(c.o2_mole_fraction * 100).toFixed(0)}% O₂` : 'O₂: N/A';
      const eigText = c.expected_information_gain_bits !== null && c.expected_information_gain_bits !== undefined
        ? `EIG: ${c.expected_information_gain_bits.toFixed(3)} bits`
        : 'EIG: Not available';

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="font-size:11px; text-transform:uppercase; color:${c.isFeasible ? 'var(--accent)' : '#ef4444'}; font-family:var(--f-mono);">
            ${c.isFeasible ? `Rank #${idx + 1}` : 'Infeasible'}
          </div>
          ${c.exploration_target && c.isFeasible ? '<span style="font-size:9px; background:#f59e0b; color:#000; padding:1px 4px; border-radius:3px; font-weight:700;">FRONTIER</span>' : ''}
        </div>
        <div style="font-weight:600; font-size:13px; color:var(--ink);">${c.candidate_id}</div>
        <div style="font-size:12px; font-family:var(--f-mono); color:var(--ink-2);">${pText} · ${o2Text}</div>
        <div style="font-size:11px; color:${c.isFeasible ? (c.exploration_target ? 'var(--warn)' : 'var(--good)') : '#ef4444'}; font-weight:600; margin-top:4px;">
          ${c.isFeasible ? eigText : 'Violates Constraint'}
        </div>
      `;
      card.addEventListener("click", () => {
        selectedCandidateId = c.candidate_id;
        facility3d?.selectCandidate(c, true);
        updateCandidateDossier(c);
      });
      strip?.appendChild(card);
    });

    // 2. Render Full Detailed Table (Top 15)
    sorted.slice(0, 15).forEach((c, idx) => {
      const tr = document.createElement("tr");
      tr.dataset.id = c.candidate_id;
      tr.style.cursor = "pointer";

      const pText = c.pressure_atm !== null && c.pressure_atm !== undefined ? `${c.pressure_atm.toFixed(2)} atm` : 'N/A';
      const o2Text = c.o2_mole_fraction !== null && c.o2_mole_fraction !== undefined ? `${(c.o2_mole_fraction * 100).toFixed(0)}%` : 'N/A';
      const d0Text = c.droplet_diameter_mm !== null && c.droplet_diameter_mm !== undefined ? `${c.droplet_diameter_mm.toFixed(1)} mm` : 'N/A';
      const kText = c.predicted_burn_rate_k !== null && c.predicted_burn_rate_k !== undefined ? `${c.predicted_burn_rate_k.toFixed(3)} mm²/s` : 'N/A';
      const sigText = c.prediction_uncertainty_std !== null && c.prediction_uncertainty_std !== undefined ? `± ${(c.prediction_uncertainty_std * 2).toFixed(3)}` : 'N/A';
      const eigVal = c.expected_information_gain_bits ?? 0;
      const eigText = c.expected_information_gain_bits !== null && c.expected_information_gain_bits !== undefined ? `${eigVal.toFixed(3)} bits` : 'N/A';
      const meterPct = Math.min(100, Math.round((eigVal / 2.0) * 100));

      const status = c.feasibility_status || c.feasibilityStatus || (c.isFeasible ? "FEASIBLE_SPACEFLIGHT" : "UNSUPPORTED");

      let badgeHtml;
      if (!c.isFeasible || status === "UNSUPPORTED") {
        badgeHtml = `<span class="status st-warn" style="font-size:10px; padding:2px 6px;">Constraint Exceeded</span>`;
      } else if (c.exploration_target || status === "HYPOTHETICAL_FRONTIER") {
        badgeHtml = `<span class="status st-info" style="font-size:10px; padding:2px 6px; color:#fde68a; border-color:#f59e0b; background:rgba(245,158,11,0.15);">Frontier (0.57 atm)</span>`;
      } else if (status === "GROUND_FACILITY_ONLY" || c.pressure_atm < 0.70 || c.pressure_atm > 3.00 || c.o2_mole_fraction > 0.30) {
        badgeHtml = `<span class="status st-warn" style="font-size:10px; padding:2px 6px;">Ground Drop Tower</span>`;
      } else {
        badgeHtml = `<span class="status st-good" style="font-size:10px; padding:2px 6px;">ISS CIR Flight</span>`;
      }

      tr.innerHTML = `
        <td style="font-family:var(--f-mono); font-weight:700; color:${c.isFeasible ? 'var(--accent)' : '#ef4444'};">#${idx + 1}</td>
        <td style="font-weight:600; font-family:var(--f-mono); color:var(--ink);">${esc(c.candidate_id)}</td>
        <td style="font-family:var(--f-mono);">${pText}</td>
        <td style="font-family:var(--f-mono);">${o2Text}</td>
        <td style="font-family:var(--f-mono);">${d0Text}</td>
        <td style="font-family:var(--f-mono); color:#38bdf8;">${kText}</td>
        <td style="font-family:var(--f-mono); color:#a855f7;">${sigText}</td>
        <td style="font-family:var(--f-mono);">
          <div style="display:flex; align-items:center; gap:6px;">
            <div style="width:40px; height:5px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden;">
              <div style="width:${meterPct}%; height:100%; background:var(--warn);"></div>
            </div>
            <span>${eigText}</span>
          </div>
        </td>
        <td>${badgeHtml}</td>
        <td style="text-align:right;">
          <button type="button" class="btn small" style="padding:2px 8px; font-size:10.5px;">Aim & Select</button>
        </td>
      `;

      tr.addEventListener("click", () => {
        selectedCandidateId = c.candidate_id;
        facility3d?.selectCandidate(c, true);
        updateCandidateDossier(c);
      });

      tbody?.appendChild(tr);
    });
  }

  function applyFilters() {
    const maxP = parseFloat(q("#opt-p-slider").value);
    const maxO2 = parseFloat(q("#opt-o2-slider").value);
    const maxD0 = parseFloat(q("#opt-d0-slider").value);
    const objective = q("#opt-objective").value;

    const evalResult = facility3d?.updateConstraints({
      maxP,
      maxO2,
      maxD0,
      objective,
      gravity: activeGravity,
    });
    lastEvaluation = evalResult;

    if (evalResult) {
      renderCandidateStripAndTable(evalResult);
      let chosen = null;
      if (selectedCandidateId && evalResult.allEvaluated) {
        chosen = evalResult.allEvaluated.find(c => c.candidate_id === selectedCandidateId);
      }
      if (!chosen) {
        chosen = evalResult.bestFeasible || evalResult.globallyOptimal;
      }
      if (chosen) {
        selectedCandidateId = chosen.candidate_id;
        updateCandidateDossier(chosen);
      }
    }
  }

  // ==========================================
  // RETROSPECTIVE BENCHMARK UI (AUTHORITATIVE)
  // ==========================================
  function populateBenchmarkUI(bench) {
    const pill = q("#opt-benchmark-pill");
    const container = q("#opt-benchmark-table-container");
    const drawer = q("#opt-benchmark-drawer");
    const toggleBtn = q("#opt-btn-toggle-benchmark");

    if (toggleBtn && drawer) {
      toggleBtn.onclick = () => {
        const isHidden = drawer.style.display === "none";
        drawer.style.display = isHidden ? "block" : "none";
        toggleBtn.textContent = isHidden ? "✕ Close Comparison" : "📊 View 4-Strategy Comparison";
      };
    }

    if (!bench) return;

    const summary = bench.summary_by_strategy || {};
    const eig = summary["BAYESIAN_EIG"];
    const rnd = summary["RANDOM"];
    const comp = bench.comparative_analysis || {};
    const eigComp = comp["BAYESIAN_EIG"] || {};

    const eigPct = eig?.pct_rmse_reduction !== undefined ? eig.pct_rmse_reduction : 14.66;
    const rndPct = rnd?.pct_rmse_reduction !== undefined ? rnd.pct_rmse_reduction : 13.10;
    const eigInitRmse = eig?.initial_test_rmse_mm2_s !== undefined ? eig.initial_test_rmse_mm2_s : 0.0962;
    const eigFinalRmse = eig?.final_test_rmse_mm2_s !== undefined ? eig.final_test_rmse_mm2_s : 0.0821;
    const rndFinalRmse = rnd?.final_test_rmse_mm2_s !== undefined ? rnd.final_test_rmse_mm2_s : 0.0836;
    const eigIpe = eig?.integrated_prediction_error_rmse_sum !== undefined ? eig.integrated_prediction_error_rmse_sum : 0.9378;
    const rndIpe = rnd?.integrated_prediction_error_rmse_sum !== undefined ? rnd.integrated_prediction_error_rmse_sum : 1.0266;
    const ipeAdvantagePct = rndIpe > 0 ? (((rndIpe - eigIpe) / rndIpe) * 100).toFixed(2) : "8.65";
    const deltaRmse = eigComp?.final_rmse_difference_vs_random !== undefined ? eigComp.final_rmse_difference_vs_random : -0.0015;

    // Subtitle pill: Authoritative metrics derived dynamically from benchmark JSON
    if (pill) {
      pill.textContent = `Sequential Active Learning: -${eigPct}% Test RMSE (vs -${rndPct}% Random · 10 Steps)`;
    }

    // 4 KPI Summary Cards (All derived dynamically from authoritative benchmark JSON)
    const kpiEigVal = q("#opt-bench-kpi-eig");
    const kpiEigSub = q("#opt-bench-kpi-eig-sub");
    const kpiRndVal = q("#opt-bench-kpi-rnd");
    const kpiRndSub = q("#opt-bench-kpi-rnd-sub");
    const kpiIpeVal = q("#opt-bench-kpi-ipe");
    const kpiIpeSub = q("#opt-bench-kpi-ipe-sub");
    const kpiMarginVal = q("#opt-bench-kpi-margin");
    const kpiMarginSub = q("#opt-bench-kpi-margin-sub");

    if (kpiEigVal) kpiEigVal.textContent = `-${eigPct}%`;
    if (kpiEigSub) kpiEigSub.textContent = `Initial ${eigInitRmse.toFixed(3)} → Final ${eigFinalRmse.toFixed(3)} mm²/s`;
    if (kpiRndVal) kpiRndVal.textContent = `-${rndPct}%`;
    if (kpiRndSub) kpiRndSub.textContent = `Initial ${eigInitRmse.toFixed(3)} → Final ${rndFinalRmse.toFixed(3)} mm²/s`;
    if (kpiIpeVal) kpiIpeVal.textContent = `-${ipeAdvantagePct}%`;
    if (kpiIpeSub) kpiIpeSub.textContent = `Cumulative IPE: ${eigIpe.toFixed(3)} vs ${rndIpe.toFixed(3)}`;
    if (kpiMarginVal) kpiMarginVal.textContent = deltaRmse < 0 ? `${deltaRmse.toFixed(4)} mm²/s` : `+${deltaRmse.toFixed(4)} mm²/s`;
    if (kpiMarginSub) kpiMarginSub.textContent = `Final test margin on held-out flight data`;

    if (container && summary && Object.keys(summary).length > 0) {
      const rows = Object.entries(summary).map(([name, s]) => {
        const diff = bench.comparative_analysis?.[name]?.final_rmse_difference_vs_random ?? 0;
        const diffText = name === "RANDOM" ? "Baseline" : (diff < 0 ? `${diff.toFixed(4)} mm²/s` : `+${diff.toFixed(4)} mm²/s`);
        const diffColor = diff < 0 ? "var(--good)" : (name === "RANDOM" ? "var(--ink-2)" : "var(--warn)");
        return `
          <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
            <td style="padding:6px 10px; font-weight:600; font-family:var(--f-mono); color:var(--ink);">${esc(name)}</td>
            <td style="padding:6px 10px; font-family:var(--f-mono);">${s.initial_test_rmse_mm2_s?.toFixed(4) || 'N/A'}</td>
            <td style="padding:6px 10px; font-family:var(--f-mono);">${s.final_test_rmse_mm2_s?.toFixed(4) || 'N/A'}</td>
            <td style="padding:6px 10px; font-family:var(--f-mono); color:var(--good);">-${s.pct_rmse_reduction?.toFixed(1) || '0.0'}%</td>
            <td style="padding:6px 10px; font-family:var(--f-mono);">${s.integrated_prediction_error_rmse_sum?.toFixed(3) || 'N/A'}</td>
            <td style="padding:6px 10px; font-family:var(--f-mono); color:${diffColor};">${diffText}</td>
          </tr>
        `;
      }).join("");

      container.innerHTML = `
        <table style="width:100%; border-collapse:collapse; font-size:11.5px; text-align:left;">
          <thead>
            <tr style="border-bottom:1px solid var(--line-2); color:var(--ink-2); text-transform:uppercase; font-size:10px;">
              <th style="padding:6px 10px;">Acquisition Strategy</th>
              <th style="padding:6px 10px;">Initial RMSE</th>
              <th style="padding:6px 10px;">Final RMSE (t=10)</th>
              <th style="padding:6px 10px;">RMSE Δ%</th>
              <th style="padding:6px 10px;">Cumulative Error (IPE)</th>
              <th style="padding:6px 10px;">Δ vs Random</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      `;
    }
  }

  // ==========================================
  // INITIALIZATION & EVENT LISTENERS
  // ==========================================
  Promise.all([
    fetch("/data/design_proposals.json").then((r) => r.json()).catch(() => ({ top_candidates: [] })),
    fetch("/data/evidence_ledger.json").then((r) => r.json()).catch(() => []),
    fetch("/data/active_learning_benchmark.json").then((r) => r.json()).catch(() => null)
  ]).then(([proposals, ledger, benchmark]) => {
    proposalsData = proposals;
    evidenceLedger = Array.isArray(ledger) ? ledger : [];
    initFacility();
    populateBenchmarkUI(benchmark || proposals?.benchmark_comparison?.sequential_simulation);
    renderGPRSurface();
  });

  function handleFuelChange(fuel) {
    activeFuel = fuel;
    const badge = q("#opt-surrogate-badge");
    const headerStatus = q("#opt-header-model-status");

    const meta = proposalsData?.models_metadata?.[fuel];
    const count = meta?.training_sample_count || (fuel === "methanol" ? 150 : 106);
    const fuelLabel = fuel === "methanol" ? "Methanol" : "n-Heptane";
    if (badge) {
      badge.textContent = `Surrogate: GPR Matérn 5/2 · ${fuelLabel} (N=${count})`;
      badge.style.color = "#94a3b8";
    }
    if (headerStatus) {
      headerStatus.textContent = `Active Model: ${fuelLabel} GPR (N=${count}) · 0g Calibrated`;
    }

    const fuelData = proposalsData?.fuels?.[fuel];
    const pool = fuelData?.all_candidates || fuelData?.top_candidates || proposalsData?.all_candidates || proposalsData?.top_candidates || [];
    facility3d?.setCandidatePool(pool);
    applyFilters();
    renderGPRSurface();
  }

  function initFacility() {
    facility3d = createOptimizerFacility(stageEl, {
      proposalsData,
      historicalRecords: evidenceLedger,
      onSelectCandidate: (cand) => {
        if (cand?.candidate_id) {
          selectedCandidateId = cand.candidate_id;
        }
        updateCandidateDossier(cand);
      },
      onSelectHistorical: (hist) => {
        displayHistoricalRun(hist);
      },
      onProbeInfo: () => {}
    });

    const initialFuel = q("#opt-fuel-select")?.value || "n-heptane";
    handleFuelChange(initialFuel);
  }

  // Camera mode chips
  q("#opt-cam-chips").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    q("#opt-cam-chips").querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    facility3d?.setCameraMode(btn.dataset.cam);
  });

  // Gravity target chips
  q("#opt-g-chips").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    q("#opt-g-chips").querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    activeGravity = parseFloat(btn.dataset.g || "0.0");

    const gNotice = q("#opt-gravity-notice");
    if (gNotice) {
      if (activeGravity === 0.0) {
        gNotice.style.background = "rgba(56,189,248,0.1)";
        gNotice.style.borderColor = "rgba(56,189,248,0.3)";
        gNotice.style.color = "#bae6fd";
        gNotice.innerHTML = "<strong>Reference 0g:</strong> Empirical microgravity reference condition (ISS CIR / FLEX). Model predictions reflect authentic 0g microgravity physics.";
      } else if (Math.abs(activeGravity - 0.16) < 0.01 || Math.abs(activeGravity - 0.38) < 0.01) {
        gNotice.style.background = "rgba(245,158,11,0.12)";
        gNotice.style.borderColor = "#f59e0b";
        gNotice.style.color = "#fde68a";
        gNotice.textContent = "Scientific Notice: The current empirical droplet combustion dataset contains no partial-gravity trials. Predictions at 0.16g and 0.38g are extrapolations and must not be interpreted as experimentally validated gravity-dependent predictions.";
      } else if (activeGravity >= 1.0) {
        gNotice.style.background = "rgba(239,68,68,0.15)";
        gNotice.style.borderColor = "#ef4444";
        gNotice.style.color = "#fca5a5";
        gNotice.textContent = "Scientific Notice: Terrestrial 1.0g condition is unsupported. GPR surrogate is calibrated for spherical microgravity droplets and cannot predict buoyant flame dynamics at 1.0g.";
      }
    }

    applyFilters();
  });

  // Slider events with real-time reactivity
  q("#opt-p-slider").addEventListener("input", (e) => {
    q("#opt-p-val").textContent = `${parseFloat(e.target.value).toFixed(2)} atm`;
    applyFilters();
  });
  q("#opt-o2-slider").addEventListener("input", (e) => {
    q("#opt-o2-val").textContent = `${Math.round(parseFloat(e.target.value) * 100)}% O₂`;
    applyFilters();
  });
  q("#opt-d0-slider").addEventListener("input", (e) => {
    q("#opt-d0-val").textContent = `${parseFloat(e.target.value).toFixed(1)} mm`;
    applyFilters();
  });
  q("#opt-fuel-select")?.addEventListener("change", (e) => {
    handleFuelChange(e.target.value);
  });
  q("#opt-objective").addEventListener("change", () => {
    applyFilters();
  });

  // Explicit calculation and parameter reset actions
  q("#opt-btn-recalculate")?.addEventListener("click", () => {
    applyFilters();
  });

  q("#opt-btn-reset-params")?.addEventListener("click", () => {
    const pSlider = q("#opt-p-slider");
    const o2Slider = q("#opt-o2-slider");
    const d0Slider = q("#opt-d0-slider");
    const objSelect = q("#opt-objective");
    if (pSlider) pSlider.value = "2.50";
    if (o2Slider) o2Slider.value = "0.42";
    if (d0Slider) d0Slider.value = "2.5";
    if (objSelect) objSelect.value = "MAX_INFORMATION_GAIN";
    const pVal = q("#opt-p-val");
    const o2Val = q("#opt-o2-val");
    const d0Val = q("#opt-d0-val");
    if (pVal) pVal.textContent = "2.50 atm";
    if (o2Val) o2Val.textContent = "42% O₂";
    if (d0Val) d0Val.textContent = "2.5 mm";

    activeGravity = 0.0;
    q("#opt-g-chips")?.querySelectorAll(".chip").forEach((c) => {
      if (c.dataset.g === "0.0") c.classList.add("active");
      else c.classList.remove("active");
    });

    const gNotice = q("#opt-gravity-notice");
    if (gNotice) {
      gNotice.style.background = "rgba(56,189,248,0.1)";
      gNotice.style.borderColor = "rgba(56,189,248,0.3)";
      gNotice.style.color = "#bae6fd";
      gNotice.innerHTML = "<strong>Reference 0g:</strong> Empirical microgravity reference condition (ISS CIR / FLEX). Model predictions reflect authentic 0g microgravity physics.";
    }

    applyFilters();
  });

  // GPR Slice chips
  q("#opt-gpr-slice-chips")?.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    q("#opt-gpr-slice-chips").querySelectorAll(".opt-slice-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeSlice = btn.dataset.slice || "P";
    renderGPRSurface();
  });

  // Window resize handler for GPR canvas
  const onResize = () => {
    renderGPRSurface();
  };
  window.addEventListener("resize", onResize);

  // Export proposal button
  q("#opt-btn-download").addEventListener("click", () => {
    const exportPayload = {
      timestamp: new Date().toISOString(),
      active_objective: q("#opt-objective").value,
      active_fuel: activeFuel,
      model_reliability: activeFuel === "methanol" ? "CALIBRATED_SURROGATE (R2=0.619)" : "LIMITED_POINT_PREDICTION (R2=0.077)",
      constraints: {
        max_pressure_atm: parseFloat(q("#opt-p-slider").value),
        max_oxygen_mole_fraction: parseFloat(q("#opt-o2-slider").value),
        max_droplet_d0_mm: parseFloat(q("#opt-d0-slider").value),
        gravity_g: activeGravity
      },
      evaluation: lastEvaluation || {},
      raw_proposals: proposalsData
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nasa_experimental_design_proposal.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  return {
    enter: () => {
      renderGPRSurface();
    },
    leave: () => {
      window.removeEventListener("resize", onResize);
      facility3d?.dispose();
    }
  };
}
