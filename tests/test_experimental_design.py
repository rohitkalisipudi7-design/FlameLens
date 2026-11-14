"""Unit tests for Module A: AI Experimental Design Optimizer."""
import json
import os
import pytest
from scripts.experimental_design_optimizer import ExperimentalDesignOptimizer

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DATA_DIR = os.path.join(BASE_DIR, "app", "public", "data")


def test_optimizer_initialization():
    """Verify optimizer fits GP surrogate model on historical training runs."""
    opt = ExperimentalDesignOptimizer()
    assert len(opt.X_train) > 0
    assert len(opt.y_train) > 0
    assert opt.gp_model is not None


def test_evaluate_candidate_outputs():
    """Verify candidate evaluation returns expected uncertainty and information gain."""
    opt = ExperimentalDesignOptimizer()
    cand = opt.evaluate_candidate(pressure_atm=1.0, oxygen_fraction=0.21, d0_mm=2.5)
    assert "candidate_id" in cand
    assert "predicted_burn_rate_k" in cand
    assert "estimated_uncertainty_sigma" in cand
    assert "expected_info_gain" in cand
    assert cand["estimated_uncertainty_sigma"] >= 0.0


def test_exploration_atmosphere_candidate_flagged():
    """Verify exploration atmosphere candidate (0.57 atm / 34% O2) is identified as frontier."""
    opt = ExperimentalDesignOptimizer()
    cand = opt.evaluate_candidate(pressure_atm=0.57, oxygen_fraction=0.34, d0_mm=2.5)
    assert cand["feasibility_status"] in ("HYPOTHETICAL_FRONTIER", "EXPLORATION_FRONTIER_TARGET") or "FRONTIER" in cand["feasibility_status"]
    assert "NASA Glenn" in cand["recommended_facility"]


def test_candidate_pool_ranking():
    """Verify pool generation produces ranked candidates with benchmark comparisons."""
    opt = ExperimentalDesignOptimizer()
    pool = opt.generate_candidate_pool(objective="MAX_INFORMATION_GAIN", n_candidates=5)
    assert len(pool["top_candidates"]) == 5
    assert "benchmark_comparison" in pool
    assert "targeted_uncertainty_ratio" in pool["benchmark_comparison"]


def test_design_proposals_json_artifact():
    """Verify public artifact exists and adheres to proposal schema."""
    path = os.path.join(PUBLIC_DATA_DIR, "design_proposals.json")
    assert os.path.exists(path)
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert "top_candidates" in data
    assert len(data["top_candidates"]) >= 5
    for c in data["top_candidates"]:
        assert "candidate_id" in c
        assert "parameters" in c
        assert "feasibility_status" in c

