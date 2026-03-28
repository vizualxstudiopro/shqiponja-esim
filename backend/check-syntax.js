const { execSync } = require('child_process');
const files = [
  'routes/auth.js', 'routes/admin.js', 'routes/packages.js',
  'routes/orders.js', 'routes/checkout.js', 'routes/webhook.js',
  'routes/oauth.js', 'routes/two-factor.js', 'db/index.js',
  'db/migrate.js', 'index.js'
];
let ok = 0, fail = 0;
for (const f of files) {
  try {
    execSync(`node -c ${f}`, { cwd: __dirname, stdio: 'pipe' });
    console.log('OK:', f);
    ok++;
  } catch (e) {
    console.error('FAIL:', f, e.stderr?.toString());
    fail++;
  }
}
console.log(`\nResult: ${ok} OK, ${fail} FAIL`);
