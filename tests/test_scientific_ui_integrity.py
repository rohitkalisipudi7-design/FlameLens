import json
from pathlib import Path
import pytest

ROOT = Path(__file__).parent.parent
PROPOSALS_PATH = ROOT / "app" / "public" / "data" / "design_proposals.json"
OPTIMIZER_VIEW_PATH = ROOT / "app" / "src" / "views" / "optimizerView.js"
OPTIMIZER_FACILITY_PATH = ROOT / "app" / "src" / "render" / "lab" / "optimizerFacility.js"
OPTIMIZER_PY_PATH = ROOT / "scripts" / "experimental_design_optimizer.py"


@pytest.fixture
def proposals_data():
    with open(PROPOSALS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def test_documented_hardware_limits_specification(proposals_data):
    """Verify hardware limits align with documented NASA publications and standards."""
    limits = proposals_data.get("documented_hardware_limits", {})
    assert "ISS_CIR_MDCA" in limits
    assert "GROUND_DROP_TOWER" in limits
    assert "EXPLORATION_ATMOSPHERE" in limits

    # ISS CIR / MDCA limits per NASA/TP-2017-219299
    cir = limits["ISS_CIR_MDCA"]
    assert cir["min_pressure_atm"] == 0.70
    assert cir["max_pressure_atm"] == 3.00
    assert cir["max_o2_mole_fraction"] == 0.30
    assert "NASA/TP-2017-219299" in cir["source"]

    # Ground Drop Tower limits per NASA TM-107000
    drop = limits["GROUND_DROP_TOWER"]
    assert drop["min_pressure_atm"] == 0.30
    assert drop["max_pressure_atm"] == 2.50
    assert drop["max_o2_mole_fraction"] == 0.40
    assert "NASA TM-107000" in drop["source"]

    # Exploration Atmosphere per NASA-STD-3001 Vol 2
    exp = limits["EXPLORATION_ATMOSPHERE"]
    assert abs(exp["target_pressure_atm"] - 0.57) < 0.01
    assert abs(exp["target_o2_mole_fraction"] - 0.34) < 0.01
    assert "NASA-STD-3001" in exp["source"]


def test_four_way_feasibility_classification(proposals_data):
    """Verify candidates are categorized into 4 mutually exclusive feasibility states."""
    valid_states = {
        "FEASIBLE_SPACEFLIGHT",
        "GROUND_FACILITY_ONLY",
        "HYPOTHETICAL_FRONTIER",
        "UNSUPPORTED"
    }

    fuels = proposals_data.get("fuels", {})
    assert "methanol" in fuels
    assert "n-heptane" in fuels

    total_candidates = 0
    for fuel_key, fuel_obj in fuels.items():
        candidates = fuel_obj.get("all_candidates", [])
        assert len(candidates) > 0
        total_candidates += len(candidates)

        for c in candidates:
            status = c.get("feasibility_status")
            assert status in valid_states, f"Candidate {c.get('candidate_id')} has invalid status {status}"
            assert "feasibility_source" in c
            assert len(c["feasibility_source"]) > 0

            # If pressure < 0.70 or O2 > 0.30, cannot be FEASIBLE_SPACEFLIGHT (ISS CIR limit)
            p = c.get("pressure_atm")
            o2 = c.get("o2_mole_fraction")
            if p is not None and o2 is not None:
                if p < 0.70 or o2 > 0.30:
                    assert status != "FEASIBLE_SPACEFLIGHT", (
                        f"Candidate {c.get('candidate_id')} with P={p}, O2={o2} incorrectly labeled FEASIBLE_SPACEFLIGHT"
                    )

    assert total_candidates >= 40


def test_gravity_disclosure_verbatim_notice():
    """Verify mandatory scientific notice for partial-gravity extrapolation appears verbatim in frontend code."""
    view_text = OPTIMIZER_VIEW_PATH.read_text(encoding="utf-8")
    expected_notice = (
        "Scientific Notice: The current empirical droplet combustion dataset contains no partial-gravity trials. "
        "Predictions at 0.16g and 0.38g are extrapolations and must not be interpreted as experimentally validated gravity-dependent predictions."
    )
    assert expected_notice in view_text, "Verbatim partial-gravity disclosure notice missing from optimizerView.js"

    # Verify 0g is empirical microgravity reference
    assert "Empirical microgravity reference condition (ISS CIR / FLEX)" in view_text

    # Verify 1g terrestrial notice
    assert "Terrestrial 1.0g condition is unsupported" in view_text or "Terrestrial 1.0g conditions are unsupported" in view_text


def test_state_synchronization_in_frontend():
    """Verify that optimizerView.js and optimizerFacility.js track latest evaluated pool and retain candidate selection."""
    facility_text = OPTIMIZER_FACILITY_PATH.read_text(encoding="utf-8")
    view_text = OPTIMIZER_VIEW_PATH.read_text(encoding="utf-8")

    # optimizerFacility.js must export evaluateCandidateFeasibility and DOCUMENTED_HARDWARE_LIMITS
    assert "export function evaluateCandidateFeasibility" in facility_text
    assert "export const DOCUMENTED_HARDWARE_LIMITS" in facility_text

    # optimizerFacility.js must track latestEvaluatedPool for raycasting
    assert "latestEvaluatedPool" in facility_text

    # optimizerView.js must maintain selectedCandidateId across filter updates
    assert "selectedCandidateId" in view_text
    assert "updateConstraints" in view_text


def test_scientific_dossier_fields(proposals_data):
    """Verify candidates and model metadata contain all physical quantities and units."""
    fuels = proposals_data.get("fuels", {})
    for fuel_name in ["methanol", "n-heptane"]:
        cand = fuels[fuel_name]["top_candidates"][0]
        assert "predicted_burn_rate_k" in cand
        assert "prediction_uncertainty_std" in cand
        assert "expected_information_gain_bits" in cand
        assert "pressure_atm" in cand
        assert "o2_mole_fraction" in cand
        assert "droplet_diameter_mm" in cand
        assert "scientific_rationale" in cand
        assert cand["burn_rate_units"] == "mm2/s"
        assert cand["uncertainty_units"] == "mm2/s"

    # Verify model metadata contains sample counts and 5-fold CV aggregates
    meta = proposals_data.get("models_metadata", {})
    assert meta["methanol"]["training_sample_count"] == 150
    assert meta["n-heptane"]["training_sample_count"] == 106
    assert "cross_validation" in meta["methanol"]
    assert "cross_validation" in meta["n-heptane"]


def test_no_unsupported_marketing_claims():
    """Verify forbidden marketing claims are absent from the codebase."""
    forbidden = ["NASA-approved", "experimentally validated", "gravity-optimized"]
    checked_files = [OPTIMIZER_VIEW_PATH, OPTIMIZER_FACILITY_PATH, OPTIMIZER_PY_PATH]

    for file_path in checked_files:
        content = file_path.read_text(encoding="utf-8")
        for claim in forbidden:
            # We allow the negative check string inside the disclosure notice or tests
            # Check for positive assertions of these claims
            lower = content.lower()
            if claim.lower() in lower:
                # The only allowed occurrence is the explicit negation in the disclosure notice:
                # "must not be interpreted as experimentally validated gravity-dependent predictions"
                lines = [line for line in content.splitlines() if claim.lower() in line.lower()]
                for line in lines:
                    assert "must not be interpreted as experimentally validated" in line or "scientific notice" in line.lower(), (
                        f"Forbidden marketing claim '{claim}' found in {file_path.name}: {line}"
                    )

