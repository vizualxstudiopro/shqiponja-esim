const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.warn('[DB] WARNING: DATABASE_URL not set. Database queries will fail.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('railway')
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err);
});

console.log('[DB] Using PostgreSQL', process.env.DATABASE_URL ? '(connected)' : '(no DATABASE_URL)');

module.exports = pool;
