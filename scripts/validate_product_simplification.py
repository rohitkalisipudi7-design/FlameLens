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
        # 1. Desktop Validation & Initial Load
        driver.set_window_size(1440, 1100)
        driver.get("http://localhost:5174/#panorama")
        time.sleep(2)
        
        # Check console errors on load
        logs = driver.get_log("browser")
        severe_errors = [l for l in logs if l.get("level") == "SEVERE" and "favicon" not in l.get("message", "")]
        results["console_errors_count"] = len(severe_errors)
        results["console_errors"] = severe_errors
        
        # Verify Main Navigation Tabs
        tab_buttons = driver.find_elements(By.CSS_SELECTOR, "#tabs .tab")
        tab_labels = [b.text.strip() for b in tab_buttons]
        results["active_tabs"] = tab_labels
        
        expected_tabs = [
            "Overview",
            "3D Laboratory",
            "Evidence Explorer",
            "Design Optimizer",
            "Comparison Studio"
        ]
        results["exact_tabs_match"] = (tab_labels == expected_tabs)
        
        # Verify Removed Modules Absent from Tabs
        removed_names = ["Safety Envelope", "Video Intelligence", "Contradiction Detector"]
        for name in removed_names:
            results[f"tab_absent_{name}"] = name not in tab_labels
            
        # Verify Overview Page Capabilities Section has 4 Cards
        cap_cards = driver.find_elements(By.CSS_SELECTOR, ".capabilities-grid .capability-card")
        results["overview_capability_cards_count"] = len(cap_cards)
        cap_titles = [c.find_element(By.TAG_NAME, "h3").text for c in cap_cards]
        results["overview_capability_titles"] = cap_titles
        
        # Verify Overview Hero Action Buttons
        hero_btns = driver.find_elements(By.CSS_SELECTOR, ".hero-actions button")
        results["hero_actions_count"] = len(hero_btns)
        hero_btn_texts = [b.text.strip() for b in hero_btns]
        results["hero_actions_texts"] = hero_btn_texts
        
        # Capture Overview Screenshot
        driver.save_screenshot(os.path.join(OUT_DIR, "simplification_overview_desktop.png"))
        print("Captured simplification_overview_desktop.png")
        
        # 2. Test Graceful Redirects for Removed Routes
        redirect_tests = ["#envelope", "#safety", "#video-lab", "#video", "#contradiction", "#contradiccion"]
        results["redirects"] = {}
        for r_hash in redirect_tests:
            driver.get(f"http://localhost:5174/{r_hash}")
            time.sleep(0.5)
            # Check current hash and that overview is visible (not broken)
            current_url = driver.current_url
            panorama_visible = driver.find_element(By.ID, "view-panorama").is_displayed()
            results["redirects"][r_hash] = {
                "final_url": current_url,
                "panorama_active": panorama_visible
            }
            
        # 3. Test Retained Module 1: 3D Combustion Laboratory (#lab3d)
        driver.get("http://localhost:5174/#lab3d")
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, "view-lab3d")))
        time.sleep(2)
        lab_visible = driver.find_element(By.ID, "view-lab3d").is_displayed()
        results["lab3d_visible"] = lab_visible
        grav_buttons = driver.find_elements(By.CSS_SELECTOR, ".grav-pill, [data-grav], .gravity-btn")
        results["lab3d_controls_present"] = len(grav_buttons) > 0
        driver.save_screenshot(os.path.join(OUT_DIR, "simplification_lab3d_desktop.png"))
        print("Captured simplification_lab3d_desktop.png")
        
        # 4. Test Retained Module 2: Evidence Explorer (#data)
        driver.get("http://localhost:5174/#data")
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, "view-data")))
        time.sleep(1.5)
        data_visible = driver.find_element(By.ID, "view-data").is_displayed()
        results["evidence_explorer_visible"] = data_visible
        data_subnav = driver.find_elements(By.CSS_SELECTOR, "#view-data .subnav button")
        results["evidence_subtabs"] = [b.text.strip() for b in data_subnav]
        driver.save_screenshot(os.path.join(OUT_DIR, "simplification_data_desktop.png"))
        print("Captured simplification_data_desktop.png")
        
        # 5. Test Retained Module 3: Design Optimizer (#optimizer)
        driver.get("http://localhost:5174/#optimizer")
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, "view-optimizer")))
        time.sleep(1.5)
        opt_visible = driver.find_element(By.ID, "view-optimizer").is_displayed()
        results["optimizer_visible"] = opt_visible
        driver.save_screenshot(os.path.join(OUT_DIR, "simplification_optimizer_desktop.png"))
        print("Captured simplification_optimizer_desktop.png")
        
        # 6. Test Retained Module 4: Comparison Studio (#compare)
        driver.get("http://localhost:5174/#compare")
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, "view-compare")))
        time.sleep(1.5)
        cmp_visible = driver.find_element(By.ID, "view-compare").is_displayed()
        results["compare_visible"] = cmp_visible
        cmp_sections = driver.find_elements(By.CSS_SELECTOR, "#view-compare .cmp-section")
        results["compare_sections_count"] = len(cmp_sections)
        driver.save_screenshot(os.path.join(OUT_DIR, "simplification_compare_desktop.png"))
        print("Captured simplification_compare_desktop.png")
        
        # 7. Responsive Validation: Tablet (820x1180) & Mobile (390x844)
        driver.set_window_size(820, 1180)
        driver.get("http://localhost:5174/#panorama")
        time.sleep(1)
        driver.save_screenshot(os.path.join(OUT_DIR, "simplification_overview_tablet.png"))
        print("Captured simplification_overview_tablet.png")
        
        driver.set_window_size(390, 844)
        driver.get("http://localhost:5174/#panorama")
        time.sleep(1)
        driver.save_screenshot(os.path.join(OUT_DIR, "simplification_overview_mobile.png"))
        print("Captured simplification_overview_mobile.png")
        
        # Final console errors check
        final_logs = driver.get_log("browser")
        final_severe = [l for l in final_logs if l.get("level") == "SEVERE" and "favicon" not in l.get("message", "")]
        results["final_console_errors_count"] = len(final_severe)
        results["final_console_errors"] = final_severe
        
    finally:
        driver.quit()
        
    with open(os.path.join(OUT_DIR, "simplification_validation_results.json"), "w") as f:
        json.dump(results, f, indent=2)
        
    print("Validation Summary:")
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()

