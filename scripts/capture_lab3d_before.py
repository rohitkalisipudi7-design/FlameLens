import time
import os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

OUT_DIR = r"C:\Users\AKHIL\.gemini\antigravity\brain\10b36273-3caa-404e-9bcf-2e7c90e62262\screenshots"
os.makedirs(OUT_DIR, exist_ok=True)

def capture_before():
    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-gpu")
    
    driver = webdriver.Chrome(options=opts)
    try:
        # Desktop
        driver.set_window_size(1440, 1050)
        driver.get("http://localhost:5174/#lab3d")
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, "v3-stage")))
        time.sleep(3) # Wait for WebGL / canvas to initialize
        driver.save_screenshot(os.path.join(OUT_DIR, "lab3d_before_desktop.png"))
        print("Captured lab3d_before_desktop.png")
        
        # Tablet
        driver.set_window_size(820, 1180)
        time.sleep(1)
        driver.save_screenshot(os.path.join(OUT_DIR, "lab3d_before_tablet.png"))
        print("Captured lab3d_before_tablet.png")
        
        # Mobile
        driver.set_window_size(390, 844)
        time.sleep(1)
        driver.save_screenshot(os.path.join(OUT_DIR, "lab3d_before_mobile.png"))
        print("Captured lab3d_before_mobile.png")
        
    finally:
        driver.quit()

if __name__ == "__main__":
    capture_before()

