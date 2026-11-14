# Flame in Freefall V4.1 — Architecture & Scientific Design Document

**Project:** NASA Space Apps Challenge 2026 — Flame in Freefall (Reto #08)  
**System Version:** V4.1.0-dev (Scientific Intelligence Expansion)  
**Author:** Flame in Freefall Engineering & Architecture Team  
**Date:** November 2026  

---

## 1. System Overview & Mission

Flame in Freefall V4.1 expands the validated V4 scientific platform into an **active research planning and intelligence ecosystem**. While V4 established retroactive evidence provenance, data quality gates, and hybrid RAG retrieval, V4.1 provides forward-looking decision support:

```
[NASA Combustion Video / PSI Datasets / NTRS Papers / Task Book]
                            │
                            ▼
   ┌────────────────────────────────────────────────────────┐
   │             SHARED SCIENTIFIC DATA CONTRACT            │
   │  (experiment_id, evidence_id, condition_vector, etc.)  │
   └────────────────────────┬───────────────────────────────┘
                            │
       ┌────────────────────┼────────────────────┐
       ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  MODULE C    │     │  MODULE B    │     │  MODULE D    │
│  Combustion  │────▶│  Scientific  │◀───▶│  Scientific  │
│  Video       │     │  Safety      │     │  Contradiction│
│  Intelligence│     │  Envelope    │     │  Detector    │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  MODULE A    │
                     │  Experimental│
                     │  Design      │
                     │  Optimizer   │
                     └──────────────┘
                            │
                            ▼
             [Next-Generation Research Matrix]
```

---

## 2. Shared Scientific Data Contracts

To prevent data silos and maintain referential integrity with V4, all new modules interface through shared entity schemas in SQLite and JSON:

### 2.1 Core Identifiers
- `experiment_id`: Primary empirical run identifier (e.g. `PSI-69:20CAL08`).
- `evidence_id`: SHA-256 derived provenance identifier (e.g. `EVID-5C7F1ED4E37A`).
- `condition_vector`: Normalized physical coordinates `[P_atm, X_O2, X_CO2, X_He, d0_mm, gravity_g]`.
- `qc_status`: Quality Gate status (`VALIDATED`, `WARNING`, `OUTLIER`, etc.).
- `model_version`: Immutable algorithm identifier (e.g. `GP-Matern52-v1`, `KNN-d2-v4.1`).
- `analysis_id`: Unique analytical execution run identifier (`OPT-...`, `ENV-...`, `VID-...`, `CTR-...`).
- `snapshot_id`: Immutable reproducibility snapshot identifier (`SNAP-...`).

### 2.2 Database Migration (`v4_1_migration.py`)
Adds 10 relational entities to `data/olap_experimentos.db`:
1. `video_assets`: Video metadata, duration, frame rate, resolution, investigation mapping.
2. `video_frames`: Extracted sample frames with timestamps and ROI coordinates.
3. `video_measurements`: Frame-level contours, apparent area, diameter, circularity, brightness.
4. `video_calibrations`: Spatial scales (pixels to mm), calibration sources, uncertainty bounds.
5. `safety_envelope_results`: Multi-dimensional parameter space coverage and domain classifications.
6. `design_candidates`: Feasible candidate experiments generated across parameter frontiers.
7. `optimization_runs`: Optimizer runs, acquisition function parameters, and ranking scores.
8. `scientific_claims_v41`: Extracted literature and empirical claims with quantitative boundaries.
9. `contradiction_candidates`: Pairs of claims flagged with potential disagreements.
10. `contradiction_reviews`: Human-in-the-loop audit logs (accepted, rejected, explained).

---

## 3. Module Specifications

### Module A — AI Experimental Design Optimizer
- **Objective:** Propose optimal future microgravity combustion experiments that minimize scientific uncertainty.
- **Algorithms:**
  - **Gaussian Process Regression (GPR):** Matérn 5/2 kernel over continuous state-space $[P, X_{\text{O}_2}, d_0]$.
  - **Expected Information Gain (EIG):** Shannon entropy reduction $\Delta H$ across poorly sampled space.
  - **Expected Improvement (EI):** Target parameter boundary exploration.
  - **Latin Hypercube Sampling (LHS) & Random Baselines:** Benchmark comparators.
- **Output Schema:** Candidate ID, proposed parameters, estimated uncertainty $\sigma(x)$, expected information gain, feasibility classification, and proposed flight testing facility (e.g. NASA Glenn ZGF Drop Tower vs. ISS CIR).

### Module B — Scientific Safety Envelope Generator
- **Objective:** Map parameter regimes into 5 explicit evidence categories without claiming legal fire-safety certification:
  1. `EXPERIMENTALLY_SUPPORTED`: High density of spaceflight experiments ($d_{\min} < 0.6, N \ge 3$).
  2. `MODEL_SUPPORTED`: In-domain empirical model with validated cross-validation error ($R^2 \ge 0.65$).
  3. `SPENSE_EVIDENCE`: Isolated flight trials; qualitative guidance only ($0.6 \le d_{\min} < 1.3$).
  4. `HIGH_UNCERTAINTY`: Parameter frontier with wide confidence intervals ($\sigma > 2\sigma_{\text{nominal}}$).
  5. `UNSUPPORTED`: Completely untested parameter combinations (e.g. sub-atmospheric $P < 0.69\text{ atm}$, $X_{\text{O}_2} + X_{\text{diluent}} > 1.0$).
- **Visuals:** 2D interactive contour heatmaps ($P \times X_{\text{O}_2}$), gravity filter ($0\text{g}, 0.16\text{g}, 0.38\text{g}, 1\text{g}$), and nearest-neighbor distance isosurfaces.

### Module C — Combustion Video Intelligence
- **Objective:** Extract quantitative morphology from NASA combustion video archives into traceable evidence.
- **Pipeline:**
  1. **Frame Ingestion:** Video metadata decoding (FPS, duration, resolution) and temporal sampling.
  2. **Preprocessing:** Grayscale conversion, adaptive background subtraction, Gaussian noise attenuation.
  3. **Segmentation:** Otsu thresholding + adaptive contour extraction + morphological closing.
  4. **Morphology Descriptors:** Apparent projected area $A(t)$, equivalent circular diameter $d_{\text{app}}(t) = 2\sqrt{A/\pi}$, centroid $(\bar{x}, \bar{y})$, circularity $C = 4\pi A / P^2$, and aspect ratio.
  5. **Temporal Event Detection:** Detects candidate extinction events $\frac{dA}{dt} \to 0$ and classifies failure modes (extinction vs. camera occlusion vs. frame cutoff).
  6. **Calibration Guard:** Pixel values are labeled as apparent image-space pixels unless a verified spatial calibration factor ($\text{px}/\text{mm}$) is documented.

### Module D — Scientific Contradiction Detector
- **Objective:** Detect and explain apparent disagreements between terrestrial and spaceflight findings.
- **Classification Taxa:**
  - `NUMERICAL_DISAGREEMENT`: Divergent numerical measurements under identical conditions.
  - `OUTCOME_DISAGREEMENT`: Conflicting phenomena (e.g. self-extinction vs. continuous propagation).
  - `ENVIRONMENTAL_DIFFERENCE`: Discrepancy caused by pressure, oxidizer, or gravity differences.
  - `METHODOLOGICAL_DIFFERENCE`: Upward buoyant spread (1g) vs concurrent low-speed convective draft (0g).
  - `INTERPRETATION_DIFFERENCE`: Differing theoretical models explaining identical data.
- **Human-in-the-Loop Review:** Allows researchers to inspect claims side-by-side, view citations, and record human resolution logs stored separately from algorithm predictions.

---

## 4. Frontend Navigational Architecture

The application interface expands from 7 to **11 coordinated views**:

```
01 — PANORAMA                  (#view-panorama)
02 — DATA & COVERAGE EXPLORER  (#view-datos)
03 — COMPARISON STUDIO         (#view-compare)
04 — EVIDENCE SIMULATOR        (#view-simulador)
05 — 3D COMBUSTION LAB         (#view-lab3d)
06 — RESEARCH AI               (#view-asistente)
07 — EVIDENCE CENTER           (#view-evidence)
08 — DESIGN OPTIMIZER          (#view-optimizer)    [NEW V4.1]
09 — SAFETY ENVELOPE           (#view-envelope)     [NEW V4.1]
10 — VIDEO INTELLIGENCE        (#view-video-lab)    [NEW V4.1]
11 — CONTRADICTION DETECTOR    (#view-contradiction)[NEW V4.1]
```

