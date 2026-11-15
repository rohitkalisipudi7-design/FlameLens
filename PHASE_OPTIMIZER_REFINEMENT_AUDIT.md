# Phase Optimizer Refinement Audit
**FlameLens AI — Design Optimizer Integrity & UX Refinement**
**Phase: Optimizer Mission Control Correction Sprint (Phase 0)**
**Date:** 2026-11-15

---

## 1. Executive Summary & Objective

The objective of this sprint is to correct six identified scientific integrity and user-experience issues in the **AI Experimental Design Optimizer — Mission Control** (`#optimizer`) without altering its established three-column architectural foundation:

1. **Conflicting Active-Learning Benchmark Metrics**: Reconcile discrepancies between subtitle claims (-14.66% / -13.1%) and statistic cards (-51.8% / -28.4%) to a single authoritative source.
2. **Weak n-Heptane GPR Performance & Misleading Presentation**: Transparently disclose n-Heptane's true cross-validation performance ($R^2 = 0.077$), provide clear reliability indicators, and separate exploratory decision support from point-prediction accuracy.
3. **Incorrect Pressure Terminology & Feasibility Rationale**: Fix contradictions where 2.50 atm was mislabeled as "sub-atmospheric", align candidate badges, tables, and rationales to documented NASA hardware envelopes.
4. **3D Chamber Viewport Label & Legend Collisions**: Reorganize the center Three.js chamber into three distinct zones (Zone A: Visualization, Zone B: Telemetry HUD, Zone C: Controls & Legend) to eliminate overlaps.
5. **Right-Side Candidate Dossier KPI Line Wrapping**: Correct oversized numerical formatting that forces values like `0.565 mm²/s` and `± 0.406 (2σ)` onto multiple lines.
6. **Unsupported Fuel Options in Active Selector**: Remove uncalibrated fuels (Methane, PMMA) from the active dropdown selector, placing them in an honest future-support disclosure.

---

## 2. Issue-by-Issue Architectural Audit

### Problem 1: Conflicting Active-Learning Benchmark Metrics

- **Relevant Files:**
  - `scripts/active_learning_benchmark.py`
  - `app/public/data/active_learning_benchmark.json`
  - `app/public/data/design_proposals.json`
  - `app/src/views/optimizerView.js`
- **Existing Behavior:**
  - The subtitle in `#optimizer` dynamically rendered:
    `Sequential Active Learning: -14.66% Test RMSE (vs -13.1% Random · 10 Steps)`.
  - The static KPI cards below displayed:
    `Bayesian EIG: -51.8% Test RMSE` and `Random: -28.4%`.
  - These two sets of numbers coexisted in the exact same view, causing confusion and scientific inconsistency.
- **Root Cause:**
  - The authoritative evaluation in `scripts/active_learning_benchmark.py` runs a 10-repetition simulation on the Methanol spaceflight cohort ($N=150$, initial train $N=15$, sequential steps $T=10$, held-out test $N=30$).
  - In `active_learning_benchmark.json`:
    - Initial Test RMSE: $0.0962\text{ mm}^2/\text{s}$
    - Final Test RMSE (EIG): $0.0821\text{ mm}^2/\text{s}$ $\rightarrow$ **14.66% reduction**
    - Final Test RMSE (Random): $0.0836\text{ mm}^2/\text{s}$ $\rightarrow$ **13.10% reduction**
    - Integrated Prediction Error (IPE): EIG $0.9378$ vs Random $1.0266$ $\rightarrow$ **-8.65% cumulative error reduction**.
    - Final RMSE difference vs. Random: $-0.0015\text{ mm}^2/\text{s}$ (small and statistically non-significant final test margin on held-out flight data).
  - In contrast, the $-51.8\%$ and $-28.4\%$ figures were hardcoded in HTML markup from an earlier exploratory prototype benchmark that had used a different initial batch size.
- **Proposed Correction:**
  - Establish `app/public/data/active_learning_benchmark.json` as the single authoritative source of truth.
  - Dynamically populate all benchmark subtitle and KPI cards from `active_learning_benchmark.json`.
  - Display the authoritative metrics:
    - **Initial-to-Final Test RMSE Reduction**: $-14.7\%$ (EIG) vs $-13.1\%$ (Random).
    - **Cumulative Prediction Error (IPE)**: $-8.65\%$ lower total error than Random ($0.938$ vs $1.027\text{ mm}^2/\text{s}\cdot\text{steps}$).
    - **Final Test Margin**: $-0.0015\text{ mm}^2/\text{s}$ difference vs Random baseline.
  - Transparently disclose that while Bayesian EIG reduces cumulative error faster across sequential steps, the final test RMSE difference on this spaceflight cohort is narrow due to flight measurement scatter.

---

### Problem 2: Weak n-Heptane GPR Performance & Misleading Presentation

