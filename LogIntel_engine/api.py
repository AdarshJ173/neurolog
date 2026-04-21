from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime
from groq import Groq
import secrets
import os

# --- ML IMPORTS ---
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import DBSCAN

app = Flask(__name__)
CORS(app)

# MongoDB Setup
client = MongoClient('YOUR-MONGO-CLIENT-LOCALHOST-SERVER')
db = client['neurolog_db']
logs_collection = db['logs']
users_collection = db['users'] 

# ==========================================
# GROQ API KEY
# ==========================================
groq_client = Groq(api_key="YOUR_GROQ_API_KEY")

# ==========================================
# 1. API KEY MANAGEMENT (Upgraded for Multiple Apps)
# ==========================================
@app.route('/api/get-keys', methods=['GET'])
def get_keys():
    uid = request.args.get('uid')
    user = users_collection.find_one({"uid": uid})
    if not user: return jsonify([])
    
    # Check for new multiple keys, or migrate the old legacy key format
    keys = user.get("api_keys", [])
    if "api_key" in user and not keys:
        keys = [{"name": "Default App", "key": user["api_key"]}]
        
    return jsonify(keys)

@app.route('/api/generate-key', methods=['POST'])
def generate_key():
    data = request.json
    uid = data.get('uid')
    app_name = data.get('app_name', 'New Application')
    
    new_api_key = "nl_" + secrets.token_hex(16)
    key_data = {"name": app_name, "key": new_api_key, "created_at": datetime.utcnow().isoformat()}
    
    # Save the new key to an array inside the user's database document
    users_collection.update_one(
        {"uid": uid}, 
        {"$push": {"api_keys": key_data}, "$set": {"email": data.get('email', '')}}, 
        upsert=True
    )
    return jsonify(key_data)

# ==========================================
# 2. INGESTION ENDPOINT
# ==========================================
@app.route('/api/ingest', methods=['POST'])
def ingest_log():
    api_key = request.headers.get('x-api-key')
    if not api_key: return jsonify({"error": "Unauthorized"}), 401
        
    # Check if the key matches their legacy key OR any of their new multiple keys
    user = users_collection.find_one({"$or": [{"api_key": api_key}, {"api_keys.key": api_key}]})
    if not user: return jsonify({"error": "Invalid API Key."}), 401

    log_data = request.json
    new_log = {
        "uid": user["uid"], 
        "timestamp": datetime.utcnow().isoformat(),
        "source": log_data.get("source", "external_app"),
        "severity_level": log_data.get("severity_level", 3),
        "severity_label": log_data.get("severity_label", "WARNING"),
        "message": log_data.get("message", "Unknown error occurred.")
    }
    logs_collection.insert_one(new_log)
    return jsonify({"status": "success"}), 200

# ==========================================
# 3. FETCH LIVE LOGS 
# ==========================================
@app.route('/api/recent-logs', methods=['GET'])
def get_recent_logs():
    uid = request.args.get('uid') 
    if not uid: return jsonify({"error": "Unauthorized"}), 401
        
    logs = list(logs_collection.find({"uid": uid}).sort("timestamp", -1).limit(20))
    for log in logs: log['_id'] = str(log['_id'])
    return jsonify(logs)

# ==========================================
# 4. BACKGROUND ML VECTORIZATION ENGINE
# ==========================================
@app.route('/api/run-ml', methods=['POST'])
def run_ml():
    data = request.json
    uid = data.get('uid')
    if not uid: return jsonify({"error": "Unauthorized"}), 401

    # Fetch user's logs
    logs = list(logs_collection.find({"uid": uid}).sort("timestamp", -1).limit(100))
    if len(logs) < 5: return jsonify({"status": "Not enough data for ML clustering."}), 200

    # Vectorize and Run DBSCAN Clustering
    messages = [log['message'] for log in logs]
    vectorizer = TfidfVectorizer(stop_words='english')
    try:
        X = vectorizer.fit_transform(messages)
        dbscan = DBSCAN(eps=0.5, min_samples=2)
        clusters = dbscan.fit_predict(X)

        anomaly_count = 0
        for i, log in enumerate(logs):
            is_anomaly = bool(clusters[i] == -1) 
            if is_anomaly: anomaly_count += 1
            logs_collection.update_one({'_id': log['_id']}, {'$set': {'ml_anomaly': is_anomaly, 'cluster_id': int(clusters[i])}})
            
        return jsonify({"status": "ML Vectorization Complete", "anomalies_detected": anomaly_count}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# 5. ML-ENHANCED AI ASSISTANT
# ==========================================
@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message')
    uid = data.get('uid')
    
    if not uid: return jsonify({"reply": "⚠️ Authentication error."}), 401

    # Fetch logs flagged specifically by DBSCAN!
    ml_anomalies = list(logs_collection.find({"uid": uid, "ml_anomaly": True}).sort("timestamp", -1).limit(5))
    
    log_context = "System ML indicates normal operations."
    if ml_anomalies:
        log_context = "\n".join([f"[{l['timestamp']}] ML-FLAGGED ANOMALY ({l['source']}): {l['message']}" for l in ml_anomalies])

    system_prompt = f"""
   You are NeuroLog AI, a highly advanced, conversational developer assistant built into the NeuroLog OS platform.
    
    YOUR COMMUNICATION STYLE (CRITICAL):
    1. Be concise, highly readable, and structured. 
    2. Use Markdown formatting heavily (bold words, bullet points, and `code blocks`).
    3. Break down complex explanations into small, digestible parts with clear headings (###).
    4. NEVER output a giant wall of text. Use spacing and short paragraphs.
    5. Act like a senior DevOps engineer explaining an issue to a teammate.
    
    UI CONTROL (CRITICAL RULE):
    You have the power to change the user's interface theme. 
    ONLY output a theme tag if the user EXPLICITLY asks you to change the background, theme, or colors. 
    Available tags: [THEME_AURORA], [THEME_CYBERPUNK], [THEME_NEBULA], [THEME_SOLAR], [THEME_QUANTUM]
    
    --- ACTIVE SYSTEM ANOMALIES ---
    {log_context}
    -------------------------------
    """

    try:
        response = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.2, 
            max_tokens=1024
        )
        return jsonify({"reply": response.choices[0].message.content})
    except Exception as e:
        return jsonify({"reply": f"⚠️ Neural link error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)
