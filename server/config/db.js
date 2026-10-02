// server/config/db.js
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    // We use 127.0.0.1 to avoid "localhost" issues on Windows
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/logintel_db', {serverSelectionTimeoutMS: 5000});
    logger.info({ message: 'MongoDB Connected Successfully', module: 'Database' });
  } catch (err) {
    logger.error({ message: 'MongoDB Connection Failed', error: err.message, module: 'Database' });
    process.exit(1);
  }
};

module.exports = connectDB;
