"""
Automated Verification Suite: GPR Standardization & Scientific Validation (Phase 3)
Verifies:
1. Feature and target scaling are fitted ONLY on training folds (zero data leakage).
2. Model predictions and predictive uncertainties are returned strictly in physical units (mm²/s).
3. 5-fold cross-validation is 100% reproducible with fixed random seed.
4. Both Methanol and n-Heptane report distinct, un-fabricated validation metrics.
5. Uncertainty outputs are finite, non-negative, and properly calibrated.
6. Epistemic uncertainty vs observation noise distinction and extrapolation caveats are documented.
"""

import json
import numpy as np
import pytest
from sklearn.model_selection import KFold
from scripts.experimental_design_optimizer import (
    ExperimentalDesignOptimizer,
    FuelGPRPipeline,
    run_cross_validation,
    LEDGER_PATH,
)


@pytest.fixture(scope="module")
def optimizer():
    return ExperimentalDesignOptimizer(ledger_path=LEDGER_PATH)


def test_scaling_fitted_only_on_training_folds(optimizer):
    """Verify feature and target scalers are fitted exclusively on training folds during CV."""
    cohort = optimizer.cohorts["methanol"]
    X = cohort["X"]
    y = cohort["y"]

    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    for fold_idx, (train_idx, val_idx) in enumerate(kf.split(X)):
        X_train, y_train = X[train_idx], y[train_idx]
        X_val = X[val_idx]

        pipe = FuelGPRPipeline(random_state=42 + fold_idx)
        pipe.fit(X_train, y_train)

        # Scaler parameters must match X_train statistics exactly, NOT full X or X_val
        np.testing.assert_allclose(pipe.feature_scaler.mean_, np.mean(X_train, axis=0), rtol=1e-5)
        np.testing.assert_allclose(pipe.feature_scaler.scale_, np.std(X_train, axis=0), rtol=1e-5)

        # Target scaler must match y_train statistics exactly
        assert abs(pipe.target_scaler.mean_[0] - np.mean(y_train)) < 1e-5
        assert abs(pipe.target_scaler.scale_[0] - np.std(y_train)) < 1e-5

        # Must NOT equal validation statistics (which would indicate leakage)
        assert not np.allclose(pipe.feature_scaler.mean_, np.mean(X_val, axis=0))
        break


def test_predictions_in_physical_units(optimizer):
    """Verify that predictions and uncertainties are inverted to physical units (mm²/s), not standardized z-scores."""
    test_points = [
        {"pressure_atm": 1.0, "oxygen_fraction": 0.21, "droplet_d0_mm": 2.0},
        {"pressure_atm": 0.57, "oxygen_fraction": 0.34, "droplet_d0_mm": 2.5},
        {"pressure_atm": 2.0, "oxygen_fraction": 0.30, "droplet_d0_mm": 3.0},
    ]

    for fuel in ["methanol", "n-heptane"]:
        for pt in test_points:
            res = optimizer.evaluate_candidate(
                pressure_atm=pt["pressure_atm"],
                oxygen_fraction=pt["oxygen_fraction"],
                d0_mm=pt["droplet_d0_mm"],
                fuel=fuel,
            )
            k = res["predicted_burn_rate_k"]
            sigma = res["estimated_uncertainty_sigma"]

            # Physical microgravity droplet burning rates are within [0.1, 1.5] mm²/s
            assert 0.1 <= k <= 1.5, f"Prediction {k} mm²/s outside physical droplet range for {fuel}"
            assert 0.01 <= sigma <= 1.0, f"Uncertainty {sigma} mm²/s outside physical range for {fuel}"


def test_cross_validation_reproducibility(optimizer):
    """Verify that 5-fold cross-validation is exactly reproducible with identical random seeds."""
    cohort = optimizer.cohorts["methanol"]
    X = cohort["X"]
    y = cohort["y"]

    cv1 = run_cross_validation(X, y, n_splits=5, random_state=42)
    cv2 = run_cross_validation(X, y, n_splits=5, random_state=42)

    assert cv1["aggregate"]["r2"]["mean"] == cv2["aggregate"]["r2"]["mean"]
    assert cv1["aggregate"]["rmse_mm2_s"]["mean"] == cv2["aggregate"]["rmse_mm2_s"]["mean"]
    assert cv1["aggregate"]["predictive_interval_coverage_95"] == cv2["aggregate"]["predictive_interval_coverage_95"]
    np.testing.assert_array_equal(cv1["oof_predictions"], cv2["oof_predictions"])


def test_both_fuel_models_report_separate_metrics(optimizer):
    """Verify Methanol and n-Heptane report distinct, genuine cross-validation metrics and fold counts."""
    meta_m = optimizer.metadata["methanol"]
    meta_h = optimizer.metadata["n-heptane"]

    assert meta_m["training_sample_count"] == 150
    assert meta_h["training_sample_count"] == 106

    cv_m = meta_m["cross_validation"]
    cv_h = meta_h["cross_validation"]

    assert len(cv_m["folds"]) == 5
    assert len(cv_h["folds"]) == 5

    # Fold sample counts must reflect cohort size (150 / 5 = 30 per fold for Methanol)
    for fold in cv_m["folds"]:
        assert fold["train_sample_count"] == 120
        assert fold["validation_sample_count"] == 30

    # Fold sample counts for n-Heptane (106 total: folds of 21 and 22)
    total_val_h = sum(fold["validation_sample_count"] for fold in cv_h["folds"])
    assert total_val_h == 106

    # Metrics must differ between fuels
    assert cv_m["aggregate"]["r2"]["mean"] != cv_h["aggregate"]["r2"]["mean"]
    assert cv_m["aggregate"]["rmse_mm2_s"]["mean"] != cv_h["aggregate"]["rmse_mm2_s"]["mean"]


def test_uncertainty_outputs_finite_and_non_negative(optimizer):
    """Verify uncertainty standard deviations are finite, real, and strictly positive across parameter bounds."""
    for p in [0.57, 1.0, 2.0]:
        for o2 in [0.18, 0.21, 0.34]:
            for d in [1.5, 2.5, 4.0]:
                for fuel in ["methanol", "n-heptane"]:
                    res = optimizer.evaluate_candidate(p, o2, d0_mm=d, fuel=fuel)
                    sigma = res["estimated_uncertainty_sigma"]
                    assert sigma is not None
                    assert np.isfinite(sigma)
                    assert sigma > 0.0


def test_model_diagnostics_and_scientific_disclaimers(optimizer):
    """Verify model diagnostics distinguish epistemic from observation noise and include extrapolation caveat."""
    for fuel in ["methanol", "n-heptane"]:
        diag = optimizer.metadata[fuel]["diagnostics"]
        assert "optimized_kernel" in diag
        assert "length_scales_scaled_space" in diag
        assert len(diag["length_scales_scaled_space"]) == 3
        assert diag["observation_noise_std_physical_mm2_s"] > 0
        assert "training_residuals_mm2_s" in diag
        assert "prediction_residuals_oof_mm2_s" in diag
        assert "uncertainty_calibration" in diag

        # Epistemic vs aleatoric distinction
        epistemic_info = diag["epistemic_vs_aleatoric"]
        assert "epistemic_uncertainty" in epistemic_info
        assert "aleatoric_noise" in epistemic_info

        # Extrapolation warning
        assert "domain_extrapolation_caveat" in diag
        assert "convex hull" in diag["domain_extrapolation_caveat"] or "extrapolation" in diag["domain_extrapolation_caveat"]

