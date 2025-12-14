const axios = require('axios');

// Get timeout from environment or use default
const TIMEOUT = parseInt(process.env.API_TIMEOUT) || 10000;

class GoldPriceService {
  constructor() {
    this.cachedData = null;
    this.lastUpdated = null;
    this.isUpdating = false;
  }

  /**
   * Fetch gold price from Yahoo Finance API
   */
  async fetchGoldPrice() {
    try {
      const response = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/GC=F', {
        timeout: TIMEOUT,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const data = response.data;

      if (data.chart && data.chart.result && data.chart.result.length > 0) {
        const result = data.chart.result[0];
        const meta = result.meta;

        // Get the most accurate price - prefer quote data over meta
        let goldPrice = meta.regularMarketPrice;

        // Check indicators for more recent price data
        if (result.indicators && result.indicators.quote && result.indicators.quote[0]) {
          const quote = result.indicators.quote[0];
          const closes = quote.close;
          if (closes && closes.length > 0) {
            // Get the last non-null close price
            for (let i = closes.length - 1; i >= 0; i--) {
              if (closes[i] !== null) {
                goldPrice = closes[i];
                break;
              }
            }
          }
        }

        // Fallback: if price seems invalid (too low), use regularMarketPrice
        if (!goldPrice || goldPrice < 1000) {
          goldPrice = meta.regularMarketPrice || meta.previousClose;
        }

        const goldPriceData = {
          goldPricePerOunceUSD: goldPrice,
          timestamp: new Date().toISOString(),
          marketState: meta.marketState,
          previousClose: meta.previousClose,
          currency: meta.currency
        };

        return {
          success: true,
          data: goldPriceData
        };
      } else {
        throw new Error('Invalid response structure from Yahoo Finance');
      }
    } catch (error) {
      console.error('Error fetching gold price:', error.message);
      return {
        success: false,
        error: error.message,
        data: this.cachedData // Return cached data if available
      };
    }
  }

  /**
   * Get cached gold price data
   */
  getCachedData() {
    return this.cachedData;
  }

  /**
   * Check if data needs to be updated
   */
  needsUpdate() {
    if (!this.cachedData || !this.lastUpdated) {
      return true;
    }

    const now = new Date();
    const lastUpdate = new Date(this.lastUpdated);
    const diffMinutes = (now - lastUpdate) / (1000 * 60);

    return diffMinutes >= 5; // Update every 5 minutes
  }

  /**
   * Update cached data
   */
  async updateCache() {
    if (this.isUpdating) {
      console.log('Update already in progress, skipping...');
      return this.cachedData;
    }

    this.isUpdating = true;
    console.log('Updating gold price data...');

    const result = await this.fetchGoldPrice();

    if (result.success) {
      this.cachedData = result.data;
      this.lastUpdated = new Date();
      console.log('Gold price updated successfully:', this.cachedData.goldPricePerOunceUSD);
    } else {
      console.error('Failed to update gold price:', result.error);
    }

    this.isUpdating = false;
    return this.cachedData;
  }

  /**
   * Initialize the service with first data fetch
   */
  async initialize() {
    console.log('Initializing Gold Price Service...');
    await this.updateCache();
  }

  /**
   * Get time since last update in minutes
   */
  getTimeSinceLastUpdate() {
    if (!this.lastUpdated) {
      return null;
    }

    const now = new Date();
    const lastUpdate = new Date(this.lastUpdated);
    return Math.floor((now - lastUpdate) / (1000 * 60));
  }
}

module.exports = new GoldPriceService();
