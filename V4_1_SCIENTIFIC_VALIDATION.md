# Flame in Freefall V4.1 — Scientific Validation Plan

**Objective:** Define objective benchmarking protocols, metrics, and ground-truth validation datasets for the 4 new scientific engines.

---

## 1. Module A: Experimental Design Optimizer Validation
- **Benchmark Baselines:**
  1. *Random Sampling:* Uniform random selection across valid parameter bounds.
  2. *Latin Hypercube Sampling (LHS):* Space-filling stratified sampling.
  3. *Uncertainty-Guided GPR / Expected Information Gain (EIG):* Active learning loop.
- **Evaluation Metric:** Average entropy reduction $\Delta H$ and Root Mean Squared Error (RMSE) reduction on a holdout empirical test set over $N = 10$ sequential experimental acquisitions.
- **Hypothesis:** Uncertainty-guided EIG reduces predictive variance faster than uniform random selection by at least 25%.

---

## 2. Module B: Scientific Safety Envelope Validation
- **Validation Dataset:** 1,872 historical spaceflight experiments across 5 families.
- **Epistemic Class Verification:**
  - Known in-domain clusters (e.g. 1 atm air, FLEX droplet tests) must be classified as `EXPERIMENTALLY_SUPPORTED`.
  - Lunar/Mars Exploration atmosphere (0.57 atm / 34% O₂) must be classified as `HIGH_UNCERTAINTY` or `UNSUPPORTED`.
  - Impossible gas mixtures ($\sum X_i > 1.0$) must be rejected as `UNSUPPORTED`.
- **False In-Domain Rate:** Must be strictly 0.0% for points outside physical flight bounds.

---

## 3. Module C: Combustion Video Intelligence Validation
- **Synthetic & Ground-Truth Test Sequence:**
  - Standardized microgravity droplet flame sequence with calibrated ground-truth coordinates, known diameter shrinkage rate $K$, and known extinction timestamp $t_{\text{ext}}$.
- **Metrics:**
  - **Intersection over Union (IoU):** $\text{IoU} \ge 0.85$ against segmented flame contours.
  - **Diameter Measurement Error:** Relative error $\le 5\%$ compared to ground truth.
  - **Extinction Event Detection:** Correct temporal event identification within $\pm 0.2\text{ seconds}$.

---

## 4. Module D: Scientific Contradiction Detector Validation
- **Evaluation Dataset:** Curated test matrix of 10 established combustion assertion pairs representing:
  - 3 Genuine numerical or methodological disagreements (e.g. upward 1g flammability vs concurrent 0g airflow).
  - 4 Compatible findings under differing environmental conditions (e.g. pressure or diluent variations).
  - 3 False conflict candidates (spurious semantic similarities).
- **Metrics:** Precision $\ge 90\%$, Recall $\ge 80\%$, False Positive Rate $< 10\%$.

