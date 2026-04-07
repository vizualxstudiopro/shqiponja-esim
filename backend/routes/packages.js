const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const airalo = require('../lib/airaloService');

function normalizePackage(p) {
  return { ...p, price: parseFloat(p.price) || 0, net_price: p.net_price != null ? parseFloat(p.net_price) || 0 : null, highlight: !!p.highlight, visible: !!p.visible };
}

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

  const validCategories = ['balkans', 'europe', 'asia', 'middle_east', 'africa', 'americas', 'oceania', 'global'];
  if (req.query.category && validCategories.includes(req.query.category)) {
    sql += ` AND category = $${paramIdx}`;
    params.push(req.query.category);
    paramIdx++;
  }

  sql += ' ORDER BY region, price';

  const packages = (await db.query(sql, params)).rows;
  res.json(packages.map(normalizePackage));
});

// GET /api/packages/search - Search ALL packages (including non-visible) for visitors
router.get('/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q || q.length < 2) return res.json([]);

  const like = `%${q}%`;
  const packages = (await db.query(
    `SELECT * FROM packages
     WHERE (package_type IS NULL OR package_type = 'sim')
       AND (name ILIKE $1 OR region ILIKE $1 OR country_code ILIKE $1 OR description ILIKE $1)
     ORDER BY visible DESC, region, price
     LIMIT 50`,
    [like]
  )).rows;
  res.json(packages.map(normalizePackage));
});

// GET /api/packages/featured - Get highlighted packages for landing page
router.get('/featured', async (req, res) => {
  const packages = (await db.query(
    "SELECT * FROM packages WHERE visible = 1 AND highlight = 1 AND (package_type IS NULL OR package_type = 'sim') ORDER BY region, price LIMIT 12"
  )).rows;
  res.json(packages.map(normalizePackage));
});

// GET /api/packages/destinations - Unique destinations grouped by country with min price
router.get('/destinations', async (req, res) => {
  try {
    const rows = (await db.query(`
      SELECT
        COALESCE(country_code, region) AS destination_id,
        MIN(flag) AS flag,
        MIN(region) AS region,
        MIN(country_code) AS country_code,
        MIN(price)::float AS min_price,
        COUNT(*)::int AS package_count,
        BOOL_OR(highlight = 1) AS popular
      FROM packages
      WHERE visible = 1 AND (package_type IS NULL OR package_type = 'sim')
      GROUP BY COALESCE(country_code, region)
      ORDER BY BOOL_OR(highlight = 1) DESC, MIN(price)
    `)).rows;

    // Derive country name from first package's name (split on " — ")
    const names = (await db.query(`
      SELECT DISTINCT ON (COALESCE(country_code, region))
        COALESCE(country_code, region) AS destination_id,
        SPLIT_PART(name, ' — ', 1) AS destination_name
      FROM packages
      WHERE visible = 1 AND (package_type IS NULL OR package_type = 'sim')
      ORDER BY COALESCE(country_code, region), id
    `)).rows;

    const nameMap = {};
    for (const n of names) nameMap[n.destination_id] = n.destination_name;

    res.json(rows.map(r => ({
      ...r,
      name: nameMap[r.destination_id] || r.region || r.destination_id
    })));
  } catch (err) {
    console.error('Destinations error:', err);
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

// GET /api/packages/:id - Get a single package (only matches numeric IDs)
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid package ID' });
  const pkg = (await db.query('SELECT * FROM packages WHERE id = $1', [id])).rows[0];
  if (!pkg) return res.status(404).json({ error: 'Package not found' });
  res.json(normalizePackage({ ...pkg }));
});

/**
 * Core sync logic — reusable from admin endpoint AND automated cron
 * @returns {Promise<number>} Number of packages synced
 */
async function syncPackagesFromAiralo() {
  let page = 1;
  let synced = 0;
  const limit = 100;

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
            // Determine category from country structure
            const category = country.type === 'global' ? 'global'
              : country.type === 'regional' ? 'regional' : 'local';

            await client.query(`
              INSERT INTO packages (name, region, flag, data, duration, price, currency, highlight, description,
                                    airalo_package_id, country_code, networks, package_type, net_price, sms, voice,
                                    visible, category)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
              ON CONFLICT(airalo_package_id) DO UPDATE SET
                price = $6, net_price = $14, data = $4, duration = $5,
                networks = $12, sms = $15, voice = $16, description = $9,
                visible = $17
            `, [
              `${country.title} — ${pkg.data || 'Unlimited'}`,
              region, flag, pkg.data || 'Unlimited',
              pkg.validity || pkg.day + ' ditë',
              pkg.price || pkg.net_price * 1.5, 'USD', 0,
              `${operator.title} — ${pkg.data || 'Unlimited'} / ${pkg.validity || pkg.day + ' ditë'}`,
              pkg.id, countryCode, operator.title || '',
              pkg.type || 'sim', pkg.net_price || null,
              pkg.sms || 0, pkg.voice || 0,
              1, category,
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

  return synced;
}

// POST /api/packages/sync - Sync packages from Airalo API (admin only)
router.post('/sync', authMiddleware, adminOnly, async (req, res) => {
  if (!airalo.isEnabled()) {
    return res.status(503).json({ error: 'Airalo API nuk është konfiguruar' });
  }

  try {
    const synced = await syncPackagesFromAiralo();
    console.log(`[AIRALO SYNC] ${synced} packages synced (manual)`);
    res.json({ success: true, synced });
  } catch (err) {
    console.error('[AIRALO SYNC ERROR]', err.message);
    res.status(500).json({ error: 'Sinkronizimi dështoi: ' + err.message });
  }
});

// Export sync function for automated cron use
router.syncPackagesFromAiralo = syncPackagesFromAiralo;

// Helper: Convert country code to flag emoji
function countryToFlag(code) {
  if (!code || code.length !== 2) return '🌍';
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
  );
}

module.exports = router;
