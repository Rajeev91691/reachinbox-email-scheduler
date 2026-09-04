from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
import time

chrome_options = Options()
chrome_options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
driver = webdriver.Chrome(options=chrome_options)

for handle in driver.window_handles:
    driver.switch_to.window(handle)
    if "localhost:3000" in driver.current_url:
        break

try:
    btns = driver.find_elements(By.TAG_NAME, "button")
    for b in btns:
        if "Log in with Google" in b.text or "Mitrajit" in b.text or "Login" in b.text:
            b.click()
            print("Clicked login button:", b.text)
            break
except Exception as e:
    print("Click error:", e)

time.sleep(2)
driver.save_screenshot(r"C:\Users\rajee\Desktop\ReachInbox-Email-Scheduler\live_dashboard_screenshot.png")
print("Saved live_dashboard_screenshot.png")
