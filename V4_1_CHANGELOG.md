# Flame in Freefall V4.1 — Changelog

All notable changes during the V4.1 Scientific Intelligence Expansion are documented here.

---

## [4.1.0] - 2026-11-14 — Master V4.1 Release

### Phase 0 — Repository Audit & Architecture Definition
- **Corpus & Environment Verification:**
  - Re-verified 1,872 experiments in `data/clean/experiments_all.csv` and 2,009 rows in `data/olap_experimentos.db`.
  - Discovered 1,930 historical NASA spaceflight combustion video filenames indexed across 13 NASA PSI campaign manifests (`files_manifest.csv`).
  - Confirmed OpenCV 5.0.0 and core scientific stack (NumPy, SciPy, Scikit-Learn, SQLite3) are operational on Python 3.10.
  - Initialized baseline test suite with 17/17 passing tests.
- **Architectural Specification:**
  - Published `V4_1_ARCHITECTURE.md` defining shared data contracts, SQLite relational schemas, and cross-module workflow.

### Phase 1 — Shared Database Infrastructure (`scripts/migrations/v4_1_migration.py`)
- **Relational Schema Migration:**
  - Applied migration `v4.1.0` to `data/olap_experimentos.db`, introducing 10 new relational entities:
    `video_assets`, `video_frames`, `video_measurements`, `video_calibrations`,
    `safety_envelope_results`, `design_candidates`, `optimization_runs`,
    `scientific_claims_v41`, `contradiction_candidates`, `contradiction_reviews`.
  - Preserved existing V4 OLAP cube views (`v_cubo_experimentos_completo`) and fact tables without data destruction.

### Phase 2 — Scientific Safety Envelope (`scripts/safety_envelope_engine.py`)
- **Parameter-Space Evidence Mapping:**
  - Implemented 5 epistemic evidence categories: `EXPERIMENTALLY_SUPPORTED`, `MODEL_SUPPORTED`, `SPARSE_EVIDENCE`, `HIGH_UNCERTAINTY`, `UNSUPPORTED`.
  - Precomputed a 15x15 parameter grid across $P \in [0.4, 3.2]\text{ atm}$ and $X_{\text{O}_2} \in [0.10, 0.45]$.
  - Embedded mandatory scientific and legal guardrail banner: communicates empirical data availability and model applicability, stating explicitly that evidence availability is not fire-safety certification.
  - Exported `app/public/data/safety_envelope.json` and populated SQLite `safety_envelope_results`.

### Phase 3 — AI Experimental Design Optimizer (`scripts/experimental_design_optimizer.py`)
- **Active Learning & Surrogate Modeling:**
  - Built Gaussian Process Regression (GPR) surrogate model using a Matérn 5/2 continuous kernel over $[P, X_{\text{O}_2}, d_0]$.
  - Formulated Expected Information Gain (EIG) based on Shannon entropy reduction $\Delta H = \frac{1}{2}\ln(2\pi e \sigma^2(x))$.
  - Implemented multi-objective prioritization (Information Gain, Exploration Frontier, Extinction Characterization).
  - Benchmarked against uniform random selection baseline (+60.7% frontier high-variance targeting gain).
  - Exported `app/public/data/design_proposals.json` and populated SQLite `optimization_runs` and `design_candidates`.

### Phase 4 — Combustion Video Intelligence (`scripts/combustion_video_intelligence.py`)
- **Computer Vision Extraction:**
  - Developed OpenCV frame segmentation using Otsu thresholding, morphological closing, and contour boundary extraction.
  - Extracted frame-by-frame descriptors: apparent area $A(t)$, equivalent diameter $d_{\text{app}}(t)$, centroid $(\bar{x}, \bar{y})$, circularity $C$, and aspect ratio.
  - Implemented physical calibration guard: uncalibrated frames remain strictly in image-space pixels without artificial conversion to millimeters.
  - Implemented temporal radiative extinction transition detection distinguishing observed flame quenching from camera occlusion and frame cutoff.
  - Synthesized a calibrated reference NASA FLEX droplet video sequence (`app/public/data/videos/psi69_flex_calibration_sample.mp4`) and exported `app/public/data/video_intelligence.json`.

### Phase 5 — Scientific Contradiction Detector (`scripts/scientific_contradiction_detector.py`)
- **Epistemic Discrepancy Classification:**
  - Implemented 6-level conflict taxonomy: `NUMERICAL_DISAGREEMENT`, `OUTCOME_DISAGREEMENT`, `ENVIRONMENTAL_DIFFERENCE`, `METHODOLOGICAL_DIFFERENCE`, `INTERPRETATION_DIFFERENCE`, `APPARENT_CONFLICT`.
  - Analyzed physical cause of apparent discrepancies (e.g. NASA-STD-6001B 1g upward buoyant plume vs Saffire-II 0g concurrent duct draft on silicone fabric).
  - Built human-in-the-loop expert determination interface with reviews logged to SQLite `contradiction_reviews`.
  - Exported `app/public/data/scientific_contradictions.json` and populated SQLite `scientific_claims_v41` and `contradiction_candidates`.

### Phase 6 — Cross-Module Scientific Orchestrator (`scripts/cross_module_orchestrator.py`)
- **End-to-End Scientific Intelligence Workflow:**
  - Coordinated automated cycle: Video Segmentation $\to$ Evidence Ledger Mapping $\to$ Safety Envelope Recalculation $\to$ Contradiction Comparability Assessment $\to$ Experimental Design Optimization.
  - Exported `app/public/data/cross_module_summary.json`.

### Phase 7 & 8 — Frontend Integration & Comprehensive Testing
- **Unified 11-View Interface:**
  - Mounted 4 new views in `app/src/main.js` and `app/index.html`:
    - `08 — Design Optimizer` (`optimizerView.js`)
    - `09 — Safety Envelope` (`safetyEnvelopeView.js`)
    - `10 — Video Intelligence` (`videoIntelligenceView.js`)
    - `11 — Contradiction Detector` (`contradictionView.js`)
  - Verified Vite production build (`npm run build`): 56 modules bundled cleanly in 901ms with zero errors.
- **Automated Pytest Suite (`tests/`):**
  - **41 / 41 tests passing in 21.74s** across all 9 test suites (`test_quality_gate.py`, `test_claim_verification.py`, `test_rag_service.py`, `test_research_gaps.py`, `test_database_migration.py`, `test_safety_envelope.py`, `test_experimental_design.py`, `test_video_intelligence.py`, `test_cross_module_workflow.py`, `test_contradiction_detector.py`).
