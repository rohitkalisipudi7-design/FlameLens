# Flame in Freefall · Web Application

Interactive dashboard for NASA Space Apps 2026 (Challenge #08): Microgravity combustion research powered by empirical NASA PSI, NTRS, and Task Book data.

---

## Quickstart

Requires Node.js 20.19+ (tested with Node 22).

```bash
cd app
npm install        # Install frontend dependencies
npm run dev        # Starts local Vite development server at http://localhost:5173
```

Additional commands:

```bash
npm run build      # Compiles production-ready bundle into dist/
npm run preview    # Serves the compiled production bundle at http://localhost:4173
```

### Data Pipeline Integration

The web application consumes the compiled JSON payload at `app/public/data/dashboard.json`. To recompile the dashboard dataset from newly downloaded or updated PSI tables (run from the project root):

```bash
.venv/Scripts/python scripts/build_dashboard_data.py
```

---

## Architecture & Directory Structure

```
app/
├── index.html                 Application shell: header, view containers, and metadata
├── public/
│   ├── data/dashboard.json    FLEX experimental runs, d²(t) curves, PSI inventory, NTRS & Task Book catalogs
│   └── favicon.svg
└── src/
    ├── main.js                Application bootstrap: loads datasets, initializes views, and starts router
    ├── state.js               Reactive state store: conditions, gravity setting, and active simulation scenario
    ├── styles/                Design system: tokens, base, layout, components, and view-specific styles
    ├── core/                  DOM utilities, SVG helpers, tooltips, lifecycle-aware router, and event bus
    ├── model/
    │   ├── knn.js             k-NN empirical surrogate model + convex hull extrapolation detector
    │   ├── flame.js           d²-law kinematics, flame phase sequencing, and scenario presets
    │   ├── lab.js             3D Laboratory textual metadata: environments, instruments, and points of interest
    │   └── findings.js        Real-time statistical findings derived from the FLEX dataset
    ├── charts/                Scientific visualizations: scatter plots, extinction boundaries, coverage maps, d²-law curves
    ├── render/
    │   ├── flame2d.js         Canvas 2D flame renderer (interactive hero simulator and preview window)
    │   ├── flame3d.js         Three.js 3D Combustion Laboratory: procedural flame, sequence manager, cameras, instruments
    │   └── lab/               chamber.js (CIR chamber + MDCA insert) · environments.js (mission presets)
    │                          textures.js (procedural canvas textures) · kit.js (structural mesh primitives)
    ├── background/space.js    Interactive microgravity background canvas
    ├── ui/                    Parameter control panel, filter chips, and partial-gravity toolbar selector
    └── views/                 Modular view controllers; parts.js orchestrates multi-view tab layouts
```

---

## 3D Combustion Laboratory

The **3D Combustion Laboratory** (Simulator tab) accurately recreates the **Combustion Integrated Rack (CIR)** and **Multi-user Droplet Combustion Apparatus (MDCA)** flight hardware onboard the International Space Station, as documented in `data/psi/PSI-69_FLEX/Presentations`:
- An eight-viewport octagonal combustion chamber.
- Dual deployment fiber needles.
- Opposed hot-wire igniter assemblies.
- Analytical instrument packages (MDCA Color Camera, HiBMS backlit shadowgraphy, LLUV ultraviolet chemiluminescence).

All geometries and surface textures are generated **procedurally at runtime** via Three.js (no external 3D asset downloads or heavy texture maps). The 3D view is designed as an illustrative, interactive simulation rather than a numerical CFD Navier-Stokes solver.

### Key Capabilities

1. **Mission Environments** (`PRESETS[].id` in `flame.js` → `LOOK` and `buildEnv` in `environments.js`):
   - `iss`: US Destiny Module with Combustion Integrated Rack (CIR).
   - `explore`: Lunar orbit exploration habitat.
   - `co2`: Deep-space cabin fire-suppression scenario.
   - `lowo2`: NASA Glenn 2.2-Second Drop Tower test rig.
   - Custom configurations retain the current mission backdrop.
2. **Multi-Scale Orbital Camera**:
   - Seamlessly switch between three physical zoom scales: *Droplet Scale*, *Chamber Scale*, and *Laboratory Scale*.
3. **Flight Instrument Views**:
   - In addition to the free orbit camera, inspect through exact instrument optical axes (`rig.cams` in `chamber.js`):
     - **Color MDCA** (4:3 aspect ratio, white-light macro).
     - **HiBMS** (Backlit shadowgraphy for soot and droplet boundary tracking).
     - **LLUV** (Low-Light Ultraviolet filtering OH* radical chemiluminescence).
   - Includes optical alignment reticles, calibrated scale bars, and digital zoom.
4. **Continuous Partial-Gravity Physics**:
   - Seamless, threshold-free gravity response across microgravity ($0g$), Lunar gravity ($0.16g$), Martian gravity ($0.38g$), and Earth gravity ($1.0g$).
   - GLSL buoyant flame deformation, continuous soot plume deflection, and droplet elongation scale smoothly without discrete step artifacts.
5. **Dynamic Combustion Lifecycle**:
   - Full timeline sequencing: Fiber Deployment $\to$ Spark Ignition $\to$ Hot Blue Flame $\to$ Sooting Envelope $\to$ Radiative Extinction / Cool Flame $\to$ Residual Burnout.
6. **Dual Narrative Modes**:
   - Switch between **"Explained"** (accessible scientific narrative for general audiences) and **"Scientific"** (rigorous engineering telemetry, instantaneous $d(t)^2$ tracking, and combustion rate constants).

---

## Performance & Lifecycle Engineering

- **View Lifecycle Architecture**: Every view implements strict `enter()` and `leave()` hooks. Three.js render loops and physics tick functions execute exclusively when the corresponding view tab is actively displayed.
- **Dynamic Code Splitting**: The Three.js rendering library (~740 KB) is bundled into a separate lazy-loaded chunk, downloaded only when the user first opens the 3D Laboratory. WebGL buffers and contexts are cleanly disposed upon exit.
- **Adaptive Frame Budgeting**: The interactive starfield background renders at a capped 30 fps and pauses entirely when the browser tab is hidden. On lower-spec hardware, the UI automatically transitions to a lightweight mode by disabling CSS backdrop-filter blurs.
- **Accessibility & Motion Compliance**: Fully respects system-level `prefers-reduced-motion` settings by disabling procedural particle motions and transitions.

---

## Empirical Surrogate Model

The client-side exploratory engine includes a fast, localized $k$-Nearest Neighbors surrogate ($k = 7$) trained across 257 NASA FLEX spaceflight runs with complete environmental parameters ($P$, $X_{\text{O}_2}$, $d_0$, fuel type):

- **Leave-One-Out Cross-Validation (LOOCV)**:
  - Burning Rate Constant ($K$): $R^2 = 0.68$, Mean Absolute Error (MAE) = $0.051\text{ mm}^2/\text{s}$.
  - Extinction Prediction Accuracy: $83\%$ (compared to a $69\%$ baseline predicting the majority class).
- **Epistemic Extrapolation Warning**: When user parameters depart from the convex hull of empirical NASA flight observations, the system explicitly flags the prediction as an extrapolation to prevent overconfident conclusions.
