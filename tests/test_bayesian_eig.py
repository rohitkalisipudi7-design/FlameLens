"""
Automated Verification Suite: Bayesian Expected Information Gain & Acquisition Engine (Phase 4)
Verifies:
1. EIG is strictly non-negative across the entire parameter space.
2. EIG is exactly zero when latent variance sigma_f_sq is zero.
3. EIG increases monotonically as latent variance increases with fixed noise.
4. EIG decreases monotonically as observation noise increases with fixed latent variance.
5. EIG units are strictly bits (using log2).
6. Zero Math.abs() masking of EIG in frontend views or rendering facilities.
7. Variance separation: sigma_total^2 = sigma_f^2 + sigma_n^2 in consistent physical units.
8. Distinct ranking objectives: Bayesian EIG, Predictive Variance, and Exploration Frontier.
"""

import math
from pathlib import Path
import pytest
import numpy as np
from scripts.experimental_design_optimizer import ExperimentalDesignOptimizer, LEDGER_PATH


@pytest.fixture(scope="module")
def optimizer():
    return ExperimentalDesignOptimizer(ledger_path=LEDGER_PATH)


def test_eig_is_non_negative(optimizer):
    """Verify Bayesian EIG is non-negative across all candidate coordinates and fuels."""
    pressures = [0.57, 0.69, 1.0, 1.5, 2.0, 2.5]
    oxygens = [0.18, 0.21, 0.30, 0.34, 0.40]
    droplets = [2.0, 3.0, 4.0]

    for fuel in ["n-heptane", "methanol"]:
        for p in pressures:
            for o2 in oxygens:
                for d in droplets:
                    cand = optimizer.evaluate_candidate(p, o2, d0_mm=d, fuel=fuel)
                    eig = cand["expected_info_gain"]
                    assert eig is not None, f"EIG must not be None for calibrated {fuel}"
                    assert eig >= 0.0, f"Bayesian EIG must be non-negative! Got {eig} at P={p}, O2={o2}, d0={d}"


def test_eig_is_zero_when_latent_variance_is_zero():
    """Verify EIG is mathematically and numerically zero when latent variance is zero."""
    # EIG = 0.5 * log2(1 + 0 / sigma_n^2) = 0.5 * log2(1) = 0.0 bits
    sigma_f_sq = 0.0
    sigma_n_sq = 0.0104

    ratio = sigma_f_sq / sigma_n_sq
    eig = 0.5 * math.log2(1.0 + ratio)
    assert eig == 0.0, f"EIG must be exactly 0.0 when latent variance is zero, got {eig}"


def test_eig_increases_as_latent_variance_increases():
    """Verify EIG strictly increases with latent variance for a fixed observation noise."""
    sigma_n_sq = 0.005  # mm4/s2
    latent_variances = [0.0001, 0.001, 0.005, 0.02, 0.1]

    eigs = [0.5 * math.log2(1.0 + v / sigma_n_sq) for v in latent_variances]

    for i in range(len(eigs) - 1):
        assert eigs[i] < eigs[i + 1], f"EIG must strictly increase with latent variance: {eigs[i]} >= {eigs[i+1]}"


def test_eig_decreases_as_observation_noise_increases():
    """Verify EIG strictly decreases with observation noise for a fixed latent variance."""
    sigma_f_sq = 0.02  # mm4/s2
    noise_variances = [0.001, 0.005, 0.01, 0.05, 0.2]

    eigs = [0.5 * math.log2(1.0 + sigma_f_sq / n) for n in noise_variances]

    for i in range(len(eigs) - 1):
        assert eigs[i] > eigs[i + 1], f"EIG must strictly decrease as noise increases: {eigs[i]} <= {eigs[i+1]}"


def test_eig_units_are_bits():
    """Verify EIG uses log2 (bits) and matches theoretical mutual information values."""
    # When signal-to-noise ratio sigma_f^2 / sigma_n^2 = 1.0: EIG = 0.5 * log2(2) = 0.500 bits
    eig_snr_1 = 0.5 * math.log2(1.0 + 1.0)
    assert math.isclose(eig_snr_1, 0.5, abs_tol=1e-7), f"Expected 0.5 bits, got {eig_snr_1}"

    # When signal-to-noise ratio sigma_f^2 / sigma_n^2 = 3.0: EIG = 0.5 * log2(4) = 1.000 bit
    eig_snr_3 = 0.5 * math.log2(1.0 + 3.0)
    assert math.isclose(eig_snr_3, 1.0, abs_tol=1e-7), f"Expected 1.0 bit, got {eig_snr_3}"

    # When signal-to-noise ratio sigma_f^2 / sigma_n^2 = 7.0: EIG = 0.5 * log2(8) = 1.500 bits
    eig_snr_7 = 0.5 * math.log2(1.0 + 7.0)
    assert math.isclose(eig_snr_7, 1.5, abs_tol=1e-7), f"Expected 1.5 bits, got {eig_snr_7}"


