require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Client } = require('pg');

(async () => {
  const c = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  const r1 = await c.query('SELECT COUNT(*)::int AS cnt FROM users');
  const r2 = await c.query('SELECT COUNT(*)::int AS cnt FROM packages');
  const r3 = await c.query('SELECT COUNT(*)::int AS cnt FROM orders');
  const r4 = await c.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");

  console.log('=== RAILWAY POSTGRES ===');
  console.log('Tables:', r4.rows.map(r => r.tablename).join(', '));
  console.log('Users:', r1.rows[0].cnt);
  console.log('Packages:', r2.rows[0].cnt);
  console.log('Orders:', r3.rows[0].cnt);

  await c.end();
})();
