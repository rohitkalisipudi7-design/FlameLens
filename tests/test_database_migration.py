"""Unit tests for Phase 1: Database Migration and Shared Schema Contracts."""
import os
import sqlite3
import pytest
from scripts.migrations.v4_1_migration import apply_migration

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "data", "olap_experimentos.db")


def test_v41_migration_tables_exist():
    """Verify all 10 new V4.1 relational entities are created in SQLite warehouse."""
    assert os.path.exists(DB_PATH)
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
    conn.close()

    expected_tables = [
        "video_assets",
        "video_frames",
        "video_measurements",
        "video_calibrations",
        "safety_envelope_results",
        "design_candidates",
        "optimization_runs",
        "scientific_claims_v41",
        "contradiction_candidates",
        "contradiction_reviews",
        "schema_migrations",
    ]
    for table in expected_tables:
        assert table in tables, f"Expected table {table} missing from database."


def test_schema_migration_version_tag():
    """Verify migration logs version v4.1.0 into schema_migrations."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    row = cur.execute("SELECT version FROM schema_migrations WHERE version='v4.1.0'").fetchone()
    conn.close()
    assert row is not None
    assert row[0] == "v4.1.0"

