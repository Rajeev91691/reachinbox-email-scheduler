import urllib.request
import time

try:
    with urllib.request.urlopen("http://localhost:5000/health") as resp:
        print("Backend Health:", resp.read().decode())
    with urllib.request.urlopen("http://localhost:3000") as resp:
        print("Frontend Status: HTTP", resp.getcode())
except Exception as e:
    print("Health check error:", e)

# Navigate Chrome to localhost:3000
try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    chrome_options = Options()
    chrome_options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
    driver = webdriver.Chrome(options=chrome_options)
    
    found = False
    for handle in driver.window_handles:
        driver.switch_to.window(handle)
        if "localhost:3000" in driver.current_url:
            driver.refresh()
            found = True
            print("Refreshed existing localhost:3000 tab!")
            break
    if not found:
        driver.get("http://localhost:3000")
        print("Navigated Chrome tab to http://localhost:3000!")
except Exception as e:
    print("Chrome notice:", e)
