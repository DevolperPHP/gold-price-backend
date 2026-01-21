require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const goldPriceService = require('./goldPriceService');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`\n📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  console.log(`   User-Agent: ${req.headers['user-agent'] || 'N/A'}`);
  console.log(`   Origin: ${req.headers.origin || 'N/A'}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'gold-price-backend'
  });
});

app.get('/', (req, res) => {
  res.send('Welcome to the Gold Price Backend Service. Use /api/gold-price to get the current gold price.');
});

// Get current gold price
app.get('/api/gold-price', async (req, res) => {
  try {
    console.log('Received request for gold price at', new Date().toISOString());
    const cachedData = goldPriceService.getCachedData();

    if (!cachedData) {
      console.log('No cached data available, service may be initializing');
      return res.status(503).json({
        success: false,
        error: 'Gold price data not available',
        message: 'Service is initializing, please try again in a moment'
      });
    }

    const timeSinceLastUpdate = goldPriceService.getTimeSinceLastUpdate();
    console.log('Returning cached gold price:', cachedData.goldPricePerOunceUSD);

    res.json({
      success: true,
      data: cachedData,
      meta: {
        lastUpdated: goldPriceService.lastUpdated,
        timeSinceLastUpdate: timeSinceLastUpdate,
        nextUpdateIn: Math.max(0, 5 - timeSinceLastUpdate),
        source: 'Yahoo Finance API (Cached)'
      }
    });
  } catch (error) {
    console.error('Error in /api/gold-price:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Force update gold price (for testing/admin purposes)
app.post('/api/gold-price/update', async (req, res) => {
  try {
    console.log('Manual update requested via API');
    await goldPriceService.updateCache();

    const cachedData = goldPriceService.getCachedData();
    res.json({
      success: true,
      data: cachedData,
      message: 'Gold price updated successfully'
    });
  } catch (error) {
    console.error('Error in manual update:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update gold price',
      message: error.message
    });
  }
});

// Get service status
app.get('/api/status', (req, res) => {
  const cachedData = goldPriceService.getCachedData();
  const timeSinceLastUpdate = goldPriceService.getTimeSinceLastUpdate();

  res.json({
    service: 'Gold Price Backend',
    version: '1.0.0',
    status: cachedData ? 'operational' : 'initializing',
    lastUpdated: goldPriceService.lastUpdated,
    timeSinceLastUpdate: timeSinceLastUpdate,
    nextUpdateIn: Math.max(0, 5 - (timeSinceLastUpdate || 0)),
    cacheStatus: cachedData ? 'warm' : 'cold',
    currentPrice: cachedData ? cachedData.goldPricePerOunceUSD : null
  });
});

// Cron job to update gold price every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('\n⏰ Running scheduled update (every 5 minutes)...');
  await goldPriceService.updateCache();
});

// Initialize service and start server
async function startServer() {
  try {
    // Initialize gold price service
    await goldPriceService.initialize();

    // Start Express server
    app.listen(PORT, () => {

      console.log(`\nPress Ctrl+C to stop the server\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the server
startServer();
