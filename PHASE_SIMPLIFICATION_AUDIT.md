# PHASE SIMPLIFICATION AUDIT: ARCHITECTURAL DEPENDENCY & SCOPE REDUCTION ANALYSIS
**FlameLens AI — NASA Space Apps Challenge 2026: Flame in Freefall**  
**Phase 0 Architecture Audit Report**  
**Date:** 2026-11-15  
**Objective:** Systematically audit the codebase to safely remove three secondary modules (**Safety Envelope**, **Video Intelligence**, **Contradiction Detector**) and establish a focused, research-grade platform centered on four primary capabilities.

---

## 1. Executive Summary

FlameLens AI is undergoing a strategic scope reduction to eliminate secondary exploratory modules and consolidate around a clean, research-grade 4-module architecture:
1. **3D Combustion Laboratory** (`#lab3d`)
2. **Evidence Explorer** (`#data` / `#evidence`)
3. **Design Optimizer** (`#optimizer`)
4. **Experiment Comparison Studio** (`#compare`)
*(plus Overview `#panorama` as the central dashboard home)*

This audit identifies every route, view, component, script, stylesheet, dataset, and test associated with the three target modules:
- **Module 1: Safety Envelope** (`#envelope`, alias `safety`)
- **Module 2: Video Intelligence** (`#video-lab`, alias `video`)
- **Module 3: Contradiction Detector** (`#contradiction`, alias `contradiccion`)

---

## 2. Identified Files & Component Inventory

### 2.1. Frontend Views & Render Facilities
| File Path | Description | Classification | Action |
|:---|:---|:---:|:---|
| `app/src/views/safetyEnvelopeView.js` | UI view for multidimensional safety envelope | **A** | Remove from active UI |
| `app/src/render/lab/safetyEnvelopeFacility.js` | Three.js 3D facility for safety envelope | **A** | Remove from active UI |
| `app/src/views/videoIntelligenceView.js` | UI view for video forensic lab & morphology | **A** | Remove from active UI |
| `app/src/render/lab/videoForensicFacility.js` | Three.js 3D facility for video analysis | **A** | Remove from active UI |
| `app/src/views/contradictionView.js` | UI view for scientific contradiction network | **A** | Remove from active UI |
| `app/src/render/lab/contradictionCommandFacility.js` | Three.js 3D facility for contradiction graphs | **A** | Remove from active UI |
| `app/src/views/overview.js` | Unreferenced historical copy of overview | **C** | Remove / archive |

### 2.2. Navigation, Routing & DOM Containers
| File / Location | Component | Classification | Action |
|:---|:---|:---:|:---|
| `app/src/main.js` | `TABS` array (`envelope`, `video-lab`, `contradiction`) | **A** | Remove secondary tabs; restructure to 4 primary + Overview |
| `app/src/main.js` | `ALIASES` mappings (`safety`, `video`, `contradiccion`) | **A** | Gracefully redirect to `#panorama` |
| `app/src/main.js` | `views` dictionary entries and imports | **A** | Remove imports and mounting calls |
| `app/index.html` | `<section id="view-envelope">` | **A** | Remove obsolete container |
| `app/index.html` | `<section id="view-video-lab">` | **A** | Remove obsolete container |
| `app/index.html` | `<section id="view-contradiction">` | **A** | Remove obsolete container |

### 2.3. Stylesheets & UI Components
| File / Location | CSS Classes | Classification | Action |
|:---|:---|:---:|:---|
| `app/src/styles/immersive_labs.css` | `.forensic-video-layout`, `.video-viewport-box` | **A** | Clean up dead CSS |
| `app/src/styles/immersive_labs.css` | `.contradiction-network-layout`, `.graph-canvas-box` | **A** | Clean up dead CSS |
| `app/src/styles/immersive_labs.css` | `.stage-lab`, `.stage-hud-*`, `.stage-controls-bar` | **B** | **PRESERVE** (Shared with 3D Lab & Optimizer) |

### 2.4. Backend Scripts & Standalone Analytical Engines
| File Path | Description | Classification | Action |
|:---|:---|:---:|:---|
| `scripts/safety_envelope_engine.py` | Standalone grid calculation engine | **B** | **PRESERVE** outside active UI (CLI / verification utility) |
| `scripts/combustion_video_intelligence.py` | Video calibration & flame morphology | **B** | **PRESERVE** outside active UI (CLI / verification utility) |
| `scripts/scientific_contradiction_detector.py` | Scientific contradiction analysis | **B** | **PRESERVE** outside active UI (CLI / verification utility) |
| `scripts/cross_module_orchestrator.py` | Cross-module orchestration CLI | **B** | **PRESERVE** outside active UI |

