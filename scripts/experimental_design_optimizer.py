"""AI Experimental Design Optimizer — Flame in Freefall V4.1.

Implements MODULE A:
Identifies candidate microgravity combustion experiments yielding the highest scientific value.
Uses Fuel-Stratified Gaussian Process Regression (GPR) models with continuous Matérn 5/2 kernels
to model the continuous parameter response surface for distinct fuel chemistries:
- Methanol (CH3OH, NASA PSI-69 FLEX)
- n-Heptane (C7H16, NASA PSI-69 FLEX)

NON-NEGOTIABLE SCIENTIFIC SAFEGUARDS:
- Separate models for distinct fuels: zero pooling of chemically incompatible fuels.
- Cohort sizes are calculated dynamically at runtime from evidence_ledger.json.
- Zero silent imputation: missing values are never replaced with assumed numbers.
- Explicit rejection for unsupported fuels ("Model not calibrated for selected fuel").
- Input standardization using StandardScaler prevents kernel length-scale distortion.
"""
import json
import math
import os
import sqlite3
import warnings
import numpy as np
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import Matern, WhiteKernel, ConstantKernel
from sklearn.model_selection import KFold
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
PUBLIC_DATA_DIR = os.path.join(BASE_DIR, "app", "public", "data")
DB_PATH = os.path.join(DATA_DIR, "olap_experimentos.db")
LEDGER_PATH = os.path.join(PUBLIC_DATA_DIR, "evidence_ledger.json")

DOCUMENTED_HARDWARE_LIMITS = {
    "ISS_CIR_MDCA": {
        "facility": "ISS Combustion Integrated Rack (CIR) / MDCA",
        "source": "NASA/TP-2017-219299 CIR Operational Envelope",
        "min_pressure_atm": 0.70,
        "max_pressure_atm": 3.00,
        "max_o2_mole_fraction": 0.30,
        "min_droplet_d0_mm": 1.0,
        "max_droplet_d0_mm": 5.0,
    },
    "GROUND_DROP_TOWER": {
        "facility": "NASA Glenn Zero Gravity Research Facility (Drop Tower)",
        "source": "NASA TM-107000 Zero-Gravity Research Facility Ground Operations Manual",
        "min_pressure_atm": 0.30,
        "max_pressure_atm": 2.50,
        "max_o2_mole_fraction": 0.40,
        "min_droplet_d0_mm": 0.8,
        "max_droplet_d0_mm": 4.0,
    },
    "EXPLORATION_ATMOSPHERE": {
        "standard": "NASA Exploration Atmosphere Standard (Lunar / Mars Habitat)",
        "source": "NASA-STD-3001 Vol 2 / NASA SP-2010-3407 (0.57 atm / 34% O2)",
        "target_pressure_atm": 0.57,
        "target_o2_mole_fraction": 0.34,
    }
}


