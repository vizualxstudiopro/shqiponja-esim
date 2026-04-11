const https = require('https');

// First login to get token
function apiCall(method, path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'shqiponja-esim-production.up.railway.app',
      path: '/api' + path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (process.env.TOKEN) {
      options.headers['Authorization'] = 'Bearer ' + process.env.TOKEN;
    }
    const req = https.request(options, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        console.log(`${method} ${path} => ${res.statusCode}`);
        try {
          const json = JSON.parse(d);
          resolve({ status: res.statusCode, data: json });
        } catch {
          resolve({ status: res.statusCode, data: d });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async () => {
  // Login
  const login = await apiCall('POST', '/auth/login', {
    email: 'admin@shqiponjaesim.com',
    password: 'admin123'
  });
  console.log('Login:', login.status, login.data.token ? 'GOT TOKEN' : login.data);
  
  if (!login.data.token) {
    console.log('Cannot login, exiting');
    return;
  }
  
  process.env.TOKEN = login.data.token;
  
  // Get packages list
  const pkgs = await apiCall('GET', '/admin/packages?limit=3');
  console.log('\nFirst 3 packages:');
  if (pkgs.data.packages) {
    pkgs.data.packages.slice(0, 3).forEach(p => {
      console.log(`  #${p.id} "${p.name}" vis=${p.visible} hl=${p.highlight} cat=${p.category}`);
    });
  }
  
  // Try to toggle highlight on first package
  const firstPkg = pkgs.data.packages && pkgs.data.packages[0];
  if (firstPkg) {
    console.log(`\nToggling highlight on #${firstPkg.id} (currently: ${firstPkg.highlight})...`);
    const toggle = await apiCall('PATCH', `/admin/packages/${firstPkg.id}/highlight`, { highlight: !firstPkg.highlight });
    console.log('Result:', toggle.status, JSON.stringify(toggle.data).slice(0, 200));
    
    // Toggle it back
    const toggleBack = await apiCall('PATCH', `/admin/packages/${firstPkg.id}/highlight`, { highlight: firstPkg.highlight });
    console.log('Toggle back:', toggleBack.status);
  }
  
  // Check public featured endpoint
  const featured = await apiCall('GET', '/packages/featured');
  console.log(`\nFeatured packages: ${Array.isArray(featured.data) ? featured.data.length : 'ERROR'}`);
  if (Array.isArray(featured.data)) {
    featured.data.forEach(p => console.log(`  #${p.id} "${p.name}" hl=${p.highlight}`));
  }
})();
