# Flame in Freefall V4 — Changelog

All notable changes to the **Flame in Freefall** platform during the V4 transformation are documented in this file.

---

## [4.0.0] - 2026-11-14 — Master V4 Release

### Phase 1 — Repository Audit & Baseline Verification
- **Verified Empirical Corpus:**
  - Audited 24 NASA PSI research campaigns, 277 NTRS technical papers, and 138 NASA Task Book combustion summaries.
  - Verified 1,872 cleaned test rows across 5 physical families: droplets (361), gas flames (1,129), solids (263), aerosols (119), and sessions (100).
  - Verified 2,009 rows in the SQLite analytical OLAP warehouse (`fact_experimento`).
  - Audited 1,121 physical quality flags spanning 57 distinct data-capture anomaly types.
  - Excluded rows (8 duplicates) are flagged `excluded=True` and preserved alongside raw records without silent data removal.
- **Created Audit Tooling:**
  - Added `scripts/audit_corpus.py` for automated baseline verification against real datasets.
  - Created `V4_IMPLEMENTATION_STATUS.md` and `V4_CHANGELOG.md` to track architectural progress.

### Phase 2 — Scientific Quality Gate & Evidence Ledger
- **Module A: Scientific Quality Gate (`scripts/scientific_quality_gate.py`):**
  - Implemented 10-dimensional physical validation checks: missing values, physical bound constraints, gas fraction summation ($X_{\text{O}_2} + X_{\text{diluent}} \le 1.0$), droplet geometry consistency ($d_{\text{ext}} \le d_0$), source line traceability, and outlier detection.
  - Defined 8 structured quality flags: `VALIDATED`, `WARNING`, `MISSING_DATA`, `UNIT_MISMATCH`, `SOURCE_CONFLICT`, `OUTLIER`, `UNVERIFIED`, and `INVALID_RECORD`.
  - Added dataset-level quality scoring with detailed rule trigger audit logs.
- **Module B: Scientific Evidence Ledger (`scripts/build_evidence_ledger.py`):**
  - Generated `app/public/data/evidence_ledger.json` containing 1,872 traceable evidence units with unique SHA-256 derived `EVID-...` identifiers.
  - Mapped verified source line numbers (e.g. `data/clean/experiments_all.csv#L2`) and investigation citations.
  - Preserved raw measurements alongside normalized physical units with complete transformation histories.
  - Exported `app/public/data/quality_report.json` summarizing verification rates across all 24 NASA campaigns.

### Phase 3 — Scientific Analytics & Comparison Engine
- **Module C: Experiment Comparison Studio (`app/src/model/compare.js`, `app/src/views/compare.js`):**
  - Interactive multi-experiment comparison supporting droplet, solid, gas flame, and aerosol families.
  - Side-by-side parameter delta calculations with unit normalization.
  - Methodology Discrepancy Detector: flags gravity regime mismatches (0g spaceflight vs 1g terrestrial), physical combustion family differences, and fuel property variances.
  - Benchmark comparison presets (e.g. Heptane vs Methanol Droplets, CO₂ Quench vs Air Baseline).
  - Scientific evidence package export in both JSON and CSV formats.
- **Module D: Prediction Validation & Uncertainty Engine (`app/src/model/knn.js`, `app/src/views/simulator.js`):**
  - Implemented in-domain vs. out-of-domain classification based on empirical NASA flight envelopes.
  - Computed standard error of the mean ($SE_K$) and 95% confidence intervals on burning rate $K$.
  - Integrated leave-one-out cross-validation benchmarks ($R^2 = 0.68$, MAE $= 0.051\text{ mm}^2/\text{s}$, RMSE $= 0.076\text{ mm}^2/\text{s}$, extinction accuracy $83.3\%$).
  - Added explicit Exploration Atmosphere Extrapolation Alert for target 0.57 atm / 34% O₂ Lunar/Mars conditions (below FLEX 0.69 atm minimum).
  - Added live reproducibility snapshot recording button directly in the simulator interface.

### Phase 4 — AI Intelligence & Scientific Verification
- **Module E: Hybrid Scientific RAG (`scripts/rag_service.py`, `scripts/rag_api_server.py`):**
  - Built intelligent question classifier (routes between DATA_METRICS, LITERATURE, COMPARISON, and RESEARCH_GAP).
  - Implemented zero-hallucination deterministic SQL execution querying `data/olap_experimentos.db` for quantitative inquiries.
  - Built local offline keyword/centroid IVF retrieval fallback guaranteeing 100% functionality without active AWS credentials.
- **Module F: Scientific Claim Verification (`scripts/claim_verification.py`):**
  - Established 5-level epistemic claim taxonomy: `EXPERIMENTALLY_VERIFIED`, `LITERATURE_SUPPORTED`, `MODEL_PREDICTED`, `CONFLICTING_EVIDENCE`, `INSUFFICIENT_EVIDENCE`.
  - Exported `app/public/data/verified_claims.json` with 6 core benchmark assertions, primary citations, and supporting/contradicting evidence IDs.
  - Seamlessly integrated claim verification cards into the Research AI response view.

### Phase 5 — Research Discovery & Reproducibility
- **Module G: Research Gap to Experiment Recommendation (`scripts/research_gap_engine.py`):**
  - Analyzed empirical parameter space density across $P \times X_{\text{O}_2}$ grid bins.
  - Identified 6 empirical blind spots in NASA historical spaceflight archives.
  - Synthesized structured Proposed Follow-Up Experiments (testing facilities, recommended matrix, scientific rationale, exploratory disclaimers).
  - Exported `app/public/data/research_gaps.json`.
- **Module H: Research Reproducibility Engine (`app/src/model/reproducibility.js`):**
  - Formulated reproducible analytical snapshots with immutable `SNAP-...` hashes, app version `4.0.0`, dataset checksum, exact input queries, output results, and timestamps.
  - Implemented local persistence, snapshot listing, and JSON import/export.

### Phase 6 — Frontend Integration & English Translation
- **7-Module Navigational Architecture:**
  - Configured 7 top-level tabs in `app/src/main.js` and `app/index.html`:
    1. `panorama` (Overview)
    2. `datos` (Data Explorer)
    3. `compare` (Comparison Studio)
    4. `simulador` (Evidence Simulator)
    5. `lab3d` (3D Combustion Lab)
    6. `asistente` (Research AI)
    7. `evidence` (Evidence & Validation Center)
- **Scientific Evidence & Validation Center View (`app/src/views/evidenceLedgerView.js`):**
  - Searchable, paginated table of 1,872 evidence records with slide-in provenance drawer.
  - Quality Gate KPI breakdown and failure categorization.
  - Research Gap matrix and Proposed Follow-Up Experiment browser.
  - Reproducibility Snapshot Manager with import/export capabilities.
- **Complete English Translation:**
  - Translated all UI strings, telemetry legends, data labels, model explanations, and presentation guidelines to English.
  - Verified Vite production build (`npm run build`) bundles cleanly in 841ms.

### Phase 7 — Testing & Verification
- **Automated Pytest Suite (`tests/`):**
  - 17/17 tests passing in 9.24s across `test_quality_gate.py`, `test_claim_verification.py`, `test_rag_service.py`, and `test_research_gaps.py`.
  - Comprehensive coverage of quality gate rules, NaN sanitation, deterministic SQL metrics, RAG question classification, claim verification status, and research gap detection.
