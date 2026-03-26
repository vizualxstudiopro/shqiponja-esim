const db = require('./index');

function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS packages (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      region      TEXT    NOT NULL,
      flag        TEXT    NOT NULL,
      data        TEXT    NOT NULL,
      duration    TEXT    NOT NULL,
      price       REAL    NOT NULL,
      currency    TEXT    NOT NULL DEFAULT 'EUR',
      highlight   INTEGER NOT NULL DEFAULT 0,
      description TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      package_id        INTEGER NOT NULL REFERENCES packages(id),
      user_id           INTEGER REFERENCES users(id),
      email             TEXT    NOT NULL,
      status            TEXT    NOT NULL DEFAULT 'pending',
      payment_status    TEXT    NOT NULL DEFAULT 'unpaid',
      qr_data           TEXT,
      created_at        TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      name            TEXT    NOT NULL,
      email           TEXT    NOT NULL UNIQUE,
      password        TEXT    NOT NULL,
      role            TEXT    NOT NULL DEFAULT 'customer',
      email_verified  INTEGER NOT NULL DEFAULT 0,
      verify_token    TEXT,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  console.log('✔ Database migrated successfully');

  // Add columns if upgrading from older schema
  const columns = db.prepare("PRAGMA table_info(orders)").all().map(c => c.name);
  if (!columns.includes('payment_status')) {
    db.exec("ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid'");
  }
  if (!columns.includes('user_id')) {
    db.exec("ALTER TABLE orders ADD COLUMN user_id INTEGER REFERENCES users(id)");
  }
  if (!columns.includes('qr_data')) {
    db.exec("ALTER TABLE orders ADD COLUMN qr_data TEXT");
  }
  if (!columns.includes('paddle_transaction_id')) {
    db.exec("ALTER TABLE orders ADD COLUMN paddle_transaction_id TEXT");
  }

  // Upgrade users table
  const userCols = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
  if (!userCols.includes('email_verified')) {
    db.exec("ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0");
  }
  if (!userCols.includes('verify_token')) {
    db.exec("ALTER TABLE users ADD COLUMN verify_token TEXT");
  }

  // Password reset columns
  if (!userCols.includes('reset_token')) {
    db.exec("ALTER TABLE users ADD COLUMN reset_token TEXT");
  }
  if (!userCols.includes('reset_token_expires')) {
    db.exec("ALTER TABLE users ADD COLUMN reset_token_expires TEXT");
  }

  // OAuth columns
  if (!userCols.includes('oauth_provider')) {
    db.exec("ALTER TABLE users ADD COLUMN oauth_provider TEXT");
  }
  if (!userCols.includes('oauth_id')) {
    db.exec("ALTER TABLE users ADD COLUMN oauth_id TEXT");
  }

  // 2FA columns
  if (!userCols.includes('totp_secret')) {
    db.exec("ALTER TABLE users ADD COLUMN totp_secret TEXT");
  }
  if (!userCols.includes('totp_enabled')) {
    db.exec("ALTER TABLE users ADD COLUMN totp_enabled INTEGER NOT NULL DEFAULT 0");
  }
}

function seed() {
  const count = db.prepare('SELECT COUNT(*) AS cnt FROM packages').get();
  if (count.cnt > 0) {
    console.log('ℹ Packages table already seeded');
    return;
  }

  const insert = db.prepare(`
    INSERT INTO packages (name, region, flag, data, duration, price, currency, highlight, description)
    VALUES (@name, @region, @flag, @data, @duration, @price, @currency, @highlight, @description)
  `);

  const packages = [
    {
      name: 'Europe Global',
      region: 'Europe',
      flag: '🇪🇺',
      data: '5 GB',
      duration: '30 ditë',
      price: 14.99,
      currency: 'EUR',
      highlight: 0,
      description: 'Mbulim në 39 vende evropiane',
    },
    {
      name: 'USA Unlimited',
      region: 'North America',
      flag: '🇺🇸',
      data: '10 GB',
      duration: '30 ditë',
      price: 19.99,
      currency: 'EUR',
      highlight: 1,
      description: 'Internet i shpejtë në të gjithë SHBA-në',
    },
    {
      name: 'Türkiye Plus',
      region: 'Asia',
      flag: '🇹🇷',
      data: '3 GB',
      duration: '15 ditë',
      price: 7.99,
      currency: 'EUR',
      highlight: 0,
      description: 'Mbulim në Turqi me 4G/5G',
    },
    {
      name: 'Global Pass',
      region: 'Global',
      flag: '🌍',
      data: '1 GB',
      duration: '7 ditë',
      price: 4.99,
      currency: 'EUR',
      highlight: 0,
      description: 'Mbulim bazik në mbi 100 vende',
    },
  ];

  const insertMany = db.transaction((items) => {
    for (const item of items) insert.run(item);
  });

  insertMany(packages);
  console.log(`✔ Seeded ${packages.length} packages`);
}

function seedAdmin() {
  const existing = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
  if (existing) return;

  const bcrypt = require('bcryptjs');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@shqiponjaesim.com';
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
  const hash = bcrypt.hashSync(adminPassword, 12);
  db.prepare(
    'INSERT INTO users (name, email, password, role, email_verified) VALUES (?, ?, ?, ?, ?)'
  ).run('Admin', adminEmail, hash, 'admin', 1);
  console.log(`✔ Default admin created (${adminEmail})`);
}

