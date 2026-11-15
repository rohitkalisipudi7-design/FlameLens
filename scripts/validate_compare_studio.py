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
        # 1. Desktop Validation & Capture
        driver.set_window_size(1440, 1100)
        driver.get("http://localhost:5174/#compare")
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, "cmp-conditions-viz")))
        time.sleep(2)
        
        # Check console errors
        logs = driver.get_log("browser")
        severe_errors = [l for l in logs if l.get("level") == "SEVERE" and "favicon" not in l.get("message", "")]
        results["console_errors_count"] = len(severe_errors)
        results["console_errors"] = severe_errors
        
        # Verify Priority Visualization Header
        viz_heading = driver.find_element(By.CLASS_NAME, "cmp-viz-heading").text
        results["viz_heading"] = viz_heading
        
        # Verify 10 Comparison Category Rows
        rows = driver.find_elements(By.CSS_SELECTOR, "#cmp-rows-container .cmp-row")
        results["categories_count"] = len(rows)
        
        # Check Preset 1: Heptane vs Methanol
        presets = driver.find_elements(By.CSS_SELECTOR, "#cmp-presets .chip")
        if len(presets) >= 1:
            presets[0].click()
            time.sleep(0.5)
            rows = driver.find_elements(By.CSS_SELECTOR, "#cmp-rows-container .cmp-row")
            card_a_id = driver.find_element(By.ID, "cmp-card-a-id").text
            card_b_id = driver.find_element(By.ID, "cmp-card-b-id").text
            results["preset_1_a"] = card_a_id
            results["preset_1_b"] = card_b_id
            
            # Category 3: Fuel
            fuel_status = rows[2].find_element(By.CLASS_NAME, "cmp-status-badge").text
            results["preset_1_fuel_status"] = fuel_status
            
            # Category 4: Gravity
            grav_status = rows[3].find_element(By.CLASS_NAME, "cmp-status-badge").text
            results["preset_1_gravity_status"] = grav_status
            
        # Check Preset 2: CO2 Quench vs Air
        if len(presets) >= 2:
            presets[1].click()
            time.sleep(0.5)
            rows = driver.find_elements(By.CSS_SELECTOR, "#cmp-rows-container .cmp-row")
            card_a_id_2 = driver.find_element(By.ID, "cmp-card-a-id").text
            card_b_id_2 = driver.find_element(By.ID, "cmp-card-b-id").text
            results["preset_2_a"] = card_a_id_2
            results["preset_2_b"] = card_b_id_2
            
            # Category 7: CO2
            co2_val_a = rows[6].find_element(By.CSS_SELECTOR, ".cell-a .cell-val").text
            co2_val_b = rows[6].find_element(By.CSS_SELECTOR, ".cell-b .cell-val").text
            co2_status = rows[6].find_element(By.CLASS_NAME, "cmp-status-badge").text
            results["preset_2_co2_a"] = co2_val_a
            results["preset_2_co2_b"] = co2_val_b
            results["preset_2_co2_status"] = co2_status
            
        # Test Dropdown Change
        sel_a = driver.find_element(By.ID, "cmp-sel-a")
        options_a = sel_a.find_elements(By.TAG_NAME, "option")
        if len(options_a) > 5:
            driver.execute_script("arguments[0].selectedIndex = 4; arguments[0].dispatchEvent(new Event('change'));", sel_a)
            time.sleep(0.5)
            results["custom_select_a"] = driver.find_element(By.ID, "cmp-card-a-id").text
            
        # Verify KPI Cards exist and are populated
        kpi_cards = driver.find_elements(By.CSS_SELECTOR, "#cmp-kpis .kpi")
        results["kpi_cards_count"] = len(kpi_cards)
        
        # Verify Aligned Parameter Matrix Table exists
        table_rows = driver.find_elements(By.CSS_SELECTOR, "#cmp-table tbody tr")
        results["table_rows_count"] = len(table_rows)
        
        # Capture Desktop Full & Priority Card
        driver.save_screenshot(os.path.join(OUT_DIR, "compare_studio_desktop.png"))
        print("Captured compare_studio_desktop.png")
        
        viz_el = driver.find_element(By.ID, "cmp-conditions-viz")
        viz_el.screenshot(os.path.join(OUT_DIR, "compare_conditions_priority_card_desktop.png"))
        print("Captured compare_conditions_priority_card_desktop.png")
        
        # 2. Tablet Capture
        driver.set_window_size(820, 1180)
        time.sleep(1)
        driver.save_screenshot(os.path.join(OUT_DIR, "compare_studio_tablet.png"))
        viz_el = driver.find_element(By.ID, "cmp-conditions-viz")
        viz_el.screenshot(os.path.join(OUT_DIR, "compare_conditions_priority_card_tablet.png"))
        print("Captured compare_studio_tablet.png")
        
        # 3. Mobile Capture
        driver.set_window_size(390, 844)
        time.sleep(1)
        driver.save_screenshot(os.path.join(OUT_DIR, "compare_studio_mobile.png"))
        viz_el = driver.find_element(By.ID, "cmp-conditions-viz")
        viz_el.screenshot(os.path.join(OUT_DIR, "compare_conditions_priority_card_mobile.png"))
        print("Captured compare_studio_mobile.png")
        
        with open(os.path.join(OUT_DIR, "compare_studio_validation_results.json"), "w") as f:
            json.dump(results, f, indent=2)
        print("Validation results saved successfully.")
        print(json.dumps(results, indent=2))
        
    finally:
        driver.quit()

if __name__ == "__main__":
    main()
