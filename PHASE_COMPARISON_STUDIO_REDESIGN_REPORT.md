# PHASE COMPARISON STUDIO: RESEARCH-GRADE UI/UX TRANSFORMATION REPORT
**Module 03 · Scientific Intelligence Engine: Experiment Comparison Studio (`#compare`)**  
**NASA Space Apps Challenge 2026 — Flame in Freefall**  
**Status:** COMPLETE & EMPIRICALLY VERIFIED (0 Console Errors · Vite Build Passed in 908ms)

---

## 1. Executive Summary & Design Vision

The **Experiment Comparison Studio** has been transformed from a basic side-by-side parameter inspector into a research-grade scientific workspace. Grounded in the core design principle:

> **"Visualize first. Explain second. Provide detailed evidence third."**

The interface adheres to the FlameLens AI visual identity:
- **Atmosphere & Space Backgrounds:** Deep Space Navy (`#030811`, `#07111F`)
- **Panel Elevation:** Matte Laboratory Panels (`#101C2B`, `#162538`) with hairline borders (`rgba(38, 56, 75, 0.7)`)
- **Dual Visual Identity:**
  - **Experiment A (Baseline):** Electric Cyan (`#20B9E8`)
  - **Experiment B (Comparison Target):** Flame Orange (`#FF791F`)
- **Typography:** Fira Code for all numerical parameters, units, and accession IDs; Space Grotesk / Inter for titles and scientific narratives.

The entire experience is organized into **six sequential research sections**, connected by a sticky workflow navigation bar that provides smooth anchor scrolling and clear cognitive progression for spaceflight researchers and competition judges.

---

## 2. Six Sequential Research Sections Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│ TOP WORKFLOW NAVIGATION: 01 Study · 02 Compat · 03 Conds (PRIORITY) · │
│                          04 Outcomes · 05 Uncertainty · 06 Findings · REF
└────────────────────────────────────────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ SECTION 01: STUDY DEFINITION & SELECTION                                │
│ • Benchmark Presets (4 empirical pairs: Heptane/Methanol, CO2 Quench,   │
│   Cross-Regime Droplet vs Gas Flame, Liquid Droplet vs Solid Spread)    │
│ • Side-by-side Study Cards (Test ID, Campaign, Accession, Fuel, DOI)   │
└────────────────────────────────────────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ SECTION 02: SCIENTIFIC COMPARABILITY ASSESSMENT                        │
│ • Rule-based Classification: [COMPARABLE / QUALIFIED / LIMITED / NOT]  │
│ • Explainable scientific summary rationale                             │
│ • 3-Column Alignment Matrix: Matching (✓), Differing (≠), Missing (—)  │
│ • Methodological Discrepancy Warnings (buoyancy, soot, diluents)       │
└────────────────────────────────────────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ SECTION 03: EXPERIMENTAL CONDITIONS COMPARISON (PRIMARY VISUAL FEATURE) │
│ • Dual Experiment Banners with VS Divider                              │
│ • 10 Aligned Comparison Rows with Cyan/Orange Visual Progress Meters:   │
│   01 Identity · 02 Family · 03 Fuel · 04 Gravity (0g vs 1g badges) ·   │
│   05 Pressure · 06 Oxygen · 07 CO2 · 08 Helium · 09 d0 · 10 Flow/Date   │
│ • Scientific domain bounds, parities, and deltas                       │
└────────────────────────────────────────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ SECTION 04: MEASURED OUTCOMES & KINETICS                               │
│ • Chart A: Burning Rate Constant (K) with signed ΔK and % change       │
│ • Chart B: Droplet Diameter Evolution d²(t) vs t Interactive SVG Plot  │
│   (Hover crosshairs, terminal markers, analytical d² disclosure)       │
│ • Chart C: Extinction Characteristics (d_ext, ratio d_ext/d0, mode)    │
│ • Chart D: Quantitative Delta Summary KPIs (ΔP, ΔO2, ΔK, ΔQ)           │
└────────────────────────────────────────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ SECTION 05: UNCERTAINTY, COMPLETENESS & SCIENTIFIC PROVENANCE          │
│ • Data Completeness (% of 12 critical physical fields populated)       │
│ • Scientific Quality Score (/100) with validation status               │
│ • Single Flight Trial vs Multi-Run Statistical Pooling Disclosure       │
│ • NASA PSI Accession Provenance & Peer Publication DOI links           │
└────────────────────────────────────────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ SECTION 06: RESEARCH INTERPRETATION & FINDINGS                         │
│ • 5 Structured Subsections:                                            │
│   A. Experimental Variations · B. Kinetic Divergence ·                 │
│   C. Evidence Citations · D. Limitations · E. Future Research Vectors   │
└────────────────────────────────────────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ TECHNICAL REFERENCE: ALIGNED PARAMETER MATRIX & EXPORT                 │
│ • Full tabular matrix with all categories, units, and methodology notes │
│ • Reproducible Data Export: JSON and CSV download buttons              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Component Deep-Dive

