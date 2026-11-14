"""Unit tests for Module C: Combustion Video Intelligence."""
import json
import os
import pytest
from scripts.combustion_video_intelligence import CombustionVideoIntelligence

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DATA_DIR = os.path.join(BASE_DIR, "app", "public", "data")
VID_PATH = os.path.join(PUBLIC_DATA_DIR, "videos", "psi69_flex_calibration_sample.mp4")


def test_calibrated_reference_video_exists():
    """Verify calibrated sample video is present or generated."""
    cv_engine = CombustionVideoIntelligence()
    if not os.path.exists(VID_PATH):
        cv_engine.generate_calibrated_reference_video(VID_PATH)
    assert os.path.exists(VID_PATH)
    assert os.path.getsize(VID_PATH) > 10000


def test_video_analysis_outputs():
    """Verify computer vision extraction yields morphological parameters and extinction detection."""
    cv_engine = CombustionVideoIntelligence()
    res = cv_engine.analyze_video(VID_PATH, pixel_scale=24.5)
    
    assert res["status"] == "VALIDATED_CV_EXTRACTION"
    assert "video_metadata" in res
    assert "calibration" in res
    assert res["calibration"]["calibrated"] is True
    assert res["calibration"]["pixel_scale"] == 24.5
    assert len(res["temporal_curve_sample"]) > 10

    first_frame = res["temporal_curve_sample"][0]
    assert "apparent_area_px2" in first_frame
    assert "apparent_diameter_px" in first_frame
    assert "physical_diameter_mm" in first_frame
    assert "circularity" in first_frame


def test_uncalibrated_pixel_guard():
    """Verify that uncalibrated videos preserve pixel labels without converting to mm."""
    cv_engine = CombustionVideoIntelligence()
    res = cv_engine.analyze_video(VID_PATH, pixel_scale=None)
    
    assert res["calibration"]["calibrated"] is False
    assert "apparent image space" in res["calibration"]["unit"]
    assert res["temporal_curve_sample"][0]["physical_diameter_mm"] is None


def test_video_extinction_candidate_detection():
    """Verify engine detects radiative extinction transition timing."""
    cv_engine = CombustionVideoIntelligence()
    res = cv_engine.analyze_video(VID_PATH, pixel_scale=24.5)
    
    assert "extinction_event" in res
    ext = res["extinction_event"]
    assert "timestamp_sec" in ext
    assert ext["timestamp_sec"] > 2.0


def test_video_intelligence_json_artifact():
    """Verify public JSON artifact matches expected schema."""
    json_path = os.path.join(PUBLIC_DATA_DIR, "video_intelligence.json")
    assert os.path.exists(json_path)
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert "video_id" in data
    assert "extinction_event" in data
    assert "temporal_curve_sample" in data

