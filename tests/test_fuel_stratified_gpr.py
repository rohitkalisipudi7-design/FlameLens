"""
Automated Verification Suite: Fuel-Stratified Gaussian Process Models (Phase 2)
Verifies:
1. Mutual exclusivity of Methanol and n-Heptane training cohorts.
2. Complete exclusion of unsupported fuels from training sets.
3. Fuel selection activates correct surrogate model and produces distinct burning rate predictions.
4. Explicit rejection with 'Model not calibrated for selected fuel.' for unsupported fuels.
5. Completeness and validity of model metadata exports.
"""

import json
from pathlib import Path
import pytest
from scripts.experimental_design_optimizer import ExperimentalDesignOptimizer

LEDGER_PATH = Path("app/public/data/evidence_ledger.json")
PROPOSALS_PATH = Path("app/public/data/design_proposals.json")


@pytest.fixture(scope="module")
def optimizer():
    return ExperimentalDesignOptimizer()


def test_fuel_cohort_mutual_exclusivity(optimizer):
    """Verify Methanol and n-Heptane cohorts are dynamically computed, non-empty, and mutually exclusive."""
    cohorts = optimizer.fuel_cohorts
    assert "methanol" in cohorts, "Methanol cohort must be present"
    assert "n-heptane" in cohorts, "n-Heptane cohort must be present"

    methanol_records = cohorts["methanol"]
    heptane_records = cohorts["n-heptane"]

    assert len(methanol_records) > 0, "Methanol cohort must not be empty"
    assert len(heptane_records) > 0, "n-Heptane cohort must not be empty"

    # Runtime counts calculated directly from authentic ledger (Methanol N=150, n-Heptane N=106)
    assert len(methanol_records) == 150, f"Expected 150 Methanol runs, got {len(methanol_records)}"
    assert len(heptane_records) == 106, f"Expected 106 n-Heptane runs, got {len(heptane_records)}"

    methanol_ids = {r.get("evidence_id") for r in methanol_records if r.get("evidence_id")}
    heptane_ids = {r.get("evidence_id") for r in heptane_records if r.get("evidence_id")}

    overlap = methanol_ids.intersection(heptane_ids)
    assert len(overlap) == 0, f"Cohorts must be mutually exclusive! Found {len(overlap)} overlapping IDs: {overlap}"


def test_unsupported_fuels_not_in_training_cohorts(optimizer):
    """Verify that unsupported fuels (PMMA, Methane, etc.) never enter either model's training set."""
    cohorts = optimizer.fuel_cohorts

    for r in cohorts["methanol"]:
        fuel_str = str(r.get("material_or_fuel", "")).strip().lower()
        assert "methanol" in fuel_str, f"Non-methanol record found in methanol cohort: {r}"
        assert r.get("family") == "droplet", "Only droplet experiments allowed in cohort"
        assert "PSI-69" in str(r.get("accession", "")), "Only PSI-69 FLEX experiments allowed in cohort"

    for r in cohorts["n-heptane"]:
        fuel_str = str(r.get("material_or_fuel", "")).strip().lower()
        assert "heptane" in fuel_str, f"Non-heptane record found in n-heptane cohort: {r}"
        assert r.get("family") == "droplet", "Only droplet experiments allowed in cohort"
        assert "PSI-69" in str(r.get("accession", "")), "Only PSI-69 FLEX experiments allowed in cohort"