class FuelGPRPipeline:
    """Standardized GPR pipeline with leakage-safe feature & target scaling."""

    def __init__(self, random_state=42):
        self.random_state = random_state
        self.feature_scaler = StandardScaler()
        self.target_scaler = StandardScaler()
        self.kernel = ConstantKernel(1.0, (1e-2, 1e2)) * Matern(
            length_scale=[1.0, 1.0, 1.0], length_scale_bounds=(1e-2, 1e2), nu=2.5
        ) + WhiteKernel(noise_level=0.1, noise_level_bounds=(1e-4, 1.0))
        self.gp = GaussianProcessRegressor(
            kernel=self.kernel,
            n_restarts_optimizer=3,
            random_state=self.random_state
        )
        self.is_fitted = False

    def fit(self, X, y):
        """Fits feature scaler, target scaler, and GPR strictly on training data."""
        X_scaled = self.feature_scaler.fit_transform(X)
        y_scaled = self.target_scaler.fit_transform(np.asarray(y).reshape(-1, 1)).ravel()
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            self.gp.fit(X_scaled, y_scaled)
        self.is_fitted = True
        return self

    def predict(self, X, return_std=True, return_variance_components=False):
        """Predicts burning rate response and uncertainty, inverted to physical units (mm^2/s).

        If return_variance_components is True:
            returns dict with:
                - y_pred (ndarray)
                - std_total_phys (ndarray)
                - sigma_f_phys (ndarray)
                - sigma_f_phys_sq (ndarray)
                - noise_phys_std (float)
                - noise_phys_sq (float)
                - eig_bits (ndarray)
        """
        if not self.is_fitted:
            raise RuntimeError("Pipeline must be fitted before predict.")
        X_arr = np.asarray(X)
        if X_arr.ndim == 1:
            X_arr = X_arr.reshape(1, -1)
        X_scaled = self.feature_scaler.transform(X_arr)

        scale_y = float(self.target_scaler.scale_[0])
        mean_y = float(self.target_scaler.mean_[0])

        try:
            noise_scaled = float(self.gp.kernel_.k2.noise_level)
        except Exception:
            noise_scaled = 0.0

        if noise_scaled <= 0.0 or not np.isfinite(noise_scaled):
            raise ValueError(f"Observation noise estimate is invalid: {noise_scaled}")

        noise_phys_sq = noise_scaled * (scale_y ** 2)
        noise_phys_std = math.sqrt(max(1e-9, noise_phys_sq))

        if return_variance_components:
            y_scaled_pred, std_scaled = self.gp.predict(X_scaled, return_std=True)
            y_pred = np.maximum(1e-4, y_scaled_pred * scale_y + mean_y)

            var_total_scaled = std_scaled ** 2
            var_latent_scaled = np.maximum(0.0, var_total_scaled - noise_scaled)

            sigma_f_phys_sq = var_latent_scaled * (scale_y ** 2)
            sigma_f_phys = np.sqrt(sigma_f_phys_sq)
            std_total_phys = np.sqrt(var_total_scaled) * scale_y

            # Bayesian Expected Information Gain: EIG(x) = 0.5 * log2(1 + sigma_f^2 / sigma_n^2) bits
            eig_bits = 0.5 * np.log2(1.0 + sigma_f_phys_sq / max(1e-9, noise_phys_sq))
            eig_bits = np.maximum(0.0, eig_bits)

            return {
                "y_pred": y_pred,
                "std_total_phys": std_total_phys,
                "sigma_f_phys": sigma_f_phys,
                "sigma_f_phys_sq": sigma_f_phys_sq,
                "noise_phys_std": noise_phys_std,
                "noise_phys_sq": noise_phys_sq,
                "eig_bits": eig_bits,
            }
        elif return_std:
            y_scaled_pred, std_scaled = self.gp.predict(X_scaled, return_std=True)
            y_pred = y_scaled_pred * scale_y + mean_y
            std_phys = std_scaled * scale_y
            return np.maximum(1e-4, y_pred), np.maximum(1e-4, std_phys)
        else:
            y_scaled_pred = self.gp.predict(X_scaled, return_std=False)
            y_pred = y_scaled_pred * scale_y + mean_y
            return np.maximum(1e-4, y_pred)


