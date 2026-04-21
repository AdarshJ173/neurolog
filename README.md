🧠 NeuroLog AI: Predictive AIOps Observability
Transforming Reactive Troubleshooting into Proactive Resilience.

NeuroLog is a high-performance, real-time log monitoring and anomaly detection platform. By combining Unsupervised Clustering (HDBSCAN) with Supervised Risk Classification (XGBoost), NeuroLog identifies system threats with 94% accuracy before they lead to downtime.

🚀 Core Features
Real-Time Ingestion: High-throughput API pipeline for streaming JSON logs.

Predictive Early Warning (EWS): Detects "Death Spiral" patterns (like heap spikes) 15–30 seconds before system failure.

Hybrid AI Core: 
HDBSCAN: Identifies zero-day anomalies without manual rules.

XGBoost (94% Accuracy): Classifies known risks and predicts system impact.

NeuroLog AI Assistant: A Llama-3 powered SRE(Site Reliability Engineer) advisor that provides plain-English root cause analysis and one-click remediation scripts.

Glass-morphism Dashboard: A modern React interface designed for low-cognitive load during high-stress incidents.

🛠️ Technical Stack
Frontend: React.js, Tailwind CSS, Recharts (Real-time visualizations)

Backend: Python (Flask), Node.js (API Gateway)

Database: MongoDB (Time-series log storage)

AI/ML: Scikit-Learn (TF-IDF), XGBoost, HDBSCAN, Groq/Llama-3 (LLM)

🧬 Methodology & Pipeline
Ingestion: External systems stream logs via a secure API Key-authenticated gateway.

Vectorization: Raw text is transformed into high-dimensional numerical vectors using TF-IDF.

Classification: The XGBoost Risk Module analyzes vectors against historical failure patterns.

Clustering: HDBSCAN isolates outliers, flagging them as potential unknown threats.

Remediation: The LLM Module generates context-aware fixes based on the specific system state.

👥 Our Team
We built NeuroLog as a cohesive engineering unit, splitting the architecture into specialized domains:

Sai Nitin(https://github.com/Sai-Nitin123) — Full-Stack Lead & System Integrator

Engineered the entire application architecture, including the Node.js Gateway and Flask Server setup.
Led the Full-Stack development, connecting the React frontend to the MongoDB log-store.
Handled the AI & API Integration, ensuring the LLM (Llama-3) and ML models were successfully connected to the live data stream.

Dhruv Patel(https://github.com/DhruvPatel0110) — Machine Learning Engineer

Developed and fine-tuned the core intelligence engines: HDBSCAN for unsupervised clustering and the XGBoost Risk Module.
Achieved the 94% classification accuracy through rigorous feature engineering and TF-IDF vectorization.

Manoj Kolapalli(https://github.com/Manojkolapalli)— QA & Systems Simulation

Developed the Synthetic Incident Simulator (the dummy app) to stress-test the platform.
Validated the Early Warning System (EWS) by creating "Death Spiral" scenarios to ensure high-fidelity detection under pressure.

To minimize latency, we bypassed traditional transformation layers and went with a Direct-to-Vector pipeline. Our frontend components (like Traffic_Bot.js) pull raw telemetry directly, while our backend handles the mathematical lifting.

**The Shift to Real-Time Observability.**
_**The Legacy Pipeline(What we moved away from)**_:-
1. _The Manual Process_: Required starting a server.js and a traffic_board.js to fake logs.

2. _The Bottleneck_: Data had to be written to a physical app.log.txt file, then passed through a Transformation Engine (te.py) before reaching the database.

3. _The Problem_: File I/O (reading/writing to text files) is slow and doesn't scale for real-world servers.

_**The Updated "NeuroLog" Pipeline (The Current Pro Version)**_:-
1. _API-First Ingestion_: We removed the need for manual traffic generators and text files. Instead, NeuroLog now provides a Standardized API Endpoint.

2. _Plug-and-Play Integration_: Any external application can now "hook" into our backend. No need to start a separate gateway; the main server handles the stream.

3. _Direct-to-Intelligence_: Logs move from the source directly into our XGBoost classification engine and MongoDB. We eliminated the te.py middleman to achieve sub-second latency.


🛠️ Step-by-Step Technical Setup
1. Ingestion Gateway (Node.js)
What to do: Open a terminal in the server or backend folder. Run npm install then node gateway.js.
The Logic: This starts the Port 5000 listener. It is the "Ear" of the project. It waits for JSON logs from the Dummy App and pipes them straight into MongoDB.

2. AI Intelligence Engine (Python Flask)
What to do: Open a second terminal. Run pip install -r requirements.txt then python api.py.
The Logic: This starts the Port 5001 service. This is the "Brain." Every few seconds, it performs the TF-IDF Vectorization and runs the XGBoost Risk Module. It calculates the 94% accuracy score and prepares the Llama-3 advisory response.

3. The Command Center (React)
What to do: Open a third terminal in the client or logintel_ui folder. Run npm install then npm run dev.
The Logic: This launches the Port 5173 (Vite) interface. It uses Short-Polling to check both backends simultaneously—fetching the raw logs from Node.js and the AI insights from Flask.

Why the 94% Accuracy matters?
Unlike traditional monitoring tools that rely on "if-then" logic, NeuroLog uses Gradient Boosting. This allows the model to learn the subtle mathematical relationships between latency, status codes, and heap memory, resulting in nearly perfect threat classification.