### 2.5. Data Files (`app/public/data/`)
| File Path | Description | Classification | Action |
|:---|:---|:---:|:---|
| `app/public/data/safety_envelope.json` | 225-cell parameter grid | **B** | **PRESERVE** (Consumed by backend test suite) |
| `app/public/data/video_intelligence.json` | Video sample detections | **B** | **PRESERVE** (Consumed by backend test suite) |
| `app/public/data/scientific_contradictions.json` | Candidate contradiction pairs | **B** | **PRESERVE** (Consumed by backend test suite) |
| `app/public/data/cross_module_summary.json` | Cross-module summary | **B** | **PRESERVE** (Consumed by backend test suite) |

### 2.6. Backend Tests (`tests/`)
| File Path | Tested Scope | Classification | Action |
|:---|:---|:---:|:---|
| `tests/test_safety_envelope.py` | Tests backend `SafetyEnvelopeEngine` | **B** | Keep passing |
| `tests/test_video_intelligence.py` | Tests backend `CombustionVideoIntelligence` | **B** | Keep passing |
| `tests/test_contradiction_detector.py` | Tests backend `ScientificContradictionDetector` | **B** | Keep passing |
| `tests/test_cross_module_workflow.py` | Tests backend `CrossModuleOrchestrator` | **B** | Keep passing |
| `tests/test_live_3d_interactivity.py` | Tests JSON schemas and 3D baseline | **B** | Keep passing |
| `tests/test_scientific_ui_integrity.py` | Tests Optimizer view and facility | **B** | Keep passing |
| `tests/test_active_learning_benchmark.py` | Tests Design Optimizer GPR/EIG | **B** | Keep passing |
| `tests/test_fuel_stratified_gpr.py` | Tests GPR standardization | **B** | Keep passing |
| `tests/test_partial_gravity_visualization.py` | Tests 3D Laboratory physics | **B** | Keep passing |

---

## 3. Dependency Map

```
[ Active Application Entry (main.js) ]
       │
       ├──► Overview (panorama.js) ─────────► Dual Flame Hero (dualFlameHero.js)
       ├──► 3D Laboratory (flame3dView.js) ──► Three.js Engine (flame3d.js, chamber.js)
       ├──► Evidence Explorer (parts.js) ───► FLEX Charts (explorer.js)
       │                                 ├──► Run by Run (experiments.js)
       │                                 └──► Evidence Ledger (evidenceLedgerView.js)
       ├──► Design Optimizer (optimizerView.js) ──► GPR Facility (optimizerFacility.js)
       └──► Comparison Studio (compare.js) ──────► Comparison Model (compare.js)

[ Secondary Modules Being Removed from Active UI ]
       ├── [x] Safety Envelope (safetyEnvelopeView.js -> safetyEnvelopeFacility.js)
       ├── [x] Video Intelligence (videoIntelligenceView.js -> videoForensicFacility.js)
       └── [x] Contradiction Detector (contradictionView.js -> contradictionCommandFacility.js)

[ Shared Scientific Infrastructure — MANDATORY TO PRESERVE ]
       ├── kit.js (Three.js chamber geometry, materials, SciFi frames)
       ├── chamber.js (CIR chamber, burner, igniter meshes)
       ├── flame3d.js (Partial gravity interpolation 0g - 1g, d² law)
       ├── optimizerFacility.js (GPR raycasting, candidate pool, feasibility)
       ├── compare.js (Model deltas, comparability assessment)
       ├── evidence_ledger.json (1,872 verified NASA flight records)
       └── design_proposals.json (Fuel-specific GPR candidates & EIG)
```

---

## 4. Component Classification Summary

- **Class A (Exclusively used by module being removed):**
  - `app/src/views/safetyEnvelopeView.js`
  - `app/src/render/lab/safetyEnvelopeFacility.js`
  - `app/src/views/videoIntelligenceView.js`
  - `app/src/render/lab/videoForensicFacility.js`
  - `app/src/views/contradictionView.js`
  - `app/src/render/lab/contradictionCommandFacility.js`
  - DOM containers `#view-envelope`, `#view-video-lab`, `#view-contradiction` in `app/index.html`
  - Dead CSS classes `.forensic-video-layout`, `.video-viewport-box`, `.contradiction-network-layout`, `.graph-canvas-box` in `app/src/styles/immersive_labs.css`
  - Routing entries in `app/src/main.js`

