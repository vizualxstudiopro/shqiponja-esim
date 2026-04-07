const axios = require('axios');

// ══════════ CONFIG ══════════
const AIRALO_CLIENT_ID = process.env.AIRALO_CLIENT_ID;
const AIRALO_CLIENT_SECRET = process.env.AIRALO_CLIENT_SECRET;
const AIRALO_ENV = process.env.AIRALO_ENV || 'sandbox'; // 'sandbox' or 'production'

// Airalo uses a single API URL — sandbox vs production is determined by credentials
const BASE_URL = process.env.AIRALO_API_URL || 'https://partners-api.airalo.com/v2';

console.log(`[AIRALO] Environment: ${AIRALO_ENV}, Base URL: ${BASE_URL}`);

const enabled = !!(AIRALO_CLIENT_ID && AIRALO_CLIENT_SECRET);

// ══════════ TOKEN MANAGEMENT ══════════
let accessToken = null;
let tokenExpiry = 0;

async function getToken() {
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const res = await axios.post(`${BASE_URL}/token`, {
    client_id: AIRALO_CLIENT_ID,
    client_secret: AIRALO_CLIENT_SECRET,
    grant_type: 'client_credentials',
  });

  accessToken = res.data.data.access_token;
  // Expire 5 min early to avoid edge cases
  tokenExpiry = Date.now() + (res.data.data.expires_in - 300) * 1000;
  console.log('[AIRALO] Token acquired, expires in', res.data.data.expires_in, 'seconds');
  return accessToken;
}

function authHeaders() {
  return getToken().then(token => ({
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  }));
}

// ══════════ PACKAGES ══════════

/**
 * Fetch all available packages/countries from Airalo
 * @param {object} params - { limit, page, filter[country], filter[type] }
 * @returns {Promise<object>} Airalo packages response
 */
async function getPackages(params = {}) {
  if (!enabled) {
    console.log('[AIRALO DEV] getPackages called without credentials');
    return null;
  }

  const headers = await authHeaders();
  const res = await axios.get(`${BASE_URL}/packages`, { headers, params });
  return res.data;
}

/**
 * Fetch packages for a specific country
 * @param {string} countryCode - ISO 3166-1 alpha-2 code (e.g., 'US', 'TR', 'IT')
 * @returns {Promise<object>} Country packages from Airalo
 */
async function getCountryPackages(countryCode) {
  if (!enabled) {
    console.log(`[AIRALO DEV] getCountryPackages(${countryCode}) called without credentials`);
    return null;
  }

  const headers = await authHeaders();
  const res = await axios.get(`${BASE_URL}/packages/${countryCode}`, { headers });
  return res.data;
}

// ══════════ ORDERS ══════════

/**
 * Create an eSIM order on Airalo
 * @param {string} packageId - Airalo package ID (e.g., 'change-in-7days-1gb')
 * @param {number} quantity - Number of eSIMs to order (usually 1)
 * @param {string} description - Order description for tracking
 * @returns {Promise<object>} Airalo order with eSIM data (QR code, ICCID, etc.)
 */
async function createOrder(packageId, quantity = 1, description = '') {
  if (!enabled) {
    console.log(`[AIRALO DEV] createOrder(${packageId}) called without credentials`);
    return null;
  }

  const headers = await authHeaders();
  const res = await axios.post(`${BASE_URL}/orders`, {
    package_id: packageId,
    quantity,
    type: 'sim',
    description,
  }, { headers });

  return res.data;
}

/**
 * Create a top-up order for an existing eSIM
 * @param {string} packageId - Airalo top-up package ID
 * @param {string} iccid - ICCID of the existing eSIM
 * @param {string} description - Order description
 * @returns {Promise<object>} Airalo top-up order
 */
async function createTopup(packageId, iccid, description = '') {
  if (!enabled) {
    console.log(`[AIRALO DEV] createTopup(${packageId}, ${iccid}) called without credentials`);
    return null;
  }

  const headers = await authHeaders();
  const res = await axios.post(`${BASE_URL}/orders/topups`, {
    package_id: packageId,
    iccid,
    description,
  }, { headers });

  return res.data;
}

// ══════════ eSIM MANAGEMENT ══════════

/**
 * Get eSIM details (status, usage, QR code)
 * @param {string} iccid - ICCID of the eSIM
 * @returns {Promise<object>} eSIM details with QR code, usage, status
 */
async function getEsim(iccid) {
  if (!enabled) {
    console.log(`[AIRALO DEV] getEsim(${iccid}) called without credentials`);
    return null;
  }

  const headers = await authHeaders();
  const res = await axios.get(`${BASE_URL}/sims/${iccid}`, { headers });
  return res.data;
}

/**
 * Get eSIM usage info
 * @param {string} iccid - ICCID of the eSIM
 * @returns {Promise<object>} Usage data (remaining data, expiry, etc.)
 */
async function getEsimUsage(iccid) {
  if (!enabled) {
    console.log(`[AIRALO DEV] getEsimUsage(${iccid}) called without credentials`);
    return null;
  }

  const headers = await authHeaders();
  const res = await axios.get(`${BASE_URL}/sims/${iccid}/usage`, { headers });
  return res.data;
}

// ══════════ UTILITIES ══════════

/**
 * Check if Airalo API is configured and available
 */
function isEnabled() {
  return enabled;
}

/**
 * Get the current environment
 */
function getEnvironment() {
  return AIRALO_ENV;
}

if (!enabled) {
  console.warn('[AIRALO] AIRALO_CLIENT_ID/SECRET mungojnë — API-ja Airalo nuk do funksionojë.');
}

module.exports = {
  isEnabled,
  getEnvironment,
  getPackages,
  getCountryPackages,
  createOrder,
  createTopup,
  getEsim,
  getEsimUsage,
};
