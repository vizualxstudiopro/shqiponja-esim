const https = require('https');

function apiCall(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'shqiponja-esim-production.up.railway.app',
      path: '/api' + path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) options.headers['Authorization'] = 'Bearer ' + token;
    
    const req = https.request(options, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d), headers: res.headers }); }
        catch { resolve({ status: res.statusCode, data: d, headers: res.headers }); }
      });
    });
    req.on('error', e => reject(e));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async () => {
  // Test health
  console.log('=== Health ===');
  const h = await apiCall('GET', '/health');
  console.log('Status:', h.status, 'Data:', h.data);
  
  // Test with Origin header 
  console.log('\n=== PATCH highlight (no auth, with Origin) ===');
  const t1 = await apiCall('PATCH', '/admin/packages/2071/highlight', { highlight: true });
  console.log('Status:', t1.status, 'Data:', JSON.stringify(t1.data).slice(0, 200));
  
  // Test public packages
  console.log('\n=== GET /packages ===');
  const t2 = await apiCall('GET', '/packages');
  console.log('Status:', t2.status, 'Count:', Array.isArray(t2.data) ? t2.data.length : typeof t2.data);
  
  // Test featured  
  console.log('\n=== GET /packages/featured ===');
  const t3 = await apiCall('GET', '/packages/featured');
  console.log('Status:', t3.status, 'Full body:', JSON.stringify(t3.data));
  
  // Test nonexistent ID
  console.log('\n=== GET /packages/99999 ===');
  const t3c = await apiCall('GET', '/packages/99999');
  console.log('Status:', t3c.status, 'Full body:', JSON.stringify(t3c.data));
  
  // Test destinations too
  console.log('\n=== GET /packages/destinations ===');
  const t3b = await apiCall('GET', '/packages/destinations');
  console.log('Status:', t3b.status, 'Count:', Array.isArray(t3b.data) ? t3b.data.length : 'Body: ' + JSON.stringify(t3b.data).slice(0, 200));
  
  // Test a real package
  console.log('\n=== GET /packages/2071 ===');
  const t3d = await apiCall('GET', '/packages/2071');
  console.log('Status:', t3d.status, 'Name:', t3d.data.name || t3d.data.error);
  
  // Test category endpoint existence
  console.log('\n=== PATCH category (no auth) ===');
  const t4 = await apiCall('PATCH', '/admin/packages/2071/category', { category: 'local' });
  console.log('Status:', t4.status, 'Data:', JSON.stringify(t4.data).slice(0, 200));
})();
