// server/config/db.js
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    // We use 127.0.0.1 to avoid "localhost" issues on Windows
    await mongoose.connect('mongodb://127.0.0.1:27017/logsense_demo');
    logger.info({ message: 'MongoDB Connected Successfully', module: 'Database' });
  } catch (err) {
    logger.critical({ message: 'MongoDB Connection Failed', error: err.message, module: 'Database' });
    process.exit(1);
  }
};

module.exports = connectDB;