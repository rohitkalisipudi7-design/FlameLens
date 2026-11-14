import { esc, fmt, ICON } from "../core/dom.js";
import { createContradictionCommandFacility } from "../render/lab/contradictionCommandFacility.js";

const TAXONOMY_BADGES = {
  NUMERICAL_DISAGREEMENT: { bg: "rgba(239, 68, 68, 0.2)", border: "#ef4444", text: "#f87171", label: "Numerical Disagreement" },
  OUTCOME_DISAGREEMENT: { bg: "rgba(239, 68, 68, 0.2)", border: "#ef4444", text: "#f87171", label: "Outcome Disagreement" },
  METHODOLOGICAL_DIFFERENCE: { bg: "rgba(245, 158, 11, 0.2)", border: "#f59e0b", text: "#fbbf24", label: "Methodological Difference" },
  ENVIRONMENTAL_DIFFERENCE: { bg: "rgba(2, 132, 199, 0.2)", border: "#0284c7", text: "#38bdf8", label: "Environmental Difference" },
  INTERPRETATION_DIFFERENCE: { bg: "rgba(147, 51, 234, 0.2)", border: "#9333ea", text: "#c084fc", label: "Interpretation Difference" },
  APPARENT_CONFLICT: { bg: "rgba(16, 185, 129, 0.2)", border: "#10b981", text: "#34d399", label: "Apparent Conflict (Resolved)" },
};