- **Relevant Files:**
  - `app/src/views/optimizerView.js`
  - `app/src/render/lab/optimizerFacility.js`
  - `scripts/experimental_design_optimizer.py`
  - `app/public/data/design_proposals.json`
- **Existing Behavior:**
  - When n-Heptane was selected, the GPR header displayed a static badge:
    `5-Fold CV: R² = 0.619 (Methanol) · RMSE = 0.065 mm²/s · 95% Coverage = 90%`.
  - This presented Methanol's favorable metrics while n-Heptane was active.
  - In reality, the n-Heptane model has a 5-fold CV of $R^2 = 0.077$, $\text{RMSE} = 0.138\text{ mm}^2/\text{s}$, and aleatoric observation noise $\sigma_n = 0.1022\text{ mm}^2/\text{s}$.
- **Root Cause:**
  - The GPR header badge had a hardcoded string referencing Methanol's metrics.
  - The candidate dossier provenance element computed CV dynamically, but lacked a prominent reliability badge and did not contextualize why n-Heptane's $R^2$ is low.
- **Proposed Correction:**
  - Dynamically bind the GPR header validation badge to the active fuel's genuine metadata:
    - For n-Heptane: `5-Fold CV: R² = 0.077 · RMSE = 0.138 mm²/s · 95% Coverage = 88.6%`.
    - For Methanol: `5-Fold CV: R² = 0.619 · RMSE = 0.065 mm²/s · 95% Coverage = 90.0%`.
  - Add a dedicated **Model Predictive Reliability Indicator**:
    - **n-Heptane**: `Reliability: Limited Point Prediction (R² = 0.077)`.
      Accompany with explicit disclosure: *"High aleatoric flight noise (σ_n = 0.102 mm²/s from filament suspension losses and video pixel variance) limits point-prediction accuracy. The model functions as uncertainty-aware exploratory decision support; use epistemic uncertainty bounds (±2σ) for experimental targeting rather than isolated point predictions."*
    - **Methanol**: `Reliability: Calibrated Empirical Surrogate (R² = 0.619)`.
  - Clearly distinguish epistemic model uncertainty ($\sigma_f$) from aleatoric measurement noise ($\sigma_n$).

---

### Problem 3: Incorrect Pressure Terminology & Feasibility Rationale

- **Relevant Files:**
  - `scripts/experimental_design_optimizer.py`
  - `app/src/render/lab/optimizerFacility.js`
  - `app/src/views/optimizerView.js`
  - `app/public/data/design_proposals.json`
- **Existing Behavior:**
  - For candidate `OPT-CAND-250-40-20` ($P = 2.50\text{ atm}$, $X_{O_2} = 0.40$):
    - Dossier Status Badge: `Hypothetical candidate · Spaceflight Feasible`
    - Table Badge: `Ground Drop Tower`
    - Scientific Rationale: *"Sub-atmospheric pressure or elevated oxidizer requires specialized ground drop tower evacuation."*
  - $2.50\text{ atm}$ is elevated (hyperbaric) pressure, yet the text called it "sub-atmospheric".
  - The badge and table disagreed because `cand.feasibilityStatus` (camelCase) was checked in the dossier view while the facility object stored `cand.feasibility_status` (snake_case), causing fallback to `cand.isFeasible ? "FEASIBLE_SPACEFLIGHT" : "UNSUPPORTED"`.
- **Root Cause:**
  - In `scripts/experimental_design_optimizer.py` line 482, the condition `elif is_subatmospheric or is_hyperoxic:` assigned a single combined string: `"Sub-atmospheric pressure or elevated oxidizer requires specialized ground drop tower evacuation."`
  - In `app/src/render/lab/optimizerFacility.js`, the feasibility evaluation distinguished reasons internally, but property naming (`feasibility_status` vs `feasibilityStatus`) led to badge desynchronization.
- **Proposed Correction:**
  - Correct terminology strictly:
    - $P < 0.70\text{ atm}$: **Sub-atmospheric pressure** (requires chamber evacuation below CIR flight rack limit).
    - $P > 1.00\text{ atm}$ (e.g. 2.50 atm): **Elevated / hyperbaric pressure**.
    - $X_{O_2} > 0.30$ (e.g. 40%): **Elevated oxidizer concentration** (exceeds CIR 30% flight hardware safety limit per NASA/TP-2017-219299).
  - Fix property access in `optimizerView.js` (`cand.feasibility_status || cand.feasibilityStatus`) to ensure candidate badge, ranking table, dossier status, tooltip, and exported JSON agree 100%.
  - Update `scripts/experimental_design_optimizer.py` and regenerators to write physically accurate rationales.

---

### Problem 4: 3D Chamber Viewport Label & Legend Collisions

