import time
import json
import os
from pymongo import MongoClient
from pathlib import Path

# --- CONFIGURATION ---
# 1. Right-click 'server/logs/app.log' -> Copy Path -> Paste below inside r"..."
LOG_FILE_PATH = os.getenv('LOG_FILE_PATH', str(Path(__file__).resolve().parents[1] / 'server' / 'logs' / 'app.log'))

MONGO_URI = "mongodb://127.0.0.1:27017"
DB_NAME = "logintel_db"
COLLECTION_NAME = "raw_logs"

def follow(thefile):
    thefile.seek(0, 2)
    while True:
        line = thefile.readline()
        if not line:
            time.sleep(0.1)
            continue
        yield line

def start_courier():
    print(f"🚀 Courier Started! Watching: {LOG_FILE_PATH}")

    # Connect to MongoDB
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]
        print("✅ Connected to MongoDB")
    except Exception as e:
        print(f"❌ Mongo Error: {e}")
        return

    # Open File
    try:
        log_file = open(LOG_FILE_PATH, "r")
    except FileNotFoundError:
        print("❌ Error: Could not find app.log. Did you paste the path correctly?")
        return

    # Watch Loop
    log_lines = follow(log_file)
    for line in log_lines:
        try:
            if line.strip():
                log_data = json.loads(line)
                collection.insert_one(log_data)
                print(f"📨 Sent: {log_data.get('message', 'Log Event')}")
        except (ValueError, TypeError) as error:
            print(f'Skipping malformed log: {error}')

if __name__ == "__main__":
    start_courier()
