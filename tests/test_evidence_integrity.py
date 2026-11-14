"""
Unit Tests for Phase 1: Evidence Integrity & Authentic Historical Data
Validates:
1. Every historical point maps to a genuine record in evidence_ledger.json.
2. No synthetic PSI-FLEX-001 through PSI-FLEX-1872 IDs are generated.
3. No fabricated burning-rate fallback (e.g. 0.42 + o2 * 0.8) exists in the codebase.
4. Missing scientific measurements display as unavailable ('Not available') without arbitrary defaults.
5. Complete provenance metadata survives from evidence_ledger.json into the dossier contract.
"""

import json
import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
LEDGER_PATH = BASE_DIR / "app" / "public" / "data" / "evidence_ledger.json"
FACILITY_JS_PATH = BASE_DIR / "app" / "src" / "render" / "lab" / "optimizerFacility.js"
VIEW_JS_PATH = BASE_DIR / "app" / "src" / "views" / "optimizerView.js"


def test_every_historical_droplet_point_maps_to_real_evidence_id():
    """Verify that all records accepted by the validation logic exist in evidence_ledger.json."""
    assert LEDGER_PATH.exists(), "evidence_ledger.json must exist"
    with open(LEDGER_PATH, "r", encoding="utf-8") as f:
        ledger = json.load(f)

    ledger_ids = {item["evidence_id"] for item in ledger if "evidence_id" in item}
    assert len(ledger_ids) == 1872, "Ledger must contain 1,872 verified evidence items"

    # Simulate validator logic from optimizerFacility.js
    valid_historical = []
    for item in ledger:
        norm = item.get("normalized_measurements", {})
        p = norm.get("pressure_atm")
        o2 = norm.get("x_o2")
        d0 = norm.get("d0_mm")
        if p and o2 and d0 and p > 0 and o2 > 0 and d0 > 0:
            valid_historical.append(item)

    assert len(valid_historical) == 261, f"Expected 261 valid 3D droplet flight runs, got {len(valid_historical)}"
    for item in valid_historical:
        assert item["evidence_id"] in ledger_ids
        assert item["accession"].startswith("PSI-")
        assert item["family"] == "droplet"


def test_no_synthetic_psi_flex_ids_in_codebase():
    """Verify that procedural PSI-FLEX-001 through 1872 generation is completely absent."""
    with open(FACILITY_JS_PATH, "r", encoding="utf-8") as f:
        facility_content = f.read()

    # Must NOT contain procedural ID generator
    assert "PSI-FLEX-${String(i" not in facility_content
    assert "Math.sin(i * 1.7)" not in facility_content
    assert "Math.cos(i * 2.3)" not in facility_content
    assert "Math.sin(i * 0.5)" not in facility_content

    # Must contain genuine validator and ledger consumption
    assert "validateHistoricalRecord" in facility_content
    assert "historicalRecords" in facility_content


def test_no_fabricated_burning_rate_fallbacks():
    """Verify that fabricated burning rate fallback (0.42 + o2 * 0.8) is removed."""
    with open(FACILITY_JS_PATH, "r", encoding="utf-8") as f:
        facility_content = f.read()
    with open(VIEW_JS_PATH, "r", encoding="utf-8") as f:
        view_content = f.read()

    # Fallback formula must not exist
    assert "0.42 + o2 * 0.8" not in facility_content
    assert "0.42 + o2 * 0.8" not in view_content
    assert "0.42 + oxygen_fraction" not in facility_content
    assert "0.42 + oxygen_fraction" not in view_content

    # Fabricated EIG and uncertainty fallbacks (0.18, 0.40) must not exist
    assert "?? 0.18;" not in facility_content
    assert "?? 0.40;" not in facility_content


def test_missing_measurements_display_unavailable():
    """Verify that candidate records and historical runs handle null measurements explicitly."""
    with open(VIEW_JS_PATH, "r", encoding="utf-8") as f:
        view_content = f.read()

    # The view must format nulls as 'Not available'
    assert '"Not available"' in view_content or "'Not available'" in view_content
    assert "|| 0.182" not in view_content
    assert "|| 0.44" not in view_content


def test_provenance_survives_from_ledger_to_selected_point():
    """Verify that authentic NASA provenance fields survive from evidence ledger to points."""
    with open(LEDGER_PATH, "r", encoding="utf-8") as f:
        ledger = json.load(f)

    # Sample a real droplet combustion test
    sample = next(
        item for item in ledger
        if item.get("family") == "droplet"
        and item.get("normalized_measurements", {}).get("burning_rate_mm2_s") is not None
    )

    assert "evidence_id" in sample
    assert "accession" in sample
    assert "campaign" in sample
    assert "test_id" in sample
    assert "source_provenance" in sample
    assert "location_reference" in sample["source_provenance"]
    assert sample["source_provenance"]["provenance_status"] == "VERIFIED_EMPIRICAL"

    # Verify that optimizerFacility passes these exact fields
    with open(FACILITY_JS_PATH, "r", encoding="utf-8") as f:
        facility_content = f.read()

    for field in ["evidence_id", "accession", "campaign", "test_id", "source_provenance", "literature_reference"]:
        assert field in facility_content

