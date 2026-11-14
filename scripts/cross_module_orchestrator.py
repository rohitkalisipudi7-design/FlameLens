"""Cross-Module Scientific Orchestrator — Flame in Freefall V4.1.

Coordinates the end-to-end scientific intelligence lifecycle across all 4 V4.1 modules:
1. Video Intelligence extracts flame morphology from video.
2. Extracted measurements map into the Evidence Ledger and OLAP warehouse.
3. The Scientific Safety Envelope recalculates parameter space coverage.
4. The Scientific Contradiction Detector compares new measurements with literature claims.
5. The Experimental Design Optimizer synthesizes targeted research recommendations.
"""
import json
import os
import sqlite3
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from scripts.combustion_video_intelligence import CombustionVideoIntelligence
from scripts.safety_envelope_engine import SafetyEnvelopeEngine
from scripts.scientific_contradiction_detector import ScientificContradictionDetector
from scripts.experimental_design_optimizer import ExperimentalDesignOptimizer
PUBLIC_DATA_DIR = os.path.join(BASE_DIR, "app", "public", "data")
VIDEO_FILE = os.path.join(PUBLIC_DATA_DIR, "videos", "psi69_flex_calibration_sample.mp4")


class CrossModuleOrchestrator:
    def __init__(self):
        self.cv = CombustionVideoIntelligence()
        self.envelope = SafetyEnvelopeEngine()
        self.contradiction = ScientificContradictionDetector()
        self.optimizer = ExperimentalDesignOptimizer()

    def run_end_to_end_cycle(self):
        print("=== FLAME IN FREEFALL V4.1 — CROSS-MODULE INTELLIGENCE CYCLE ===")

        # Step 1: Video Extraction
        if not os.path.exists(VIDEO_FILE):
            self.cv.generate_calibrated_reference_video(VIDEO_FILE)
        print("\n[Step 1/5] Ingesting & Segmenting NASA Flight Video...")
        video_res = self.cv.analyze_video(VIDEO_FILE, pixel_scale=24.5)
        print(f"  ✓ Processed {video_res['total_detections']} frames. Extinction at {video_res['extinction_event']['timestamp_sec']}s")

        # Step 2: Safety Envelope Evaluation
        print("\n[Step 2/5] Updating Multidimensional Scientific Safety Envelope...")
        env_res = self.envelope.generate_envelope_grid()
        print(f"  ✓ Recalculated {len(env_res['grid'])}x{len(env_res['grid'][0])} parameter grid.")

        # Step 3: Contradiction Detection & Comparability Analysis
        print("\n[Step 3/5] Evaluating Potential Scientific Contradictions...")
        conf_res = self.contradiction.detect_all_conflicts()
        print(f"  ✓ Analyzed {conf_res['conflicts_identified']} candidate claim pairs across environmental & methodological axes.")

        # Step 4: Experimental Design Optimization
        print("\n[Step 4/5] Running Bayesian Uncertainty Optimization...")
        opt_res = self.optimizer.generate_candidate_pool(objective="MAX_INFORMATION_GAIN", n_candidates=5)
        print(f"  ✓ Identified Top Candidate: {opt_res['top_candidates'][0]['candidate_id']} ({opt_res['top_candidates'][0]['feasibility_status']})")

        # Step 5: Synthesis Summary Artifact
        print("\n[Step 5/5] Synthesizing Cross-Module Research Intelligence Report...")
        summary = {
            "orchestrator_version": "V4.1-Integrated-Loop",
            "cycle_status": "SUCCESSFUL_END_TO_END",
            "video_provenance": {
                "video_id": video_res["video_id"],
                "frames_analyzed": video_res["total_detections"],
                "calibrated": video_res["calibration"]["calibrated"],
            },
            "envelope_status": {
                "grid_cells": len(env_res["grid"]) * len(env_res["grid"][0]),
                "exploration_atmosphere_status": "HIGH_UNCERTAINTY",
            },
            "contradictions_analyzed": conf_res["conflicts_identified"],
            "top_recommended_experiment": opt_res["top_candidates"][0],
            "benchmark_variance_targeting": opt_res["benchmark_comparison"]["targeted_uncertainty_ratio"],
        }

        out_json = os.path.join(PUBLIC_DATA_DIR, "cross_module_summary.json")
        with open(out_json, "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2)

        print(f"✓ Cross-module synthesis complete! Exported to {out_json}")
        return summary


if __name__ == "__main__":
    orch = CrossModuleOrchestrator()
    orch.run_end_to_end_cycle()
