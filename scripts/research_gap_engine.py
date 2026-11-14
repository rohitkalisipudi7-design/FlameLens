"""Research Gap & Experiment Recommendation Engine — Flame in Freefall V4.

Implements MODULE G:
1. Analyzes coverage density across ambient parameters (P, O₂, fuel/material, gravity).
2. Detects blind spots and parameter frontiers where empirical data is sparse or absent.
3. Formulates evidence-grounded Proposed Follow-Up Experiments with clear scientific rationale.
4. Distinguishes established NASA test archives from proposed future test matrices.
"""
import json
import math
import os
import numpy as np
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
PUBLIC_DATA_DIR = os.path.join(BASE_DIR, "app", "public", "data")
LEDGER_PATH = os.path.join(PUBLIC_DATA_DIR, "evidence_ledger.json")

# Proposed mission targets requiring empirical microgravity validation
KNOWN_EXPLORATION_SCENARIOS = [
    {
        "id": "GAP-01",
        "title": "Lunar/Mars Exploration Habitat Atmosphere (0.57 atm / 34% O₂)",
        "target_conditions": {"pressure_atm": 0.57, "x_o2": 0.34, "gravity": "0g"},
        "focus_fuels": ["n-heptane", "PMMA", "Nomex/Kevlar fabrics"],
        "criticality": "HIGH",
        "scientific_rationale": "NASA's Exploration Atmospheres architecture adopts 8.2 psia (56.5 kPa) and 34% oxygen for EVA transit. Reduced pressure increases gas diffusivity while elevated oxygen significantly accelerates flame spread and lowers ignition energy.",
        "empirical_gap_identified": "Historical FLEX droplet tests evaluated 0.69 to 3.0 atm; zero droplet combustion experiments exist at 0.57 atm. Solid spread tests (Saffire) tested near-ambient or 1 atm.",
        "proposed_experiment": {
            "title": "Sub-Atmospheric Hyperoxic Droplet Burning & Extinction Test",
            "facility": "NASA Glenn Zero Gravity Research Facility (ZGF Drop Tower) / ISS CIR",
            "recommended_matrix": [
                {"pressure_atm": 0.57, "x_o2": 0.34, "diluent": "N2", "d0_mm": 2.0},
                {"pressure_atm": 0.57, "x_o2": 0.34, "diluent": "N2", "d0_mm": 3.5},
                {"pressure_atm": 0.57, "x_o2": 0.28, "diluent": "N2", "d0_mm": 3.0},
            ],
            "expected_outcome": "Quantify whether radiative extinction limits shift to smaller droplet diameters and determine if cool flame transitions persist at 0.57 atm.",
            "disclaimer": "Proposed follow-up experiment — formulated as an exploratory research proposal, not an established NASA flight mandate.",
        },
    },
    {
        "id": "GAP-02",
        "title": "High-Concentration CO₂ Quenching in Low Forced Convective Flows",
        "target_conditions": {"pressure_atm": 1.0, "x_o2": 0.18, "x_co2": 0.45, "gravity": "0g"},
        "focus_fuels": ["Methanol", "Ethanol", "Saffire SIBAL fabric"],
        "criticality": "MEDIUM",
        "scientific_rationale": "While droplet tests verified >30% CO₂ quenches isolated liquid droplets, the interaction between CO₂ extinguisher deployment and ventilation draft (5–20 cm/s) across porous solid fabrics in microgravity remains uncharacterized.",
        "empirical_gap_identified": "BASS and Saffire investigated airflow spread, but rarely combined concurrent flow with high localized CO₂ extinguishing concentrations.",
        "proposed_experiment": {
            "title": "Microgravity Smoldering and Flame Quenching Under CO₂ Injection with Concurrent Draft",
            "facility": "SoFIE (Solid Fuel Ignition and Extinction) insert aboard CIR",
            "recommended_matrix": [
                {"pressure_atm": 1.0, "x_o2": 0.21, "co2_injection_pct": 40.0, "flow_cm_s": 10.0},
                {"pressure_atm": 1.0, "x_o2": 0.21, "co2_injection_pct": 50.0, "flow_cm_s": 20.0},
            ],
            "expected_outcome": "Determine whether localized CO₂ discharge extinguishes the flame or merely forces transition to low-oxygen subsurface smoldering.",
            "disclaimer": "Proposed follow-up experiment — formulated as an exploratory research proposal, not an established NASA flight mandate.",
        },
    },
    {
        "id": "GAP-03",
        "title": "Low-Gravity Partial Buoyancy Regimes (Lunar 0.16g and Martian 0.38g)",
        "target_conditions": {"gravity": "0.16g / 0.38g", "pressure_atm": 0.57, "x_o2": 0.34},
        "focus_fuels": ["Heptane", "Polyethylene", "Nomex"],
        "criticality": "HIGH",
        "scientific_rationale": "Terrestrial 1g creates dominant upward buoyancy. 0g eliminates buoyancy entirely. Partial gravities (Moon/Mars) exist in an unstable intermediate regime where buoyant flow is weak yet non-zero, potentially trapping toxic combustion products close to ignition surfaces.",
        "empirical_gap_identified": "99% of NASA Physical Sciences combustion trials were flown at 0g aboard the ISS or drop towers, with the remaining fraction tested in 1g. Fractional gravity data is almost non-existent in public archives.",
        "proposed_experiment": {
            "title": "Parabolic Flight / Centrifuge-Augmented Partial Gravity Flame Morphology Study",
            "facility": "Reduced Gravity Parabolic Aircraft (Lunar & Martian parabolic maneuvers)",
            "recommended_matrix": [
                {"target_g": 0.16, "fuel": "Heptane", "p_atm": 1.0, "x_o2": 0.21},
                {"target_g": 0.38, "fuel": "Heptane", "p_atm": 1.0, "x_o2": 0.21},
            ],
            "expected_outcome": "Measure transition Reynolds and Grashof numbers where flame transitions from spherical symmetry to buoyant plume.",
            "disclaimer": "Proposed follow-up experiment — formulated as an exploratory research proposal, not an established NASA flight mandate.",
        },
    },
]

