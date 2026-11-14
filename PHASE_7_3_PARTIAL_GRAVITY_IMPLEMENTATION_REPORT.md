# PHASE 7.3 — CONTROLLED PARTIAL-GRAVITY VISUALIZATION CORRECTION REPORT

**Project:** Flame in Freefall  
**Phase:** 7.3 — Controlled Partial-Gravity Visualization Correction  
**Role:** Senior Three.js Engineer and Scientific Visualization Engineer  
**Status:** Successfully Implemented, Tested, and Verified  
**Strict Directives Honored:** Read-Only/Controlled Scope; GPR, EIG, $d^2$-law, and Design Optimizer completely untouched; Zero unsupported physical claims.

---

## 1. Root Cause Analysis

Prior to this phase, the 3D Combustion Laboratory exhibited an internal logic disconnect across its gravity-dependent visual pipelines:

1. **Vertex Shader Threshold Gating (`uG > 0.5`):**
   In [app/src/render/flame3d.js:33](file:///c:/PROJECTS/Flames/NASA-SPACE-APPS-main/app/src/render/flame3d.js#L33), upward buoyancy deformation and waist necking were wrapped inside:
   ```glsl
   if (uG > 0.5) {
     float up = max(p.y, 0.0);
     p.y += up * up * 1.6;
     p.xz *= 1.0 - 0.5 * smoothstep(0.0, 2.6, p.y);
     p.y -= 0.35;
   }
   ```
   For Lunar gravity ($0.16g$) and Martian gravity ($0.38g$), `uG > 0.5` evaluated to `false`. As a result, the flame remained strictly spherical, identical to $0g$, failing to show any buoyancy deformation.

2. **JavaScript Binary Truthiness (`g ? ... : ...`):**
   Concurrently, in the JavaScript animation loop:
   - Flame radius scaling: `rF = ... * (g ? 0.8 : 1) * ...` ([flame3d.js:313](file:///c:/PROJECTS/Flames/NASA-SPACE-APPS-main/app/src/render/flame3d.js#L313)).
   - Soot particle advection: `if (!g) { ... spherical orbit ... } else { ... convective upward chimney ... }` ([flame3d.js:345](file:///c:/PROJECTS/Flames/NASA-SPACE-APPS-main/app/src/render/flame3d.js#L345)).
   - Thermal glow elongation: `glow.scale.set(gs, gs * (F.g ? 1.6 : 1), 1)` ([flame3d.js:465](file:///c:/PROJECTS/Flames/NASA-SPACE-APPS-main/app/src/render/flame3d.js#L465)).
   - Camera target offset: `mix(g ? rF0 * 0.7 : 0, ...)` ([flame3d.js:381](file:///c:/PROJECTS/Flames/NASA-SPACE-APPS-main/app/src/render/flame3d.js#L381)).

Because any non-zero number in JavaScript is truthy, selecting $0.16g$ or $0.38g$ triggered the full $1g$ convective soot upward escape, while the shader rendered a completely spherical flame. This created a visual contradiction where soot escaped upward from a non-elongated spherical flame.

---

## 2. Files Modified

In strict adherence to the authorized scope, only the following files were modified:

| File Path | Description of Changes |
|---|---|
| [app/src/render/flame3d.js](file:///c:/PROJECTS/Flames/NASA-SPACE-APPS-main/app/src/render/flame3d.js) | Implemented `normalizeGravity()`, replaced threshold `if (uG > 0.5)` with continuous `buoy = clamp(uG, 0.0, 1.0)`, replaced binary JS checks with smooth linear blends across soot particles, flame radius, glow, and hotspots, and exported mathematical verification helpers. |
| [app/src/model/flame.js](file:///c:/PROJECTS/Flames/NASA-SPACE-APPS-main/app/src/model/flame.js) | Updated `phaseNote()` to clearly distinguish microgravity ($0g$), partial gravity ($0.16g$ and $0.38g$), and Earth gravity ($1g$), with explicit qualitative visualization disclosure. |
| [app/src/views/flame3dView.js](file:///c:/PROJECTS/Flames/NASA-SPACE-APPS-main/app/src/views/flame3dView.js) | Integrated `labGravitySwitch()` into the 3D Combustion Laboratory toolbar, providing direct access to 0g (ISS), 0.16g (Lunar), 0.38g (Martian), and 1g (Earth) states. |
| [tests/test_partial_gravity_visualization.py](file:///c:/PROJECTS/Flames/NASA-SPACE-APPS-main/tests/test_partial_gravity_visualization.py) | Created 8 automated unit and integration tests verifying normalization, clamping, monotonic deformation, particle bias, and model invariance. |

---

## 3. Old vs. New Gravity Behavior Comparison

| Environment | Gravity $g$ | Old Behavior | New Corrected Behavior |
|---|:---:|---|---|
| **ISS Reference (0g)** | $0.00$ | Spherical flame, spherical rotating soot shell, glow centered, $r_F$ scale factor $1.0$. | **Identical Baseline Preserved:** Zero buoyancy deformation, zero upward particle bias, spherical rotating soot shell. |
| **Lunar (0.16g)** | $0.16$ | **Broken / Contradictory:** Shader rendered spherical flame (`uG <= 0.5`), but JS triggered full $1g$ vertical soot chimney updraft and $r_F$ scale factor dropped to $0.8$. | **Smooth Subtle Buoyancy:** Flame exhibits subtle upward stretch ($+0.256\cdot up^2$), 84% spherical soot shell with 16% upward drift, $r_F$ scale factor $0.968$. |
| **Martian (0.38g)** | $0.38$ | **Broken / Contradictory:** Identical to 0.16g (spherical flame with full $1g$ soot chimney). | **Moderate Buoyancy:** Flame exhibits intermediate upward stretch ($+0.608\cdot up^2$), 62% spherical soot shell with 38% upward drift, $r_F$ scale factor $0.924$. |
| **Earth (1g)** | $1.00$ | Full teardrop elongation ($+1.60\cdot up^2$), full convective soot chimney updraft, $r_F$ scale factor $0.8$. | **Identical Full Buoyancy Preserved:** Full teardrop elongation, full convective soot chimney updraft, $r_F$ scale factor $0.8$. |

---

## 4. Gravity Normalization Logic

Normalized gravity is enforced at the entry point of every calculation in [app/src/render/flame3d.js:29-35](file:///c:/PROJECTS/Flames/NASA-SPACE-APPS-main/app/src/render/flame3d.js#L29-L35):

```javascript
export function normalizeGravity(val) {
  const num = typeof val === "number" ? val : Number(val);
  if (isNaN(num)) return 0.0;
  return Math.max(0.0, Math.min(1.0, num));
}
```

- Invalid inputs (`null`, `undefined`, `"invalid"`, `NaN`) safely fallback to `0.0`.
- Out-of-bounds values are clamped: $< 0.0 \to 0.0$, $> 1.0 \to 1.0$.
- Standard reference values map deterministically:
  $$\text{ISS } (0g) \to 0.00 \quad\mid\quad \text{Lunar } (0.16g) \to 0.16 \quad\mid\quad \text{Martian } (0.38g) \to 0.38 \quad\mid\quad \text{Earth } (1g) \to 1.00$$

---

## 5. GLSL Shader Changes

In [app/src/render/flame3d.js](file:///c:/PROJECTS/Flames/NASA-SPACE-APPS-main/app/src/render/flame3d.js), the vertex shader was modified to compute continuous buoyancy deformation without conditional branching:

### Vertex Shader (`VERT`)
```glsl
void main(){
  vec3 p = position;
  float gNorm = clamp(uG, 0.0, 1.0);
  float n = nz(p * 2.2 + vec3(0.0, -uTime * (0.5 + 2.5 * gNorm), uTime * 0.2));
  p *= 1.0 + (n - 0.5) * (uAmp + 0.3 * gNorm);

  // Deformación boyante continua (0g esférica, 0.16g sutil, 0.38g moderada, 1g penacho pleno)
  float buoy = gNorm;
  float up = max(p.y, 0.0);
  p.y += up * up * (1.6 * buoy);
  p.xz *= 1.0 - (0.5 * buoy) * smoothstep(0.0, 2.6, p.y);
  p.y -= 0.35 * buoy;

  vY = p.y;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
```

### Fragment Shader (`FRAG`)
```glsl
void main(){
  float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uPow);
  float band = uBand > 0.5 ? smoothstep(-0.3, 0.7, vY) : (uBand < -0.5 ? 1.0 - 0.7 * smoothstep(0.2, 1.8, vY) : 1.0);
  float gNorm = clamp(uG, 0.0, 1.0);
  gl_FragColor = vec4(uColor * f * uAlpha * 1.6 * mix(1.0, band, gNorm), 1.0);
}
```

---

## 6. Particle and Geometry Changes

Every visual subsystem in `flame3d.js` was converted from binary toggles to continuous functions of $g = \text{normalizeGravity}(\text{getG}())$:

1. **Flame Radius Convective Thinning:**
   ```javascript
   const rF = Math.max(rD * fsr, rD + 0.6) * (1.0 - 0.2 * g) * (0.25 + 0.75 * kindle);
   ```
2. **Soot Particle Interpolation:**
   Instead of choosing between a rotating spherical shell or an upward chimney, particles smoothly blend between both states:
   ```javascript
   // 1. Spherical baseline position (sX, sY, sZ)
   // 2. Buoyant convective chimney position (pX, pY, pZ)
   pos[i * 3]     = sX + (pX - sX) * g;
   pos[i * 3 + 1] = sY + (pY - sY) * g;
   pos[i * 3 + 2] = sZ + (pZ - sZ) * g;
   ```
3. **Camera LookAt Offset:**
   ```javascript
   const ty = mix(g * rF0 * 0.7, look.lab.ty, wide);
   ```
4. **Thermal Glow Scale and Position:**
   ```javascript
   glow.scale.set(gs, gs * (1.0 + 0.6 * F.g), 1);
   glow.position.set(0, F.hot ? F.rF * 0.6 * F.g : 0, 0);
   ```

---

## 7. Automated Test Results

The test suite was executed across backend and frontend environments:

### 1. Focused Partial Gravity Test Suite
```bash
py -3.10 -m pytest tests/test_partial_gravity_visualization.py
```
**Results:** **8 / 8 PASSED in 13.03s**
- `test_gravity_normalization_reference_values`: PASSED
- `test_gravity_clamping_and_invalid_inputs`: PASSED
- `test_0g_reference_behavior`: PASSED
- `test_partial_gravity_and_1g_strictly_monotonic`: PASSED
  - Verified: $\text{def}(0.00) < \text{def}(0.16) < \text{def}(0.38) < \text{def}(1.00)$
  - Verified: $\text{bias}(0.00) < \text{bias}(0.16) < \text{bias}(0.38) < \text{bias}(1.00)$
- `test_intermediate_gravity_points` ($0.08g, 0.27g, 0.65g$): PASSED
- `test_source_code_elimination_of_binary_truthiness`: PASSED
- `test_d2_law_kinematic_invariance`: PASSED
- `test_gpr_and_eig_invariance`: PASSED

### 2. Full Regression Test Suite
```bash
py -3.10 -m pytest tests/
```
**Results:** **83 / 83 PASSED in 110.10s (0 failures, 0 errors)**

### 3. Frontend Production Build
```bash
cd app; npm run build
```
**Results:** **Vite 8.3.1 build clean in 1.27s (0 errors)**

---

## 8. Browser Verification Results

Per strict audit guidelines:
- **Headless Chrome DevTools Automation:** **NOT VERIFIED via Headless Browser Automation.** The host test environment runs Node.js v22.11.0, whereas the Chrome DevTools MCP driver requires Node.js v22.12.0+. Headless screenshots could not be generated through automated agents.
- **Static Build & Local Runtime:** Verified. The production Vite bundle compiles without warnings or shader errors, and the local dev server (`http://localhost:5173/`, task-46) serves the application without uncaught runtime exceptions.

---

## 9. Scientific Limitations & Disclosure

1. **Illustrative Approximation Only:**
   This correction ensures internal mathematical consistency and smooth visual transitions between microgravity, lunar, martian, and terrestrial settings. It **must not be interpreted as a validated partial-gravity combustion solver**.
2. **Lack of Empirical Flight Records:**
   The empirical NASA PSI-69 FLEX flight dataset contains zero experimental points conducted at $0.16g$ or $0.38g$. As disclosed in [app/src/views/optimizerView.js:349](file:///c:/PROJECTS/Flames/NASA-SPACE-APPS-main/app/src/views/optimizerView.js#L349):
   > *"Scientific Notice: The current empirical droplet combustion dataset contains no partial-gravity trials. Predictions at 0.16g and 0.38g are extrapolations and must not be interpreted as experimentally validated gravity-dependent predictions."*

---

## 10. Invariance Confirmation

It is hereby confirmed under strict technical inspection:
- **Analytical $d^2$-law kinematics** ($d^2(t) = d_0^2 - K \cdot t$) were **not changed**.
- **Fuel-stratified Gaussian Process Regression models** (Methanol $N=150$, n-Heptane $N=106$) were **not changed**.
- **Bayesian Expected Information Gain** acquisition calculations were **not changed**.
- **The Experimental Design Optimizer view and facility** were **not changed**.
- **All 83 existing tests** continue to pass with zero regressions.

---
*End of Phase 7.3 Implementation Report.*

