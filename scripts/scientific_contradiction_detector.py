"""Scientific Contradiction Detector — Flame in Freefall V4.1.

Implements MODULE D:
Analyzes apparent disagreements between microgravity combustion experiments and literature.
Distinguishes genuine scientific contradictions from environmental or methodological differences.

Epistemic Conflict Taxonomy:
1. NUMERICAL_DISAGREEMENT: Differing values measured under identical parameters.
2. OUTCOME_DISAGREEMENT: Conflicting physical outcomes (e.g. self-extinction vs continuous propagation).
3. ENVIRONMENTAL_DIFFERENCE: Discrepancy driven by pressure, oxygen, or gravity differences.
4. METHODOLOGICAL_DIFFERENCE: Terrestrial 1g upward buoyant convection vs 0g low-speed forced draft.
5. INTERPRETATION_DIFFERENCE: Theoretical model divergence explaining the same data.
6. APPARENT_CONFLICT: Superficial semantic dispute resolved by checking condition vectors.

NON-NEGOTIABLE SCIENTIFIC SAFEGUARDS:
- Never treats apparent semantic disagreement as an established scientific contradiction without comparability analysis.
- Stores human review decisions in a separate audit table from automated algorithm assessments.
- Preserves raw values alongside normalized units.
"""
import json
import math
import os
import sqlite3

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
PUBLIC_DATA_DIR = os.path.join(BASE_DIR, "app", "public", "data")
DB_PATH = os.path.join(DATA_DIR, "olap_experimentos.db")

# Curated benchmark claim repository with quantitative condition vectors
BENCHMARK_CLAIMS = [
    {
        "claim_id": "CLM-V41-01",
        "claim_text": "Silicone fabric samples ignite and propagate fire upward to total consumption in ambient Earth atmosphere.",
        "source_type": "STANDARD_TEST",
        "source_reference": "NASA-STD-6001B Test 1 (Terrestrial Upward Flammability Screening)",
        "investigation_id": "NASA-STD-6001B",
        "material": "Silicone",
        "condition_vector": {"pressure_atm": 1.0, "x_o2": 0.21, "gravity_g": 1.0, "flow_cm_s": 0.0},
        "reported_parameter": "burn_length_cm",
        "reported_value": 30.0,
        "reported_unit": "cm",
        "normalized_value": 300.0,
        "normalized_unit": "mm",
        "methodology": "Terrestrial 1g upward flame propagation inside vertical chamber with buoyant convective plume.",
    },
    {
        "claim_id": "CLM-V41-02",
        "claim_text": "Silicone samples self-extinguished shortly after ignition aboard Cygnus OA-6 without spreading.",
        "source_type": "FLIGHT_EXPERIMENT",
        "source_reference": "Urban et al., 2019 (NASA/TM-2019-220054) - Saffire-II Summary",
        "investigation_id": "PSI-99_SAFFIRE-II",
        "material": "Silicone",
        "condition_vector": {"pressure_atm": 1.0, "x_o2": 0.21, "gravity_g": 0.0, "flow_cm_s": 20.0},
        "reported_parameter": "burn_length_cm",
        "reported_value": 3.8,
        "reported_unit": "cm",
        "normalized_value": 38.0,
        "normalized_unit": "mm",
        "methodology": "Spacecraft Cygnus vehicle microgravity duct with low-speed forced concurrent ventilation (20 cm/s).",
    },
    {
        "claim_id": "CLM-V41-03",
        "claim_text": "Heptane droplet burning rate K decreases when inert helium diluent replaces nitrogen.",
        "source_type": "LITERATURE_THEORY",
        "source_reference": "Theoretical Quasi-Steady Film Theory Estimate",
        "investigation_id": "THEORETICAL",
        "material": "n-heptane",
        "condition_vector": {"pressure_atm": 1.0, "x_o2": 0.21, "gravity_g": 0.0, "diluent": "He"},
        "reported_parameter": "burning_rate_K",
        "reported_value": 0.32,
        "reported_unit": "mm2/s",
        "normalized_value": 0.32,
        "normalized_unit": "mm2/s",
        "methodology": "Quasi-steady gas-phase film model assuming constant Lewis number.",
    },
    {
        "claim_id": "CLM-V41-04",
        "claim_text": "FLEX spaceflight trials observed an average 40% increase in heptane burning rate K in helium atmospheres compared to nitrogen.",
        "source_type": "FLIGHT_EXPERIMENT",
        "source_reference": "Farouk et al., 2014 (Combustion Theory and Modelling) / PSI-69",
        "investigation_id": "PSI-69_FLEX",
        "material": "n-heptane",
        "condition_vector": {"pressure_atm": 1.0, "x_o2": 0.21, "gravity_g": 0.0, "diluent": "He"},
        "reported_parameter": "burning_rate_K",
        "reported_value": 0.58,
        "reported_unit": "mm2/s",
        "normalized_value": 0.58,
        "normalized_unit": "mm2/s",
        "methodology": "ISS CIR Multi-user Droplet Combustion Apparatus frame-by-frame video diameter tracking.",
    },
    {
        "claim_id": "CLM-V41-05",
        "claim_text": "Methanol droplets burn to complete consumption at 1.0 atm air in microgravity.",
        "source_type": "LITERATURE",
        "source_reference": "Classical Droplet Combustion Survey (Law, 1982)",
        "investigation_id": "SURVEY",
        "material": "Methanol",
        "condition_vector": {"pressure_atm": 1.0, "x_o2": 0.21, "gravity_g": 0.0, "x_co2": 0.0},
        "reported_parameter": "extinction_fraction",
        "reported_value": 0.0,
        "reported_unit": "%",
        "normalized_value": 0.0,
        "normalized_unit": "%",
        "methodology": "Drop tower short-duration test (< 2.2 s) prior to radiative extinction onset.",
    },
    {
        "claim_id": "CLM-V41-06",
        "claim_text": "Large methanol droplets (> 2.5 mm) frequently undergo radiative extinction before complete burnout in CIR.",
        "source_type": "FLIGHT_EXPERIMENT",
        "source_reference": "PSI-69 DropletData / Hicks et al., 2010",
        "investigation_id": "PSI-69_FLEX",
        "material": "Methanol",
        "condition_vector": {"pressure_atm": 1.0, "x_o2": 0.21, "gravity_g": 0.0, "d0_mm": 3.0},
        "reported_parameter": "extinction_fraction",
        "reported_value": 78.0,
        "reported_unit": "%",
        "normalized_value": 78.0,
        "normalized_unit": "%",
        "methodology": "Long-duration microgravity testing aboard ISS with full lifetime observation (> 8 s).",
    },
]