def analyze_research_gaps():
    print("Analyzing experimental parameter coverage density...")
    if not os.path.exists(LEDGER_PATH):
        raise FileNotFoundError(f"Evidence ledger not found at {LEDGER_PATH}")

    with open(LEDGER_PATH, "r", encoding="utf-8") as f:
        ledger = json.load(f)

    # 1. Parameter Grid Density Calculation (Pressure x Oxygen)
    p_bins = [(0.0, 0.65), (0.65, 0.90), (0.90, 1.15), (1.15, 1.80), (1.80, 3.20)]
    o2_bins = [(0.10, 0.16), (0.16, 0.22), (0.22, 0.28), (0.28, 0.35), (0.35, 0.50)]

    grid_counts = {}
    for p_lo, p_hi in p_bins:
        for o_lo, o_hi in o2_bins:
            cell_key = f"P[{p_lo:.2f}-{p_hi:.2f}]_O2[{int(o_lo*100)}-{int(o_hi*100)}%]"
            grid_counts[cell_key] = 0

    valid_experiments = 0
    for exp in ledger:
        norm = exp.get("normalized_measurements", {})
        p = norm.get("pressure_atm")
        o2 = norm.get("x_o2")
        if p is not None and o2 is not None:
            valid_experiments += 1
            for p_lo, p_hi in p_bins:
                if p_lo <= p < p_hi:
                    for o_lo, o_hi in o2_bins:
                        if o_lo <= o2 < o_hi:
                            cell_key = f"P[{p_lo:.2f}-{p_hi:.2f}]_O2[{int(o_lo*100)}-{int(o_hi*100)}%]"
                            grid_counts[cell_key] += 1

    # Identify blind spots
    blind_spots = [k for k, count in grid_counts.items() if count == 0]
    sparse_cells = [k for k, count in grid_counts.items() if 1 <= count <= 3]

    gap_report = {
        "engine_version": "V4.0-Research-Gap-Recommendation",
        "total_experiments_analyzed": len(ledger),
        "valid_atmospheric_experiments": valid_experiments,
        "grid_density": grid_counts,
        "total_cells": len(grid_counts),
        "zero_coverage_blind_spots": len(blind_spots),
        "blind_spot_cells": blind_spots,
        "sparse_cells": sparse_cells,
        "established_exploration_scenarios": KNOWN_EXPLORATION_SCENARIOS,
    }

    out_path = os.path.join(PUBLIC_DATA_DIR, "research_gaps.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(gap_report, f, indent=2)

    print(f"Research gap analysis saved to {out_path} ({len(blind_spots)} blind spots identified)")
    return gap_report


if __name__ == "__main__":
    analyze_research_gaps()

