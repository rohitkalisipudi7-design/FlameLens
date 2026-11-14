# VERCEL DEPLOYMENT FIX REPORT — CROSS-PLATFORM NATIVE DEPENDENCY CONFLICT

**Date:** 2026-11-15  
**Platform Scope:** Vercel (Linux x64) & Local Development (Windows x64)  
**Status:** VALIDATED & RESOLVED  

---

## 1. Executive Summary

During Vercel production deployments, `npm install` (and `npm ci`) failed with error code `EBADPLATFORM`:

```
npm error code EBADPLATFORM
npm error notsup Unsupported platform for @rolldown/binding-win32-x64-msvc: wanted {"os":"win32","cpu":"x64"} (current: {"os":"linux","cpu":"x64"})
```

The issue was diagnosed, isolated, corrected, and verified across both native Windows x64 and native Linux x64 (Ubuntu 22.04 on WSL2). Zero scientific code, mathematical models, evidence ledgers, or visualization logic were altered.

---

## 2. Exact Root Cause Analysis

1. **Direct Dependency Misclassification**:
   In `app/package.json`, `@rolldown/binding-win32-x64-msvc` was listed directly under `"dependencies"`:
   ```json
   "dependencies": {
     "@rolldown/binding-win32-x64-msvc": "^1.2.11",
     "three": "^0.186.1"
   }
   ```
2. **Platform Incompatibility on Vercel Linux**:
   `@rolldown/binding-win32-x64-msvc` is a Windows-specific native binary module explicitly specifying `os: ["win32"]` and `cpu: ["x64"]`.
   Because it was declared as a top-level mandatory project dependency (rather than a platform-selective optional dependency), npm on Linux was forced to treat it as a hard requirement. Upon detecting that the actual runtime OS was `linux` while the package specified `win32`, npm halted immediately with `EBADPLATFORM`.
3. **Rolldown Architectural Role**:
   `vite@8.3.1` depends on `rolldown@1.2.11`, which internally defines a comprehensive list of 15 platform-specific binary bindings under its `optionalDependencies` (including `@rolldown/binding-linux-x64-gnu`, `@rolldown/binding-linux-x64-musl`, `@rolldown/binding-win32-x64-msvc`, and `@rolldown/binding-darwin-arm64`). Under standard cross-platform npm semantics, npm automatically installs the single binding matching the host OS/CPU and silently ignores the non-matching optional bindings. The hardcoded entry in `package.json` broke this mechanism.

---

## 3. Files Modified

| File | Change Type | Description |
|---|---|---|
| `app/package.json` | Modified | Removed hardcoded `@rolldown/binding-win32-x64-msvc` from `"dependencies"`. |
| `app/package-lock.json` | Regenerated & Synchronized | Removed top-level direct dependency; preserved `@rolldown/binding-win32-x64-msvc` as `optional: true` under `rolldown`; verified all 15 native platform bindings remain intact. |

---

## 4. Exact Dependency & Lockfile Diffs

### `app/package.json`
```diff
--- a/app/package.json
+++ b/app/package.json
@@ -13,7 +13,6 @@
     "preview": "vite preview"
   },
   "dependencies": {
-    "@rolldown/binding-win32-x64-msvc": "^1.2.11",
     "three": "^0.186.1"
   },
   "devDependencies": {
```

### `app/package-lock.json`
```diff
--- a/app/package-lock.json
+++ b/app/package-lock.json
@@ -8,11 +8,13 @@
       "name": "flame-in-freefall",
       "version": "0.2.0",
       "dependencies": {
-        "@rolldown/binding-win32-x64-msvc": "^1.2.11",
         "three": "^0.186.1"
       },
       "devDependencies": {
         "vite": "^8.3.1"
+      },
+      "engines": {
+        "node": ">=20.19.0"
       }
     },
```
In the lockfile, `@rolldown/binding-win32-x64-msvc` now carries:
```json
"dev": true,
"license": "MIT",
"optional": true,
"os": [
  "win32"
]
```
While `@rolldown/binding-linux-x64-gnu` (required by Vercel) remains properly configured as:
```json
"dev": true,
"license": "MIT",
"optional": true,
"os": [
  "linux"
]
```

---

## 5. Verification & Validation Evidence

### A. Windows x64 Verification (Local Environment)
1. **Dependency Tree (`npm ls vite rolldown`)**:
   ```
   flame-in-freefall@0.2.0 C:\PROJECTS\Flames\NASA-SPACE-APPS-main\app
   `-- vite@8.3.1
     `-- rolldown@1.2.11
   ```
2. **Production Build (`npm run build`)**:
   ```
   vite v8.3.1 building client environment for production...
   transforming...
   ✓ 61 modules transformed.
   rendering chunks...
   computing gzip size...
   dist/index.html                    5.01 kB │ gzip:   1.42 kB
   dist/assets/index-CTxGI4lX.css    44.47 kB │ gzip:  10.38 kB
   dist/assets/flame3d-nSDrGt68.js   27.79 kB │ gzip:  12.43 kB
   dist/assets/index-j7Qc_mLL.js    852.25 kB │ gzip: 232.40 kB
   ✓ built in 518ms
   ```
   *Result:* PASSED.

### B. Linux x64 Verification (Real Linux Environment in WSL2 Ubuntu)
A clean directory was prepared with zero cached `node_modules` and executed natively in Linux:
1. **Clean Installation (`npm install`)**:
   ```
   added 18 packages, and audited 19 packages in 1s
   ```
   *Verified bindings downloaded:* `@rolldown/binding-linux-x64-gnu` was automatically resolved and installed; Windows bindings were safely skipped.
2. **Production Build (`npm run build`)**:
   ```
   vite v8.3.1 building client environment for production...
   transforming...
   ✓ 61 modules transformed.
   rendering chunks...
   computing gzip size...
   dist/index.html                    5.01 kB │ gzip:   1.42 kB
   dist/assets/index-CTxGI4lX.css    44.47 kB │ gzip:  10.38 kB
   dist/assets/flame3d-nSDrGt68.js   27.79 kB │ gzip:  12.43 kB
   dist/assets/index-j7Qc_mLL.js    852.25 kB │ gzip: 232.40 kB
   ✓ built in 399ms
   ```
   *Result:* PASSED. Exit code 0.

### C. Scientific Model & Pipeline Integrity
The full automated test suite was executed against the repository:
```
============================= 91 passed in 39.03s =============================
```
*Result:* 91 of 91 tests passed (100%). No regressions across Gaussian Process Regression, Bayesian Expected Information Gain, safety envelope boundaries, video forensics, or 3D partial-gravity visualization logic.

---

## 6. Remaining Deployment Considerations

1. **Vercel Build Command Configuration**:
   - Root Directory: `app` (or Root with Build Command `cd app && npm run build` and Output Directory `app/dist`).
   - Node.js Version: Vercel defaults to Node.js 20.x or 22.x, both of which satisfy `^20.19.0 || >=22.12.0`.
2. **Zero Deployment Workarounds Needed**:
   No `.npmrc` flags (such as `--ignore-engines` or `--legacy-peer-deps`) are required. Standard `npm install` / `npm ci` completes cleanly.

