"""Database Migration v4_1 — Flame in Freefall V4.1.

Adds 10 new relational entities to 'data/olap_experimentos.db' supporting:
1. Video Assets & Provenance
2. Video Sample Frames
3. Video Contour & Morphology Measurements
4. Video Spatial Calibrations
5. Safety Envelope Parameter Space Grid
6. AI Experimental Design Candidates
7. Optimization Runs & Acquisition Tracking
8. Scientific Claims (Granular V4.1 schema)
9. Scientific Contradiction Candidates
10. Human-in-the-Loop Contradiction Review Records
"""
import os
import sqlite3
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH = os.path.join(BASE_DIR, "data", "olap_experimentos.db")


def apply_migration(db_path=DB_PATH):
    print(f"Applying V4.1 database migration to {db_path}...")
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"Database not found at {db_path}")

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.executescript("""
    -- 1. Video Assets
    CREATE TABLE IF NOT EXISTS video_assets (
        video_id TEXT PRIMARY KEY,
        investigation_id TEXT,
        file_name TEXT NOT NULL,
        duration_sec REAL,
        fps REAL,
        resolution_w INTEGER,
        resolution_h INTEGER,
        source_manifest TEXT,
        calibrated INTEGER DEFAULT 0,
        pixel_scale_px_per_mm REAL,
        created_at TEXT
    );

    -- 2. Video Frames
    CREATE TABLE IF NOT EXISTS video_frames (
        frame_id TEXT PRIMARY KEY,
        video_id TEXT NOT NULL REFERENCES video_assets(video_id),
        frame_index INTEGER NOT NULL,
        timestamp_sec REAL NOT NULL,
        roi_x INTEGER,
        roi_y INTEGER,
        roi_w INTEGER,
        roi_h INTEGER
    );

    -- 3. Video Measurements
    CREATE TABLE IF NOT EXISTS video_measurements (
        measurement_id TEXT PRIMARY KEY,
        video_id TEXT NOT NULL REFERENCES video_assets(video_id),
        frame_index INTEGER NOT NULL,
        timestamp_sec REAL NOT NULL,
        apparent_area_px2 REAL,
        apparent_diameter_px REAL,
        physical_diameter_mm REAL,
        centroid_x REAL,
        centroid_y REAL,
        circularity REAL,
        aspect_ratio REAL,
        mean_brightness REAL,
        is_extinction_candidate INTEGER DEFAULT 0,
        qc_flag TEXT DEFAULT 'VALIDATED'
    );

    -- 4. Video Calibrations
    CREATE TABLE IF NOT EXISTS video_calibrations (
        calibration_id TEXT PRIMARY KEY,
        video_id TEXT NOT NULL REFERENCES video_assets(video_id),
        pixel_scale REAL NOT NULL,
        scale_unit TEXT DEFAULT 'px/mm',
        calibration_source TEXT,
        calibration_method TEXT,
        uncertainty_pct REAL
    );

    -- 5. Safety Envelope Results
    CREATE TABLE IF NOT EXISTS safety_envelope_results (
        envelope_id TEXT PRIMARY KEY,
        pressure_atm REAL NOT NULL,
        oxygen_fraction REAL NOT NULL,
        gravity_g REAL NOT NULL,
        fuel_material TEXT NOT NULL,
        evidence_class TEXT NOT NULL,
        nearest_neighbor_dist REAL,
        local_sample_density INTEGER,
        model_uncertainty_score REAL,
        supporting_evidence_count INTEGER,
        analysis_timestamp TEXT
    );

    -- 6. Design Candidates
    CREATE TABLE IF NOT EXISTS design_candidates (
        candidate_id TEXT PRIMARY KEY,
        target_objective TEXT NOT NULL,
        pressure_atm REAL NOT NULL,
        oxygen_fraction REAL NOT NULL,
        gravity_g REAL NOT NULL,
        fuel_material TEXT NOT NULL,
        droplet_d0_mm REAL,
        predicted_burn_rate_k REAL,
        estimated_uncertainty_sigma REAL,
        expected_info_gain REAL,
        feasibility_status TEXT,
        recommended_facility TEXT,
        rationale TEXT,
        created_at TEXT
    );

    -- 7. Optimization Runs
    CREATE TABLE IF NOT EXISTS optimization_runs (
        run_id TEXT PRIMARY KEY,
        objective_name TEXT NOT NULL,
        algorithm_used TEXT NOT NULL,
        n_candidates_generated INTEGER,
        bounds_json TEXT,
        top_candidate_id TEXT REFERENCES design_candidates(candidate_id),
        run_timestamp TEXT
    );

    -- 8. Scientific Claims (Granular V4.1 schema)
    CREATE TABLE IF NOT EXISTS scientific_claims_v41 (
        claim_id TEXT PRIMARY KEY,
        claim_text TEXT NOT NULL,
        source_type TEXT NOT NULL,
        source_reference TEXT,
        investigation_id TEXT,
        condition_vector_json TEXT,
        reported_parameter TEXT,
        reported_value REAL,
        reported_unit TEXT,
        normalized_value REAL,
        normalized_unit TEXT,
        methodology TEXT
    );

    -- 9. Contradiction Candidates
    CREATE TABLE IF NOT EXISTS contradiction_candidates (
        conflict_id TEXT PRIMARY KEY,
        claim_id_a TEXT NOT NULL REFERENCES scientific_claims_v41(claim_id),
        claim_id_b TEXT NOT NULL REFERENCES scientific_claims_v41(claim_id),
        conflict_category TEXT NOT NULL,
        condition_compatibility_score REAL,
        methodological_compatibility_score REAL,
        discrepancy_explanation TEXT,
        preliminary_status TEXT
    );

    -- 10. Contradiction Reviews (Human-in-the-Loop)
    CREATE TABLE IF NOT EXISTS contradiction_reviews (
        review_id TEXT PRIMARY KEY,
        conflict_id TEXT NOT NULL REFERENCES contradiction_candidates(conflict_id),
        reviewer_decision TEXT NOT NULL,
        reviewer_notes TEXT,
        reviewed_at TEXT
    );

    -- Migration Schema Version Tag
    CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TEXT
    );
    """)

    cur.execute(
        "INSERT OR REPLACE INTO schema_migrations (version, applied_at) VALUES ('v4.1.0', datetime('now'))"
    )
    conn.commit()

    # Verify all 10 tables exist
    tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
    conn.close()

    expected = [
        "video_assets", "video_frames", "video_measurements", "video_calibrations",
        "safety_envelope_results", "design_candidates", "optimization_runs",
        "scientific_claims_v41", "contradiction_candidates", "contradiction_reviews"
    ]
    missing = [t for t in expected if t not in tables]
    if missing:
        raise RuntimeError(f"Migration incomplete. Missing tables: {missing}")

    print(f"Migration v4.1 successfully applied! All 10 relational tables verified.")
    return True


if __name__ == "__main__":
    apply_migration()

