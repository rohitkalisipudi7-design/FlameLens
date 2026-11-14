"""Unit tests for Module B: Scientific Safety Envelope Generator."""
import json
import os
import pytest
from scripts.safety_envelope_engine import SafetyEnvelopeEngine, EMPIRICAL_BOUNDS

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DATA_DIR = os.path.join(BASE_DIR, "app", "public", "data")


def test_safety_envelope_initialization():
    """Verify engine loads experimental coordinates from ledger."""
    engine = SafetyEnvelopeEngine()
    assert len(engine.experiments) > 1000
    assert any("heptane" in str(e["fuel"]).lower() for e in engine.experiments)


def test_safety_envelope_in_domain_classification():
    """Verify nominal ISS conditions (1.0 atm, 21% O2) are EXPERIMENTALLY_SUPPORTED."""
    engine = SafetyEnvelopeEngine()
    res = engine.classify_point(pressure_atm=1.0, oxygen_fraction=0.21, gravity_g=0.0)
    assert res["evidence_class"] in ["EXPERIMENTALLY_SUPPORTED", "MODEL_SUPPORTED"]
    assert res["nearest_neighbor_dist"] is not None
    assert res["is_extrapolation"] is False


def test_safety_envelope_exploration_atmosphere_frontier():
    """Verify Lunar/Mars exploration standard (0.57 atm, 34% O2) is tagged HIGH_UNCERTAINTY."""
    engine = SafetyEnvelopeEngine()
    res = engine.classify_point(pressure_atm=0.57, oxygen_fraction=0.34, gravity_g=0.0)
    assert res["evidence_class"] == "HIGH_UNCERTAINTY"
    assert "NASA Exploration Atmosphere" in res["rationale"]
    assert res["is_extrapolation"] is True


def test_safety_envelope_physical_impossibility():
    """Verify impossible gas mixture (> 1.0) is rejected as UNSUPPORTED."""
    engine = SafetyEnvelopeEngine()
    res = engine.classify_point(
        pressure_atm=1.0, oxygen_fraction=0.60, diluent_co2=0.50  # Sum = 1.10 > 1.0
    )
    assert res["evidence_class"] == "UNSUPPORTED"
    assert "physical impossibility" in res["rationale"].lower()


def test_safety_envelope_json_artifact_schema():
    """Verify generated safety_envelope.json contains valid grid and legal disclaimer."""
    json_path = os.path.join(PUBLIC_DATA_DIR, "safety_envelope.json")
    assert os.path.exists(json_path)
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert "grid" in data
    assert "p_ticks" in data
    assert "o2_ticks" in data
    assert "legal_disclaimer" in data
    assert "NOT a certified spacecraft fire-safety determination" in data["legal_disclaimer"]
    assert len(data["grid"]) >= 10
