/**
 * Standalone PostgreSQL migration script.
 * 
 * Creates all tables, indexes, seeds demo packages, and creates admin user.
 * Run with:   DATABASE_URL="postgresql://..." node db/pg-migrate.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL mungon! Vendose në .env ose si env var.');
  process.exit(1);
}

async function run() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : false,
  });

  await client.connect();
  console.log('✔ Connected to PostgreSQL');

  // ─── 1. Create tables ──────────────────────────────────────────────
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id                SERIAL PRIMARY KEY,
      name              TEXT    NOT NULL,
      email             TEXT    NOT NULL UNIQUE,
      password          TEXT    NOT NULL,
      role              TEXT    NOT NULL DEFAULT 'customer',
      email_verified    INTEGER NOT NULL DEFAULT 0,
      verify_token      TEXT,
      reset_token       TEXT,
      reset_token_expires TEXT,
      oauth_provider    TEXT,
      oauth_id          TEXT,
      totp_secret       TEXT,
      totp_enabled      INTEGER NOT NULL DEFAULT 0,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  console.log('✔ Table "users" created');

  await client.query(`
    CREATE TABLE IF NOT EXISTS packages (
      id                SERIAL PRIMARY KEY,
      name              TEXT    NOT NULL,
      region            TEXT    NOT NULL,
      flag              TEXT    NOT NULL,
      data              TEXT    NOT NULL,
      duration          TEXT    NOT NULL,
      price             NUMERIC(10,2) NOT NULL,
      currency          TEXT    NOT NULL DEFAULT 'EUR',
      highlight         INTEGER NOT NULL DEFAULT 0,
      description       TEXT,
      airalo_package_id TEXT    UNIQUE,
      country_code      TEXT,
      networks          TEXT,
      package_type      TEXT    DEFAULT 'sim',
      net_price         NUMERIC(10,2),
      visible           INTEGER NOT NULL DEFAULT 0,
      sms               INTEGER DEFAULT 0,
      voice             INTEGER DEFAULT 0,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  console.log('✔ Table "packages" created');

  await client.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id                    SERIAL PRIMARY KEY,
      package_id            INTEGER NOT NULL REFERENCES packages(id),
      user_id               INTEGER REFERENCES users(id),
      email                 TEXT    NOT NULL,
      customer_name         TEXT,
      phone                 TEXT,
      status                TEXT    NOT NULL DEFAULT 'pending',
      payment_status        TEXT    NOT NULL DEFAULT 'unpaid',
      qr_data               TEXT,
      payment_provider      TEXT,
      stripe_checkout_session_id TEXT,
      stripe_payment_intent_id TEXT,
      paid_at               TIMESTAMPTZ,
      access_token          TEXT,
      promo_code_id         INTEGER,
      discount_amount       REAL DEFAULT 0,
      final_price           REAL,
      airalo_order_id       TEXT,
      iccid                 TEXT,
      esim_status           TEXT,
      qr_code_url           TEXT,
      activation_code       TEXT,
      created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  console.log('✔ Table "orders" created');

  await client.query(`
    CREATE TABLE IF NOT EXISTS promo_codes (
      id                SERIAL PRIMARY KEY,
      code              TEXT NOT NULL UNIQUE,
      discount_type     TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
      discount_value    REAL NOT NULL,
      min_order         REAL,
      max_uses          INTEGER,
      used_count        INTEGER NOT NULL DEFAULT 0,
      active            INTEGER NOT NULL DEFAULT 1,
      expires_at        TIMESTAMPTZ,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  console.log('✔ Table "promo_codes" created');

  await client.query(`
    CREATE TABLE IF NOT EXISTS webhook_logs (
      id                SERIAL PRIMARY KEY,
      source            TEXT NOT NULL,
      external_event_id TEXT,
      event_type        TEXT,
      order_id          INTEGER REFERENCES orders(id),
      payload           TEXT,
      status            TEXT NOT NULL DEFAULT 'received',
      error             TEXT,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  console.log('✔ Table "webhook_logs" created');

  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'orders_promo_code_id_fkey'
      ) THEN
        ALTER TABLE orders
        ADD CONSTRAINT orders_promo_code_id_fkey
        FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id);
      END IF;
    END $$;
  `);
  console.log('✔ Orders promo foreign key ensured');

  // ─── 2. Indexes ────────────────────────────────────────────────────
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_users_email      ON users(email);
    CREATE INDEX IF NOT EXISTS idx_orders_user_id    ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_packages_airalo   ON packages(airalo_package_id);
    CREATE INDEX IF NOT EXISTS idx_packages_country  ON packages(country_code);
    CREATE INDEX IF NOT EXISTS idx_orders_iccid      ON orders(iccid);
    CREATE INDEX IF NOT EXISTS idx_orders_access_token ON orders(access_token);
    CREATE INDEX IF NOT EXISTS idx_orders_stripe_checkout ON orders(stripe_checkout_session_id);
    CREATE INDEX IF NOT EXISTS idx_webhook_logs_external_event_id ON webhook_logs(external_event_id);
  `);
  console.log('✔ Indexes created');

  // ─── 3. Seed demo packages ─────────────────────────────────────────
  const { rows: pkgCheck } = await client.query('SELECT COUNT(*)::int AS cnt FROM packages');
  if (pkgCheck[0].cnt === 0) {
    const packages = [
      { name: 'Europe Global',  region: 'Europe',        flag: '🇪🇺', data: '5 GB',  duration: '30 ditë', price: 14.99, description: 'Mbulim në 39 vende evropiane' },
      { name: 'USA Unlimited',  region: 'North America', flag: '🇺🇸', data: '10 GB', duration: '30 ditë', price: 19.99, description: 'Internet i shpejtë në të gjithë SHBA-në', highlight: 1 },
      { name: 'Türkiye Plus',   region: 'Asia',          flag: '🇹🇷', data: '3 GB',  duration: '15 ditë', price: 7.99,  description: 'Mbulim në Turqi me 4G/5G' },
      { name: 'Global Pass',    region: 'Global',        flag: '🌍', data: '1 GB',  duration: '7 ditë',  price: 4.99,  description: 'Mbulim bazik në mbi 100 vende' },
    ];

    for (const p of packages) {
      await client.query(
        `INSERT INTO packages (name, region, flag, data, duration, price, currency, highlight, description)
         VALUES ($1, $2, $3, $4, $5, $6, 'EUR', $7, $8)`,
        [p.name, p.region, p.flag, p.data, p.duration, p.price, p.highlight || 0, p.description]
      );
    }
    console.log(`✔ Seeded ${packages.length} demo packages`);
  } else {
    console.log(`ℹ Packages already seeded (${pkgCheck[0].cnt})`);
  }

  // ─── 4. Seed admin user ────────────────────────────────────────────
  const { rows: adminCheck } = await client.query("SELECT id FROM users WHERE role = 'admin'");
  if (adminCheck.length === 0) {
    const bcrypt = require('bcryptjs');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@shqiponjaesim.com';
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
    if (!process.env.ADMIN_DEFAULT_PASSWORD) {
      console.warn('⚠️  WARNING: ADMIN_DEFAULT_PASSWORD not set — using "admin123"');
    }
    const hash = bcrypt.hashSync(adminPassword, 12);
    await client.query(
      'INSERT INTO users (name, email, password, role, email_verified) VALUES ($1, $2, $3, $4, $5)',
      ['Admin', adminEmail, hash, 'admin', 1]
    );
    console.log(`✔ Admin user created (${adminEmail})`);
  } else {
    console.log('ℹ Admin user already exists');
  }

  // ─── 5. Import Airalo CSV ──────────────────────────────────────────
  await importAiraloCSV(client);

  // ─── Done ──────────────────────────────────────────────────────────
  const { rows: t1 } = await client.query('SELECT COUNT(*)::int AS cnt FROM users');
  const { rows: t2 } = await client.query('SELECT COUNT(*)::int AS cnt FROM packages');
  const { rows: t3 } = await client.query('SELECT COUNT(*)::int AS cnt FROM orders');
  console.log('\n═══════════════════════════════════════');
  console.log(`  users:    ${t1[0].cnt} rows`);
  console.log(`  packages: ${t2[0].cnt} rows`);
  console.log(`  orders:   ${t3[0].cnt} rows`);
  console.log('═══════════════════════════════════════');
  console.log('✔ PostgreSQL migration complete!');

  await client.end();
}

async function importAiraloCSV(client) {
  const fs = require('fs');
  const path = require('path');
  const csvPath = path.join(__dirname, '..', 'seeds', 'airalo-packages.csv');

  console.log('[CSV IMPORT] Looking for CSV at:', csvPath);
  if (!fs.existsSync(csvPath)) {
    console.warn('[CSV IMPORT] CSV file not found — skipping');
    return;
  }

  const { rows: existing } = await client.query(
    "SELECT COUNT(*)::int AS cnt FROM packages WHERE airalo_package_id IS NOT NULL"
  );
  if (existing[0].cnt > 0) {
    console.log(`ℹ Airalo packages already imported (${existing[0].cnt})`);
    return;
  }

  try {
    const { parseCSV, COUNTRY_CODES, REGIONS, countryToFlag, extractDuration, calculateRetailPrice, getRegionForSpecial } = require('../scripts/import-airalo-csv-lib');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const rows = parseCSV(csvContent);
    console.log(`[CSV IMPORT] Parsed ${rows.length} rows from CSV`);

    let imported = 0;

    // Batch in a transaction
    await client.query('BEGIN');
    for (const row of rows) {
      const country = row['Country Region'];
      const packageId = row['Package Id'];
      const type = row['Type'];
      const netPrice = parseFloat(row['Net Price']);
      const minPrice = parseFloat(row['Minimum selling price']);
      const data = row['Data'];
      const sms = parseInt(row['SMS']) || 0;
      const voice = parseInt(row['Voice']) || 0;
      const networks = row['Networks'];
      if (!packageId || !country || isNaN(netPrice) || isNaN(minPrice)) continue;

      const countryCode = COUNTRY_CODES[country] || '';
      const flag = countryToFlag(countryCode);
      const region = REGIONS[countryCode] || getRegionForSpecial(country) || 'Other';
      const duration = extractDuration(packageId);
      const retailPrice = calculateRetailPrice(netPrice, minPrice);

      await client.query(
        `INSERT INTO packages (name, region, flag, data, duration, price, currency, highlight, description,
                               airalo_package_id, country_code, networks, package_type, net_price, sms, voice)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         ON CONFLICT (airalo_package_id) DO UPDATE SET
           price = EXCLUDED.price, net_price = EXCLUDED.net_price, data = EXCLUDED.data,
           duration = EXCLUDED.duration, networks = EXCLUDED.networks, sms = EXCLUDED.sms,
           voice = EXCLUDED.voice, name = EXCLUDED.name, description = EXCLUDED.description`,
        [
          `${country} — ${data}`, region, flag, data, duration, retailPrice,
          'USD', 0, `${networks} — ${data} / ${duration}`,
          packageId, countryCode, networks, type, netPrice, sms, voice,
        ]
      );
      imported++;
    }

    // Remove old dummy seed packages
    try {
      await client.query('DELETE FROM packages WHERE airalo_package_id IS NULL AND id NOT IN (SELECT DISTINCT package_id FROM orders)');
    } catch (e) { /* ignore if orders reference them */ }

    await client.query('COMMIT');

    const { rows: total } = await client.query('SELECT COUNT(*)::int AS cnt FROM packages');
    console.log(`✔ Imported ${imported} Airalo packages from CSV (total: ${total[0].cnt})`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[CSV IMPORT ERROR]', err.message);
  }
}

run().catch(err => {
  console.error('❌ Migration failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