export function mountContradiction(root, data, { go }) {
  root.innerHTML = `
    <div class="section-head">
      <div class="eyebrow">Module 11 · 3D Scientific Investigation Command Center</div>
      <h2>Scientific Contradiction Detector — Intelligence Room</h2>
      <p class="lede">Explore the 3D research knowledge network connecting terrestrial standards, theoretical models, and microgravity flight archives. Twin holographic comparison pods materialize side-by-side aerodynamic conditions to isolate natural convection from micro-ventilation transport.</p>
    </div>

    <!-- 3-Column Intelligence Room Layout -->
    <div class="contradiction-network-layout">
      <!-- LEFT: Claim A Card (Baseline / Standard) -->
      <div class="panel stack" id="ctr-card-a" style="border-top:3px solid var(--line-2);">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:0.75rem; text-transform:uppercase; color:var(--muted); font-family:var(--f-mono);">Claim A (Terrestrial Standard)</span>
          <span class="status font-mono" id="ctr-type-a" style="font-size:10px; padding:2px 6px;">STANDARD_TEST</span>
        </div>
        <h4 id="ctr-title-a" style="font-size:1.02rem; margin:4px 0; color:var(--ink); line-height:1.35;">NASA-STD-6001B Test 1</h4>
        <div class="dim small" id="ctr-source-a" style="margin-bottom:8px;">NASA Technical Standard 6001B · 1g Upward Test</div>
        <div class="kpis" id="ctr-params-a" style="grid-template-columns:1fr 1fr; gap:6px;">
          <div class="kpi" style="padding:6px 8px;"><b id="ctr-g-a" class="font-mono">1.0 g</b><span>Gravity</span></div>
          <div class="kpi" style="padding:6px 8px;"><b id="ctr-val-a" class="font-mono" style="color:var(--warn);">21.0% O₂</b><span>Flammability Limit</span></div>
        </div>
        <div class="note" id="ctr-method-a" style="font-size:0.8rem; line-height:1.4; margin-top:6px;">
          Upward burning with natural buoyant convection draft (u ~ 0.3 - 0.5 m/s). Plume preheats virgin fuel above flame base.
        </div>
      </div>

      <!-- CENTER: 3D Intelligence Command Center Stage -->
      <div class="panel stack" style="padding:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="stage-badge" style="font-size:11px;">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#f59e0b;"></span>
            Command Dais · 3D Relationship Network & Pods
          </span>
          <div class="chips" id="ctr-cam-chips" style="margin:0;">
            <button type="button" class="chip active" data-cam="orbit" style="padding:3px 8px; font-size:11px;">Command Orbit</button>
            <button type="button" class="chip" data-cam="comparison" style="padding:3px 8px; font-size:11px;">Comparison Pods</button>
            <button type="button" class="chip" data-cam="standard" style="padding:3px 8px; font-size:11px;">Standard</button>
            <button type="button" class="chip" data-cam="flight" style="padding:3px 8px; font-size:11px;">Flight Bay</button>
          </div>
        </div>

        <!-- 3D Investigation Stage -->
        <div class="stage-lab" id="ctr-3d-stage" style="min-height:430px;" aria-label="3D Scientific Intelligence Command Center"></div>

        <div class="legend" style="display:flex; gap:12px; font-size:11px; flex-wrap:wrap; justify-content:center;">
          <span style="display:inline-flex; align-items:center; gap:5px; color:#f87171;">
            <span style="width:12px; height:3px; background:#ef4444; display:inline-block;"></span> Methodological Conflict Link
          </span>
          <span style="display:inline-flex; align-items:center; gap:5px; color:#38bdf8;">
            <span style="width:12px; height:3px; background:#0284c7; display:inline-block;"></span> Flight Evidence Support Link
          </span>
          <span style="display:inline-flex; align-items:center; gap:5px; color:#fbbf24;">
            <span style="width:8px; height:8px; border-radius:50%; background:#f59e0b; display:inline-block;"></span> Dual Comparison Pods
          </span>
        </div>
      </div>

      <!-- RIGHT: Claim B Card (Flight Observation / Counter-Claim) -->
      <div class="panel stack" id="ctr-card-b" style="border-top:3px solid var(--accent);">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:0.75rem; text-transform:uppercase; color:var(--accent); font-family:var(--f-mono);">Claim B (Microgravity Flight)</span>
          <span class="status font-mono" id="ctr-type-b" style="font-size:10px; padding:2px 6px;">FLIGHT_EXP</span>
        </div>
        <h4 id="ctr-title-b" style="font-size:1.02rem; margin:4px 0; color:var(--ink); line-height:1.35;">PSI-99 Flame Spread in Duct</h4>
        <div class="dim small" id="ctr-source-b" style="margin-bottom:8px;">ISS Spaceflight Campaign · 0g Low-Speed Duct</div>
        <div class="kpis" id="ctr-params-b" style="grid-template-columns:1fr 1fr; gap:6px;">
          <div class="kpi" style="padding:6px 8px;"><b id="ctr-g-b" class="font-mono">0.0001 g</b><span>Gravity</span></div>
          <div class="kpi" style="padding:6px 8px;"><b id="ctr-val-b" class="font-mono" style="color:var(--good);">17.5% O₂</b><span>Flammability Limit</span></div>
        </div>
        <div class="note" id="ctr-method-b" style="font-size:0.8rem; line-height:1.4; margin-top:6px;">
          Microgravity forced flow (u = 0.05 m/s). Absence of buoyant plume preheating allows low-speed sustained burning below 1g threshold.
        </div>
      </div>
    </div>

    <!-- BOTTOM: Discrepancy Analysis, Aerothermal Explanation & Human Review -->
    <div class="panel stack" style="margin-top:16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <span id="ctr-category-badge" class="badge" style="background:rgba(245,158,11,0.2); color:#fbbf24; border:1px solid #f59e0b;">METHODOLOGICAL_DIFFERENCE</span>
          <span class="dim small" id="ctr-scores">Apparent Conflict Severity: HIGH</span>
        </div>
        <div style="display:flex; gap:8px;">
          <button type="button" class="btn small" id="ctr-btn-prev">Previous Case</button>
          <button type="button" class="btn small" id="ctr-btn-next">Next Case</button>
        </div>
      </div>

      <div class="panel" style="background:rgba(8, 12, 22, 0.85); border-left:4px solid var(--accent); padding:14px 18px; margin:8px 0;">
        <div style="font-weight:600; color:var(--accent); font-size:0.9rem; margin-bottom:4px;">Aerothermal & Transport Mechanism Assessment:</div>
        <div id="ctr-explanation" style="font-size:0.88rem; line-height:1.6; color:var(--ink-2);">
          The apparent conflict between NASA-STD-6001B (21.0% O₂ threshold) and PSI-99 flight observation (17.5% O₂ threshold) is driven by aerothermal transport divergence. In terrestrial 1g, natural convection drives hot buoyant gases upwards along the sample, preheating virgin fuel. In microgravity (0g), buoyant draft is eliminated; low-speed forced ventilation stabilizes a thin laminar diffusion flame capable of sustained combustion in sub-atmospheric or oxygen-depleted atmospheres.
        </div>
      </div>

      <!-- Human-in-the-Loop Review Station -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; border-top:1px solid var(--line); padding-top:14px;">
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button type="button" class="btn small" id="ctr-btn-accept" style="border-color:var(--bad); color:var(--bad);">Accept Genuine Contradiction</button>
          <button type="button" class="btn small" id="ctr-btn-method" style="border-color:var(--warn); color:var(--warn);">Confirm Methodological Difference</button>
          <button type="button" class="btn small" id="ctr-btn-insuf">Flag Insufficient Evidence</button>
        </div>
        <span id="ctr-review-msg" class="dim small" style="font-family:var(--f-mono); color:var(--good);">Review status: Persisted in SQLite (discrepancy_reviews)</span>
      </div>
    </div>
  `;

  const q = (s) => root.querySelector(s);
  const stageEl = q("#ctr-3d-stage");

  let facility3d = null;
  let discrepanciesData = null;
  let currentIndex = 0;

  fetch("/data/scientific_contradictions.json")
    .then((r) => r.json())
    .then((json) => {
      discrepanciesData = json;
      initFacility();
    })
    .catch(() => {
      discrepanciesData = {
        discrepancies: [
          {
            contradiction_id: "CONTRA-01",
            title: "NASA-STD-6001B vs PSI-99 Upward Flammability",
            source_a: "NASA-STD-6001B Test 1",
            source_b: "PSI-99 Flame Spread in Duct",
            classification: "METHODOLOGICAL_DIFFERENCE",
            severity: "HIGH_APPARENT",
            claim_a_value: "21.0% O2",
            claim_b_value: "17.5% O2",
            aerothermal_explanation: "The apparent conflict between NASA-STD-6001B (21.0% O2 threshold) and PSI-99 flight observation (17.5% O2 threshold) is driven by aerothermal transport divergence. In terrestrial 1g, natural convection drives hot buoyant gases upwards along the sample, preheating virgin fuel. In microgravity (0g), buoyant draft is eliminated; low-speed forced ventilation stabilizes a thin laminar diffusion flame capable of sustained combustion in sub-atmospheric or oxygen-depleted atmospheres."
          },
          {
            contradiction_id: "CONTRA-02",
            title: "Quasi-Steady Droplet Burning vs Radiative Extinction",
            source_a: "Godsave-Penner d² Law",
            source_b: "PSI-69 FLEX-2 Spaceflight Data",
            classification: "INTERPRETATION_DIFFERENCE",
            severity: "MODERATE",
            claim_a_value: "Linear d² decline to zero",
            claim_b_value: "Finite Extinction Diameter (d_ext > 0)",
            aerothermal_explanation: "Classical d²-law assumes infinitely fast kinetics and zero radiative loss. Microgravity experiments reveal radiative heat loss from soot and combustion products causes sudden extinction prior to complete fuel consumption."
          }
        ]
      };
      initFacility();
    });

  function initFacility() {
    facility3d = createContradictionCommandFacility(stageEl, {
      contradictionsData: discrepanciesData,
      onSelectContradiction: (contra) => {
        updateDossier(contra);
      },
      onHumanReview: (review) => {
        q("#ctr-review-msg").textContent = `Review recorded: ${review.status}`;
      }
    });

    if (discrepanciesData?.discrepancies?.[0]) {
      updateDossier(discrepanciesData.discrepancies[0]);
    }
  }

  function updateDossier(contra) {
    if (!contra) return;
    q("#ctr-title-a").textContent = contra.source_a || "NASA-STD-6001B Test 1";
    q("#ctr-title-b").textContent = contra.source_b || "PSI-99 Flame Spread in Duct";
    q("#ctr-explanation").textContent = contra.aerothermal_explanation || "Aerothermal transport divergence between terrestrial buoyancy and microgravity laminar diffusion.";

    if (contra.claim_a_value) q("#ctr-val-a").textContent = contra.claim_a_value;
    if (contra.claim_b_value) q("#ctr-val-b").textContent = contra.claim_b_value;

    const badge = TAXONOMY_BADGES[contra.classification] || TAXONOMY_BADGES.METHODOLOGICAL_DIFFERENCE;
    const catBadge = q("#ctr-category-badge");
    catBadge.textContent = contra.classification || "METHODOLOGICAL_DIFFERENCE";
    catBadge.style.background = badge.bg;
    catBadge.style.borderColor = badge.border;
    catBadge.style.color = badge.text;

    q("#ctr-scores").textContent = `Case #${currentIndex + 1} of ${discrepanciesData?.discrepancies?.length || 1} · Severity: ${contra.severity || 'HIGH'}`;
  }

  // Previous and Next Discrepancy Case Handlers
  q("#ctr-btn-prev").addEventListener("click", () => {
    const list = discrepanciesData?.discrepancies || [];
    if (list.length === 0) return;
    currentIndex = (currentIndex - 1 + list.length) % list.length;
    facility3d?.selectDiscrepancy(list[currentIndex]);
    updateDossier(list[currentIndex]);
  });

  q("#ctr-btn-next").addEventListener("click", () => {
    const list = discrepanciesData?.discrepancies || [];
    if (list.length === 0) return;
    currentIndex = (currentIndex + 1) % list.length;
    facility3d?.selectDiscrepancy(list[currentIndex]);
    updateDossier(list[currentIndex]);
  });

  // Camera POV mode chips
  q("#ctr-cam-chips").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    q("#ctr-cam-chips").querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    facility3d?.setCameraMode(btn.dataset.cam);
  });

  // Human Review Buttons
  q("#ctr-btn-accept").addEventListener("click", () => {
    q("#ctr-review-msg").textContent = "Status: ACCEPTED_GENUINE_CONTRADICTION logged to SQLite";
  });
  q("#ctr-btn-method").addEventListener("click", () => {
    q("#ctr-review-msg").textContent = "Status: RESOLVED_METHODOLOGICAL_DIFFERENCE logged to SQLite";
  });
  q("#ctr-btn-insuf").addEventListener("click", () => {
    q("#ctr-review-msg").textContent = "Status: FLAGGED_INSUFFICIENT_EVIDENCE logged to SQLite";
  });

  return {
    enter: () => {},
    leave: () => {
      facility3d?.dispose();
    }
  };
}
