const db = require('../client');

async function migrate() {
  // Create tables with PostgreSQL syntax
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id              SERIAL PRIMARY KEY,
      name            TEXT    NOT NULL,
      email           TEXT    NOT NULL UNIQUE,
      password        TEXT    NOT NULL,
      role            TEXT    NOT NULL DEFAULT 'customer',
      email_verified  INTEGER NOT NULL DEFAULT 0,
      verify_token    TEXT,
      reset_token     TEXT,
      reset_token_expires TEXT,
      oauth_provider  TEXT,
      oauth_id        TEXT,
      totp_secret     TEXT,
      totp_enabled    INTEGER NOT NULL DEFAULT 0,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS packages (
      id              SERIAL PRIMARY KEY,
      name            TEXT    NOT NULL,
      region          TEXT    NOT NULL,
      flag            TEXT    NOT NULL,
      data            TEXT    NOT NULL,
      duration        TEXT    NOT NULL,
      price           REAL    NOT NULL,
      currency        TEXT    NOT NULL DEFAULT 'EUR',
      highlight       INTEGER NOT NULL DEFAULT 0,
      description     TEXT,
      airalo_package_id TEXT,
      country_code    TEXT,
      networks        TEXT,
      package_type    TEXT    DEFAULT 'sim',
      net_price       REAL,
      visible         INTEGER NOT NULL DEFAULT 0,
      sms             INTEGER DEFAULT 0,
      voice           INTEGER DEFAULT 0,
      category        TEXT    DEFAULT 'local',
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id                  SERIAL PRIMARY KEY,
      package_id          INTEGER NOT NULL REFERENCES packages(id),
      user_id             INTEGER REFERENCES users(id),
      email               TEXT    NOT NULL,
      status              TEXT    NOT NULL DEFAULT 'pending',
      payment_status      TEXT    NOT NULL DEFAULT 'unpaid',
      qr_data             TEXT,
      ls_order_id         TEXT,
      airalo_order_id     TEXT,
      iccid               TEXT,
      esim_status         TEXT,
      qr_code_url         TEXT,
      activation_code     TEXT,
      created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Webhook logs for debugging payment flows
  await db.query(`
    CREATE TABLE IF NOT EXISTS webhook_logs (
      id              SERIAL PRIMARY KEY,
      source          TEXT    NOT NULL DEFAULT 'lemonsqueezy',
      event_type      TEXT,
      order_id        INTEGER,
      payload         TEXT,
      status          TEXT    NOT NULL DEFAULT 'received',
      error           TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  console.log('✔ Database tables ensured');

  // Add highlight column if missing (for tables created before highlight feature)
  try {
    await db.query(`ALTER TABLE packages ADD COLUMN IF NOT EXISTS highlight INTEGER NOT NULL DEFAULT 0`);
  } catch (e) {
    // Column likely already exists
  }

  // Add category column if missing
  try {
    await db.query(`ALTER TABLE packages ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'local'`);
    // Auto-populate category for existing packages based on country_code
    await db.query(`UPDATE packages SET category = 'regional' WHERE category IS NULL OR category = 'local' AND country_code IN ('EU','AS','ME','OC','CB','AF')`);
    await db.query(`UPDATE packages SET category = 'global' WHERE category IS NULL OR category = 'local' AND country_code IN ('GL')`);
  } catch (e) {
    // Column likely already exists
  }

  // Add ls_order_id column if missing
  try {
    await db.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS ls_order_id TEXT`);
  } catch (e) {
    // Column likely already exists
  }

  // Add access_token column for secure unauthenticated order access
  try {
    await db.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS access_token TEXT`);
  } catch (e) {
    // Column likely already exists
  }

  // Add customer_name and phone columns to orders
  try {
    await db.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT`);
    await db.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone TEXT`);
  } catch (e) {
    // Columns likely already exist
  }

  // Performance indexes
  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_packages_airalo ON packages(airalo_package_id);
    CREATE INDEX IF NOT EXISTS idx_packages_country ON packages(country_code);
    CREATE INDEX IF NOT EXISTS idx_orders_iccid ON orders(iccid);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_packages_airalo_unique ON packages(airalo_package_id);
  `);
  console.log('✔ Database indexes ensured');

  // Seed data
  await seed();
  await seedAdmin();
  await fixAdminEmail();
}

async function seed() {
  const result = await db.query('SELECT COUNT(*) AS cnt FROM packages');
  if (parseInt(result.rows[0].cnt) > 0) {
    console.log('ℹ Packages table already seeded');
    return;
  }

  const packages = [
    { name: 'Europe Global', region: 'Europe', flag: '🇪🇺', data: '5 GB', duration: '30 ditë', price: 14.99, currency: 'EUR', highlight: 0, description: 'Mbulim në 39 vende evropiane' },
    { name: 'USA Unlimited', region: 'North America', flag: '🇺🇸', data: '10 GB', duration: '30 ditë', price: 19.99, currency: 'EUR', highlight: 1, description: 'Internet i shpejtë në të gjithë SHBA-në' },
    { name: 'Türkiye Plus', region: 'Asia', flag: '🇹🇷', data: '3 GB', duration: '15 ditë', price: 7.99, currency: 'EUR', highlight: 0, description: 'Mbulim në Turqi me 4G/5G' },
    { name: 'Global Pass', region: 'Global', flag: '🌍', data: '1 GB', duration: '7 ditë', price: 4.99, currency: 'EUR', highlight: 0, description: 'Mbulim bazik në mbi 100 vende' },
  ];

  for (const p of packages) {
    await db.query(
      'INSERT INTO packages (name, region, flag, data, duration, price, currency, highlight, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [p.name, p.region, p.flag, p.data, p.duration, p.price, p.currency, p.highlight, p.description]
    );
  }
  console.log(`✔ Seeded ${packages.length} packages`);
}

async function seedAdmin() {
  const result = await db.query("SELECT id FROM users WHERE role = $1", ['admin']);
  if (result.rows.length > 0) return;

  const bcrypt = require('bcryptjs');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@shqiponjaesim.com';
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
  if (!process.env.ADMIN_DEFAULT_PASSWORD) {
    console.warn('⚠️  WARNING: ADMIN_DEFAULT_PASSWORD not set — using insecure default password "admin123". Set this env var immediately!');
  }
  const hash = bcrypt.hashSync(adminPassword, 12);
  await db.query(
    'INSERT INTO users (name, email, password, role, email_verified) VALUES ($1, $2, $3, $4, $5)',
    ['Admin', adminEmail, hash, 'admin', 1]
  );
  console.log(`✔ Default admin created (${adminEmail})`);
}

async function fixAdminEmail() {
  const bcrypt = require('bcryptjs');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@shqiponjaesim.com';
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD;

  const old = (await db.query("SELECT id FROM users WHERE email = 'admin@shqiponja-esim.com' AND role = 'admin'")).rows[0];
  if (old && adminEmail !== 'admin@shqiponja-esim.com') {
    await db.query('UPDATE users SET email = $1 WHERE id = $2', [adminEmail, old.id]);
    console.log(`✔ Admin email updated to ${adminEmail}`);
  }

  if (adminPassword) {
    const admin = (await db.query("SELECT id FROM users WHERE email = $1 AND role = 'admin'", [adminEmail])).rows[0];
    if (admin) {
      const hash = bcrypt.hashSync(adminPassword, 12);
      await db.query('UPDATE users SET password = $1 WHERE id = $2', [hash, admin.id]);
      console.log('✔ Admin password synced from ADMIN_DEFAULT_PASSWORD');
    }
  }
}

module.exports = { migrate };
