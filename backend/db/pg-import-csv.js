/**
 * Import Airalo CSV into Railway Postgres.
 * Run: DATABASE_URL="..." node db/pg-import-csv.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL missing'); process.exit(1); }

async function run() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  // Check if already imported
  const { rows: chk } = await client.query(
    "SELECT COUNT(*)::int AS cnt FROM packages WHERE airalo_package_id IS NOT NULL"
  );
  if (chk[0].cnt > 0) {
    console.log(`Airalo packages already exist (${chk[0].cnt}) — skipping`);
    await client.end();
    return;
  }

  const csvPath = path.join(__dirname, '..', 'seeds', 'airalo-packages.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('CSV not found:', csvPath);
    await client.end();
    process.exit(1);
  }

  const { parseCSV, COUNTRY_CODES, REGIONS, countryToFlag, extractDuration, calculateRetailPrice, getRegionForSpecial } =
    require('../scripts/import-airalo-csv-lib');

  const csv = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(csv);
  console.log(`Parsed ${rows.length} rows`);

  await client.query('BEGIN');
  let ok = 0, skip = 0;

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

    if (!packageId || !country || isNaN(netPrice) || isNaN(minPrice)) { skip++; continue; }

    const cc = COUNTRY_CODES[country] || '';
    const flag = countryToFlag(cc);
    const region = REGIONS[cc] || getRegionForSpecial(country) || 'Other';
    const dur = extractDuration(packageId);
    const price = calculateRetailPrice(netPrice, minPrice);

    try {
      await client.query('SAVEPOINT sp');
      await client.query(
        `INSERT INTO packages (name,region,flag,data,duration,price,currency,highlight,description,
                               airalo_package_id,country_code,networks,package_type,net_price,sms,voice)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         ON CONFLICT (airalo_package_id) DO UPDATE SET
           price=EXCLUDED.price, net_price=EXCLUDED.net_price, data=EXCLUDED.data,
           duration=EXCLUDED.duration, networks=EXCLUDED.networks, sms=EXCLUDED.sms,
           voice=EXCLUDED.voice, name=EXCLUDED.name, description=EXCLUDED.description`,
        [`${country} — ${data}`, region, flag, data, dur, price, 'USD', 0,
         `${networks} — ${data} / ${dur}`, packageId, cc, networks, type, netPrice, sms, voice]
      );
      await client.query('RELEASE SAVEPOINT sp');
      ok++;
      if (ok % 500 === 0) console.log(`  ... ${ok} imported`);
    } catch (e) {
      await client.query('ROLLBACK TO SAVEPOINT sp');
      if (skip < 5) console.error(`ROW ERR [${packageId}]:`, e.message);
      skip++;
      continue;
    }
  }

  // Remove old seed packages (without airalo_package_id)
  try {
    await client.query(
      'DELETE FROM packages WHERE airalo_package_id IS NULL AND id NOT IN (SELECT DISTINCT package_id FROM orders WHERE package_id IS NOT NULL)'
    );
  } catch (e) { /* ignore */ }

  await client.query('COMMIT');

  const { rows: total } = await client.query('SELECT COUNT(*)::int AS cnt FROM packages');
  console.log(`\n✔ Imported ${ok} packages (skipped ${skip})`);
  console.log(`  Total packages in DB: ${total[0].cnt}`);
  await client.end();
}

run().catch(err => {
  console.error('FATAL:', err.message);
  console.error(err.stack);
  process.exit(1);
});
