from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
import time

chrome_options = Options()
chrome_options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
driver = webdriver.Chrome(options=chrome_options)

figma_handle = None
for handle in driver.window_handles:
    driver.switch_to.window(handle)
    if "figma.com" in driver.current_url:
        figma_handle = handle
        print("Found Figma tab:", driver.title, driver.current_url)
        break

if not figma_handle:
    print("Figma tab not open, navigating...")
    driver.get("https://www.figma.com/design/kOTwGlESjijCYnMgtHfvfU/Outbox-Labs-Assignment?node-id=59-4050&p=f")

time.sleep(5)
# Zoom to fit (Shift + 1 or Shift + 2 in Figma)
try:
    body = driver.find_element(By.TAG_NAME, "body")
    body.send_keys(Keys.SHIFT, "1")
    time.sleep(2)
except Exception as e:
    print("Zoom note:", e)

screenshot_path = r"C:\Users\rajee\Desktop\ReachInbox-Email-Scheduler\figma_overview.png"
driver.save_screenshot(screenshot_path)
print("Screenshot saved to:", screenshot_path)
