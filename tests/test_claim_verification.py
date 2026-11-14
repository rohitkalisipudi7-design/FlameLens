"""Unit tests for Module F: Scientific Claim Verification Engine."""
import os
import json
import pytest
from scripts.claim_verification import ScientificClaimVerifier, CORE_VERIFIED_CLAIMS

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DATA_DIR = os.path.join(BASE_DIR, "app", "public", "data")


def test_claim_verifier_initialization():
    """Verify claim verifier loads core claims correctly."""
    verifier = ScientificClaimVerifier()
    assert len(verifier.claims) >= 6
    assert any(c["claim_id"] == "CLM-001" for c in verifier.claims)


def test_verify_experimentally_verified_claim():
    """Verify that a claim backed by direct flight observations is tagged EXPERIMENTALLY_VERIFIED."""
    verifier = ScientificClaimVerifier()
    res = verifier.verify_statement("Heptane droplets burning in microgravity exhibit secondary cool flame combustion")
    assert res["claim_status"] == "EXPERIMENTALLY_VERIFIED"
    assert res["claim_id"] == "CLM-001"
    assert len(res["supporting_evidence"]) > 0


def test_verify_conflicting_evidence_claim():
    """Verify that a controversial or non-universal claim triggers CONFLICTING_EVIDENCE."""
    verifier = ScientificClaimVerifier()
    res = verifier.verify_statement("NASA-STD-6001B upward flame propagation Test 1 in 1g vs 0g Saffire silicone")
    assert res["claim_status"] == "CONFLICTING_EVIDENCE"
    assert res["claim_id"] == "CLM-002"
    assert len(res["contradicting_evidence"]) > 0


def test_verify_insufficient_evidence_claim():
    """Verify that an untested regime triggers INSUFFICIENT_EVIDENCE."""
    verifier = ScientificClaimVerifier()
    # Query without matching NASA keywords
    res = verifier.verify_statement("Xenon gas addition at 50 atm in krypton plasma arc.")
    assert res["claim_status"] == "INSUFFICIENT_EVIDENCE"
    assert "No direct NASA empirical flight test" in res["explanation"]


def test_verified_claims_json_artifact():
    """Verify that the generated verified_claims.json file exists and adheres to schema."""
    path = os.path.join(PUBLIC_DATA_DIR, "verified_claims.json")
    assert os.path.exists(path), f"Missing artifact: {path}"
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert isinstance(data, list)
    assert len(data) >= 6
    for claim in data:
        assert "claim_id" in claim
        assert "category" in claim
        assert "claim_text" in claim
        assert "verification_explanation" in claim
        assert claim["category"] in [
            "EXPERIMENTALLY_VERIFIED",
            "LITERATURE_SUPPORTED",
            "MODEL_PREDICTED",
            "CONFLICTING_EVIDENCE",
            "INSUFFICIENT_EVIDENCE",
        ]
