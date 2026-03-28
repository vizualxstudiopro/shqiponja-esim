const { Client } = require('pg');
(async () => {
  const c = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await c.connect();
  // Show sample packages to understand naming
  const r = await c.query("SELECT DISTINCT country_code, flag, region, name FROM packages WHERE country_code IS NOT NULL ORDER BY country_code LIMIT 50");
  console.log('=== SAMPLE PACKAGES BY COUNTRY ===');
  r.rows.forEach(x => console.log(x.country_code, x.flag, x.region, '|', x.name));
  
  // Count unique countries
  const r2 = await c.query("SELECT COUNT(DISTINCT country_code) as cnt FROM packages WHERE country_code IS NOT NULL");
  console.log('\nUnique countries:', r2.rows[0].cnt);
  
  // Show regions
  const r3 = await c.query("SELECT DISTINCT region FROM packages ORDER BY region");
  console.log('\nRegions:', r3.rows.map(x => x.region).join(', '));
  
  await c.end();
})();
