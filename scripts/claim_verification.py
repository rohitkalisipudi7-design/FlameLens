"""Scientific Claim Verification Engine for Flame in Freefall V4.

Implements MODULE F:
Classifies scientific claims into 5 rigorous epistemic categories:
1. EXPERIMENTALLY_VERIFIED (Direct empirical flight measurements in PSI/OLAP)
2. LITERATURE_SUPPORTED (Documented in NTRS papers, theoretical models)
3. MODEL_PREDICTED (Estimated via k-NN, d² law, or chemical kinetic mechanisms)
4. CONFLICTING_EVIDENCE (Contradictions between 1g terrestrial screening & 0g spaceflight)
5. INSUFFICIENT_EVIDENCE (Unexplored atmospheres, missing experimental regimes)
"""
import json
import os
import re

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
PUBLIC_DATA_DIR = os.path.join(BASE_DIR, "app", "public", "data")

CORE_VERIFIED_CLAIMS = [
    {
        "claim_id": "CLM-001",
        "claim_text": "Heptane droplets burning in microgravity exhibit secondary cool flame combustion following visible flame radiative extinction.",
        "category": "EXPERIMENTALLY_VERIFIED",
        "primary_investigation": "PSI-69 (FLEX)",
        "supporting_evidence_ids": ["EVID-5C7F1ED4E37A", "PSI-69:DropletData-FLEX"],
        "contradicting_evidence_ids": [],
        "literature_citations": ["Nayagam et al., 2012 (Combustion and Flame 159)", "Williams et al., 2014"],
        "verification_explanation": "Directly observed across multiple large heptane droplet trials aboard the ISS CIR rack. After hot flame soot luminescence extinguishes, the droplet silhouette continues shrinking due to low-temperature oxidation (~430 °C).",
        "confidence": 0.98,
    },
    {
        "claim_id": "CLM-002",
        "claim_text": "NASA-STD-6001B upward flame propagation (Test 1) in 1g is non-conservative for certain materials in microgravity with concurrent flow.",
        "category": "CONFLICTING_EVIDENCE",
        "primary_investigation": "PSI-99 (Saffire-II) / PSI-25 (BASS-II)",
        "supporting_evidence_ids": ["PSI-99:Saffire-II-Silicone", "PSI-25:BASS-II-PMMA"],
        "contradicting_evidence_ids": ["NASA-STD-6001B-Test1"],
        "literature_citations": ["Urban et al., 2019 (NASA/TM-2019-220054)", "Dietrich et al., 2017"],
        "verification_explanation": "Terrestrial 1g certification burns samples upward where buoyant convective flow sweeps heat into the unburned solid. In 0g with low concurrent airflows (e.g. 20 cm/s cabin ventilation), flame residence times increase and oxygen diffusion differs. Saffire-II confirmed silicone self-extinguished in 0g while burning completely in 1g, whereas thin SIBAL fabrics propagated continuously.",
        "confidence": 0.95,
    },
    {
        "claim_id": "CLM-003",
        "claim_text": "Ambient carbon dioxide (CO₂) above 30% concentration reliably extinguishes methanol droplet flames in microgravity.",
        "category": "EXPERIMENTALLY_VERIFIED",
        "primary_investigation": "PSI-69 (FLEX)",
        "supporting_evidence_ids": ["PSI-69:FLEX-CO2-Trials"],
        "contradicting_evidence_ids": [],
        "literature_citations": ["Hicks et al., 2010 (NTRS-20100033120)"],
        "verification_explanation": "97% of methanol droplets tested in FLEX with >30% CO₂ extinguished prior to burnout due to enhanced gas-phase radiative loss and lower flame temperature. Supports the use of CO₂ portable fire extinguishers aboard the ISS.",
        "confidence": 0.96,
    },
    {
        "claim_id": "CLM-004",
        "claim_text": "Droplet burning rates under NASA Lunar/Mars exploration atmospheres (0.57 atm, 34% O₂) are known from historical ISS test data.",
        "category": "INSUFFICIENT_EVIDENCE",
        "primary_investigation": "PSI-69 (FLEX) Coverage Gap",
        "supporting_evidence_ids": [],
        "contradicting_evidence_ids": ["PSI-69:Minimum-Pressure-0.69atm"],
        "literature_citations": ["NASA Spacecraft Fire Safety Workshop 2024", "JSC-29353B"],
        "verification_explanation": "FLEX droplet trials never tested ambient pressures below 0.69 atm. While 34% oxygen is within tested range, the coupled condition of 0.57 atm and 34% O₂ represents an empirical blind spot. Any prediction is an extrapolation.",
        "confidence": 0.99,
    },
    {
        "claim_id": "CLM-005",
        "claim_text": "Helium diluent increases the burning rate K of liquid fuel droplets in microgravity compared to nitrogen diluent.",
        "category": "EXPERIMENTALLY_VERIFIED",
        "primary_investigation": "PSI-69 (FLEX)",
        "supporting_evidence_ids": ["PSI-69:FLEX-He-Runs"],
        "contradicting_evidence_ids": [],
        "literature_citations": ["Farouk et al., 2014 (Combustion Theory and Modelling)"],
        "verification_explanation": "FLEX measured an average 40% higher burning rate in helium-diluted atmospheres (>20% He) due to helium's high thermal conductivity accelerating heat transfer back to the liquid droplet surface.",
        "confidence": 0.94,
    },
    {
        "claim_id": "CLM-006",
        "claim_text": "Microgravity droplet diameter shrinkage strictly follows the d²-law (d² = d₀² - K·t) throughout the entire lifetime without deviation.",
        "category": "CONFLICTING_EVIDENCE",
        "primary_investigation": "PSI-69 (FLEX)",
        "supporting_evidence_ids": ["PSI-69:Steady-Burning-Regimes"],
        "contradicting_evidence_ids": ["PSI-69:Disruptive-Boiling", "PSI-69:Cool-Flame-Transition"],
        "literature_citations": ["Law, C.K., Combustion Physics (2006)", "Nayagam et al., 2012"],
        "verification_explanation": "The d² law holds during quasi-steady hot diffusion combustion. However, deviation occurs during droplet heat-up (initial transient), radiative extinction, micro-explosions/disruptions, and the lower-rate cool flame phase.",
        "confidence": 0.97,
    },
]

