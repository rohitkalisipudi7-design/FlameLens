import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

opts = Options()
opts.add_argument('--headless')
opts.add_argument('--disable-gpu')
driver = webdriver.Chrome(options=opts)

try:
    driver.set_window_size(1440, 960)
    driver.get('http://localhost:5174/#panorama')
    time.sleep(2)

    # Check console logs
    logs = driver.get_log('browser')
    severe_errors = [l for l in logs if l['level'] == 'SEVERE']
    print(f'Browser Severe Console Errors: {len(severe_errors)}')
    for err in severe_errors:
        print('  SEVERE:', err['message'])

    # 1. Hero Buttons
    hero_btns = driver.find_elements(By.CSS_SELECTOR, '.hero-actions button')
    print(f'Hero Actions Count: {len(hero_btns)}')
    for b in hero_btns:
        text = b.text.strip().replace('\n', ' ')
        go = b.get_attribute('data-go')
        print(f'  Hero Button: "{text}" -> data-go="{go}"')

    # 2. Porthole Canvas
    canvas = driver.find_elements(By.ID, 'hero-flame')
    print(f'Porthole Canvas Exists: {len(canvas) > 0}')
    bolts = driver.find_elements(By.CSS_SELECTOR, '.bolt')
    print(f'Porthole Perimeter Screws: {len(bolts)}')

    # 3. Research Snapshot KPIs
    kpi_cards = driver.find_elements(By.CSS_SELECTOR, '.snapshot-card')
    print(f'Snapshot KPI Cards: {len(kpi_cards)}')
    for card in kpi_cards:
        num = card.find_element(By.CSS_SELECTOR, '.kpi-num').text.strip()
        label = card.find_element(By.CSS_SELECTOR, '.kpi-label').text.strip()
        desc = card.find_element(By.CSS_SELECTOR, '.kpi-desc').text.strip()
        print(f'  KPI: {num} | {label} | {desc}')

    # 4. Capabilities Cards
    cap_cards = driver.find_elements(By.CSS_SELECTOR, '.capability-card')
    print(f'Capability Cards: {len(cap_cards)}')
    for c in cap_cards:
        title = c.find_element(By.TAG_NAME, 'h3').text.strip()
        btn = c.find_element(By.CSS_SELECTOR, '.card-action-btn').text.strip()
        target = c.get_attribute('data-go')
        print(f'  Capability: "{title}" -> "{btn}" ({target})')

    # 5. Discoveries Cards
    disc_cards = driver.find_elements(By.CSS_SELECTOR, '.discovery-card')
    print(f'Discovery Cards: {len(disc_cards)}')
    for d in disc_cards:
        topic = d.find_element(By.CSS_SELECTOR, '.disc-topic-badge').text.strip()
        big = d.find_element(By.CSS_SELECTOR, '.disc-big').text.strip()
        print(f'  Discovery: [{topic}] -> {big}')

    # 6. Problem Cards
    prob_cards = driver.find_elements(By.CSS_SELECTOR, '.problem-card')
    print(f'Problem Cards: {len(prob_cards)}')
    for p in prob_cards:
        tag = p.find_element(By.CSS_SELECTOR, '.problem-tag').text.strip()
        title = p.find_element(By.TAG_NAME, 'h3').text.strip()
        print(f'  Problem: [{tag}] {title}')

    # 7. Inventory Table
    rows = driver.find_elements(By.CSS_SELECTOR, '#inv tbody tr')
    print(f'Campaign Table Rows: {len(rows)}')
    doi_links = driver.find_elements(By.CSS_SELECTOR, '#inv tbody tr td a.doi-link')
    print(f'Campaign DOI Links: {len(doi_links)}')

    # 8. Test Navigation Clicks
    print('\nTesting Navigation Interactions:')
    # Click 3D Lab button in hero
    lab_btn = driver.find_element(By.CSS_SELECTOR, '.hero-btn-primary')
    lab_btn.click()
    time.sleep(1)
    print(f'  Clicked "Explore the Laboratory", Current URL Hash: {driver.current_url.split("/")[-1]}')
    
    # Return to panorama
    driver.get('http://localhost:5174/#panorama')
    time.sleep(1)
    
    # Click Evidence button
    data_btn = driver.find_element(By.CSS_SELECTOR, '.hero-actions button[data-go="data"]')
    data_btn.click()
    time.sleep(1)
    print(f'  Clicked "Explore the Evidence", Current URL Hash: {driver.current_url.split("/")[-1]}')
    
    # Return to panorama
    driver.get('http://localhost:5174/#panorama')
    time.sleep(1)
    
    # Click Optimizer button in capabilities
    opt_card = driver.find_element(By.CSS_SELECTOR, '.card-opt')
    opt_card.click()
    time.sleep(1)
    print(f'  Clicked "Design Optimizer Card", Current URL Hash: {driver.current_url.split("/")[-1]}')

finally:
    driver.quit()

