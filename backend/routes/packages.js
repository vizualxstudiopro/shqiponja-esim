const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const airalo = require('../lib/airaloService');

// GET /api/packages - List all eSIM packages
router.get('/', async (req, res) => {
  const { country, region, type } = req.query;

  let sql = 'SELECT * FROM packages WHERE visible = 1';
  const params = [];
  let paramIdx = 1;

  if (country) {
    sql += ` AND country_code = $${paramIdx}`;
    params.push(country.toUpperCase());
    paramIdx++;
  }
  if (region) {
    sql += ` AND region = $${paramIdx}`;
    params.push(region);
    paramIdx++;
  }
  if (type) {
    sql += ` AND package_type = $${paramIdx}`;
    params.push(type);
    paramIdx++;
  } else {
    // By default, only show SIM packages (not topups)
    sql += " AND (package_type IS NULL OR package_type = 'sim')";
  }

  sql += ' ORDER BY region, price';

  const packages = (await db.query(sql, params)).rows;
  res.json(packages.map((p) => ({ ...p, highlight: !!p.highlight })));
});

// GET /api/packages/featured - Get highlighted packages for landing page
router.get('/featured', async (req, res) => {
  const packages = (await db.query(
    "SELECT * FROM packages WHERE visible = 1 AND highlight = 1 AND (package_type IS NULL OR package_type = 'sim') ORDER BY region, price LIMIT 12"
  )).rows;
  res.json(packages.map((p) => ({ ...p, highlight: !!p.highlight })));
});

// GET /api/packages/:id - Get a single package
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const pkg = (await db.query('SELECT * FROM packages WHERE id = $1', [id])).rows[0];
  if (!pkg) return res.status(404).json({ error: 'Package not found' });
  res.json({ ...pkg, highlight: !!pkg.highlight });
});

// POST /api/packages/sync - Sync packages from Airalo API (admin only)
router.post('/sync', authMiddleware, adminOnly, async (req, res) => {
  if (!airalo.isEnabled()) {
    return res.status(503).json({ error: 'Airalo API nuk është konfiguruar' });
  }

  try {
    let page = 1;
    let synced = 0;
    const limit = 100;

    // Ensure unique index on airalo_package_id exists
    await db.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_packages_airalo_unique ON packages(airalo_package_id)');

    while (true) {
      const result = await airalo.getPackages({ limit, page });
      if (!result || !result.data || result.data.length === 0) break;

      const client = await db.connect();
      try {
        await client.query('BEGIN');
        for (const country of result.data) {
          const countryCode = country.country_code || '';
          const flag = country.flag || countryToFlag(countryCode);
          const region = country.region || 'Other';

          if (!country.operators) continue;
          for (const operator of country.operators) {
            if (!operator.packages) continue;
            for (const pkg of operator.packages) {
              await client.query(`
                INSERT INTO packages (name, region, flag, data, duration, price, currency, highlight, description,
                                      airalo_package_id, country_code, networks, package_type, net_price, sms, voice)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                ON CONFLICT(airalo_package_id) DO UPDATE SET
                  price = $6, net_price = $14, data = $4, duration = $5,
                  networks = $12, sms = $15, voice = $16, description = $9
              `, [
                `${country.title} — ${pkg.data || 'Unlimited'}`,
                region, flag, pkg.data || 'Unlimited',
                pkg.validity || pkg.day + ' ditë',
                pkg.price || pkg.net_price * 1.5, 'USD', 0,
                `${operator.title} — ${pkg.data || 'Unlimited'} / ${pkg.validity || pkg.day + ' ditë'}`,
                pkg.id, countryCode, operator.title || '',
                pkg.type || 'sim', pkg.net_price || null,
                pkg.sms || 0, pkg.voice || 0,
              ]);
              synced++;
            }
          }
        }
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }

      if (result.data.length < limit) break;
      page++;
    }

    console.log(`[AIRALO SYNC] ${synced} packages synced`);
    res.json({ success: true, synced });
  } catch (err) {
    console.error('[AIRALO SYNC ERROR]', err.message);
    res.status(500).json({ error: 'Sinkronizimi dështoi: ' + err.message });
  }
});

// Helper: Convert country code to flag emoji
function countryToFlag(code) {
  if (!code || code.length !== 2) return '🌍';
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
  );
}

module.exports = router;
