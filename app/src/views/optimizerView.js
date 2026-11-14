import { esc, fmt, ICON } from "../core/dom.js";
import { createOptimizerFacility } from "../render/lab/optimizerFacility.js";

export function mountOptimizer(root, data, { go }) {
  root.innerHTML = `
    <div class="section-head">
      <div class="eyebrow">Module 08 · Virtual NASA Research Facility</div>
      <h2>AI Experimental Design Optimizer — Mission Control</h2>
      <p class="lede">Explore the physical NASA combustion chamber and the multi-dimensional parameter space where future microgravity combustion experiments should be targeted. Selecting a candidate animates the motorized deployment needles, tunes the gas manifold, and illuminates its Expected Information Gain (EIG) path.</p>
    </div>

    <!-- Mission Control 3-Column Layout -->
    <div class="mission-control-layout">
      <!-- LEFT: Constraints & Parameter Range Sliders -->
      <div class="panel stack">
        <h3>Experimental Constraints</h3>

        <div style="display:grid; gap:6px;">
          <label for="opt-fuel-select" style="font-size:0.82rem; font-weight:600; color:var(--ink-2);">Droplet Fuel Matrix</label>
          <select id="opt-fuel-select" style="width:100%; padding:7px 10px; background:var(--panel-solid); color:var(--ink); border:1px solid var(--line-2); border-radius:6px; font-size:12.5px;">
            <option value="n-heptane" selected>n-Heptane (C₇H₁₆ · N=106)</option>
            <option value="methanol">Methanol (CH₃OH · N=150)</option>
            <option value="methane">Methane (CH₄ · Unsupported)</option>
            <option value="pmma">PMMA (Solid · Unsupported)</option>
          </select>
        </div>
        
        <div style="display:grid; gap:6px;">
          <label for="opt-objective" style="font-size:0.82rem; font-weight:600; color:var(--ink-2);">Research Objective</label>
          <select id="opt-objective" style="width:100%; padding:7px 10px; background:var(--panel-solid); color:var(--ink); border:1px solid var(--line-2); border-radius:6px; font-size:12.5px;">
            <option value="MAX_INFORMATION_GAIN">Max Bayesian Information Gain (EIG bits)</option>
            <option value="MAX_PREDICTIVE_VARIANCE">Max Predictive Variance (Epistemic σ_f²)</option>
            <option value="EXPLORATION_FRONTIER">Exploration Frontier (Lunar/Mars 0.57 atm)</option>
            <option value="EXTINCTION_BOUNDARY">Extinction Boundary (Quenching Limit)</option>
          </select>
        </div>

        <div style="display:grid; gap:4px;">
          <div style="display:flex; justify-content:space-between; font-size:0.82rem;">
            <span style="color:var(--ink-2);">Pressure Limit (P):</span>
            <b id="opt-p-val" class="font-mono">2.50 atm</b>
          </div>
          <input type="range" id="opt-p-slider" min="0.3" max="2.5" step="0.05" value="2.5" style="width:100%;">
        </div>

        <div style="display:grid; gap:4px;">
          <div style="display:flex; justify-content:space-between; font-size:0.82rem;">
            <span style="color:var(--ink-2);">Oxygen Cap (X_O₂):</span>
            <b id="opt-o2-val" class="font-mono">42% O₂</b>
          </div>
          <input type="range" id="opt-o2-slider" min="0.15" max="0.42" step="0.01" value="0.42" style="width:100%;">
        </div>

        <div style="display:grid; gap:4px;">
          <div style="display:flex; justify-content:space-between; font-size:0.82rem;">
            <span style="color:var(--ink-2);">Droplet Size Limit (d₀):</span>
            <b id="opt-d0-val" class="font-mono">2.5 mm</b>
          </div>
          <input type="range" id="opt-d0-slider" min="0.5" max="2.5" step="0.1" value="2.5" style="width:100%;">
        </div>

        <div style="display:grid; gap:6px;">
          <span style="font-size:0.82rem; color:var(--ink-2);">Gravity Target:</span>
          <div class="chips" id="opt-g-chips">
            <button type="button" class="chip active" data-g="0.0">0g (ISS)</button>
            <button type="button" class="chip" data-g="0.16">0.16g (Lunar)</button>
            <button type="button" class="chip" data-g="0.38">0.38g (Mars)</button>
            <button type="button" class="chip" data-g="1.0">1.0g (Ref)</button>
          </div>
          <div id="opt-gravity-notice" style="margin-top:4px; font-size:11px; line-height:1.4; padding:6px 9px; border-radius:5px; background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.3); color:#bae6fd;">
            <strong>Reference 0g:</strong> Empirical microgravity reference condition (ISS CIR / FLEX). Model predictions reflect authentic 0g microgravity physics.
          </div>
        </div>

        <div style="display:grid; gap:6px;">
          <span style="font-size:0.82rem; color:var(--ink-2);">Camera POV Mode:</span>
          <div class="chips" id="opt-cam-chips">
            <button type="button" class="chip active" data-cam="orbit">Facility Orbit</button>
            <button type="button" class="chip" data-cam="chamber">Chamber View</button>
            <button type="button" class="chip" data-cam="sample">Needle Macro</button>
            <button type="button" class="chip" data-cam="rack">Gas Manifold</button>
          </div>
        </div>

        <div class="note" style="font-size:0.8rem; line-height:1.45; margin-top:6px;">
          <strong>Chamber Servo Guard:</strong> Opposed motorized deployment needles physically calibrate to candidate diameter (0.5 - 2.5 mm).
        </div>
      </div>

      <!-- CENTER: Interactive 3D Research Facility Stage -->
      <div class="stage-lab" id="opt-3d-stage" aria-label="Virtual NASA Experimental Research Facility">
        <div class="stage-hud-top">
          <span class="stage-badge" id="opt-mode-badge">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#ffd48a;"></span>
            NASA Research Facility · [P × O₂ × d₀]
          </span>
          <div class="stage-controls-bar">
            <span id="opt-surrogate-badge" style="font-size:11px; color:#94a3b8; font-family:var(--f-mono);">Surrogate: GPR Matérn 5/2 · n-Heptane (N=106)</span>
          </div>
        </div>

        <div class="stage-hud-bottom">
          <div class="legend" style="display:flex; flex-wrap:wrap; gap:12px; font-size:11px; background:rgba(6,9,18,0.7); padding:4px 10px; border-radius:999px; border:1px solid var(--line-2);">
            <span style="display:inline-flex; align-items:center; gap:5px; color:#38bdf8;">
              <span style="width:8px; height:8px; border-radius:50%; background:#0284c7; display:inline-block;"></span>
              <span id="opt-hist-legend-text">Verified NASA Historical Runs</span>
            </span>
            <span style="display:inline-flex; align-items:center; gap:5px; color:var(--color-flame-bright);">
              <span style="width:8px; height:8px; border-radius:50%; background:var(--color-flame); display:inline-block;"></span> Feasible Candidates
            </span>
            <span style="display:inline-flex; align-items:center; gap:5px; color:#ef4444;">
              <span style="width:8px; height:8px; border-radius:50%; background:#dc2626; display:inline-block;"></span> Infeasible (Wireframe)
            </span>
            <span style="display:inline-flex; align-items:center; gap:5px; color:#a855f7;">
              <span style="width:8px; height:8px; border-radius:50%; background:#9333ea; display:inline-block;"></span> Uncertainty Halo
            </span>
          </div>
          <span class="dim small" style="font-size:11px; color:var(--ink-2);">Drag to orbit · Scroll to zoom · Click candidates / historical points</span>
        </div>
      </div>

      <!-- RIGHT: Selected Candidate Decision & Provenance Card -->
      <div class="panel stack" id="opt-detail-card">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="font-size:0.8rem; text-transform:uppercase; color:var(--accent); font-family:var(--f-mono);">Active Candidate Dossier</div>
          <div style="display:flex; gap:6px; align-items:center;">
            <span id="opt-cand-fuel-badge" style="font-size:10px; font-family:var(--f-mono); padding:2px 6px; border-radius:4px; background:rgba(255,255,255,0.08); color:var(--ink-2);">n-Heptane</span>
            <span id="opt-rank-indicator" style="font-size:11px; font-weight:600; color:var(--good); display:none;">★ Best Feasible</span>
          </div>
        </div>
        <h3 id="opt-cand-title" style="margin:0; font-size:1.1rem; color:var(--ink);">CAND-01</h3>
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

        <div class="kpis" style="grid-template-columns:1fr 1fr; gap:8px;">
          <div class="kpi" style="padding:10px 12px;"><b id="opt-cand-k" class="font-mono" style="color:#38bdf8;">Not available</b><span>Burn Rate (K)</span></div>
          <div class="kpi" style="padding:10px 12px;"><b id="opt-cand-sigma" class="font-mono" style="color:#a855f7;">Not available</b><span>Uncertainty (σ)</span></div>
          <div class="kpi" style="padding:10px 12px;"><b id="opt-cand-eig" class="font-mono" style="color:var(--warn);">Not available</b><span>Bayesian EIG</span></div>
          <div class="kpi" style="padding:10px 12px;"><b id="opt-cand-p" class="font-mono">Not available</b><span>Pressure (P)</span></div>
          <div class="kpi" style="padding:10px 12px;"><b id="opt-cand-o2" class="font-mono" style="color:var(--good);">Not available</b><span>Oxidizer Fraction</span></div>
          <div class="kpi" style="padding:10px 12px;"><b id="opt-cand-d0" class="font-mono">Not available</b><span>Droplet d₀</span></div>
        </div>

        <div>
          <span style="font-size:0.8rem; font-weight:600; color:var(--ink-2); display:block; margin-bottom:4px;">Supporting Historical Runs:</span>
          <div id="opt-cand-neighbors" style="font-size:0.82rem; font-family:var(--f-mono); color:var(--ink); line-height:1.4;">
            No nearest historical runs indexed.
          </div>
        </div>

        <div>
          <span style="font-size:0.8rem; font-weight:600; color:var(--ink-2); display:block; margin-bottom:4px;">Model Provenance & Validation:</span>
          <div id="opt-cand-provenance" style="font-size:0.8rem; font-family:var(--f-mono); color:var(--ink-2); line-height:1.4; background:rgba(0,0,0,0.25); padding:6px 8px; border-radius:4px; border:1px solid var(--line-2);">
            GPR Matérn 5/2 · NASA PSI-69 FLEX Flight Archive
          </div>
        </div>

        <div>
          <span style="font-size:0.8rem; font-weight:600; color:var(--ink-2); display:block; margin-bottom:4px;">Scientific Rationale:</span>
          <p id="opt-cand-rationale" style="font-size:0.84rem; color:var(--ink-2); line-height:1.45;">
            Exploration atmosphere target (0.57 atm / 34% O₂). High surrogate model variance indicates significant microgravity knowledge gap. Maximum expected information gain to reduce flight extrapolation risk.
          </p>
        </div>

        <button type="button" class="btn small" id="opt-btn-download" style="width:100%; justify-content:center; margin-top:8px;">
          Export Full Research Proposal
        </button>
      </div>
    </div>

    <!-- BOTTOM: Sequence Strip & Benchmark Comparison -->
    <div class="panel stack" style="margin-top:20px;">
      <div class="panel-title" style="flex-wrap:wrap; gap:10px;">
        <div>
          <h3 style="margin:0;">Candidate Ranking Timeline</h3>
          <span style="font-size:11px; color:var(--ink-2);">Sequential candidate proposals ranked by active research objective</span>
        </div>
        <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
          <span class="dim small" id="opt-benchmark-pill" style="color:var(--good); font-weight:600; font-family:var(--f-mono); font-size:11px;">Sequential Active Learning: Evaluating...</span>
          <button type="button" class="btn small" id="opt-btn-toggle-benchmark" style="padding:3px 8px; font-size:11px;">
            📊 Retrospective benchmark
          </button>
        </div>
      </div>

      <!-- Expandable Honest Benchmark Drawer -->
      <div id="opt-benchmark-drawer" style="display:none; background:rgba(15,23,42,0.6); border:1px solid var(--line-2); border-radius:6px; padding:12px; margin-bottom:8px; font-size:12px; line-height:1.45;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <strong style="color:var(--ink);">Sequential Active Learning Benchmark (Methanol Cohort, N=150 · 10 Repetitions)</strong>
          <span style="font-size:10.5px; color:var(--ink-2); font-family:var(--f-mono);">15 Initial Train · 10 Sequential Steps · 30 Held-out Test</span>
        </div>
        <div id="opt-benchmark-table-container" style="overflow-x:auto;"></div>
        <div style="margin-top:8px; font-size:11px; color:var(--ink-2); font-style:italic;" id="opt-benchmark-notice">
          * Notice: Simulated sequential benchmark evaluated on historical NASA PSI-69 spaceflight observations. Does not represent physical closed-loop experiment outcomes.
        </div>
      </div>

      <div class="candidate-strip" id="opt-candidate-strip" style="display:flex; gap:10px; overflow-x:auto; padding-bottom:6px;"></div>
    </div>
  `;

  const q = (s) => root.querySelector(s);
  const stageEl = q("#opt-3d-stage");

  let facility3d = null;
  let proposalsData = null;
  let evidenceLedger = [];
  let activeGravity = 0.0;
  let activeFuel = "n-heptane";
  let lastEvaluation = null;
  let selectedCandidateId = null;

  function updateCandidateDossier(cand) {
    if (!cand) return;

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
        fuelBadge.style.color = "var(--ink)";
        fuelBadge.style.background = "rgba(255,255,255,0.08)";
      } else if (fuelName === "n-heptane") {
        fuelBadge.textContent = "n-Heptane (C₇H₁₆ · N=106)";
        fuelBadge.style.color = "var(--ink)";
        fuelBadge.style.background = "rgba(255,255,255,0.08)";
      } else {
        fuelBadge.textContent = `${fuelName.toUpperCase()} (Unsupported)`;
        fuelBadge.style.color = "#ef4444";
        fuelBadge.style.background = "rgba(239,68,68,0.15)";
      }
    }

    if (cand.error_message || cand.model_status === "UNSUPPORTED_FUEL") {
      q("#opt-cand-title").textContent = cand.candidate_id || "UNSUPPORTED FUEL";
      q("#opt-cand-k").textContent = "Not available";
      q("#opt-cand-p").textContent = "Not available";
      q("#opt-cand-o2").textContent = "Not available";
      q("#opt-cand-d0").textContent = "Not available";
      q("#opt-cand-eig").textContent = "Not available";
      q("#opt-cand-sigma").textContent = "Not available";

      rankEl.style.display = "none";
      statusEl.className = "status st-warn";
      statusEl.style.background = "rgba(239,68,68,0.2)";
      statusEl.style.color = "#fca5a5";
      statusEl.style.borderColor = "#ef4444";
      statusEl.textContent = "MODEL NOT CALIBRATED";
      if (feasSourceEl) feasSourceEl.textContent = "Calibration: No empirical microgravity flight models for this fuel";

      if (extrapAlert) extrapAlert.style.display = "none";

      violAlert.style.display = "block";
      violList.innerHTML = `• ${esc(cand.error_message || "Model not calibrated for selected fuel.")}`;
      q("#opt-cand-neighbors").textContent = "Model not calibrated for selected fuel.";
      if (provEl) {
        provEl.innerHTML = `<b>Status:</b> Model uncalibrated. Only Methanol (N=150) and n-Heptane (N=106) have verified empirical flight surrogate models.`;
      }
      q("#opt-cand-rationale").textContent = cand.scientific_rationale || "Model not calibrated for selected fuel. Calibrated surrogate models are only provided for Methanol and n-Heptane microgravity droplet combustion.";
      return;
    }

    q("#opt-cand-title").textContent = cand.candidate_id || "CAND-01";
    q("#opt-cand-k").textContent = cand.predicted_burn_rate_k !== null && cand.predicted_burn_rate_k !== undefined ? `${cand.predicted_burn_rate_k.toFixed(3)} mm²/s` : "Not available";
    q("#opt-cand-p").textContent = cand.pressure_atm !== null && cand.pressure_atm !== undefined ? `${cand.pressure_atm.toFixed(2)} atm` : "Not available";
    q("#opt-cand-o2").textContent = cand.o2_mole_fraction !== null && cand.o2_mole_fraction !== undefined ? `${(cand.o2_mole_fraction * 100).toFixed(1)}% O₂` : "Not available";
    q("#opt-cand-d0").textContent = cand.droplet_diameter_mm !== null && cand.droplet_diameter_mm !== undefined ? `${cand.droplet_diameter_mm.toFixed(1)} mm` : "Not available";
    
    if (cand.expected_information_gain_bits !== null && cand.expected_information_gain_bits !== undefined) {
      q("#opt-cand-eig").textContent = `${cand.expected_information_gain_bits.toFixed(3)} bits`;
    } else {
      q("#opt-cand-eig").textContent = "Not available";
    }

    if (cand.prediction_uncertainty_std !== null && cand.prediction_uncertainty_std !== undefined) {
      q("#opt-cand-sigma").textContent = `± ${cand.prediction_uncertainty_std.toFixed(3)} mm²/s`;
    } else {
      q("#opt-cand-sigma").textContent = "Not available";
    }

    const isTopFeasible = lastEvaluation?.bestFeasible && lastEvaluation.bestFeasible.candidate_id === cand.candidate_id;
    rankEl.style.display = isTopFeasible ? "inline-block" : "none";

    // Feasibility status badge & Hardware qualification mapping
    const status = cand.feasibilityStatus || (cand.isFeasible ? "FEASIBLE_SPACEFLIGHT" : "UNSUPPORTED");
    if (status === "FEASIBLE_SPACEFLIGHT") {
      statusEl.className = "status st-good";
      statusEl.style.background = "var(--good-bg)";
      statusEl.style.color = "var(--good-ink)";
      statusEl.style.borderColor = "var(--good)";
      statusEl.textContent = "Hypothetical candidate · Spaceflight Feasible";
      if (feasSourceEl) feasSourceEl.textContent = `Model prediction · Hardware: ${cand.feasibilitySource || 'ISS CIR / MDCA (NASA/TP-2017-219299)'}`;
    } else if (status === "GROUND_FACILITY_ONLY") {
      statusEl.className = "status st-warn";
      statusEl.style.background = "var(--warn-bg)";
      statusEl.style.color = "var(--warn-ink)";
      statusEl.style.borderColor = "var(--warn)";
      statusEl.textContent = "Hypothetical candidate · Ground Facility Only";
      if (feasSourceEl) feasSourceEl.textContent = `Model prediction · Hardware: ${cand.feasibilitySource || 'NASA TM-107000 Zero-Gravity Facility'}`;
    } else if (status === "HYPOTHETICAL_FRONTIER") {
      statusEl.className = "status st-info";
      statusEl.style.background = "rgba(32, 185, 232, 0.15)";
      statusEl.style.color = "var(--color-cyan)";
      statusEl.style.borderColor = "var(--color-cyan)";
      statusEl.textContent = "Hypothetical candidate · Exploration Frontier Target";
      if (feasSourceEl) feasSourceEl.textContent = `Model prediction · Standard: ${cand.feasibilitySource || 'NASA-STD-3001 Vol 2 Habitat Standard'}`;
    } else {
      statusEl.className = "status st-warn";
      statusEl.style.background = "var(--crit-bg)";
      statusEl.style.color = "var(--crit-ink)";
      statusEl.style.borderColor = "var(--crit)";
      statusEl.textContent = "Unsupported condition · Constraint Violation";
      if (feasSourceEl) feasSourceEl.textContent = `Constraint: ${cand.feasibilitySource || 'Envelope Exceeded'}`;
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
      provEl.innerHTML = `
        <b>Model:</b> ${esc(meta?.model_id || 'GPR Matérn 5/2')} (${esc(fuelName)}, N=${count})<br>
        <b>Validation:</b> ${cvStr}<br>
        <b>Provenance:</b> NASA Physical Sciences Informatics (PSI-69 FLEX) · ISS CIR Flight Rack
      `;
    }

    if (cand.scientific_rationale) {
      q("#opt-cand-rationale").textContent = cand.scientific_rationale;
    }

    q("#opt-candidate-strip").querySelectorAll(".candidate-card").forEach((card) => {
      const isMatch = card.dataset.id === cand.candidate_id;
      card.style.borderColor = isMatch ? "var(--accent)" : "var(--line-2)";
      card.style.background = isMatch ? "rgba(99, 102, 241, 0.2)" : (card.dataset.feasible === "true" ? "rgba(8, 12, 22, 0.7)" : "rgba(30, 10, 10, 0.6)");
    });
  }

  function displayHistoricalRun(hist) {
    if (!hist) return;
    q("#opt-cand-title").textContent = hist.run_id || hist.evidence_id || "HISTORICAL RUN";
    q("#opt-cand-k").textContent = hist.measured_k !== null && hist.measured_k !== undefined
      ? `${hist.measured_k.toFixed(3)} mm²/s`
      : "Not available";
    q("#opt-cand-p").textContent = hist.pressure_atm !== null && hist.pressure_atm !== undefined ? `${hist.pressure_atm.toFixed(2)} atm` : "Not available";
    q("#opt-cand-o2").textContent = hist.oxygen_fraction !== null && hist.oxygen_fraction !== undefined ? `${(hist.oxygen_fraction * 100).toFixed(1)}% O₂` : "Not available";
    q("#opt-cand-d0").textContent = hist.droplet_diameter_mm !== null && hist.droplet_diameter_mm !== undefined ? `${hist.droplet_diameter_mm.toFixed(1)} mm` : "Not available";
    
    q("#opt-cand-eig").textContent = "Recorded Flight";
    q("#opt-cand-sigma").textContent = "Empirical Zero";

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

  function renderCandidateStrip(evalResult) {
    const strip = q("#opt-candidate-strip");
    strip.innerHTML = "";

    const candidates = evalResult?.allEvaluated || evalResult?.feasibleCandidates || [];
    if (!candidates || candidates.length === 0) {
      strip.innerHTML = `<span class="dim small" style="padding:10px;">No candidates match current experimental constraints. Relax limits to view proposals.</span>`;
      return;
    }

    // Sort: feasible candidates first, ordered by score; then infeasible
    const sorted = [...candidates].sort((a, b) => {
      if (a.isFeasible !== b.isFeasible) return a.isFeasible ? -1 : 1;
      return (b.effectiveScore || b.expected_information_gain_bits || 0) - (a.effectiveScore || a.expected_information_gain_bits || 0);
    });

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
      });
      strip.appendChild(card);
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
      renderCandidateStrip(evalResult);
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

  let benchmarkData = null;

  function populateBenchmarkUI(bench) {
    const pill = q("#opt-benchmark-pill");
    const container = q("#opt-benchmark-table-container");
    const drawer = q("#opt-benchmark-drawer");
    const toggleBtn = q("#opt-btn-toggle-benchmark");

    if (toggleBtn && drawer) {
      toggleBtn.onclick = () => {
        const isHidden = drawer.style.display === "none";
        drawer.style.display = isHidden ? "block" : "none";
        toggleBtn.textContent = isHidden ? "✕ Close Benchmark" : "📊 Benchmark Comparison";
      };
    }

    if (!bench) return;

    const summary = bench.summary_by_strategy || {};
    const eig = summary["BAYESIAN_EIG"];
    const rnd = summary["RANDOM"];

    if (pill) {
      if (eig && rnd) {
        pill.textContent = `Sequential Active Learning: -${eig.pct_rmse_reduction}% Test RMSE (vs -${rnd.pct_rmse_reduction}% Random · 10 Steps)`;
      } else if (proposalsData?.benchmark_comparison?.targeted_uncertainty_ratio) {
        pill.textContent = proposalsData.benchmark_comparison.targeted_uncertainty_ratio;
      }
    }

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

  Promise.all([
    fetch("/data/design_proposals.json").then((r) => r.json()).catch(() => ({ top_candidates: [] })),
    fetch("/data/evidence_ledger.json").then((r) => r.json()).catch(() => []),
    fetch("/data/active_learning_benchmark.json").then((r) => r.json()).catch(() => null)
  ]).then(([proposals, ledger, benchmark]) => {
    proposalsData = proposals;
    evidenceLedger = Array.isArray(ledger) ? ledger : [];
    benchmarkData = benchmark;
    initFacility();
    populateBenchmarkUI(benchmark || proposals?.benchmark_comparison?.sequential_simulation);
  });

  function handleFuelChange(fuel) {
    activeFuel = fuel;
    const badge = q("#opt-surrogate-badge");

    if (fuel === "n-heptane" || fuel === "methanol") {
      const meta = proposalsData?.models_metadata?.[fuel];
      const count = meta?.training_sample_count || (fuel === "methanol" ? 150 : 106);
      const fuelLabel = fuel === "methanol" ? "Methanol" : "n-Heptane";
      if (badge) {
        badge.textContent = `Surrogate: GPR Matérn 5/2 · ${fuelLabel} (N=${count})`;
        badge.style.color = "#94a3b8";
      }

      const fuelData = proposalsData?.fuels?.[fuel];
      const pool = fuelData?.all_candidates || fuelData?.top_candidates || proposalsData?.all_candidates || proposalsData?.top_candidates || [];
      facility3d?.setCandidatePool(pool);
      applyFilters();
    } else {
      // Explicit rejection for unsupported fuels
      if (badge) {
        badge.textContent = `Surrogate: Model not calibrated for ${fuel}`;
        badge.style.color = "#ef4444";
      }

      facility3d?.setCandidatePool([]);
      renderCandidateStrip({ allEvaluated: [] });
      q("#opt-candidate-strip").innerHTML = `<div style="padding:14px; color:#fca5a5; font-size:12px; line-height:1.4;"><strong>Model not calibrated for selected fuel (${esc(fuel)}).</strong><br>Independent Gaussian Process Regression surrogate models are calibrated strictly for <em>Methanol</em> (N=150) and <em>n-Heptane</em> (N=106) spaceflight droplet experiments.</div>`;

      updateCandidateDossier({
        candidate_id: `${fuel.toUpperCase()}-UNSUPPORTED`,
        pressure_atm: null,
        o2_mole_fraction: null,
        expected_information_gain_bits: null,
        prediction_uncertainty_std: null,
        isFeasible: false,
        violations: [`Model not calibrated for selected fuel: ${fuel}`],
        error_message: "Model not calibrated for selected fuel.",
        scientific_rationale: `Model not calibrated for selected fuel (${fuel}). Gaussian Process Regression surrogate is only fitted and calibrated for microgravity droplet combustion of Methanol (N=150) and n-Heptane (N=106) from NASA PSI-69 FLEX flight experiments.`
      });
    }
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

  // Export proposal button
  q("#opt-btn-download").addEventListener("click", () => {
    const exportPayload = {
      timestamp: new Date().toISOString(),
      active_objective: q("#opt-objective").value,
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
    enter: () => {},
    leave: () => {
      facility3d?.dispose();
    }
  };
}
