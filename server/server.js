// server/server.js (Main Folder Version)
const express = require('express');
const cors = require('cors');
const fs = require('fs');       
const path = require('path');   
const mongoose = require('mongoose'); 
const connectDB = require('./config/db'); 

const app = express();
app.use(cors());
app.use(express.json());

try { connectDB(); } catch (e) { console.log("DB skipped"); }

app.post('/api/log', (req, res) => {
    try {
        const logEntry = JSON.stringify(req.body) + '\n';
        const logFilePath = path.join(__dirname, 'logs', 'app.log');
        
        fs.appendFileSync(logFilePath, logEntry);
        
        console.log(`✅ WRITTEN TO FILE: ${req.body.severity_label}`);
        res.status(201).send({ status: 'ok' });
    } catch (error) {
        console.error("❌ FILE WRITE ERROR:", error);
        res.status(500).send(error);
    }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🟢 MAIN SERVER RUNNING on port ${PORT}`);
});