def test_fuel_selection_changes_active_model_and_predictions_differ(optimizer):
    """Verify fuel selection changes active model and yields distinct predictions for identical conditions."""
    cand_params = {
        "pressure_atm": 1.0,
        "oxygen_fraction": 0.21,
        "droplet_d0_mm": 2.5,
        "gravity_g": 0.0
    }

    eval_methanol = optimizer.evaluate_candidate(cand_params, fuel="methanol")
    eval_heptane = optimizer.evaluate_candidate(cand_params, fuel="n-heptane")

    # Verify model identities
    assert eval_methanol["model_metadata"]["fuel"] == "methanol"
    assert eval_methanol["model_metadata"]["model_id"] == "GPR-MATERN52-METHANOL"
    assert eval_heptane["model_metadata"]["fuel"] == "n-heptane"
    assert eval_heptane["model_metadata"]["model_id"] == "GPR-MATERN52-N_HEPTANE"

    # Both predictions must be valid numerical burn rates
    k_meth = eval_methanol["predicted_burn_rate_k"]
    k_hept = eval_heptane["predicted_burn_rate_k"]
    assert isinstance(k_meth, (int, float)) and k_meth > 0
    assert isinstance(k_hept, (int, float)) and k_hept > 0

    # Physical combustion kinetics between Methanol and n-Heptane must differ
    assert k_meth != k_hept, f"Methanol and n-Heptane predictions must differ! Got {k_meth} vs {k_hept}"


def test_unsupported_fuel_explicit_rejection(optimizer):
    """Verify unsupported fuels return explicit rejection and zero uncalibrated predictions."""
    cand_params = {
        "pressure_atm": 1.0,
        "oxygen_fraction": 0.21,
        "droplet_d0_mm": 2.0,
        "gravity_g": 0.0
    }

    for unsupported in ["pmma", "methane", "ethylene", "diesel", "unknown"]:
        res = optimizer.evaluate_candidate(cand_params, fuel=unsupported)
        assert res["predicted_burn_rate_k"] is None, f"Predicted burn rate must be None for {unsupported}"
        assert res["estimated_uncertainty_sigma"] is None, f"Uncertainty sigma must be None for {unsupported}"
        assert res["model_status"] == "UNSUPPORTED_FUEL", f"Model status must be UNSUPPORTED_FUEL for {unsupported}"
        assert res["error_message"] == "Model not calibrated for selected fuel.", (
            f"Expected explicit rejection message for {unsupported}"
        )
        assert res["model_metadata"] is None, f"Model metadata must be None for {unsupported}"


def test_model_metadata_completeness(optimizer):
    """Verify model metadata structure, schema, and parameter domain boundaries."""
    for fuel_name in ["methanol", "n-heptane"]:
        meta = optimizer.get_model_metadata(fuel_name)
        assert meta is not None, f"Metadata must exist for {fuel_name}"
        assert "model_id" in meta
        assert meta["fuel"] == fuel_name
        assert meta["training_sample_count"] in (150, 106)
        assert "NASA PSI-69" in meta["training_data_source"]
        assert "Matern" in meta["kernel_configuration"]
        assert "nu=2.5" in meta["kernel_configuration"]
        assert meta["validation_status"] == "CALIBRATED_EMPIRICAL"

        ranges = meta["supported_parameter_ranges"]
        for param in ["pressure_atm", "oxygen_fraction", "droplet_d0_mm"]:
            assert param in ranges, f"{param} range missing in {fuel_name} metadata"
            assert ranges[param]["min"] < ranges[param]["max"], f"Invalid range for {param}"


def test_proposals_json_contains_fuel_cohorts_and_metadata():
    """Verify the generated design_proposals.json contains fuel stratified candidates and metadata."""
    assert PROPOSALS_PATH.exists(), "design_proposals.json must exist"
    with open(PROPOSALS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert "fuels" in data, "fuels key must exist in design_proposals.json"
    assert "methanol" in data["fuels"]
    assert "n-heptane" in data["fuels"]
    assert len(data["fuels"]["methanol"]["all_candidates"]) > 0
    assert len(data["fuels"]["n-heptane"]["all_candidates"]) > 0

    assert "models_metadata" in data
    assert "methanol" in data["models_metadata"]
    assert "n-heptane" in data["models_metadata"]
    assert data["models_metadata"]["methanol"]["training_sample_count"] == 150
    assert data["models_metadata"]["n-heptane"]["training_sample_count"] == 106
