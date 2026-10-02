const winston = require('winston');
const path = require('path');

// 1. ROBUST PATH: Go up one level (..) to 'server/logs/app.log'
// This works no matter where you run the command from.
const logDir = path.join(__dirname, '..', 'logs');
require('fs').mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'app.log');

// 2. FORMAT: Matches what Python expects ("level", not "log.level")
const logFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
    return JSON.stringify({
        timestamp: timestamp,
        level: level,  // Changed from "log.level" to "level" for Python compatibility
        message: message,
        service: "quickkart-backend",
        ...meta
    });
});

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        logFormat
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: logFile })
    ]
});

module.exports = logger;