class ScientificClaimVerifier:
    def __init__(self):
        self.claims = CORE_VERIFIED_CLAIMS

    def verify_statement(self, statement):
        """Analyzes a statement and matches against established empirical claims."""
        stmt = statement.lower().strip()
        matched = []

        keywords = {
            "CLM-001": ["cool flame", "llama fría", "heptane", "heptano", "radiative extinction"],
            "CLM-002": ["test 1", "nasa-std-6001", "saffire", "silicone", "silicón", "upward", "1g vs 0g"],
            "CLM-003": ["co2", "extinguisher", "extintor", "methanol", "metanol", "quenching", "30%"],
            "CLM-004": ["0.57", "exploration", "exploración", "34%", "lunar", "mars", "habitat"],
            "CLM-005": ["helium", "helio", "thermal conductivity", "conducción"],
            "CLM-006": ["d2", "d²", "law", "ley", "strictly", "constant"],
        }

        for claim in self.claims:
            cid = claim["claim_id"]
            kw_hits = sum(1 for kw in keywords.get(cid, []) if kw in stmt)
            if kw_hits >= 1:
                matched.append({
                    "matched_claim": claim,
                    "relevance_score": min(1.0, kw_hits * 0.4),
                })

        if matched:
            matched.sort(key=lambda x: -x["relevance_score"])
            top = matched[0]["matched_claim"]
            return {
                "claim_status": top["category"],
                "claim_id": top["claim_id"],
                "explanation": top["verification_explanation"],
                "supporting_evidence": top["supporting_evidence_ids"],
                "contradicting_evidence": top["contradicting_evidence_ids"],
                "literature": top["literature_citations"],
                "confidence": top["confidence"],
                "all_matches": matched,
            }

        return {
            "claim_status": "INSUFFICIENT_EVIDENCE",
            "claim_id": None,
            "explanation": "No direct NASA empirical flight test or literature match found in the knowledge base.",
            "supporting_evidence": [],
            "contradicting_evidence": [],
            "literature": [],
            "confidence": 0.50,
            "all_matches": [],
        }

    def export_verified_claims(self, output_path=None):
        out = output_path or os.path.join(PUBLIC_DATA_DIR, "verified_claims.json")
        os.makedirs(os.path.dirname(out), exist_ok=True)
        with open(out, "w", encoding="utf-8") as f:
            json.dump(self.claims, f, indent=2)
        print(f"Verified claims exported to {out}")


if __name__ == "__main__":
    verifier = ScientificClaimVerifier()
    verifier.export_verified_claims()

