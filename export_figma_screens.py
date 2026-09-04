from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
import time
import os

chrome_options = Options()
chrome_options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
driver = webdriver.Chrome(options=chrome_options)

for handle in driver.window_handles:
    driver.switch_to.window(handle)
    if "figma.com" in driver.current_url:
        break

time.sleep(3)

# Find all tree row / layer elements
tree_items = driver.find_elements(By.XPATH, "//*[contains(text(), 'Login Screen') or contains(text(), 'Homepage')]")
print(f"Found {len(tree_items)} matching tree items")

out_dir = r"C:\Users\rajee\Desktop\ReachInbox-Email-Scheduler\figma_screens"
os.makedirs(out_dir, exist_ok=True)

for idx, item in enumerate(tree_items):
    try:
        text = item.text.strip()
        print(f"Clicking layer [{idx}]: {text}")
        item.click()
        time.sleep(1)
        
        # Send Shift + 2 to zoom to selection
        actions = ActionChains(driver)
        actions.key_down(Keys.SHIFT).send_keys('2').key_up(Keys.SHIFT).perform()
        time.sleep(2)
        
        filepath = os.path.join(out_dir, f"screen_{idx}_{text.replace(' ', '_')}.png")
        driver.save_screenshot(filepath)
        print(f"Saved: {filepath}")
    except Exception as e:
        print(f"Error on item {idx}: {e}")

print("Done exporting screens!")
