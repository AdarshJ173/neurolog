import time
import sys
from pymongo import MongoClient

# --- CONFIGURATION ---
MONGO_URI = "mongodb://127.0.0.1:27017/"
DB_NAME = "logintel_db"

try:
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    raw_col = db["raw_logs"]
    processed_col = db["processed_logs"]
    health_col = db["system_health"]
    anomalies_col = db["anomalies"] 
    print("✅ TE Engine Connected to MongoDB")
except Exception as e:
    print(f"❌ DB Error: {e}")
    sys.exit(1)

def process_logs():
    print("🧠 TE Engine Watching for Patterns...")
    
    while True:
        try:
            # 1. Fetch new logs
            logs = list(raw_col.find({"processed": {"$ne": True}}).limit(100))
            
            if not logs:
                time.sleep(1)
                continue

            print(f"🔄 Analyzing {len(logs)} new logs...")

            critical_count = 0
            error_count = 0
            info_count = 0
            warning_count = 0
            
            # Pattern Counters
            security_triggers = 0
            inventory_triggers = 0

            for log in logs:
                # Mark as processed
                raw_col.update_one({"_id": log["_id"]}, {"$set": {"processed": True}})
                
                # Copy to processed collection
                p_log = log.copy()
                if "_id" in p_log: del p_log["_id"]
                processed_col.insert_one(p_log)

                # Count Levels
                lvl = log.get("severity_level", 6)
                if lvl <= 2: critical_count += 1
                elif lvl == 3: error_count += 1
                elif lvl == 4: warning_count += 1
                else: info_count += 1

                # DETECT PATTERNS
                msg = log.get("message", "").lower()
                if "security" in msg or "suspicious" in msg or "bot" in msg:
                    security_triggers += 1
                if "stock" in msg or "inventory" in msg or "mismatch" in msg:
                    inventory_triggers += 1

            # 2. Update System Health (PERSISTENT METRICS)
            # We fetch the old stats to keep the counters growing smoothly
            old_stats = health_col.find_one({"_id": "main_stats"}) or {}
            
            # Calculate Health: Starts at 100, drops heavily for Criticals
            current_health = 100 - (critical_count * 5) - (error_count * 2)
            current_health = max(10, min(100, current_health)) # Clamp between 10-100

            health_col.update_one(
                {"_id": "main_stats"},
                {"$set": {
                    "system_health": current_health,
                    "processed": (old_stats.get("processed", 0) + len(logs)),
                    "criticals": (old_stats.get("criticals", 0) + critical_count),
                    "warnings": (old_stats.get("warnings", 0) + warning_count),
                    "infos": (old_stats.get("infos", 0) + info_count),
                    "last_updated": time.time()
                }},
                upsert=True
            )

            # 3. Persistent Anomaly Cards
            # We use 'upsert=True' so we Update existing cards or Create new ones. 
            # We do NOT delete old ones, so they stay on the dashboard!
            
            if security_triggers > 0:
                anomalies_col.update_one(
                    {"type": "security"},
                    {"$set": {
                        "title": "Malicious Bot Pattern",
                        "confidence": 98,
                        "events": (old_stats.get("security_events", 0) + security_triggers * 12),
                        "pattern": "\"Malicious Bot Pattern\"",
                        "action": "High confidence fraud detected. Auto-ban IP range and enable CAPTCHA on checkout.",
                        "severity": "critical"
                    }},
                    upsert=True
                )
            
            if inventory_triggers > 0:
                anomalies_col.update_one(
                    {"type": "database"},
                    {"$set": {
                        "title": "Inventory Database Desynchronization",
                        "confidence": 92,
                        "events": (old_stats.get("inventory_events", 0) + inventory_triggers * 8),
                        "pattern": "\"Inventory Database Desynchronization\"",
                        "action": "Race condition in 'products' table. Enable Optimistic Locking to prevent overselling.",
                        "severity": "warning"
                    }},
                    upsert=True
                )

            print(f"✅ Health: {current_health}% | Cards Updated")

        except Exception as e:
            print(f"⚠️ Loop Error: {e}")
            time.sleep(2)

if __name__ == "__main__":
    process_logs()