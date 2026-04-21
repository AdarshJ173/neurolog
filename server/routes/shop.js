// server/routes/shop.js
const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Your Premium Inventory
let inventory = {
  'macbook': 5,
  'iphone 17 pro': 8,
  'airpods': 0, // Out of stock (Error Generator)
  'ps5': 3,
  'xbox': 10,
  'Samsung odessey G9 monitor': 4,
  'Steelseries keyboard': 0, // Out of stock
  'Logitech mouse': 15,
  'Bose headphones': 10,
  'Dyson vacuum': 10,
  'Sony camera': 19,
  'Canon camera': 16,
  'Nikon camera': 13,
  'Samsung S25 ultra': 10,
  'Google Pixel 10 pro XL': 5
};

// GET all products
router.get('/products', (req, res) => {
  res.json(inventory);
});

// POST Buy Item (The Log Generator)
router.post('/buy', (req, res) => {
  const { item, userId } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  // --- SCENARIO 1: BOT TRAP (The "Intelligence" Trigger) ---
  // If the bot asks for these specific items, we flag it as a security threat.
  if (item === "time_machine" || item === "ufo") {
    logger.warn({ 
      message: `Security Alert: Bot at ${ip} tried to buy restricted item (${item})`, 
      module: 'Security',
      ip: ip
    });
    return res.status(403).json({ error: 'Forbidden' });
  }

  // --- SCENARIO 2: Item doesn't exist (User Mistake) ---
  if (!inventory.hasOwnProperty(item)) {
    logger.warn({ 
      message: `User attempted to buy non-existent item: ${item}`, 
      module: 'Shop' 
    });
    return res.status(404).json({ error: 'Item not found' });
  }

  // --- SCENARIO 3: Out of Stock (System Error) ---
  if (inventory[item] <= 0) {
    logger.error({ 
      message: `Stock error for user ${ip} - Item ${item} out of sync`, 
      module: 'Inventory',
      stock: 0
    });
    return res.status(400).json({ error: 'Out of stock' });
  }

  // --- SCENARIO 4: Success (Normal Activity) ---
  // inventory[item] -= 1; // Uncomment if you want stock to actually drain
  
  logger.info({ 
    message: `Transaction successful: ${item} purchased by ${userId || 'guest'}`, 
    http: {
      method: 'POST',
      url: '/api/buy',
      status_code: 200,
    },
    ecommerce: {
      item: item,
      price: 1299, 
      currency: 'USD'
    }
  });
  
  res.json({ success: true, message: `Purchased ${item}` });
});

// --- SCENARIO 5: Critical Crash (System Failure) ---
router.get('/simulate-crash', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  // We use logger.error but include "CRITICAL" in the message for the AI
  logger.error({
    level: 'fatal', 
    message: `CRITICAL: SYSTEM CRASH triggered by ${ip} - Payment Gateway Connection Refused`,
    module: 'System',
    timestamp: new Date().toISOString()
  });
  
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = router;