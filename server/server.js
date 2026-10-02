const express = require('express');
const axios = require('axios');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const app = express();
app.use(express.json({ limit: '64kb' }));
// Optional compatibility gateway. The unified Flask API is the source of truth.
app.post('/api/log', async (req, res) => {
  try {
    const response = await axios.post(process.env.NEUROLOG_API_URL || 'http://127.0.0.1:5001/api/ingest', req.body, {
      headers: { 'x-api-key': req.headers['x-api-key'] || process.env.NEUROLOG_INGEST_KEY || '' }, timeout: 10000,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 502).json(error.response?.data || {error: 'NeuroLog API unavailable.'});
  }
});
app.get('/health', (_req, res) => res.json({status: 'ok', service: 'optional-gateway'}));
app.use((_req, res) => res.status(404).json({error: 'Route not found.'}));
app.use((error, _req, res, _next) => res.status(error.status || 500).json({error: 'Invalid request.'}));
if (require.main === module) app.listen(Number(process.env.PORT || 5000), '127.0.0.1', () => console.log('Optional gateway on http://127.0.0.1:5000'));
module.exports = app;
