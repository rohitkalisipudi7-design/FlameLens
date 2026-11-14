"""Unit tests for Phase 6: Cross-Module Intelligence and End-to-End Workflow."""
import json
import os
import pytest
from scripts.cross_module_orchestrator import CrossModuleOrchestrator

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DATA_DIR = os.path.join(BASE_DIR, "app", "public", "data")


def test_cross_module_cycle_execution():
    """Verify end-to-end integration across all 4 V4.1 engines."""
    orchestrator = CrossModuleOrchestrator()
    summary = orchestrator.run_end_to_end_cycle()
    
    assert summary["cycle_status"] == "SUCCESSFUL_END_TO_END"
    assert "video_provenance" in summary
    assert "envelope_status" in summary
    assert "top_recommended_experiment" in summary
    assert summary["contradictions_analyzed"] >= 3


def test_cross_module_summary_json_artifact():
    """Verify cross_module_summary.json artifact exists and has complete metadata."""
    path = os.path.join(PUBLIC_DATA_DIR, "cross_module_summary.json")
    assert os.path.exists(path)
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert "top_recommended_experiment" in data
    assert "candidate_id" in data["top_recommended_experiment"]
    assert "parameters" in data["top_recommended_experiment"]

