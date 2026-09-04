from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
import time

chrome_options = Options()
chrome_options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
driver = webdriver.Chrome(options=chrome_options)

for handle in driver.window_handles:
    driver.switch_to.window(handle)
    if "figma.com" in driver.current_url:
        break

# Let's inspect layers on the left panel
layers = driver.find_elements(By.CSS_SELECTOR, "[data-testid='layer-row'], [class*='layer_row'], [class*='tree_row']")
print(f"Found {len(layers)} layer elements")

# Click on Login Screen layer to focus & zoom into it
for l in layers:
    text = l.text.strip()
    if text:
        print("Layer:", text)

# Zoom in: press '+' multiple times or navigate to node
driver.get("https://www.figma.com/design/kOTwGlESjijCYnMgtHfvfU/Outbox-Labs-Assignment?node-id=59-4050&p=f")
time.sleep(4)
driver.save_screenshot(r"C:\Users\rajee\Desktop\ReachInbox-Email-Scheduler\figma_node_59_4050.png")
print("Saved node screenshot")
