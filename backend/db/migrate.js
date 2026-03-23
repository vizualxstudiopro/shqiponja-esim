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
      stripe_session_id TEXT,
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
  if (!columns.includes('stripe_session_id')) {
    db.exec("ALTER TABLE orders ADD COLUMN stripe_session_id TEXT");
  }
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
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
  const hash = bcrypt.hashSync(adminPassword, 12);
  db.prepare(
    'INSERT INTO users (name, email, password, role, email_verified) VALUES (?, ?, ?, ?, ?)'
  ).run('Admin', 'admin@shqiponja-esim.com', hash, 'admin', 1);
  console.log('✔ Default admin created (admin@shqiponja-esim.com) — NDRYSHO FJALËKALIMIN NË PRODUKSION!');
}

migrate();
seed();
seedAdmin();

// Performance indexes
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
  CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);
`);
console.log('✔ Database indexes ensured');