### 3.1. Sticky Workflow Navigation Bar
- **Location:** Pinned sticky header below the application topbar (`position: sticky; top: 10px; z-index: 50;`).
- **Features:**
  - Glassmorphic backdrop blur (`rgba(10, 20, 32, 0.94)`, `backdrop-filter: blur(14px)`).
  - 7 sequential research step buttons with step numbers (`01` through `06` plus `REF`).
  - Highlighting priority tag on **03 Conditions** (`PRIORITY` pill in Flame Orange).
  - Smooth anchor scrolling to any section upon click.

### 3.2. Section 01 — Study Definition & Experiment Selection
- **Benchmark Research Presets:**
  1. `Heptane vs Methanol Droplets (FLEX)` (`PSI-69:20CAL08` vs `PSI-69:20CAL13`): Contrasts soot-forming hydrocarbon with clean alcohol in 0g.
  2. `CO₂ Extinguisher Quench vs Air Baseline` (`PSI-69:20CAL08` vs `PSI-69:256F002`): Evaluates 40% CO₂ dilution against standard ISS cabin atmosphere.
  3. `Droplet vs Gaseous Jet Diffusion (Cross-Regime)` (`PSI-69:20CAL08` vs `PSI-10:19115A1`): Demonstrates cross-regime physical guardrails and methodology discrepancy handling.
  4. `Liquid Droplet vs Solid Material Spread` (`PSI-69:20CAL08` vs `PSI-26:1`): Contrasts spherical droplet diffusion with solid surface flame propagation.
- **Side-by-Side Study Cards:**
  - Distinct Cyan (`#20B9E8`) top border for Baseline A; Flame Orange (`#FF791F`) for Target B.
  - Prominent Test ID and physical family badge.
  - Official NASA Physical Sciences Informatics accession number (`PSI-69`, `PSI-10`, `PSI-26`).
  - Direct peer-reviewed publication citations with external DOI links (e.g. `https://doi.org/10.1080/13647830.2024.2326830`).

### 3.3. Section 02 — Scientific Comparability Assessment
- **Deterministic Rule-Based Classification:**
  - `✓ COMPARABLE`: Same physical family, 0g freefall parity, identical fuel chemistry.
  - `⚠️ COMPARABLE WITH QUALIFICATIONS`: Same family, but variations in fuel chemistry or diluents (e.g., CO₂ quench).
  - `⚡ LIMITED COMPARABILITY`: Gravitational shifts (0g vs 1g) introducing strong buoyant convection ($Gr \gg 1$) vs pure diffusion ($Gr \approx 0$).
  - `🛑 NOT DIRECTLY COMPARABLE`: Physical family mismatch (e.g. droplet vs gas flame or solid spread).
- **Condition-Alignment Matrix:**
  - **Matching Conditions:** Green indicators with parameter counts and values.
  - **Differing Conditions:** Orange indicators displaying side-by-side transition ($A \to B$) and quantitative delta.
  - **Missing / Unrecorded:** Neutral indicators showing parameters not captured in the flight telemetry.
