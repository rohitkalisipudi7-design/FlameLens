import os, time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

out_dir = r"C:\Users\AKHIL\.gemini\antigravity\brain\10b36273-3caa-404e-9bcf-2e7c90e62262\screenshots"
os.makedirs(out_dir, exist_ok=True)

opts = Options()
opts.add_argument("--headless")
opts.add_argument("--disable-gpu")
opts.add_argument("--hide-scrollbars")

driver = webdriver.Chrome(options=opts)

try:
    # 1. Desktop full & hero card
    driver.set_window_size(1440, 960)
    driver.get("http://localhost:5174/#panorama")
    time.sleep(2.5)

    # Check console errors
    logs = driver.get_log("browser")
    severe = [l for l in logs if l["level"] == "SEVERE"]
    print(f"Browser severe errors: {len(severe)}")
    for s in severe:
        print("  ", s["message"])

    # Screenshot hero element
    card = driver.find_element(By.ID, "hero-dual-flame")
    card.screenshot(os.path.join(out_dir, "hero_dual_flame_card_desktop.png"))
    print("Saved hero_dual_flame_card_desktop.png")

    driver.save_screenshot(os.path.join(out_dir, "hero_dual_flame_overview_desktop.png"))
    print("Saved hero_dual_flame_overview_desktop.png")

    # 2. Tablet
    driver.set_window_size(820, 1180)
    driver.get("http://localhost:5174/#panorama")
    time.sleep(2)
    card = driver.find_element(By.ID, "hero-dual-flame")
    card.screenshot(os.path.join(out_dir, "hero_dual_flame_card_tablet.png"))
    driver.save_screenshot(os.path.join(out_dir, "hero_dual_flame_overview_tablet.png"))
    print("Saved tablet screenshots")

    # 3. Mobile
    driver.set_window_size(390, 844)
    driver.get("http://localhost:5174/#panorama")
    time.sleep(2)
    card = driver.find_element(By.ID, "hero-dual-flame")
    card.screenshot(os.path.join(out_dir, "hero_dual_flame_card_mobile.png"))
    driver.save_screenshot(os.path.join(out_dir, "hero_dual_flame_overview_mobile.png"))
    print("Saved mobile screenshots")

finally:
    driver.quit()

