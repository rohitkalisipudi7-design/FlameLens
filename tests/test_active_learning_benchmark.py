"""Tests for Phase 6 Sequential Active Learning Benchmark and Final Integration."""

import json
from pathlib import Path
import pytest

ROOT = Path(__file__).parent.parent
BENCHMARK_PATH = ROOT / "app" / "public" / "data" / "active_learning_benchmark.json"
PROPOSALS_PATH = ROOT / "app" / "public" / "data" / "design_proposals.json"
LEDGER_PATH = ROOT / "app" / "public" / "data" / "evidence_ledger.json"
OPTIMIZER_VIEW_PATH = ROOT / "app" / "src" / "views" / "optimizerView.js"
OPTIMIZER_FACILITY_PATH = ROOT / "app" / "src" / "render" / "lab" / "optimizerFacility.js"


@pytest.fixture
def benchmark_data():
    assert BENCHMARK_PATH.exists(), f"Benchmark artifact missing at {BENCHMARK_PATH}"
    with open(BENCHMARK_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def proposals_data():
    assert PROPOSALS_PATH.exists(), f"Proposals artifact missing at {PROPOSALS_PATH}"
    with open(PROPOSALS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def ledger_data():
    assert LEDGER_PATH.exists(), f"Evidence ledger missing at {LEDGER_PATH}"
    with open(LEDGER_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def test_benchmark_artifact_schema(benchmark_data):
    """Verify active learning benchmark artifact structure and required metadata."""
    assert "benchmark_id" in benchmark_data
    assert "benchmark_dataset" in benchmark_data
    assert "strategies_evaluated" in benchmark_data
    assert "summary_by_strategy" in benchmark_data
    assert "comparative_analysis" in benchmark_data
    assert "honest_disclosure" in benchmark_data

    strategies = benchmark_data["strategies_evaluated"]
    assert "RANDOM" in strategies
    assert "LHS" in strategies
    assert "MAX_VARIANCE" in strategies
    assert "BAYESIAN_EIG" in strategies


def test_benchmark_dataset_isolation_and_parameters(benchmark_data):
    """Verify sample counts, initial batch, sequential steps, and repetitions."""
    ds = benchmark_data["benchmark_dataset"]
    assert ds["fuel"] == "methanol"
    assert ds["total_available_cohort_size"] == 150
    assert ds["initial_training_batch_size"] == 15
    assert ds["sequential_acquisition_steps"] == 10
    assert ds["held_out_test_set_size"] == 30
    assert ds["independent_repetitions"] == 10
    assert ds["unacquired_pool_size"] == 150 - 30 - 15
    assert "data_leakage_guard" in ds


def test_four_strategies_learning_curves_complete(benchmark_data):
    """Verify each strategy contains complete 10-step sequential convergence metrics."""
    summary = benchmark_data["summary_by_strategy"]
    for strat_name in ["RANDOM", "LHS", "MAX_VARIANCE", "BAYESIAN_EIG"]:
        assert strat_name in summary, f"Strategy {strat_name} missing from summary"
        s = summary[strat_name]
        assert "initial_test_rmse_mm2_s" in s
        assert "final_test_rmse_mm2_s" in s
        assert "pct_rmse_reduction" in s
        assert "integrated_prediction_error_rmse_sum" in s
        assert "learning_curve" in s

        # Steps 0 through 10 = 11 steps total
        lc = s["learning_curve"]
        assert len(lc) == 11
        for step_idx, step_data in enumerate(lc):
            assert step_data["step"] == step_idx
            assert step_data["train_sample_count"] == 15 + step_idx
            assert "mean" in step_data["test_rmse"]
            assert "std" in step_data["test_rmse"]
            assert step_data["test_rmse"]["mean"] > 0
            assert "mean" in step_data["test_coverage_95"]


def test_honest_reporting_no_hardcoded_claims(proposals_data):
    """Verify elimination of procedural hardcoded entropy or uncalibrated claims."""
    # Check that hardcoded lhs_stratification_entropy 2.14 was eliminated
    bc = proposals_data.get("benchmark_comparison", {})
    assert "lhs_stratification_entropy" not in bc
    assert "sequential_simulation" in bc

    view_text = OPTIMIZER_VIEW_PATH.read_text(encoding="utf-8")
    # Verify the hardcoded +60.7% pill text was removed from view
    assert "+60.7% Higher Frontier Targeting vs. Random Baseline" not in view_text
    assert "opt-btn-toggle-benchmark" in view_text
    assert "opt-benchmark-drawer" in view_text


def test_end_to_end_pipeline_integration(ledger_data, proposals_data, benchmark_data):
    """Verify end-to-end integration: Evidence Ledger -> Fuel GPR -> Proposals -> Benchmark."""
    # 1. Evidence Ledger contains authentic flight records
    flex_records = [r for r in ledger_data if r.get("family") == "droplet" and "PSI-69" in r.get("accession", "")]
    assert len(flex_records) >= 250

    # 2. Fuel-specific GPR metadata in proposals matches ledger cohorts
    meta = proposals_data.get("models_metadata", {})
    assert meta["methanol"]["training_sample_count"] == 150
    assert meta["n-heptane"]["training_sample_count"] == 106

    # 3. Candidate proposals contain valid physical predictions and EIG
    top_cand = proposals_data["top_candidates"][0]
    assert top_cand["predicted_burn_rate_k"] > 0
    assert top_cand["prediction_uncertainty_std"] > 0
    assert top_cand["expected_information_gain_bits"] >= 0

    # 4. Benchmark links back to methanol cohort
    assert benchmark_data["benchmark_dataset"]["total_available_cohort_size"] == meta["methanol"]["training_sample_count"]