// Fix admin email if it was created with old hardcoded value
function fixAdminEmail() {
  const bcrypt = require('bcryptjs');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@shqiponjaesim.com';
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD;
  
  // Fix old hardcoded email
  const old = db.prepare("SELECT id FROM users WHERE email = 'admin@shqiponja-esim.com' AND role = 'admin'").get();
  if (old && adminEmail !== 'admin@shqiponja-esim.com') {
    db.prepare('UPDATE users SET email = ? WHERE id = ?').run(adminEmail, old.id);
    console.log(`✔ Admin email updated to ${adminEmail}`);
  }

  // Sync admin password with env var on every startup
  if (adminPassword) {
    const admin = db.prepare("SELECT id FROM users WHERE email = ? AND role = 'admin'").get(adminEmail);
    if (admin) {
      const hash = bcrypt.hashSync(adminPassword, 12);
      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, admin.id);
      console.log('✔ Admin password synced from ADMIN_DEFAULT_PASSWORD');
    }
  }
}

migrate();
seed();
seedAdmin();
fixAdminEmail();

  // Airalo integration columns on packages
  const pkgCols = db.prepare("PRAGMA table_info(packages)").all().map(c => c.name);
  if (!pkgCols.includes('airalo_package_id')) {
    db.exec("ALTER TABLE packages ADD COLUMN airalo_package_id TEXT");
  }
  if (!pkgCols.includes('country_code')) {
    db.exec("ALTER TABLE packages ADD COLUMN country_code TEXT");
  }
  if (!pkgCols.includes('networks')) {
    db.exec("ALTER TABLE packages ADD COLUMN networks TEXT");
  }
  if (!pkgCols.includes('package_type')) {
    db.exec("ALTER TABLE packages ADD COLUMN package_type TEXT DEFAULT 'sim'");
  }
  if (!pkgCols.includes('net_price')) {
    db.exec("ALTER TABLE packages ADD COLUMN net_price REAL");
  }
  if (!pkgCols.includes('sms')) {
    db.exec("ALTER TABLE packages ADD COLUMN sms INTEGER DEFAULT 0");
  }
  if (!pkgCols.includes('voice')) {
    db.exec("ALTER TABLE packages ADD COLUMN voice INTEGER DEFAULT 0");
  }

  // Airalo integration columns on orders
  const orderCols = db.prepare("PRAGMA table_info(orders)").all().map(c => c.name);
  if (!orderCols.includes('airalo_order_id')) {
    db.exec("ALTER TABLE orders ADD COLUMN airalo_order_id TEXT");
  }
  if (!orderCols.includes('iccid')) {
    db.exec("ALTER TABLE orders ADD COLUMN iccid TEXT");
  }
  if (!orderCols.includes('esim_status')) {
    db.exec("ALTER TABLE orders ADD COLUMN esim_status TEXT");
  }
  if (!orderCols.includes('qr_code_url')) {
    db.exec("ALTER TABLE orders ADD COLUMN qr_code_url TEXT");
  }
  if (!orderCols.includes('activation_code')) {
    db.exec("ALTER TABLE orders ADD COLUMN activation_code TEXT");
  }

// Performance indexes
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
  CREATE INDEX IF NOT EXISTS idx_packages_airalo ON packages(airalo_package_id);
  CREATE INDEX IF NOT EXISTS idx_packages_country ON packages(country_code);
  CREATE INDEX IF NOT EXISTS idx_orders_iccid ON orders(iccid);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_packages_airalo_unique ON packages(airalo_package_id);
`);
console.log('✔ Database indexes ensured');

// Import Airalo packages from CSV if not yet imported
function importAiraloCSV() {
  const fs = require('fs');
  const path = require('path');
  const csvPath = path.join(__dirname, '..', 'seeds', 'airalo-packages.csv');
  if (!fs.existsSync(csvPath)) return;

  const existing = db.prepare('SELECT COUNT(*) as cnt FROM packages WHERE airalo_package_id IS NOT NULL').get();
  if (existing.cnt > 0) {
    console.log(`ℹ Airalo packages already imported (${existing.cnt})`);
    return;
  }

  // Inline CSV import (same logic as scripts/import-airalo-csv.js)
  const { parseCSV, COUNTRY_CODES, REGIONS, countryToFlag, extractDuration, calculateRetailPrice, getRegionForSpecial } = require('../scripts/import-airalo-csv-lib');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(csvContent);

  const upsert = db.prepare(`
    INSERT INTO packages (name, region, flag, data, duration, price, currency, highlight, description,
                          airalo_package_id, country_code, networks, package_type, net_price, sms, voice)
    VALUES (@name, @region, @flag, @data, @duration, @price, @currency, @highlight, @description,
            @airalo_package_id, @country_code, @networks, @package_type, @net_price, @sms, @voice)
    ON CONFLICT(airalo_package_id) DO UPDATE SET
      price = @price, net_price = @net_price, data = @data, duration = @duration,
      networks = @networks, sms = @sms, voice = @voice, name = @name, description = @description
  `);

  let imported = 0;
  const importAll = db.transaction((rows) => {
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
      upsert.run({
        name: `${country} — ${data}`, region, flag, data, duration, price: retailPrice,
        currency: 'USD', highlight: 0, description: `${networks} — ${data} / ${duration}`,
        airalo_package_id: packageId, country_code: countryCode, networks,
        package_type: type, net_price: netPrice, sms, voice,
      });
      imported++;
    }
  });
  importAll(rows);

  // Remove old dummy packages with no airalo_package_id (if no orders reference them)
  try { db.prepare('DELETE FROM packages WHERE airalo_package_id IS NULL').run(); } catch(e) { /* FK constraint */ }

  console.log(`✔ Imported ${imported} Airalo packages from CSV`);
}
importAiraloCSV();
