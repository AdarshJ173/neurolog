const axios = require('axios');

// Pointing to your Node Server
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const API_URL = process.env.NEUROLOG_API_URL || 'http://127.0.0.1:5001/api/ingest';
if (!process.env.NEUROLOG_INGEST_KEY) { console.error('Set NEUROLOG_INGEST_KEY to a key created in Configuration.'); process.exit(1); }

const SCENARIOS = [
    // BAD STUFF (Higher weight to ensure health drops)
    { level: 2, label: 'CRITICAL', messages: ['Database connection refused', 'Payment Gateway Timeout', 'RAID Controller Failure'], weight: 0.1 },
    { level: 3, label: 'ERROR', messages: ['NullPointerException in Auth', 'Order ID not found', 'Stock mismatch detected'], weight: 0.15 },
    { level: 4, label: 'WARNING', messages: ['High Memory Usage (92%)', 'API Latency > 500ms', 'Security Alert: Suspicious IP'], weight: 0.2 },

    // GOOD STUFF
    { level: 6, label: 'INFO', messages: ['User login successful', 'Item added to cart', 'Checkout completed', 'Page view: /home'], weight: 0.55 }
];

const getWeightedScenario = () => {
    let r = Math.random();
    for (const s of SCENARIOS) {
        if (r < s.weight) return s;
        r -= s.weight;
    }
    return SCENARIOS[SCENARIOS.length - 1];
};

const generateLog = async () => {
    const scenario = getWeightedScenario();
    // Pick a random message from the scenario
    const baseMessage = scenario.messages[Math.floor(Math.random() * scenario.messages.length)];

    const logData = {
        timestamp: new Date().toISOString(),
        severity_level: scenario.level,
        severity_label: scenario.label,
        source: ['auth-service', 'inventory-db', 'payment-gate', 'frontend'][Math.floor(Math.random() * 4)],
        message: `${baseMessage} [TraceID: ${Math.random().toString(36).substr(7)}]`
    };

    try {
        await axios.post(API_URL, logData, {headers: {'x-api-key': process.env.NEUROLOG_INGEST_KEY}, timeout: 10000});
        console.log(`[${logData.severity_label}] Sent: ${logData.message}`);
    } catch (error) {
        console.error('Failed to connect to Server:', error.message);
    }
};

console.log("🚀 Realistic Traffic Bot Started...");
// Generate logs faster (every 0.5 - 1.5 seconds)
setInterval(generateLog, Math.random() * 1000 + 500);