- **Methodology Warnings Box:**
  - Specific warnings categorized as `CRITICAL`, `HIGH`, or `MEDIUM` explaining fluid dynamic and thermophysical differences.

### 3.4. Section 03 — Priority Visualization: Experimental Conditions Comparison
- **Visual Design:** Full-width analytical stage featuring Cyan (`#20B9E8`) and Orange (`#FF791F`) identification cards connected by a centered `VS` badge.
- **10 Aligned Comparison Rows:**
  1. `01 · IDENTITY & CAMPAIGN`: Flight accession, campaign, test ID.
  2. `02 · PHYSICAL FAMILY`: Droplet spherical diffusion vs surface boundary regression.
  3. `03 · FUEL / MATERIAL`: Alkane vs alcohol chemistry, soot propensities.
  4. `04 · GRAVITATIONAL REGIME`: Prominent orbital freefall badge (`🛰️ 0g Microgravity`) vs terrestrial badge (`🌍 1g Terrestrial`).
  5. `05 · AMBIENT PRESSURE`: 0–3.0 atm visual meter + exact numeric readings.
  6. `06 · OXYGEN CONCENTRATION`: 0–50% mole fraction meter ($X_{\text{O}_2}$) + exact percentage.
  7. `07 · CO₂ CONCENTRATION`: 0–70% diluent suppressant meter ($X_{\text{CO}_2}$) + exact percentage.
  8. `08 · HELIUM CONCENTRATION`: 0–50% conductive diluent meter ($X_{\text{He}}$) + exact percentage.
  9. `09 · INITIAL DIAMETER (d₀)`: 0–5.0 mm droplet size meter + exact millimeter readings.
  10. `10 · OTHER TEST CONDITIONS`: Convective flow speed and observed termination modes.
- **Parity & Delta Badges:** Automatic calculation of $\Delta$ and percentage change for all numeric rows.
- **Footnote:** Explicitly clarifying that matching environmental parameters represent aligned boundary conditions, not identical kinetic outcomes.

### 3.5. Section 04 — Measured Outcome Comparison & Kinetics
- **Chart A — Burning Rate Constant ($K$):**
  - Paired horizontal progress bars comparing $K_A$ vs $K_B$ ($\text{mm}^2/\text{s}$).
  - Delta badge displaying signed $\Delta K$ and percentage change.
- **Chart B — Droplet Diameter Evolution $d^2(t)$ vs $t$ (Interactive SVG):**
  - Vector SVG plotting analytical $d^2$-law trajectories:
    $$d^2(t) = d_0^2 - K \cdot t$$
  - Cyan trajectory for Experiment A; Orange trajectory for Experiment B.
  - Terminal markers displaying extinction diameter $d_{\text{ext}}$ and duration $t_b$.
  - Interactive mousemove crosshair with floating tooltip displaying real-time $(t, d^2, d)$ calculations.
  - **Explicit Scientific Disclosure:** Disclosing that frame-by-frame digitizer time-series are modeled from empirical flight constants $(d_0, K, t_b, d_{\text{ext}})$ archived in the NASA PSI repository.
  - Fallback message for non-droplet physical regimes.
- **Chart C — Extinction Characteristics:**
  - Extinction diameter $d_{\text{ext}}$ comparison (mm).
  - Extinction ratio $d_{\text{ext}} / d_0$ (%) showing remaining droplet fraction at flame quench.
  - Observed termination mode badge (`Total Burnout`, `Radiative Extinction`).
- **Chart D — Quantitative Delta Summary KPIs:**
  - Preserved 4 KPI cards: Pressure Delta ($\Delta P$), Oxygen Delta ($\Delta O_2$), Burning Rate Delta ($\Delta K$), and Quality Score Delta ($\Delta Q$).

