"""Unit tests for Module G: Research Gap to Experiment Recommendation."""
import os
import json
import pytest
from scripts.research_gap_engine import analyze_research_gaps, KNOWN_EXPLORATION_SCENARIOS

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DATA_DIR = os.path.join(BASE_DIR, "app", "public", "data")


def test_research_gap_scenarios():
    """Verify predefined exploration atmosphere scenarios are well-formed."""
    assert len(KNOWN_EXPLORATION_SCENARIOS) >= 3
    
    # Check for Exploration Atmosphere (0.57 atm / 34% O2)
    gap_ids = [g["id"] for g in KNOWN_EXPLORATION_SCENARIOS]
    assert "GAP-01" in gap_ids
    
    exp_gap = next(g for g in KNOWN_EXPLORATION_SCENARIOS if g["id"] == "GAP-01")
    assert exp_gap["criticality"] == "HIGH"
    assert "proposed_experiment" in exp_gap
    assert "facility" in exp_gap["proposed_experiment"]
    assert "Drop Tower" in exp_gap["proposed_experiment"]["facility"]


def test_research_gap_analysis_execution():
    """Verify density grid analysis executes and identifies blind spots."""
    report = analyze_research_gaps()
    assert report["total_experiments_analyzed"] > 1000
    assert report["zero_coverage_blind_spots"] > 0
    assert "grid_density" in report


def test_research_gaps_json_artifact():
    """Verify generated research_gaps.json matches application schema."""
    path = os.path.join(PUBLIC_DATA_DIR, "research_gaps.json")
    assert os.path.exists(path), f"Missing artifact: {path}"
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert "established_exploration_scenarios" in data
    assert len(data["established_exploration_scenarios"]) >= 3
    for gap in data["established_exploration_scenarios"]:
        assert "id" in gap
        assert "title" in gap
        assert "criticality" in gap
        assert "proposed_experiment" in gap
