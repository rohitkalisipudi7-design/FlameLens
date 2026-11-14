"""Unit tests for Module A: Scientific Quality Gate and Module B: Evidence Ledger."""
import os
import json
import pytest
from scripts.scientific_quality_gate import ScientificQualityGate, PHYSICAL_BOUNDS
from scripts.build_evidence_ledger import clean_json_val

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
PUBLIC_DATA_DIR = os.path.join(BASE_DIR, "app", "public", "data")


def test_physical_bounds_loaded():
    """Ensure fundamental combustion parameters have explicit physical bounds."""
    assert "pressure_atm" in PHYSICAL_BOUNDS
    assert "x_o2" in PHYSICAL_BOUNDS
    assert "d0_mm" in PHYSICAL_BOUNDS
    assert PHYSICAL_BOUNDS["x_o2"]["max"] == 1.0
    assert PHYSICAL_BOUNDS["pressure_atm"]["min"] > 0


def test_quality_gate_gas_sum_impossibility():
    """Verify that a physically impossible oxidizer + inert mixture > 1.0 is flagged."""
    gate = ScientificQualityGate()
    row = {
        "uid": "TEST-01",
        "family": "droplet",
        "fuel": "Heptane",
        "x_o2": 0.50,
        "x_n2": 0.50,
        "x_co2": 0.20,  # Sum = 1.20 > 1.0
        "pressure_atm": 1.0,
        "d0_mm": 2.0,
        "source_file": "table.csv",
        "source_line": 10,
    }
    res = gate.evaluate_record(row)
    assert "INVALID_RECORD" in res["quality_flags"]
    assert any("sum to" in log for log in res["rule_logs"])
    assert res["validation_score"] < 80.0


def test_quality_gate_diameter_inconsistency():
    """Verify that extinction diameter exceeding initial diameter is flagged."""
    gate = ScientificQualityGate()
    row = {
        "uid": "TEST-02",
        "family": "droplet",
        "fuel": "Methanol",
        "x_o2": 0.21,
        "pressure_atm": 1.0,
        "d0_mm": 2.0,
        "d_ext_mm": 2.8,  # dext > d0
        "source_file": "table.csv",
        "source_line": 15,
    }
    res = gate.evaluate_record(row)
    assert "INVALID_RECORD" in res["quality_flags"]
    assert any("extinction diameter" in log.lower() for log in res["rule_logs"])


def test_quality_gate_clean_record_passes():
    """Verify that a nominal, validated experiment receives VALIDATED status with high score."""
    gate = ScientificQualityGate()
    row = {
        "uid": "TEST-03",
        "family": "droplet",
        "fuel": "Heptane",
        "x_o2": 0.21,
        "x_n2": 0.79,
        "pressure_atm": 1.0,
        "d0_mm": 2.5,
        "d_ext_mm": 1.1,
        "source_file": "clean_table.csv",
        "source_line": 25,
    }
    res = gate.evaluate_record(row)
    assert res["primary_status"] == "VALIDATED"
    assert res["validation_score"] == 100.0


def test_clean_json_val_handles_nan_and_inf():
    """Ensure JSON sanitizer eliminates NaNs and Infinities for browser compliance."""
    data = {
        "a": float("nan"),
        "b": float("inf"),
        "c": 42.5,
        "nested": {"d": float("nan"), "e": "text"},
    }
    cleaned = clean_json_val(data)
    assert cleaned["a"] is None
    assert cleaned["b"] is None
    assert cleaned["c"] == 42.5
    assert cleaned["nested"]["d"] is None
    assert cleaned["nested"]["e"] == "text"


def test_evidence_ledger_file_integrity():
    """Verify generated evidence ledger exists and has valid schema."""
    ledger_path = os.path.join(PUBLIC_DATA_DIR, "evidence_ledger.json")
    assert os.path.exists(ledger_path)
    with open(ledger_path, "r", encoding="utf-8") as f:
        records = json.load(f)

    assert len(records) >= 1800
    sample = records[0]
    assert "evidence_id" in sample
    assert sample["evidence_id"].startswith("EVID-")
    assert "source_provenance" in sample
    assert "location_reference" in sample["source_provenance"]
    assert "scientific_quality" in sample
    assert "quality_score" in sample["scientific_quality"]

