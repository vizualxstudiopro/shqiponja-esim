const https = require('https');

const API = 'shqiponja-esim-production.up.railway.app';

function makeRequest(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API,
      path,
      method,
      headers: { 'Content-Type': 'application/json', ...headers }
    };
    const req = https.request(options, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(d) });
        } catch {
          resolve({ status: res.statusCode, body: d });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async () => {
  console.log('1. HEALTH check...');
  const health = await makeRequest('GET', '/api/health');
  console.log('   Status:', health.status, 'Uptime:', health.body.uptime, 'seconds');

  console.log('\n2. FEATURED packages...');
  const feat = await makeRequest('GET', '/api/packages/featured');
  console.log('   Status:', feat.status);
  if (feat.status === 200) {
    console.log('   Count:', Array.isArray(feat.body) ? feat.body.length : 'not array');
  } else {
    console.log('   Error:', JSON.stringify(feat.body));
  }

  console.log('\n3. PUBLIC packages...');
  const pub = await makeRequest('GET', '/api/packages');
  console.log('   Status:', pub.status);
  console.log('   Count:', Array.isArray(pub.body) ? pub.body.length : 'not array');
})();
