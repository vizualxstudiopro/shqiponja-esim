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

  await db.query(`
    CREATE TABLE IF NOT EXISTS order_sms_alerts (
      id                  SERIAL PRIMARY KEY,
      order_id            INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      threshold_percent   INTEGER NOT NULL,
      usage_percent       REAL,
      message_sid         TEXT,
      created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(order_id, threshold_percent)
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

  // Promo codes table
  await db.query(`
    CREATE TABLE IF NOT EXISTS promo_codes (
      id              SERIAL PRIMARY KEY,
      code            TEXT    NOT NULL UNIQUE,
      discount_type   TEXT    NOT NULL DEFAULT 'percent',
      discount_value  REAL    NOT NULL,
      max_uses        INTEGER,
      used_count      INTEGER NOT NULL DEFAULT 0,
      min_order       REAL    DEFAULT 0,
      active          INTEGER NOT NULL DEFAULT 1,
      expires_at      TIMESTAMPTZ,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Promo code reference on orders
  try {
    await db.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code_id INTEGER REFERENCES promo_codes(id)`);
    await db.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount REAL DEFAULT 0`);
    await db.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS final_price REAL`);
  } catch (e) {
    // Columns likely already exist
  }

  // Referral code on users
  try {
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by INTEGER REFERENCES users(id)`);
  } catch (e) {
    // Columns likely already exist
  }

  // SMS 2FA on users
  try {
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_2fa_enabled INTEGER NOT NULL DEFAULT 0`);
  } catch (e) {
    // Columns likely already exist
  }

  // Referrals table
  await db.query(`
    CREATE TABLE IF NOT EXISTS referrals (
      id              SERIAL PRIMARY KEY,
      referrer_id     INTEGER NOT NULL REFERENCES users(id),
      referred_id     INTEGER NOT NULL REFERENCES users(id),
      order_id        INTEGER REFERENCES orders(id),
      reward_type     TEXT    NOT NULL DEFAULT 'discount',
      reward_value    REAL    NOT NULL DEFAULT 10,
      status          TEXT    NOT NULL DEFAULT 'pending',
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS referral_rewards (
      id              SERIAL PRIMARY KEY,
      referral_id     INTEGER NOT NULL REFERENCES referrals(id),
      user_id         INTEGER NOT NULL REFERENCES users(id),
      order_id        INTEGER REFERENCES orders(id),
      reward_kind     TEXT    NOT NULL DEFAULT 'data_gb',
      reward_amount   REAL    NOT NULL DEFAULT 3,
      status          TEXT    NOT NULL DEFAULT 'granted',
      note            TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS avatar_assets (
      id              SERIAL PRIMARY KEY,
      persona_key     TEXT    NOT NULL UNIQUE,
      name            TEXT    NOT NULL,
      role            TEXT,
      region          TEXT,
      prompt          TEXT,
      image_data      TEXT    NOT NULL,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_rewards_unique_grant ON referral_rewards(referral_id, user_id, order_id)`);

  // Performance indexes
  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_packages_airalo ON packages(airalo_package_id);
    CREATE INDEX IF NOT EXISTS idx_packages_country ON packages(country_code);
    CREATE INDEX IF NOT EXISTS idx_orders_iccid ON orders(iccid);
    CREATE INDEX IF NOT EXISTS idx_order_sms_alerts_order_threshold ON order_sms_alerts(order_id, threshold_percent);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_packages_airalo_unique ON packages(airalo_package_id);
  `);
  console.log('✔ Database indexes ensured');

  // Newsletter subscribers
  await db.query(`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id                SERIAL PRIMARY KEY,
      email             TEXT NOT NULL UNIQUE,
      locale            TEXT NOT NULL DEFAULT 'sq',
      unsubscribe_token TEXT NOT NULL UNIQUE,
      subscribed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      unsubscribed_at   TIMESTAMPTZ
    )
  `);

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