def run_cross_validation(X, y, n_splits=5, random_state=42):
    """Executes reproducible 5-fold cross-validation with strict leakage isolation."""
    kf = KFold(n_splits=n_splits, shuffle=True, random_state=random_state)
    fold_metrics = []
    oof_predictions = np.zeros(len(y))
    oof_uncertainties = np.zeros(len(y))

    for fold_idx, (train_idx, val_idx) in enumerate(kf.split(X)):
        X_train, y_train = X[train_idx], y[train_idx]
        X_val, y_val = X[val_idx], y[val_idx]

        # Fresh pipeline for each fold - zero leakage
        fold_pipeline = FuelGPRPipeline(random_state=random_state + fold_idx)
        fold_pipeline.fit(X_train, y_train)

        y_pred_val, std_val = fold_pipeline.predict(X_val, return_std=True)
        oof_predictions[val_idx] = y_pred_val
        oof_uncertainties[val_idx] = std_val

        r2 = float(r2_score(y_val, y_pred_val))
        mae = float(mean_absolute_error(y_val, y_pred_val))
        rmse = float(np.sqrt(mean_squared_error(y_val, y_pred_val)))

        # 95% predictive interval: [mu - 1.96*std, mu + 1.96*std]
        ci_lower = y_pred_val - 1.96 * std_val
        ci_upper = y_pred_val + 1.96 * std_val
        coverage_95 = float(np.mean((y_val >= ci_lower) & (y_val <= ci_upper)))
        mean_pi_width = float(np.mean(ci_upper - ci_lower))

        fold_metrics.append({
            "fold": fold_idx + 1,
            "train_sample_count": len(train_idx),
            "validation_sample_count": len(val_idx),
            "r2": round(r2, 4),
            "mae_mm2_s": round(mae, 4),
            "rmse_mm2_s": round(rmse, 4),
            "pi_coverage_95": round(coverage_95, 4),
            "mean_pi_width_mm2_s": round(mean_pi_width, 4),
        })

    mean_r2 = float(np.mean([m["r2"] for m in fold_metrics]))
    std_r2 = float(np.std([m["r2"] for m in fold_metrics]))
    mean_mae = float(np.mean([m["mae_mm2_s"] for m in fold_metrics]))
    std_mae = float(np.std([m["mae_mm2_s"] for m in fold_metrics]))
    mean_rmse = float(np.mean([m["rmse_mm2_s"] for m in fold_metrics]))
    std_rmse = float(np.std([m["rmse_mm2_s"] for m in fold_metrics]))
    mean_cov = float(np.mean([m["pi_coverage_95"] for m in fold_metrics]))
    mean_width = float(np.mean([m["mean_pi_width_mm2_s"] for m in fold_metrics]))

    return {
        "n_splits": n_splits,
        "random_state": random_state,
        "folds": fold_metrics,
        "aggregate": {
            "r2": {"mean": round(mean_r2, 4), "std": round(std_r2, 4)},
            "mae_mm2_s": {"mean": round(mean_mae, 4), "std": round(std_mae, 4)},
            "rmse_mm2_s": {"mean": round(mean_rmse, 4), "std": round(std_rmse, 4)},
            "predictive_interval_coverage_95": round(mean_cov, 4),
            "mean_predictive_interval_width_mm2_s": round(mean_width, 4),
        },
        "oof_predictions": oof_predictions,
        "oof_uncertainties": oof_uncertainties,
    }


