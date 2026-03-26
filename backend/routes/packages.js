const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const airalo = require('../lib/airaloService');

// GET /api/packages - List all eSIM packages
router.get('/', (req, res) => {
  const { country, region, type } = req.query;

  let sql = 'SELECT * FROM packages WHERE visible = 1';
  const params = [];

  if (country) {
    sql += ' AND country_code = ?';
    params.push(country.toUpperCase());
  }
  if (region) {
    sql += ' AND region = ?';
    params.push(region);
  }
  if (type) {
    sql += " AND package_type = ?";
    params.push(type);
  } else {
    // By default, only show SIM packages (not topups)
    sql += " AND (package_type IS NULL OR package_type = 'sim')";
  }

  sql += ' ORDER BY region, price';

  const packages = db.prepare(sql).all(...params);
  res.json(packages.map((p) => ({ ...p, highlight: !!p.highlight })));
});

// GET /api/packages/:id - Get a single package
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(id);
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

    const upsert = db.prepare(`
      INSERT INTO packages (name, region, flag, data, duration, price, currency, highlight, description,
                            airalo_package_id, country_code, networks, package_type, net_price, sms, voice)
      VALUES (@name, @region, @flag, @data, @duration, @price, @currency, @highlight, @description,
              @airalo_package_id, @country_code, @networks, @package_type, @net_price, @sms, @voice)
      ON CONFLICT(airalo_package_id) DO UPDATE SET
        price = @price, net_price = @net_price, data = @data, duration = @duration,
        networks = @networks, sms = @sms, voice = @voice, description = @description
    `);

    // Ensure unique index on airalo_package_id exists
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_packages_airalo_unique ON packages(airalo_package_id)');

    while (true) {
      const result = await airalo.getPackages({ limit, page });
      if (!result || !result.data || result.data.length === 0) break;

      const insertMany = db.transaction((items) => {
        for (const country of items) {
          const countryCode = country.country_code || '';
          const flag = country.flag || countryToFlag(countryCode);
          const region = country.region || 'Other';

          if (!country.operators) continue;
          for (const operator of country.operators) {
            if (!operator.packages) continue;
            for (const pkg of operator.packages) {
              upsert.run({
                name: `${country.title} — ${pkg.data || 'Unlimited'}`,
                region,
                flag,
                data: pkg.data || 'Unlimited',
                duration: pkg.validity || pkg.day + ' ditë',
                price: pkg.price || pkg.net_price * 1.5,
                currency: 'USD',
                highlight: 0,
                description: `${operator.title} — ${pkg.data || 'Unlimited'} / ${pkg.validity || pkg.day + ' ditë'}`,
                airalo_package_id: pkg.id,
                country_code: countryCode,
                networks: operator.title || '',
                package_type: pkg.type || 'sim',
                net_price: pkg.net_price || null,
                sms: pkg.sms || 0,
                voice: pkg.voice || 0,
              });
              synced++;
            }
          }
        }
      });

      insertMany(result.data);
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
