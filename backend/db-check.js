const { Client } = require('pg');
(async () => {
  const c = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await c.connect();
  try {
    const r = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='packages' ORDER BY ordinal_position");
    console.log('=== PACKAGE COLUMNS ===');
    r.rows.forEach(x => console.log('  ' + x.column_name + ' (' + x.data_type + ')'));

    const v = await c.query('SELECT COUNT(*)::int as cnt FROM packages WHERE visible=1');
    console.log('VISIBLE packages:', v.rows[0].cnt);

    try {
      const h = await c.query('SELECT COUNT(*)::int as cnt FROM packages WHERE highlight=1');
      console.log('HIGHLIGHTED packages:', h.rows[0].cnt);
    } catch (e) {
      console.log('HIGHLIGHT COLUMN MISSING:', e.message);
    }

    const t = await c.query('SELECT COUNT(*)::int as cnt FROM packages');
    console.log('TOTAL packages:', t.rows[0].cnt);
  } catch (e) {
    console.log('ERROR:', e.message);
  }
  await c.end();
})();
