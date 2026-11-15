import time
import os
import json
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

OUT_DIR = r"C:\Users\AKHIL\.gemini\antigravity\brain\10b36273-3caa-404e-9bcf-2e7c90e62262\screenshots"
os.makedirs(OUT_DIR, exist_ok=True)

def main():
    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-gpu")
    
    driver = webdriver.Chrome(options=opts)
    results = {}
    
    try:
        # 1. Desktop Validation
        driver.set_window_size(1440, 1100)
        driver.get("http://localhost:5174/#compare")
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, "cmp-conditions-viz")))
        time.sleep(2)
        
        # Check console errors
        logs = driver.get_log("browser")
        severe_errors = [l for l in logs if l.get("level") == "SEVERE" and "favicon" not in l.get("message", "")]
        results["console_errors_count"] = len(severe_errors)
        results["console_errors"] = severe_errors
        
        # Verify 6 Sections & Tech Matrix
        sections = [
            "cmp-sec-01",
            "cmp-sec-02",
            "cmp-sec-03",
            "cmp-sec-04",
            "cmp-sec-05",
            "cmp-sec-06",
            "cmp-sec-tech"
        ]
        results["sections_found"] = {}
        for sec_id in sections:
            el = driver.find_elements(By.ID, sec_id)
            results["sections_found"][sec_id] = len(el) > 0
            
        # Verify Workflow Navigation
        nav_items = driver.find_elements(By.CSS_SELECTOR, "#cmp-workflow-nav .cmp-nav-item")
        results["nav_items_count"] = len(nav_items)
        
        # Verify Presets count
        presets = driver.find_elements(By.CSS_SELECTOR, "#cmp-presets .chip")
        results["presets_count"] = len(presets)
        
        # Verify Section 01: Study Cards
        study_cards = driver.find_elements(By.CSS_SELECTOR, "#cmp-study-cards-wrap .cmp-study-card")
        results["study_cards_count"] = len(study_cards)
        
        # Verify Section 02: Comparability Panel
        compat_badge = driver.find_element(By.CSS_SELECTOR, ".cmp-compat-hero .cmp-status-badge").text
        results["default_comparability_badge"] = compat_badge
        matrix_cols = driver.find_elements(By.CSS_SELECTOR, ".cmp-matrix-grid .cmp-matrix-col")
        results["matrix_cols_count"] = len(matrix_cols)
        
        # Verify Section 03: Conditions Viz (10 Category Rows)
        rows = driver.find_elements(By.CSS_SELECTOR, "#cmp-rows-container .cmp-row")
        results["conditions_rows_count"] = len(rows)
        
        # Verify Section 04: Outcomes (Chart A, B, C, D)
        outcome_cards = driver.find_elements(By.CSS_SELECTOR, "#cmp-outcomes-wrap .cmp-outcome-card")
        results["outcome_cards_count"] = len(outcome_cards)
        d2_svg = driver.find_elements(By.ID, "cmp-d2-svg")
        results["d2_svg_found"] = len(d2_svg) > 0
        kpi_cards = driver.find_elements(By.CSS_SELECTOR, "#cmp-kpis .kpi")
        results["kpi_cards_count"] = len(kpi_cards)
        
        # Verify Section 05: Uncertainty Grid
        quality_cards = driver.find_elements(By.CSS_SELECTOR, "#cmp-uncertainty-wrap .cmp-quality-card")
        results["quality_cards_count"] = len(quality_cards)
        
        # Verify Section 06: Findings Grid
        finding_cards = driver.find_elements(By.CSS_SELECTOR, "#cmp-findings-wrap .cmp-finding-card")
        results["finding_cards_count"] = len(finding_cards)
        
        # Verify Tech Reference Table
        table_rows = driver.find_elements(By.CSS_SELECTOR, "#cmp-table tbody tr")
        results["table_rows_count"] = len(table_rows)
        
        # Capture Full Desktop
        driver.save_screenshot(os.path.join(OUT_DIR, "compare_studio_full_desktop.png"))
        print("Captured compare_studio_full_desktop.png")
        
        # Capture Section 01 & 02
        sec1_2 = driver.find_element(By.ID, "cmp-sec-01")
        driver.execute_script("arguments[0].scrollIntoView();", sec1_2)
        time.sleep(0.5)
        driver.save_screenshot(os.path.join(OUT_DIR, "compare_sec1_study_desktop.png"))
        
        # Capture Section 03 Priority Conditions
        sec3 = driver.find_element(By.ID, "cmp-sec-03")
        driver.execute_script("arguments[0].scrollIntoView();", sec3)
        time.sleep(0.5)
        driver.save_screenshot(os.path.join(OUT_DIR, "compare_sec3_conditions_desktop.png"))
        
        # Capture Section 04 Outcomes & d2 SVG
        sec4 = driver.find_element(By.ID, "cmp-sec-04")
        driver.execute_script("arguments[0].scrollIntoView();", sec4)
        time.sleep(0.5)
        driver.save_screenshot(os.path.join(OUT_DIR, "compare_sec4_outcomes_desktop.png"))
        
        # Capture Section 05 & 06
        sec5 = driver.find_element(By.ID, "cmp-sec-05")
        driver.execute_script("arguments[0].scrollIntoView();", sec5)
        time.sleep(0.5)
        driver.save_screenshot(os.path.join(OUT_DIR, "compare_sec5_uncertainty_desktop.png"))
        
        # Test Preset 1: Heptane vs Methanol
        if len(presets) >= 1:
            driver.execute_script("arguments[0].click();", presets[0])
            time.sleep(0.6)
            card_a_id = driver.find_element(By.ID, "cmp-card-a-id").text
            card_b_id = driver.find_element(By.ID, "cmp-card-b-id").text
            p1_badge = driver.find_element(By.CSS_SELECTOR, ".cmp-compat-hero .cmp-status-badge").text
            results["preset_1_a"] = card_a_id
            results["preset_1_b"] = card_b_id
            results["preset_1_compat"] = p1_badge
            
        # Test Preset 2: CO2 Quench
        if len(presets) >= 2:
            driver.execute_script("arguments[0].click();", presets[1])
            time.sleep(0.6)
            card_a_id_2 = driver.find_element(By.ID, "cmp-card-a-id").text
            card_b_id_2 = driver.find_element(By.ID, "cmp-card-b-id").text
            p2_badge = driver.find_element(By.CSS_SELECTOR, ".cmp-compat-hero .cmp-status-badge").text
            results["preset_2_a"] = card_a_id_2
            results["preset_2_b"] = card_b_id_2
            results["preset_2_compat"] = p2_badge
            
        # Test Preset 3: Cross-Regime Droplet vs Gas Flame
        if len(presets) >= 3:
            driver.execute_script("arguments[0].click();", presets[2])
            time.sleep(0.6)
            p3_badge = driver.find_element(By.CSS_SELECTOR, ".cmp-compat-hero .cmp-status-badge").text
            results["preset_3_compat"] = p3_badge
            # Capture Cross-regime warning state
            sec2 = driver.find_element(By.ID, "cmp-sec-02")
            driver.execute_script("arguments[0].scrollIntoView();", sec2)
            time.sleep(0.5)
            driver.save_screenshot(os.path.join(OUT_DIR, "compare_cross_regime_warning_desktop.png"))
            print("Captured compare_cross_regime_warning_desktop.png")
            
        # Switch back to Preset 1 for tablet & mobile screenshots
        driver.execute_script("arguments[0].click();", presets[0])
        time.sleep(0.6)
        
        # 2. Tablet Validation (820x1180)
        driver.set_window_size(820, 1180)
        time.sleep(1)
        driver.save_screenshot(os.path.join(OUT_DIR, "compare_studio_tablet_full.png"))
        print("Captured compare_studio_tablet_full.png")
        
        # 3. Mobile Validation (390x844)
        driver.set_window_size(390, 844)
        time.sleep(1)
        driver.save_screenshot(os.path.join(OUT_DIR, "compare_studio_mobile_full.png"))
        print("Captured compare_studio_mobile_full.png")
        
    finally:
        driver.quit()
        
    with open(os.path.join(OUT_DIR, "compare_studio_full_validation_results.json"), "w") as f:
        json.dump(results, f, indent=2)
        
    print("Validation Results:")
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