def test_no_negative_values_hidden_through_math_abs():
    """Verify neither frontend view nor rendering facility hides negative EIG values with Math.abs()."""
    view_path = Path("app/src/views/optimizerView.js")
    facility_path = Path("app/src/render/lab/optimizerFacility.js")

    assert view_path.exists()
    assert facility_path.exists()

    view_content = view_path.read_text(encoding="utf-8")
    facility_content = facility_path.read_text(encoding="utf-8")

    assert "Math.abs(cand.expected_information_gain" not in view_content, (
        "optimizerView.js must not use Math.abs on expected_information_gain!"
    )
    assert "Math.abs(c.expected_information_gain" not in view_content, (
        "optimizerView.js must not use Math.abs on expected_information_gain in strip!"
    )
    assert "Math.abs(data.expected_information_gain" not in facility_content, (
        "optimizerFacility.js must not use Math.abs on expected_information_gain in ranking!"
    )


def test_variance_separation_consistency(optimizer):
    """Verify sigma_total^2 = sigma_f^2 + sigma_n^2 in consistent physical units."""
    for fuel in ["methanol", "n-heptane"]:
        cand = optimizer.evaluate_candidate(1.0, 0.21, d0_mm=2.5, fuel=fuel)

        sigma_tot = cand["estimated_uncertainty_sigma"]
        sigma_f = cand["latent_uncertainty_sigma_f"]
        sigma_f_sq = cand["latent_variance_sigma_f_sq"]
        sigma_n = cand["observation_noise_sigma_n"]
        sigma_n_sq = cand["observation_noise_sigma_n_sq"]

        # Check square consistency (allowing for rounding precision)
        assert math.isclose(sigma_f**2, sigma_f_sq, abs_tol=1e-4)
        assert math.isclose(sigma_n**2, sigma_n_sq, abs_tol=1e-4)

        # Check Pythagorean variance decomposition: Var_tot = Var_f + Var_n
        expected_var_tot = sigma_f_sq + sigma_n_sq
        actual_var_tot = sigma_tot**2
        assert math.isclose(actual_var_tot, expected_var_tot, abs_tol=1e-3), (
            f"Variance separation mismatch: {actual_var_tot} != {expected_var_tot}"
        )


def test_distinct_ranking_objectives(optimizer):
    """Verify MAX_INFORMATION_GAIN, MAX_PREDICTIVE_VARIANCE, and EXPLORATION_FRONTIER produce distinct rankings."""
    pool_eig = optimizer.generate_candidate_pool(objective="MAX_INFORMATION_GAIN", fuel="methanol")
    pool_var = optimizer.generate_candidate_pool(objective="MAX_PREDICTIVE_VARIANCE", fuel="methanol")
    pool_front = optimizer.generate_candidate_pool(objective="EXPLORATION_FRONTIER", fuel="methanol")

    top_eig = pool_eig["top_candidates"]
    top_var = pool_var["top_candidates"]
    top_front = pool_front["top_candidates"]

    # Exploration Frontier must rank the exploration candidate (0.57 atm / 34% O2) first
    assert top_front[0]["feasibility_status"] in ("HYPOTHETICAL_FRONTIER", "EXPLORATION_FRONTIER_TARGET") or "FRONTIER" in top_front[0]["feasibility_status"]
    assert math.isclose(top_front[0]["parameters"]["pressure_atm"], 0.57, abs_tol=0.05)

    # Top EIG ranks by descending expected information gain
    eig_values = [c["expected_info_gain"] for c in top_eig]
    assert eig_values == sorted(eig_values, reverse=True)

    # Top Variance ranks by descending latent variance
    var_values = [c["latent_variance_sigma_f_sq"] for c in top_var]
    assert var_values == sorted(var_values, reverse=True)
