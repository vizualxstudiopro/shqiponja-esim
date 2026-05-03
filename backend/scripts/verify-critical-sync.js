const fs = require('fs');
const path = require('path');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function assertContains(content, pattern, message) {
  if (!pattern.test(content)) {
    throw new Error(message);
  }
}

function assertNotContains(content, pattern, message) {
  if (pattern.test(content)) {
    throw new Error(message);
  }
}

function run() {
  const serverPath = path.join(__dirname, '..', 'src', 'server.js');
  const packagesPath = path.join(__dirname, '..', 'routes', 'packages.js');

  const server = read(serverPath);
  const packages = read(packagesPath);

  // Airalo scheduler guardrails
  assertContains(
    server,
    /AIRALO_SYNC_INTERVAL_MS\s*=\s*Number\(process\.env\.AIRALO_SYNC_INTERVAL_MS\s*\|\|\s*60\s*\*\s*60\s*\*\s*1000\)/,
    'Critical guard failed: 60-minute Airalo interval default is missing or changed.'
  );
  assertContains(
    server,
    /setInterval\(\s*\(\)\s*=>\s*\{\s*runSync\('interval'\)/s,
    'Critical guard failed: interval-based Airalo sync scheduler is missing.'
  );
  assertContains(
    server,
    /app\.locals\.triggerAiraloSync\s*=\s*runSync/,
    'Critical guard failed: app trigger for Airalo sync is missing.'
  );

  // Package sync safety guardrails
  assertContains(
    packages,
    /router\.syncPackagesFromAiralo\s*=\s*syncPackagesFromAiralo/,
    'Critical guard failed: exported sync function is missing from packages route.'
  );
  assertContains(
    packages,
    /ON\s+CONFLICT\(airalo_package_id\)\s+DO\s+UPDATE/s,
    'Critical guard failed: idempotent upsert protection is missing.'
  );
  assertContains(
    packages,
    /cache\.flushAll\(\)/,
    'Critical guard failed: package cache invalidation after sync is missing.'
  );
  assertNotContains(
    packages,
    /DELETE\s+FROM\s+packages/i,
    'Critical guard failed: destructive package deletion detected in sync route.'
  );

  console.log('[verify:sync] OK - Airalo sync and package safety guards passed.');
}

try {
  run();
} catch (err) {
  console.error('[verify:sync] FAILED:', err.message);
  process.exit(1);
}