### 3.6. Section 05 — Uncertainty, Completeness & Scientific Provenance
- **Data Completeness Indicator:** Calculates the percentage of 12 critical physical parameters populated in each experiment (with visual progress meters).
- **Scientific Quality Score:** Displays validation score (/100) and certification badge (`VALIDATED`).
- **Empirical Measurement Uncertainty Disclosure:**
  - Discloses that measurements represent single flight execution runs aboard the ISS Microgravity Science Glovebox (MSG).
  - Quantifies optical camera frame-rate and edge detection limits ($\pm 5\%$ on $d_0$, $\pm 7\%$ on $K$).
  - Explains that differences reflect sensor resolution rather than ensemble statistical averaging.
- **Dataset Provenance & Literature Citations:**
  - NASA PSI accession reference, source CSV filename and exact line number, and clickable publication DOI hyperlinks.

### 3.7. Section 06 — Research Interpretation & Findings
- **Structured Findings Grid:**
  - **A. Experimental Boundary Variations:** Synthesizes the atmospheric, diluent, and pressure differences.
  - **B. Observed Kinetic Differences:** Explains the burning rate $K$ shift and flame lifetime.
  - **C. Peer Evidence Citations:** Cites Glenn Research Center archives and peer-reviewed journals.
  - **D. Methodological Limitations:** Discloses 14–80 $\mu\text{m}$ SiC support fiber heat conduction losses and chamber radiative confinement.
  - **E. Recommended Future Research Directions:** Recommends free-floating untethered droplet deployment and intermediate cool-flame radical sampling.

### 3.8. Technical Reference & Data Export
- Preserves the full **Aligned Parameter Matrix Table** with all 16 standardized physical fields, group headers, and delta values.
- Preserves **Export JSON** and **Export CSV** download buttons.

---

## 4. Verification & Automated Test Results

Automated headless Selenium validation was executed via `scripts/validate_compare_studio_full.py` using Python 3.10 and ChromeDriver on localhost:5174.

### Test Matrix Results

| Test Item | Expected Result | Measured Result | Status |
|:---|:---|:---|:---:|
| **Console Errors** | 0 Severe Console Errors | `0` | **PASS** |
| **Vite Production Build** | Zero build or lint errors | `✓ built in 908ms` | **PASS** |
| **Section 01 Presence** | `#cmp-sec-01` present | `true` | **PASS** |
| **Section 02 Presence** | `#cmp-sec-02` present | `true` | **PASS** |
| **Section 03 Presence** | `#cmp-sec-03` present | `true` | **PASS** |
| **Section 04 Presence** | `#cmp-sec-04` present | `true` | **PASS** |
| **Section 05 Presence** | `#cmp-sec-05` present | `true` | **PASS** |
| **Section 06 Presence** | `#cmp-sec-06` present | `true` | **PASS** |
| **Technical Matrix Presence**| `#cmp-sec-tech` present | `true` | **PASS** |
| **Workflow Navigation** | 7 navigation buttons | `7` | **PASS** |
| **Benchmark Presets** | 4 empirical pairs | `4` | **PASS** |
| **Study Definition Cards** | 2 side-by-side cards | `2` | **PASS** |
| **Conditions Rows** | 10 priority rows | `10` | **PASS** |
| **Interactive $d^2(t)$ SVG** | `#cmp-d2-svg` present | `true` | **PASS** |
| **KPI Summary Cards** | 4 KPI delta cards | `4` | **PASS** |
| **Uncertainty Cards** | 4 quality/provenance cards | `4` | **PASS** |
| **Research Finding Cards** | 5 structured findings | `5` | **PASS** |
| **Matrix Table Rows** | 16 parameter rows | `16` | **PASS** |
| **Preset 1 (Heptane/Methanol)** | Classified with qualifications | `⚠️ COMPARABLE WITH QUALIFICATIONS` | **PASS** |
| **Preset 2 (CO₂ Quench)** | Classified with qualifications | `⚠️ COMPARABLE WITH QUALIFICATIONS` | **PASS** |
| **Preset 3 (Cross-Regime)** | Flags physical mismatch | `🛑 NOT DIRECTLY COMPARABLE` | **PASS** |

