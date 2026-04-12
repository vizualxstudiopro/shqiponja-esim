const axios = require('axios');

// Cache exchange rates for 1 hour
let cachedRates = null;
let cacheExpiry = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Fallback rates if API is down
const FALLBACK_RATES = { EUR: 0.92, ALL: 100.5, GBP: 0.79 };

/**
 * Fetch real-time exchange rates from USD base
 * Uses open.er-api.com (free, no key needed, 1500 req/month)
 */
async function getRates() {
  if (cachedRates && Date.now() < cacheExpiry) {
    return cachedRates;
  }

  try {
    const res = await axios.get('https://open.er-api.com/v6/latest/USD', { timeout: 5000 });
    if (res.data && res.data.rates) {
      cachedRates = {
        EUR: res.data.rates.EUR || FALLBACK_RATES.EUR,
        ALL: res.data.rates.ALL || FALLBACK_RATES.ALL,
        GBP: res.data.rates.GBP || FALLBACK_RATES.GBP,
        updatedAt: new Date().toISOString(),
      };
      cacheExpiry = Date.now() + CACHE_DURATION;
      console.log(`[EXCHANGE] Rates updated: 1 USD = ${cachedRates.EUR} EUR, ${cachedRates.ALL} ALL`);
      return cachedRates;
    }
  } catch (err) {
    console.warn('[EXCHANGE] API failed, using fallback rates:', err.message);
  }

  // Return fallback or last cached
  if (cachedRates) return cachedRates;
  return { ...FALLBACK_RATES, updatedAt: null };
}

/**
 * Convert USD to EUR
 */
async function usdToEur(amountUsd) {
  const rates = await getRates();
  return Math.round(amountUsd * rates.EUR * 100) / 100;
}

/**
 * Get EUR to ALL rate
 */
async function eurToAllRate() {
  const rates = await getRates();
  // ALL/EUR = ALL/USD ÷ EUR/USD
  return Math.round((rates.ALL / rates.EUR) * 100) / 100;
}

module.exports = { getRates, usdToEur, eurToAllRate };
