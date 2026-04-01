const { Client } = require('pg');
async function main() {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  
  const r = await c.query(`
    SELECT DISTINCT country_code, MIN(name) as sample_name, MIN(region) as region, COUNT(*)::int as cnt 
    FROM packages WHERE package_type='sim' 
    GROUP BY country_code ORDER BY cnt DESC
  `);
  
  // Find non-standard country codes (regional/global eSIMs)
  const regional = [];
  r.rows.forEach(x => {
    // Standard ISO country codes are 2 letters; but multi-country eSIMs also use 2-letter codes
    // Check by name pattern
    const name = x.sample_name || '';
    const isMultiCountry = /^(Africa|Asia|Europe|Global|Caribbean|Middle East|South America|North America|Central America|Oceania)/.test(name);
    if (isMultiCountry) {
      regional.push(x);
      console.log('REGIONAL/GLOBAL: cc=' + x.country_code + ' | name=' + name + ' | region=' + x.region + ' | cnt=' + x.cnt);
    }
  });
  
  console.log('\nTotal regional/global destinations:', regional.length);
  console.log('Total ALL destinations:', r.rows.length);
  
  await c.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