---

## 5. Visual Artifacts Generated

The following high-resolution screenshots were captured and are accessible in the artifact directory:

1. **Full Desktop Overview (1440×1100):**  
   [compare_studio_full_desktop.png](file:///C:/Users/AKHIL/.gemini/antigravity/brain/10b36273-3caa-404e-9bcf-2e7c90e62262/screenshots/compare_studio_full_desktop.png)
2. **Section 01 & 02 (Study Definition & Comparability):**  
   [compare_sec1_study_desktop.png](file:///C:/Users/AKHIL/.gemini/antigravity/brain/10b36273-3caa-404e-9bcf-2e7c90e62262/screenshots/compare_sec1_study_desktop.png)
3. **Section 03 (Priority Experimental Conditions Visualization):**  
   [compare_sec3_conditions_desktop.png](file:///C:/Users/AKHIL/.gemini/antigravity/brain/10b36273-3caa-404e-9bcf-2e7c90e62262/screenshots/compare_sec3_conditions_desktop.png)
4. **Section 04 (Measured Outcomes & Interactive $d^2(t)$ SVG):**  
   [compare_sec4_outcomes_desktop.png](file:///C:/Users/AKHIL/.gemini/antigravity/brain/10b36273-3caa-404e-9bcf-2e7c90e62262/screenshots/compare_sec4_outcomes_desktop.png)
5. **Section 05 & 06 (Uncertainty, Completeness & Findings):**  
   [compare_sec5_uncertainty_desktop.png](file:///C:/Users/AKHIL/.gemini/antigravity/brain/10b36273-3caa-404e-9bcf-2e7c90e62262/screenshots/compare_sec5_uncertainty_desktop.png)
6. **Cross-Regime Discrepancy Alert State (Preset 3):**  
   [compare_cross_regime_warning_desktop.png](file:///C:/Users/AKHIL/.gemini/antigravity/brain/10b36273-3caa-404e-9bcf-2e7c90e62262/screenshots/compare_cross_regime_warning_desktop.png)
7. **Tablet Viewport (820×1180):**  
   [compare_studio_tablet_full.png](file:///C:/Users/AKHIL/.gemini/antigravity/brain/10b36273-3caa-404e-9bcf-2e7c90e62262/screenshots/compare_studio_tablet_full.png)
8. **Mobile Viewport (390×844):**  
   [compare_studio_mobile_full.png](file:///C:/Users/AKHIL/.gemini/antigravity/brain/10b36273-3caa-404e-9bcf-2e7c90e62262/screenshots/compare_studio_mobile_full.png)

---

## 6. Scope Compliance & Verification

- **Code Modifications Strictly Confined:**
  - Modified: [app/src/views/compare.js](file:///c:/PROJECTS/Flames/NASA-SPACE-APPS-main/app/src/views/compare.js)
  - Modified: [app/src/model/compare.js](file:///c:/PROJECTS/Flames/NASA-SPACE-APPS-main/app/src/model/compare.js)
  - Modified: [app/src/styles/views.css](file:///c:/PROJECTS/Flames/NASA-SPACE-APPS-main/app/src/styles/views.css)
- **Unmodified Modules:**
  - Overview (`#overview`), 3D Laboratory (`#lab3d`), Evidence Explorer (`#evidence`), Design Optimizer (`#optimizer`), Simulation Studio (`#simulator`), and GPR surrogate models were completely untouched.
- **Scientific Integrity Preserved:**
  - Missing empirical data points are displayed honestly as `N/A` rather than assumed zero.
  - Analytical trajectory lines explicitly disclose that frame-by-frame time-series are modeled from NASA PSI empirical constants $(d_0, K, t_b, d_{\text{ext}})$.
  - Single-trial execution is explicitly distinguished from ensemble mean statistics.