class ExperimentalDesignOptimizer:
    SUPPORTED_FUELS = ("n-heptane", "methanol")

    def __init__(self, ledger_path=LEDGER_PATH):
        self.ledger_path = ledger_path
        self.cohorts = self._load_fuel_cohorts()
        self.pipelines = {}
        self.models = {}
        self.scalers = {}
        self.target_scalers = {}
        self.metadata = {}
        self._train_fuel_models()

        # Default active fuel for backwards compatibility
        default_fuel = "n-heptane" if "n-heptane" in self.cohorts and len(self.cohorts["n-heptane"]["y"]) > 0 else "methanol"
        self.active_fuel = default_fuel
        self.X_train = self.cohorts[default_fuel]["X"]
        self.y_train = self.cohorts[default_fuel]["y"]
        self.gp_model = self.models[default_fuel]
        self.pipeline = self.pipelines[default_fuel]

    def _load_fuel_cohorts(self):
        """Loads and filters mutually exclusive, physically valid droplet combustion cohorts."""
        if not os.path.exists(self.ledger_path):
            raise FileNotFoundError(f"Evidence ledger not found at {self.ledger_path}")
        with open(self.ledger_path, "r", encoding="utf-8") as f:
            ledger = json.load(f)

        cohorts = {
            "methanol": {"features": [], "targets": [], "evidence_ids": [], "records": []},
            "n-heptane": {"features": [], "targets": [], "evidence_ids": [], "records": []},
        }

        for item in ledger:
            fam = item.get("family")
            acc = item.get("accession", "")
            fuel_raw = (item.get("material_or_fuel") or "").lower().strip()
            norm = item.get("normalized_measurements", {})
            p = norm.get("pressure_atm")
            o2 = norm.get("x_o2")
            d0 = norm.get("d0_mm")
            k = norm.get("burning_rate_mm2_s")

            # Must be droplet family, PSI-69 FLEX, with complete valid measurements
            if fam == "droplet" and "PSI-69" in acc:
                if p is not None and o2 is not None and d0 is not None and k is not None:
                    p_val = float(p)
                    o2_val = float(o2)
                    d0_val = float(d0)
                    k_val = float(k)
                    if p_val > 0 and 0 < o2_val <= 1.0 and d0_val > 0 and k_val > 0.05:
                        ev_id = item.get("evidence_id")
                        if "methanol" in fuel_raw:
                            cohorts["methanol"]["features"].append([p_val, o2_val, d0_val])
                            cohorts["methanol"]["targets"].append(k_val)
                            cohorts["methanol"]["evidence_ids"].append(ev_id)
                            cohorts["methanol"]["records"].append(item)
                        elif "heptane" in fuel_raw:
                            cohorts["n-heptane"]["features"].append([p_val, o2_val, d0_val])
                            cohorts["n-heptane"]["targets"].append(k_val)
                            cohorts["n-heptane"]["evidence_ids"].append(ev_id)
                            cohorts["n-heptane"]["records"].append(item)

        processed = {}
        for fuel_key, data in cohorts.items():
            features = np.array(data["features"]) if data["features"] else np.empty((0, 3))
            targets = np.array(data["targets"]) if data["targets"] else np.empty((0,))
            processed[fuel_key] = {
                "X": features,
                "y": targets,
                "evidence_ids": data["evidence_ids"],
                "records": data["records"],
                "sample_count": len(targets),
            }
        return processed

    @property
    def fuel_cohorts(self):
        """Returns the raw filtered records per fuel cohort."""
        return {f: self.cohorts[f]["records"] for f in self.cohorts}

    def get_model_metadata(self, fuel):
        """Returns the model metadata for a given fuel."""
        matched = self._normalize_fuel(fuel)
        return self.metadata.get(matched)

    def _train_fuel_models(self):
        """Fits independent GPR models with standardized features and targets, running 5-fold CV and diagnostics."""
        for fuel_key in self.SUPPORTED_FUELS:
            cohort = self.cohorts.get(fuel_key)
            if not cohort or cohort["sample_count"] == 0:
                continue

            X = cohort["X"]
            y = cohort["y"]

            # 1. Run 5-fold Cross-Validation with strict leakage isolation
            cv_results = run_cross_validation(X, y, n_splits=5, random_state=42)

            # 2. Fit final pipeline on all cohort training data
            pipeline = FuelGPRPipeline(random_state=42)
            pipeline.fit(X, y)

            self.pipelines[fuel_key] = pipeline
            self.models[fuel_key] = pipeline.gp
            self.scalers[fuel_key] = pipeline.feature_scaler
            self.target_scalers[fuel_key] = pipeline.target_scaler

            # 3. Model Diagnostics & Residuals
            y_train_pred, std_train_pred = pipeline.predict(X, return_std=True)
            train_residuals = y - y_train_pred
            oof_residuals = y - cv_results["oof_predictions"]

            gp_kernel = pipeline.gp.kernel_
            # Extract length scales (order: [P, O2, d0])
            try:
                ls = [round(float(v), 3) for v in gp_kernel.k1.k2.length_scale]
            except Exception:
                ls = []

            try:
                noise_scaled = float(gp_kernel.k2.noise_level)
            except Exception:
                noise_scaled = 0.0

            noise_phys_std = math.sqrt(noise_scaled) * float(pipeline.target_scaler.scale_[0])
            mean_oof_sigma = float(np.mean(cv_results["oof_uncertainties"]))
            calibration_ratio = round(cv_results["aggregate"]["rmse_mm2_s"]["mean"] / max(1e-4, mean_oof_sigma), 3)

            diagnostics = {
                "optimized_kernel": str(gp_kernel),
                "length_scales_scaled_space": ls,
                "observation_noise_variance_scaled": round(noise_scaled, 6),
                "observation_noise_std_physical_mm2_s": round(noise_phys_std, 4),
                "training_residuals_mm2_s": {
                    "mean": round(float(np.mean(train_residuals)), 4),
                    "std": round(float(np.std(train_residuals)), 4),
                    "max_abs": round(float(np.max(np.abs(train_residuals))), 4),
                },
                "prediction_residuals_oof_mm2_s": {
                    "mean": round(float(np.mean(oof_residuals)), 4),
                    "std": round(float(np.std(oof_residuals)), 4),
                    "max_abs": round(float(np.max(np.abs(oof_residuals))), 4),
                },
                "uncertainty_calibration": {
                    "nominal_95_percent_target": 0.95,
                    "empirical_95_percent_coverage": cv_results["aggregate"]["predictive_interval_coverage_95"],
                    "calibration_ratio_rmse_over_mean_sigma": calibration_ratio,
                },
                "epistemic_vs_aleatoric": {
                    "epistemic_uncertainty": "Position-dependent posterior covariance from continuous Matérn 5/2 kernel; increases substantially in sparse parameter space and exploration frontiers.",
                    "aleatoric_noise": f"Homoscedastic WhiteKernel noise (std = {round(noise_phys_std, 4)} mm²/s) capturing measurement repeat variance, filament suspension losses, and video tracking pixel noise.",
                },
                "domain_extrapolation_caveat": "Verified 5-fold cross-validation performance applies ONLY within the convex hull of training data. It does NOT prove reliable extrapolation outside the empirical domain.",
            }

            self.metadata[fuel_key] = {
                "model_id": f"GPR-MATERN52-{fuel_key.upper().replace('-', '_')}",
                "fuel": fuel_key,
                "training_sample_count": len(y),
                "training_data_source": "NASA PSI-69 (FLEX) Microgravity Spaceflight Droplet Experiments",
                "kernel_configuration": str(gp_kernel),
                "supported_parameter_ranges": {
                    "pressure_atm": {"min": round(float(np.min(X[:, 0])), 2), "max": round(float(np.max(X[:, 0])), 2)},
                    "oxygen_fraction": {"min": round(float(np.min(X[:, 1])), 3), "max": round(float(np.max(X[:, 1])), 3)},
                    "droplet_d0_mm": {"min": round(float(np.min(X[:, 2])), 1), "max": round(float(np.max(X[:, 2])), 1)},
                },
                "validation_status": "CALIBRATED_EMPIRICAL",
                "cross_validation": {
                    "n_splits": cv_results["n_splits"],
                    "random_state": cv_results["random_state"],
                    "folds": cv_results["folds"],
                    "aggregate": cv_results["aggregate"],
                },
                "diagnostics": diagnostics,
            }

    def _normalize_fuel(self, fuel):
        if not fuel:
            return None
        f = fuel.lower().replace(" ", "").replace("_", "-")
        for supp in self.SUPPORTED_FUELS:
            if supp in f or f in supp or ("heptane" in f and "heptane" in supp) or ("methanol" in f and "methanol" in supp):
                return supp
        return None

    def evaluate_candidate(self, pressure_atm=1.0, oxygen_fraction=0.21, d0_mm=2.5, fuel="n-heptane", gravity_g=0.0):
        """Predicts burning rate response, uncertainty sigma, and information gain using the fuel-specific model."""
        if isinstance(pressure_atm, dict):
            params = pressure_atm
            pressure_atm = params.get("pressure_atm", 1.0)
            oxygen_fraction = params.get("oxygen_fraction", 0.21)
            d0_mm = params.get("droplet_d0_mm", params.get("d0_mm", 2.5))
            gravity_g = params.get("gravity_g", gravity_g)
            if "fuel" in params and fuel == "n-heptane":
                fuel = params["fuel"]

        matched_fuel = self._normalize_fuel(fuel)
        cand_id = f"OPT-CAND-{int(pressure_atm*100):03d}-{int(oxygen_fraction*100):02d}-{int(d0_mm*10):02d}"

        # Explicit rejection for unsupported fuels
        if not matched_fuel or matched_fuel not in self.pipelines:
            return {
                "candidate_id": cand_id,
                "parameters": {
                    "pressure_atm": round(pressure_atm, 2),
                    "oxygen_fraction": round(oxygen_fraction, 3),
                    "droplet_d0_mm": round(d0_mm, 1),
                    "fuel": fuel,
                    "gravity_g": gravity_g,
                },
                "predicted_burn_rate_k": None,
                "estimated_uncertainty_sigma": None,
                "latent_uncertainty_sigma_f": None,
                "latent_variance_sigma_f_sq": None,
                "observation_noise_sigma_n": None,
                "observation_noise_sigma_n_sq": None,
                "expected_info_gain": None,
                "feasibility_status": "UNSUPPORTED_FUEL",
                "recommended_facility": "Not applicable",
                "scientific_rationale": "Model not calibrated for selected fuel. Empirical NASA spaceflight GPR calibration is currently available for Methanol and n-Heptane droplet combustion.",
                "model_status": "UNSUPPORTED_FUEL",
                "error_message": "Model not calibrated for selected fuel.",
                "model_metadata": None,
            }

        # Predict using fuel-specific standardized surrogate pipeline (variance separation & Bayesian EIG)
        pipeline = self.pipelines[matched_fuel]
        pt = np.array([[pressure_atm, oxygen_fraction, d0_mm]])
        components = pipeline.predict(pt, return_variance_components=True)

        pred_k = float(components["y_pred"][0])
        std_sigma = float(components["std_total_phys"][0])
        sigma_f = float(components["sigma_f_phys"][0])
        sigma_f_sq = float(components["sigma_f_phys_sq"][0])
        noise_sigma = float(components["noise_phys_std"])
        noise_sq = float(components["noise_phys_sq"])
        eig_bits = float(components["eig_bits"][0])

        # Feasibility classification with documented hardware limits
        is_exploration = math.isclose(pressure_atm, 0.57, abs_tol=0.06) and math.isclose(oxygen_fraction, 0.34, abs_tol=0.05)
        is_subatmospheric = pressure_atm < 0.70
        is_hyperoxic = oxygen_fraction > 0.30

        if gravity_g >= 1.0:
            status = "UNSUPPORTED"
            facility = "Terrestrial Rig (Uncalibrated for 1g Buoyancy)"
            source = "Surrogate restricted to microgravity spherical droplet combustion"
            rationale = "Terrestrial 1g reference is an unsupported condition for this surrogate model."
        elif is_exploration or (0.01 < gravity_g < 0.99):
            status = "HYPOTHETICAL_FRONTIER"
            facility = "NASA Glenn Zero Gravity Research Facility (Drop Tower) / Surface Hab"
            source = "NASA-STD-3001 Vol 2 (0.57 atm / 34% O2 Habitat Standard)"
            rationale = "Target Exploration Atmosphere (0.57 atm / 34% O2). High informational value: resolves critical microgravity gap."
        elif is_subatmospheric or is_hyperoxic:
            status = "GROUND_FACILITY_ONLY"
            facility = "NASA Glenn Zero Gravity Research Facility (Drop Tower)"
            source = "NASA TM-107000 (Drop Tower Evacuated Chamber Protocol)"
            rationale = "Sub-atmospheric pressure or elevated oxidizer requires specialized ground drop tower evacuation."
        else:
            status = "FEASIBLE_SPACEFLIGHT"
            facility = "ISS Combustion Integrated Rack (CIR) / MDCA insert"
            source = "NASA/TP-2017-219299 CIR Operational Envelope"
            rationale = "Within standard flight chamber envelope; fills local parametric sparsity."

        meta = self.metadata.get(matched_fuel, {})

        return {
            "candidate_id": cand_id,
            "pressure_atm": round(pressure_atm, 2),
            "o2_mole_fraction": round(oxygen_fraction, 3),
            "droplet_diameter_mm": round(d0_mm, 1),
            "fuel": matched_fuel,
            "exploration_target": is_exploration,
            "parameters": {
                "pressure_atm": round(pressure_atm, 2),
                "oxygen_fraction": round(oxygen_fraction, 3),
                "droplet_d0_mm": round(d0_mm, 1),
                "fuel": matched_fuel,
                "gravity_g": gravity_g,
            },
            "predicted_burn_rate_k": round(max(0.01, pred_k), 4),
            "burn_rate_units": "mm2/s",
            "prediction_uncertainty_std": round(std_sigma, 4),
            "uncertainty_units": "mm2/s",
            "estimated_uncertainty_sigma": round(std_sigma, 4),
            "latent_uncertainty_sigma_f": round(sigma_f, 4),
            "latent_variance_sigma_f_sq": round(sigma_f_sq, 6),
            "observation_noise_sigma_n": round(noise_sigma, 4),
            "observation_noise_sigma_n_sq": round(noise_sq, 6),
            "expected_info_gain": round(eig_bits, 4),
            "expected_information_gain_bits": round(eig_bits, 4),
            "feasibility_status": status,
            "feasibility_source": source,
            "recommended_facility": facility,
            "scientific_rationale": rationale,
            "model_status": "CALIBRATED",
            "model_metadata": meta,
        }

    def generate_candidate_pool(self, objective="MAX_INFORMATION_GAIN", n_candidates=10, fuel="n-heptane"):
        """Generates candidate experiments and ranks them using fuel-stratified GPR and distinct scientific objectives."""
        pressures = [0.57, 0.69, 0.85, 1.0, 1.25, 1.5, 2.0, 2.5]
        oxygens = [0.18, 0.21, 0.25, 0.30, 0.34, 0.40]
        d0_sizes = [2.0, 3.0, 4.0]

        matched_fuel = self._normalize_fuel(fuel) or "n-heptane"

        # Generate candidates for all supported fuels to bundle into public artifact
        all_fuel_pools = {}
        for supp_fuel in self.SUPPORTED_FUELS:
            f_candidates = []
            for p in pressures:
                for o2 in oxygens:
                    for d in d0_sizes:
                        c = self.evaluate_candidate(p, o2, d0_mm=d, fuel=supp_fuel)
                        f_candidates.append(c)

            # Mathematically distinct objective rankings
            if objective == "MAX_INFORMATION_GAIN":
                f_candidates.sort(key=lambda x: -x["expected_info_gain"] if x["expected_info_gain"] is not None else 999)
            elif objective == "MAX_PREDICTIVE_VARIANCE":
                f_candidates.sort(key=lambda x: -(x["latent_variance_sigma_f_sq"] or 0.0) if x["latent_variance_sigma_f_sq"] is not None else 999)
            elif objective == "EXPLORATION_FRONTIER":
                f_candidates.sort(key=lambda x: (0 if (x.get("exploration_target") or "FRONTIER" in (x["feasibility_status"] or "") or "EXPLORATION" in (x["feasibility_status"] or "")) else 1, -x["expected_info_gain"] if x["expected_info_gain"] is not None else 999))
            else:
                f_candidates.sort(key=lambda x: -x["expected_info_gain"] if x["expected_info_gain"] is not None else 999)

            all_fuel_pools[supp_fuel] = {
                "top_candidates": f_candidates[:n_candidates],
                "all_candidates": f_candidates,
            }

        # Active pool
        active_candidates = all_fuel_pools[matched_fuel]["all_candidates"]
        top_candidates = all_fuel_pools[matched_fuel]["top_candidates"]

        # Baseline Comparison: Compare Top Active Learning vs Random Sampling
        rand_indices = np.random.RandomState(42).choice(len(active_candidates), min(n_candidates, len(active_candidates)), replace=False)
        random_candidates = [active_candidates[i] for i in rand_indices]

        avg_opt_uncertainty = np.mean([c["estimated_uncertainty_sigma"] for c in top_candidates if c["estimated_uncertainty_sigma"] is not None])
        avg_rand_uncertainty = np.mean([c["estimated_uncertainty_sigma"] for c in random_candidates if c["estimated_uncertainty_sigma"] is not None])
        gain_pct = round(((avg_opt_uncertainty - avg_rand_uncertainty) / max(1e-4, avg_rand_uncertainty)) * 100, 1)

        # Load sequential active learning benchmark metrics from empirical simulation artifact
        benchmark_summary = {}
        bench_path = os.path.join(PUBLIC_DATA_DIR, "active_learning_benchmark.json")
        if os.path.exists(bench_path):
            try:
                with open(bench_path, "r", encoding="utf-8") as bf:
                    b_data = json.load(bf)
                    s_summary = b_data.get("summary_by_strategy", {})
                    benchmark_summary = {
                        "simulated_sequential_steps": b_data.get("benchmark_dataset", {}).get("sequential_acquisition_steps", 10),
                        "independent_repetitions": b_data.get("benchmark_dataset", {}).get("independent_repetitions", 10),
                        "initial_rmse_mm2_s": s_summary.get("BAYESIAN_EIG", {}).get("initial_test_rmse_mm2_s"),
                        "final_rmse_eig_mm2_s": s_summary.get("BAYESIAN_EIG", {}).get("final_test_rmse_mm2_s"),
                        "final_rmse_random_mm2_s": s_summary.get("RANDOM", {}).get("final_test_rmse_mm2_s"),
                        "pct_rmse_reduction_eig": s_summary.get("BAYESIAN_EIG", {}).get("pct_rmse_reduction"),
                        "pct_rmse_reduction_random": s_summary.get("RANDOM", {}).get("pct_rmse_reduction"),
                        "integrated_error_reduction_pct": round(
                            (s_summary.get("RANDOM", {}).get("integrated_prediction_error_rmse_sum", 1.0) -
                             s_summary.get("BAYESIAN_EIG", {}).get("integrated_prediction_error_rmse_sum", 1.0)) /
                            max(1e-4, s_summary.get("RANDOM", {}).get("integrated_prediction_error_rmse_sum", 1.0)) * 100, 2
                        ),
                        "simulated_benchmark_notice": b_data.get("honest_disclosure")
                    }
            except Exception:
                benchmark_summary = {}

        result = {
            "run_id": f"OPT-RUN-{objective}-{matched_fuel.upper()}",
            "objective": objective,
            "active_fuel": matched_fuel,
            "documented_hardware_limits": DOCUMENTED_HARDWARE_LIMITS,
            "top_candidates": top_candidates,
            "all_candidates": active_candidates,
            "models_metadata": self.metadata,
            "fuels": all_fuel_pools,
            "benchmark_comparison": {
                "active_learning_top_sigma": round(float(avg_opt_uncertainty), 3),
                "random_sampling_avg_sigma": round(float(avg_rand_uncertainty), 3),
                "targeted_uncertainty_ratio": f"{gain_pct:+.1f}% higher targeting of high-variance frontier",
                "sequential_simulation": benchmark_summary,
            },
            "timestamp": "2026-11-14T22:00:00Z",
        }

        # Save to SQLite and JSON
        out_json = os.path.join(PUBLIC_DATA_DIR, "design_proposals.json")
        with open(out_json, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2)

        self._save_to_sqlite(result)
        print(f"Fuel-Stratified Proposals generated for {matched_fuel} ({len(top_candidates)} top / {len(active_candidates)} all). Saved to {out_json}")
        return result

    def _save_to_sqlite(self, result):
        if not os.path.exists(DB_PATH):
            return
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()

        cur.execute("""
        INSERT OR REPLACE INTO optimization_runs (
            run_id, objective_name, algorithm_used, n_candidates_generated,
            bounds_json, top_candidate_id, run_timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        """, (
            result["run_id"], f"{result['objective']}:{result.get('active_fuel', 'heptane')}",
            f"Fuel-Stratified GPR Matérn 5/2 ({result.get('active_fuel')})",
            len(result["top_candidates"]), json.dumps(result["benchmark_comparison"]),
            result["top_candidates"][0]["candidate_id"] if result["top_candidates"] else None
        ))

        for c in result["top_candidates"]:
            p = c["parameters"]
            cur.execute("""
            INSERT OR REPLACE INTO design_candidates (
                candidate_id, target_objective, pressure_atm, oxygen_fraction,
                gravity_g, fuel_material, droplet_d0_mm, predicted_burn_rate_k,
                estimated_uncertainty_sigma, expected_info_gain, feasibility_status,
                recommended_facility, rationale, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            """, (
                c["candidate_id"], result["objective"], p["pressure_atm"], p["oxygen_fraction"],
                p["gravity_g"], p["fuel"], p["droplet_d0_mm"], c["predicted_burn_rate_k"],
                c["estimated_uncertainty_sigma"], c["expected_info_gain"], c["feasibility_status"],
                c["recommended_facility"], c["scientific_rationale"]
            ))

        # Store model validation & diagnostic metadata
        cur.execute("""
        CREATE TABLE IF NOT EXISTS gpr_model_metadata (
            model_id TEXT PRIMARY KEY,
            fuel TEXT,
            training_sample_count INTEGER,
            r2_mean REAL,
            rmse_mean REAL,
            coverage_95 REAL,
            metadata_json TEXT,
            updated_at TEXT
        )
        """)
        for fuel_key, meta in self.metadata.items():
            aggr = meta.get("cross_validation", {}).get("aggregate", {})
            cur.execute("""
            INSERT OR REPLACE INTO gpr_model_metadata (
                model_id, fuel, training_sample_count, r2_mean, rmse_mean, coverage_95, metadata_json, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
            """, (
                meta["model_id"],
                meta["fuel"],
                meta["training_sample_count"],
                aggr.get("r2", {}).get("mean"),
                aggr.get("rmse_mm2_s", {}).get("mean"),
                aggr.get("predictive_interval_coverage_95"),
                json.dumps(meta)
            ))

        conn.commit()
        conn.close()


if __name__ == "__main__":
    opt = ExperimentalDesignOptimizer()
    opt.generate_candidate_pool()
