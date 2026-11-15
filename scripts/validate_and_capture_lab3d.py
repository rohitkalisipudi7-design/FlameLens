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
        driver.set_window_size(1440, 1050)
        driver.get("http://localhost:5174/#lab3d")
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, "v3-stage")))
        time.sleep(3) # Wait for WebGL scene to load
        
        # Check console errors
        logs = driver.get_log("browser")
        severe_errors = [l for l in logs if l.get("level") == "SEVERE" and "favicon" not in l.get("message", "")]
        results["console_errors_count"] = len(severe_errors)
        results["console_errors"] = severe_errors
        
        # Verify Area A: Header
        hdr_title = driver.find_element(By.CLASS_NAME, "lab-main-title").text
        hdr_scenario = driver.find_element(By.ID, "v3-hdr-name").text
        results["header_title"] = hdr_title
        results["initial_scenario"] = hdr_scenario
        
        # Verify Area B: Scenario Presets
        scene_cards = driver.find_elements(By.CLASS_NAME, "lab-scene-card")
        results["scenario_cards_count"] = len(scene_cards)
        
        # Test clicking Exploration Atmosphere
        explore_card = driver.find_element(By.CSS_SELECTOR, '.lab-scene-card[data-env="explore"]')
        explore_card.click()
        time.sleep(0.5)
        results["explore_scenario_name"] = driver.find_element(By.ID, "v3-hdr-name").text
        results["explore_card_pressed"] = explore_card.get_attribute("aria-pressed")
        
        # Test clicking CO2 Extinguisher Discharge
        co2_card = driver.find_element(By.CSS_SELECTOR, '.lab-scene-card[data-env="co2"]')
        co2_card.click()
        time.sleep(0.5)
        results["co2_scenario_name"] = driver.find_element(By.ID, "v3-hdr-name").text
        
        # Test clicking ISS Cabin
        iss_card = driver.find_element(By.CSS_SELECTOR, '.lab-scene-card[data-env="iss"]')
        iss_card.click()
        time.sleep(0.5)
        results["iss_scenario_name"] = driver.find_element(By.ID, "v3-hdr-name").text
        
        # Verify Area C: Controls
        fuel_select = driver.find_element(By.ID, "lab-in-fuel")
        results["fuel_value"] = fuel_select.get_attribute("value")
        
        # Test changing fuel to Methanol
        driver.execute_script("arguments[0].value = 'Methanol'; arguments[0].dispatchEvent(new Event('change'));", fuel_select)
        time.sleep(0.5)
        results["fuel_after_change"] = driver.find_element(By.ID, "lab-in-fuel").get_attribute("value")
        
        # Test changing back to Heptane
        driver.execute_script("arguments[0].value = 'Heptane'; arguments[0].dispatchEvent(new Event('change'));", fuel_select)
        time.sleep(0.5)
        
        # Test Gravity toolbar
        g_btns = driver.find_elements(By.CSS_SELECTOR, '#v3-g button')
        results["gravity_buttons_count"] = len(g_btns)
        
        # Click 0.38g (Martian)
        g_038 = driver.find_element(By.CSS_SELECTOR, '#v3-g button[data-g="0.38"]')
        g_038.click()
        time.sleep(0.3)
        results["g_038_pressed"] = g_038.get_attribute("aria-pressed")
        
        # Click 0g
        g_0 = driver.find_element(By.CSS_SELECTOR, '#v3-g button[data-g="0"]')
        g_0.click()
        time.sleep(0.3)
        results["g_0_pressed"] = g_0.get_attribute("aria-pressed")
        
        # Test Camera view
        cam_btns = driver.find_elements(By.CSS_SELECTOR, '#v3-view button')
        results["camera_buttons_count"] = len(cam_btns)
        
        # Switch to Color camera
        cam_color = driver.find_element(By.CSS_SELECTOR, '#v3-view button[data-v="color"]')
        cam_color.click()
        time.sleep(0.5)
        results["color_cam_pressed"] = cam_color.get_attribute("aria-pressed")
        
        # Switch back to Free orbit
        cam_free = driver.find_element(By.CSS_SELECTOR, '#v3-view button[data-v="free"]')
        cam_free.click()
        time.sleep(0.5)
        results["free_cam_pressed"] = cam_free.get_attribute("aria-pressed")
        
        # Test Scale modes
        scale_btns = driver.find_elements(By.CSS_SELECTOR, '#v3-level button')
        results["scale_buttons_count"] = len(scale_btns)
        
        # Test Reading level
        aud_tech = driver.find_element(By.CSS_SELECTOR, '#v3-aud button[data-v="tech"]')
        aud_tech.click()
        time.sleep(0.3)
        results["aud_tech_pressed"] = aud_tech.get_attribute("aria-pressed")
        
        aud_plain = driver.find_element(By.CSS_SELECTOR, '#v3-aud button[data-v="plain"]')
        aud_plain.click()
        time.sleep(0.3)
        results["aud_plain_pressed"] = aud_plain.get_attribute("aria-pressed")
        
        # Area D: Telemetry Checks
        time.sleep(1)
        tele_t = driver.find_element(By.CSS_SELECTOR, '.tele-metric-box [data-v="t"]').text
        tele_d = driver.find_element(By.CSS_SELECTOR, '.tele-metric-box [data-v="d"]').text
        results["telemetry_t"] = tele_t
        results["telemetry_d"] = tele_d
        
        # Area E: Evidence Checks
        ev_cov = driver.find_element(By.ID, "v3-cov").text
        ev_k = driver.find_element(By.ID, "ev-k-stat").text
        results["evidence_cov"] = ev_cov[:40] if ev_cov else ""
        results["evidence_k"] = ev_k
        
        # Capture Desktop Screenshots
        driver.save_screenshot(os.path.join(OUT_DIR, "lab3d_after_desktop.png"))
        print("Captured lab3d_after_desktop.png")
        
        # Capture Viewport-only
        stage_el = driver.find_element(By.ID, "v3-stage")
        stage_el.screenshot(os.path.join(OUT_DIR, "lab3d_after_stage_desktop.png"))
        print("Captured lab3d_after_stage_desktop.png")
        
        # 2. Tablet Capture
        driver.set_window_size(820, 1180)
        time.sleep(1)
        driver.save_screenshot(os.path.join(OUT_DIR, "lab3d_after_tablet.png"))
        print("Captured lab3d_after_tablet.png")
        
        # 3. Mobile Capture
        driver.set_window_size(390, 844)
        time.sleep(1)
        driver.save_screenshot(os.path.join(OUT_DIR, "lab3d_after_mobile.png"))
        print("Captured lab3d_after_mobile.png")
        
        with open(os.path.join(OUT_DIR, "lab3d_validation_results.json"), "w") as f:
            json.dump(results, f, indent=2)
        print("Validation results saved successfully.")
        print(json.dumps(results, indent=2))
        
    finally:
        driver.quit()

if __name__ == "__main__":
    main()

