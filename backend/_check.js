const { Client } = require('pg');
(async () => {
  const c = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await c.connect();
  
  // 1. Add category column if missing
  try {
    await c.query("ALTER TABLE packages ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'local'");
    console.log('+ Category column added/verified');
  } catch (e) {
    console.log('Category column error:', e.message);
  }
  
  // 2. Auto-populate categories
  const r1 = await c.query("UPDATE packages SET category = 'regional' WHERE (category IS NULL OR category = 'local') AND country_code IN ('EU','AS','ME','OC','CB','AF')");
  console.log('Set regional:', r1.rowCount);
  const r2 = await c.query("UPDATE packages SET category = 'global' WHERE (category IS NULL OR category = 'local') AND country_code IN ('GL')");
  console.log('Set global:', r2.rowCount);
  
  // 3. Find first package and test highlight toggle
  const firstPkg = await c.query('SELECT id, name, visible, highlight FROM packages ORDER BY id LIMIT 1');
  if (firstPkg.rows.length > 0) {
    const pkg = firstPkg.rows[0];
    console.log('\nFirst package:', pkg);
    
    await c.query('UPDATE packages SET highlight = 1 WHERE id = $1', [pkg.id]);
    const after = await c.query('SELECT id, name, visible, highlight FROM packages WHERE id=$1', [pkg.id]);
    console.log('After set hl=1:', after.rows[0]);
    
    await c.query('UPDATE packages SET visible = 1 WHERE id = $1', [pkg.id]);
    const after2 = await c.query('SELECT id, name, visible, highlight FROM packages WHERE id=$1', [pkg.id]);
    console.log('After set vis=1:', after2.rows[0]);
    
    // Reset
    await c.query('UPDATE packages SET highlight = 0, visible = 0 WHERE id = $1', [pkg.id]);
    console.log('Reset back to 0/0');
  }
  
  // Show ID range
  const idRange = await c.query('SELECT MIN(id)::int as min_id, MAX(id)::int as max_id FROM packages');
  console.log('\nID range:', idRange.rows[0]);
  
  // 4. Show category distribution
  const cats = await c.query("SELECT category, COUNT(*)::int as cnt FROM packages GROUP BY category ORDER BY cnt DESC");
  console.log('\nCategories:', cats.rows);
  
  await c.end();
})();