- **Class B (Shared with retained modules or backend test suite):**
  - `app/src/render/lab/kit.js` (Used by 3D Lab and Optimizer)
  - `app/src/render/lab/chamber.js` (Used by 3D Lab)
  - `app/src/render/lab/textures.js` (Used by 3D Lab)
  - `scripts/safety_envelope_engine.py`, `combustion_video_intelligence.py`, `scientific_contradiction_detector.py`, `cross_module_orchestrator.py` (Retained as standalone Python research engines outside the active UI)
  - `app/public/data/safety_envelope.json`, `video_intelligence.json`, `scientific_contradictions.json`, `cross_module_summary.json` (Retained for backend test suite integrity)

- **Class C (Unused or obsolete):**
  - `app/src/views/overview.js` (Orphaned duplicate of `panorama.js`)

- **Class D (Unclear — investigated):**
  - None. All dependencies are strictly mapped and accounted for.

---

## 5. Removal Risks & Mitigation Strategy

1. **Risk: Broken Routes or Bookmark Failures**
   - *Mitigation:* In `app/src/main.js`, configure `ALIASES` so that `#envelope`, `#safety`, `#video-lab`, `#video`, `#contradiction`, and `#contradiccion` gracefully redirect to `#panorama` (Overview). No blank page or broken error occurs.
2. **Risk: Regression in Retained 3D Facilities**
   - *Mitigation:* Do not touch `kit.js`, `chamber.js`, `flame3d.js`, or `optimizerFacility.js`. Verified that neither `flame3d.js` nor `optimizerFacility.js` imports any of the three removed facilities.
3. **Risk: Backend Test Suite Breakage**
   - *Mitigation:* Preserve the backend Python engines (`scripts/*.py`) and their pre-computed JSON datasets in `app/public/data/`. All 91 pytest tests will continue passing seamlessly.
4. **Risk: Overview Page Disconnect**
   - *Mitigation:* Update `app/src/views/panorama.js` Section 3 ("Platform Capabilities") from 3 cards to 4 cards, explicitly highlighting **Comparison Studio** alongside **3D Laboratory**, **Evidence Explorer**, and **Design Optimizer**.

---

## 6. Proposed Action Plan

1. **Phase 1 — Remove User-Facing Modules:**
   - Remove `envelope`, `video-lab`, `contradiction` from `TABS` and `views` in `app/src/main.js`.
   - Add graceful redirect aliases in `ALIASES`.
   - Remove `<section id="view-envelope">`, `<section id="view-video-lab">`, and `<section id="view-contradiction">` from `app/index.html`.
   - Remove Class A files: `safetyEnvelopeView.js`, `safetyEnvelopeFacility.js`, `videoIntelligenceView.js`, `videoForensicFacility.js`, `contradictionView.js`, `contradictionCommandFacility.js`, and `overview.js`.
   - Remove obsolete CSS from `app/src/styles/immersive_labs.css`.

2. **Phase 2 — Restructure Product Identity:**
   - Configure `TABS` in `app/src/main.js` to showcase:
     - `Overview` (`panorama`)
     - `3D Laboratory` (`lab3d`)
     - `Evidence Explorer` (`data`)
     - `Design Optimizer` (`optimizer`)
     - `Comparison Studio` (`compare`)
   - Update `app/src/views/panorama.js` to present the 4 primary capabilities.
   - Update product tagline and positioning: *"FlameLens AI — Microgravity Combustion Research & Experimental Design Platform"*.

3. **Phase 3 — Protect Scientific Infrastructure:**
   - Verify GPR hyperparameters, dataset ledger, 3D gravity interpolation, and comparison workflow remain untouched.

4. **Phase 4 — Application Cleanup:**
   - Verify build passes cleanly with zero warnings or dead imports.

5. **Phase 5 — Testing & Regression Validation:**
   - Run backend test suite (`pytest`) -> 91 tests must pass.
   - Run frontend production build (`npm run build`).
   - Run Selenium headless validation across Desktop, Tablet, and Mobile.

6. **Phase 6 — Completion Report:**
   - Produce `PHASE_SIMPLIFICATION_COMPLETION_REPORT.md`.

