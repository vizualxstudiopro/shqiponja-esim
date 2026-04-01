const { Client } = require('pg');

async function main() {
  const c = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await c.connect();

  // Check packages with no country_code (regional/global)
  let r = await c.query(
    "SELECT name, region, country_code FROM packages WHERE country_code IS NULL AND package_type = 'sim' LIMIT 15"
  );
  console.log('NO-COUNTRY SIM PACKAGES:');
  r.rows.forEach(x => console.log('  ' + x.name + ' | region=' + x.region));

  r = await c.query(
    "SELECT COUNT(*)::int as cnt FROM packages WHERE country_code IS NULL AND package_type = 'sim'"
  );
  console.log('TOTAL NO-COUNTRY SIM:', r.rows[0].cnt);

  // Check what "Global" region looks like
  r = await c.query(
    "SELECT name, region, country_code FROM packages WHERE region = 'Global' AND package_type = 'sim' LIMIT 5"
  );
  console.log('\nGLOBAL REGION SAMPLES:');
  r.rows.forEach(x => console.log('  ' + x.name + ' | cc=' + x.country_code));

  // Check multi-country packages (regional)
  r = await c.query(
    "SELECT name, region, country_code FROM packages WHERE country_code IS NULL AND region != 'Global' AND package_type = 'sim' LIMIT 10"
  );
  console.log('\nREGIONAL (non-global, no country) SAMPLES:');
  r.rows.forEach(x => console.log('  ' + x.name + ' | region=' + x.region));

  // Destination endpoint data check
  r = await c.query(`
    SELECT 
      COALESCE(country_code, region) AS dest_id,
      MIN(flag) AS flag,
      MIN(region) AS region,
      MIN(country_code) AS country_code,
      MIN(price)::float AS min_price,
      COUNT(*)::int AS pkg_count,
      BOOL_OR(highlight = 1) AS popular
    FROM packages 
    WHERE visible = 1 AND (package_type IS NULL OR package_type = 'sim')
    GROUP BY COALESCE(country_code, region)
    ORDER BY popular DESC, min_price
    LIMIT 20
  `);
  console.log('\nDESTINATIONS (visible only):');
  console.log('Total groups:', r.rows.length);
  r.rows.forEach(x => console.log('  ' + x.flag + ' ' + x.dest_id + ' | region=' + x.region + ' | cc=' + x.country_code + ' | min=' + x.min_price + ' | pkgs=' + x.pkg_count + ' | pop=' + x.popular));

  await c.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
