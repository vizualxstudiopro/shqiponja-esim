const { Client } = require('pg');

async function main() {
  const c = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await c.connect();

  // All packages (ignoring visible)
  let r = await c.query(`
    SELECT 
      COALESCE(country_code, region) AS dest_id,
      MIN(flag) AS flag,
      MIN(region) AS region,
      MIN(country_code) AS country_code,
      MIN(price)::float AS min_price,
      COUNT(*)::int AS pkg_count
    FROM packages WHERE package_type = 'sim'
    GROUP BY COALESCE(country_code, region)
    ORDER BY MIN(price)
    LIMIT 30
  `);
  console.log('ALL DESTINATIONS (ignoring visible):');
  console.log('Total groups:', r.rows.length);
  r.rows.forEach(x => console.log('  ' + x.flag + ' ' + x.dest_id + ' | region=' + x.region + ' | cc=' + (x.country_code || 'NULL') + ' | pkgs=' + x.pkg_count + ' | min=' + x.min_price));

  // Unique country_code values that are not standard 2-letter
  r = await c.query("SELECT DISTINCT country_code, name, region FROM packages WHERE LENGTH(country_code) != 2 AND package_type = 'sim' LIMIT 20");
  console.log('\nNON-STANDARD COUNTRY CODES:');
  r.rows.forEach(x => console.log('  cc=' + x.country_code + ' | name=' + x.name + ' | region=' + x.region));

  // Check if any packages cover multiple countries (regional eSIMs)
  r = await c.query("SELECT DISTINCT country_code, name FROM packages WHERE name LIKE '%Europe%' OR name LIKE '%Global%' OR name LIKE '%Asia%' OR name LIKE '%Africa%' LIMIT 15");
  console.log('\nMULTI-COUNTRY PACKAGE NAMES:');
  r.rows.forEach(x => console.log('  cc=' + x.country_code + ' | name=' + x.name));

  // Show ALL regions
  r = await c.query("SELECT DISTINCT region, COUNT(*)::int as cnt FROM packages WHERE package_type='sim' GROUP BY region ORDER BY cnt DESC");
  console.log('\nALL REGIONS (sim only):');
  r.rows.forEach(x => console.log('  ' + x.region + ' = ' + x.cnt));

  await c.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