- **Relevant Files:**
  - `app/src/render/lab/optimizerFacility.js`
  - `app/src/views/optimizerView.js`
  - `app/src/styles/immersive_labs.css`
- **Existing Behavior:**
  - In-scene 3D mesh panels ("HEPTANE FUEL", "O2 MANIFOLD") and digital transducer screen floated directly inside the 3D scene, intersecting with parameter cage lines during camera rotation.
  - The floating `.legend` chip bar and the `.dim.small` interaction hint (`Drag to orbit · Scroll to zoom`) occupied the same `.stage-hud-bottom` container, overlapping when screen width was constrained.
- **Proposed Correction:**
  - Structure the 3D stage into 3 distinct zones:
    - **Zone A (Chamber Visualization)**: Keep the Three.js combustion chamber, deployment needles, and droplet suspension as the clean primary focal point. Position in-scene gantry labels compactly with depth offsets to prevent clipping into parameter space.
    - **Zone B (Telemetry HUD Overlay)**: Dedicated top overlay bar displaying clean, short metrics: Mode, Fuel, Chamber Pressure, Oxygen fraction, and Gravity status.
    - **Zone C (Bottom Footer & Legend)**: Separate the scientific legend chips and interaction hint into independent lines or distinct corners with `pointer-events: none` on hints and `pointer-events: auto` on interactive controls.
  - Ensure zero collision across Desktop (1440px), Tablet (820px), and Mobile (390px).

---

### Problem 5: Active Candidate Dossier Typography & Line Wrapping

- **Relevant Files:**
  - `app/src/views/optimizerView.js`
  - `app/src/styles/views.css`
  - `app/src/styles/immersive_labs.css`
- **Existing Behavior:**
  - In `#opt-detail-card`, the 2-column KPI grid cards have an effective content width of ~114px.
  - Numerical values with units (`0.565 mm²/s`, `± 0.406 (2σ)`) wrapped into awkward 2-line fragments.
- **Proposed Correction:**
  - Restructure KPI cards to separate numerical value and units into distinct semantic spans:
    `<b class="kpi-val font-mono">0.565<span class="kpi-unit">mm²/s</span></b>`.
  - Apply `font-size: 1.05rem`, `white-space: nowrap`, `overflow: hidden`, `text-overflow: ellipsis`, and `font-variant-numeric: tabular-nums`.
  - Format uncertainty cleanly as `± 0.406` with `<span class="kpi-unit">2σ</span>`.
  - Ensure all 6 KPI cards align neatly and never wrap their unit strings onto a separate line.

---

### Problem 6: Unsupported Fuel Options in Active Selector

- **Relevant Files:**
  - `app/src/views/optimizerView.js`
  - `scripts/experimental_design_optimizer.py`
  - `app/public/data/design_proposals.json`
- **Existing Behavior:**
  - `<select id="opt-fuel-select">` included `Methane (CH₄ · Unsupported)` and `PMMA (Solid · Unsupported)` alongside n-Heptane and Methanol.
  - Selecting them produced an uncalibrated error state in the dossier.
- **Proposed Correction:**
  - Implement **Option B**:
    - Keep `<select id="opt-fuel-select">` strictly populated with verified, trained models:
      1. `n-Heptane (C₇H₁₆ · N=106 · PSI-69 FLEX)`
      2. `Methanol (CH₃OH · N=150 · PSI-69 FLEX)`
    - Add a distinct "Model Registry & Future Chemistries" disclosure box immediately beneath the selector:
      *"GPR surrogate models are calibrated strictly on empirical microgravity droplet flight records (NASA PSI-69 FLEX). Future modules for gaseous methane (CH₄) and solid PMMA are in development; raw historical test records remain available in Evidence Explorer."*
  - This guarantees the user cannot select an uncalibrated fuel in the active optimizer, while preserving full visibility of broader NASA research.

---

## 3. Risks & Safeguards

| Component | Risk | Safeguard |
| :--- | :--- | :--- |
| **Active Learning Benchmark** | Breaking existing downstream tests expecting benchmark keys | Preserve all keys in `active_learning_benchmark.json`; only align UI display to authoritative output |
| **GPR Validation** | Changing GPR training data or hyperparameters | **STRICT RULE**: Do NOT touch GPR training or scikit-learn code; report honest evaluation results |
| **Feasibility Logic** | Breaking flight candidate filtering in other views | Synchronize property naming (`feasibility_status`) and refine physical terminology without deleting enum states |
| **3D Three.js Chamber** | Distorting chamber animations or raycasting | Modify only DOM HUD overlays and in-scene label placements; preserve camera matrix and needle tweens |
| **Pytest Suite** | Test regression across 91 unit tests | Run `pytest` after each phase to guarantee 100% pass rate |

---

*Phase 0 Audit complete. Implementation proceeding through Phases 1–6 in order.*

