"""Unit tests for Module D: Scientific Contradiction Detector."""
import json
import os
import pytest
from scripts.scientific_contradiction_detector import ScientificContradictionDetector

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DATA_DIR = os.path.join(BASE_DIR, "app", "public", "data")


def test_contradiction_detector_initialization():
    """Verify contradiction detector loads curated claims with condition vectors."""
    detector = ScientificContradictionDetector()
    assert len(detector.claims) >= 6
    for c in detector.claims:
        assert "condition_vector" in c
        assert "methodology" in c


def test_classify_methodological_difference():
    """Verify NASA-STD-6001B (1g upward) vs Saffire-II (0g duct) is tagged METHODOLOGICAL_DIFFERENCE."""
    detector = ScientificContradictionDetector()
    ca = detector.claims[0]  # Silicone 1g upward
    cb = detector.claims[1]  # Silicone Saffire 0g duct
    res = detector.analyze_claim_pair(ca, cb)
    
    assert res["conflict_category"] == "METHODOLOGICAL_DIFFERENCE"
    assert "buoyant" in res["discrepancy_explanation"].lower()
    assert res["methodological_compatibility_score"] >= 0.80


def test_classify_interpretation_difference():
    """Verify film theory vs FLEX helium measurement is tagged INTERPRETATION_DIFFERENCE."""
    detector = ScientificContradictionDetector()
    ca = detector.claims[2]  # Film theory estimate
    cb = detector.claims[3]  # FLEX flight measurement
    res = detector.analyze_claim_pair(ca, cb)
    
    assert res["conflict_category"] == "INTERPRETATION_DIFFERENCE"
    assert "thermal conductivity" in res["discrepancy_explanation"].lower()


def test_human_review_storage():
    """Verify human reviewer decisions are persisted separately into SQLite."""
    detector = ScientificContradictionDetector()
    ok = detector.record_human_review(
        conflict_id="CONF-CLM-V41-01-CLM-V41-02",
        decision="ACCEPTED_METHODOLOGICAL_DIFFERENCE",
        notes="Confirmed by Urban et al., 2019."
    )
    assert ok is True


def test_scientific_contradictions_json_artifact():
    """Verify public JSON artifact matches expected schema."""
    json_path = os.path.join(PUBLIC_DATA_DIR, "scientific_contradictions.json")
    assert os.path.exists(json_path)
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert "contradiction_pairs" in data
    assert len(data["contradiction_pairs"]) >= 3
    for p in data["contradiction_pairs"]:
        assert "conflict_id" in p
        assert "conflict_category" in p
        assert "discrepancy_explanation" in p