class ScientificContradictionDetector:
    def __init__(self, db_path=DB_PATH):
        self.db_path = db_path
        self.claims = BENCHMARK_CLAIMS

    def analyze_claim_pair(self, claim_a, claim_b):
        """Compares two scientific assertions across environmental and methodological axes."""
        ca = claim_a["condition_vector"]
        cb = claim_b["condition_vector"]

        # 1. Check material compatibility
        mat_match = claim_a.get("material", "").lower() == claim_b.get("material", "").lower()

        # 2. Check gravity environment compatibility
        ga = ca.get("gravity_g", 0.0)
        gb = cb.get("gravity_g", 0.0)
        grav_diff = abs(ga - gb) > 0.1

        # 3. Check pressure & oxygen compatibility
        p_diff = abs(ca.get("pressure_atm", 1.0) - cb.get("pressure_atm", 1.0)) > 0.1
        o2_diff = abs(ca.get("x_o2", 0.21) - cb.get("x_o2", 0.21)) > 0.03
        flow_diff = abs(ca.get("flow_cm_s", 0.0) - cb.get("flow_cm_s", 0.0)) > 5.0

        # Numerical delta
        val_a = claim_a.get("normalized_value", 0.0)
        val_b = claim_b.get("normalized_value", 0.0)
        num_diff_ratio = abs(val_a - val_b) / max(1e-4, (val_a + val_b) / 2.0)

        # Classification decision logic
        if not mat_match:
            category = "APPARENT_CONFLICT"
            compat_score = 0.20
            method_score = 0.30
            explanation = "Materials differ. Divergent behavior is physically expected due to thermophysical fuel properties."
        elif grav_diff and flow_diff:
            category = "METHODOLOGICAL_DIFFERENCE"
            compat_score = 0.45
            method_score = 0.85
            explanation = (
                "NASA-STD-6001B (1g upward test) utilizes natural buoyant convection where the flame plume preheats unburned material above it. "
                "In microgravity (0g) with concurrent forced ventilation (e.g. Saffire duct at 20 cm/s), buoyancy is absent and oxygen diffusion is slower, "
                "causing silicone to self-extinguish while it burns completely in 1g. The discrepancy is driven by aerodynamic transport differences, NOT a material inconsistency."
            )
        elif grav_diff or p_diff or o2_diff:
            category = "ENVIRONMENTAL_DIFFERENCE"
            compat_score = 0.50
            method_score = 0.70
            explanation = f"Experimental conditions differ (Pressure delta: {p_diff}, Oxygen delta: {o2_diff}, Gravity delta: {grav_diff}). Disagreement is attributable to environmental boundary shifts."
        elif "THEORETICAL" in claim_a.get("investigation_id", "") or "THEORETICAL" in claim_b.get("investigation_id", ""):
            category = "INTERPRETATION_DIFFERENCE"
            compat_score = 0.90
            method_score = 0.65
            explanation = (
                "Classical quasi-steady film theory assumes constant thermal properties and underestimated helium's high thermal conductivity "
                "(which accelerates conductive heat feedback to the liquid droplet), leading to lower predicted burning rate than observed in FLEX flight data."
            )
        elif num_diff_ratio > 0.30:
            category = "NUMERICAL_DISAGREEMENT"
            compat_score = 0.85
            method_score = 0.85
            explanation = f"Measurements under ostensibly similar nominal conditions exhibit a {num_diff_ratio*100:.1f}% divergence. Potential instrumentation or droplet support fiber artifact."
        else:
            category = "APPARENT_CONFLICT"
            compat_score = 0.80
            method_score = 0.80
            explanation = "Superficial wording difference; underlying physical measurements are mutually compatible within measurement uncertainty."

        conflict_id = f"CONF-{claim_a['claim_id']}-{claim_b['claim_id']}"

        return {
            "conflict_id": conflict_id,
            "claim_a": claim_a,
            "claim_b": claim_b,
            "conflict_category": category,
            "condition_compatibility_score": round(compat_score, 2),
            "methodological_compatibility_score": round(method_score, 2),
            "discrepancy_explanation": explanation,
            "preliminary_status": "IDENTIFIED_AWAITING_REVIEW",
        }

    def detect_all_conflicts(self):
        """Scans curated claim pairs and builds contradiction registry."""
        candidate_pairs = [
            (self.claims[0], self.claims[1]),  # Silicone 1g vs Saffire 0g
            (self.claims[2], self.claims[3]),  # Heptane Helium theory vs FLEX experiment
            (self.claims[4], self.claims[5]),  # Methanol Drop Tower short time vs ISS full lifetime
        ]

        conflicts = [self.analyze_claim_pair(ca, cb) for ca, cb in candidate_pairs]

        registry = {
            "engine_version": "V4.1-Contradiction-Detector",
            "total_claims_indexed": len(self.claims),
            "conflicts_identified": len(conflicts),
            "taxonomy": [
                "NUMERICAL_DISAGREEMENT", "OUTCOME_DISAGREEMENT", "ENVIRONMENTAL_DIFFERENCE",
                "METHODOLOGICAL_DIFFERENCE", "INTERPRETATION_DIFFERENCE", "APPARENT_CONFLICT"
            ],
            "contradiction_pairs": conflicts,
            "timestamp": "2026-11-14T19:00:00Z",
        }

        # Save to SQLite and JSON
        out_json = os.path.join(PUBLIC_DATA_DIR, "scientific_contradictions.json")
        with open(out_json, "w", encoding="utf-8") as f:
            json.dump(registry, f, indent=2)

        self._save_to_sqlite(registry)
        print(f"Scientific Contradictions registry saved: {len(conflicts)} conflict candidates saved to {out_json}")
        return registry

    def record_human_review(self, conflict_id, decision, notes="Validated against NTRS publication"):
        """Records human-in-the-loop expert determination."""
        if not os.path.exists(self.db_path):
            return False
        conn = sqlite3.connect(self.db_path, timeout=30.0)
        cur = conn.cursor()
        rev_id = f"REV-{conflict_id}"
        cur.execute("""
        INSERT OR REPLACE INTO contradiction_reviews (
            review_id, conflict_id, reviewer_decision, reviewer_notes, reviewed_at
        ) VALUES (?, ?, ?, ?, datetime('now'))
        """, (rev_id, conflict_id, decision, notes))
        conn.commit()
        conn.close()
        return True

    def _save_to_sqlite(self, registry):
        if not os.path.exists(self.db_path):
            return
        conn = sqlite3.connect(self.db_path, timeout=30.0)
        cur = conn.cursor()

        # Insert claims
        for c in self.claims:
            cur.execute("""
            INSERT OR REPLACE INTO scientific_claims_v41 (
                claim_id, claim_text, source_type, source_reference, investigation_id,
                condition_vector_json, reported_parameter, reported_value, reported_unit,
                normalized_value, normalized_unit, methodology
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                c["claim_id"], c["claim_text"], c["source_type"], c["source_reference"],
                c["investigation_id"], json.dumps(c["condition_vector"]), c["reported_parameter"],
                c["reported_value"], c["reported_unit"], c["normalized_value"], c["normalized_unit"],
                c["methodology"]
            ))

        # Insert conflict candidates
        for conf in registry["contradiction_pairs"]:
            cur.execute("""
            INSERT OR REPLACE INTO contradiction_candidates (
                conflict_id, claim_id_a, claim_id_b, conflict_category,
                condition_compatibility_score, methodological_compatibility_score,
                discrepancy_explanation, preliminary_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                conf["conflict_id"], conf["claim_a"]["claim_id"], conf["claim_b"]["claim_id"],
                conf["conflict_category"], conf["condition_compatibility_score"],
                conf["methodological_compatibility_score"], conf["discrepancy_explanation"],
                conf["preliminary_status"]
            ))

        conn.commit()
        conn.close()


if __name__ == "__main__":
    detector = ScientificContradictionDetector()
    detector.detect_all_conflicts()

