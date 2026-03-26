/**
 * Import Airalo packages from CSV into the database.
 * Run: node backend/scripts/import-airalo-csv.js
 */
const fs = require('fs');
const path = require('path');

// Initialize DB (runs migrations)
require('../db/migrate');
const db = require('../db');

const CSV_PATH = path.join(__dirname, '..', 'data', 'airalo-packages.csv');

// Country code mapping for flag emojis
const COUNTRY_CODES = {
  'United States': 'US', 'France': 'FR', 'China': 'CN', 'Spain': 'ES', 'Italy': 'IT',
  'Turkey': 'TR', 'United Kingdom': 'GB', 'Germany': 'DE', 'Mexico': 'MX', 'Thailand': 'TH',
  'Hong Kong': 'HK', 'Malaysia': 'MY', 'Greece': 'GR', 'Canada': 'CA', 'South Korea': 'KR',
  'Japan': 'JP', 'Singapore': 'SG', 'Aruba': 'AW', 'Afghanistan': 'AF', 'Anguilla': 'AI',
  'Albania': 'AL', 'Andorra': 'AD', 'United Arab Emirates': 'AE', 'Argentina': 'AR',
  'Armenia': 'AM', 'Antigua And Barbuda': 'AG', 'Australia': 'AU', 'Austria': 'AT',
  'Azerbaijan': 'AZ', 'Belgium': 'BE', 'Benin': 'BJ', 'Bonaire': 'BQ', 'Burkina Faso': 'BF',
  'Bangladesh': 'BD', 'Bulgaria': 'BG', 'Bahrain': 'BH', 'Bahamas': 'BS',
  'Bosnia and Herzegovina': 'BA', 'Saint Barthélemy': 'BL', 'Belarus': 'BY', 'Belize': 'BZ',
  'Bermuda': 'BM', 'Bolivia': 'BO', 'Brazil': 'BR', 'Barbados': 'BB', 'Brunei': 'BN',
  'Bhutan': 'BT', 'Botswana': 'BW', 'Central African Republic': 'CF', 'Switzerland': 'CH',
  'Chile': 'CL', "Côte d'Ivoire": 'CI', 'Cameroon': 'CM',
  'Democratic Republic Of The Congo': 'CD', 'Republic of the Congo': 'CG',
  'Colombia': 'CO', 'Cape Verde': 'CV', 'Costa Rica': 'CR', 'Curaçao': 'CW',
  'Cyprus': 'CY', 'Czech Republic': 'CZ', 'Dominica': 'DM', 'Denmark': 'DK',
  'Dominican Republic': 'DO', 'Algeria': 'DZ', 'Ecuador': 'EC', 'Egypt': 'EG',
  'Estonia': 'EE', 'Ethiopia': 'ET', 'Finland': 'FI', 'Fiji': 'FJ', 'Faroe Islands': 'FO',
  'Gabon': 'GA', 'Georgia': 'GE', 'Ghana': 'GH', 'Gibraltar': 'GI', 'Guinea': 'GN',
  'Guadeloupe': 'GP', 'Gambia': 'GM', 'Guinea-Bissau': 'GW', 'Grenada': 'GD',
  'Greenland': 'GL', 'Guatemala': 'GT', 'French Guiana': 'GF', 'Guam': 'GU',
  'Guyana': 'GY', 'Honduras': 'HN', 'Croatia': 'HR', 'Haiti': 'HT', 'Hungary': 'HU',
  'Indonesia': 'ID', 'Isle of Man': 'IM', 'India': 'IN', 'Ireland': 'IE', 'Iraq': 'IQ',
  'Iceland': 'IS', 'Israel': 'IL', 'Jamaica': 'JM', 'Jersey': 'JE', 'Jordan': 'JO',
  'Kazakhstan': 'KZ', 'Kenya': 'KE', 'Kyrgyzstan': 'KG', 'Cambodia': 'KH',
  'Saint Kitts and Nevis': 'KN', 'Kuwait': 'KW', 'Laos': 'LA', 'Lebanon': 'LB',
  'Liberia': 'LR', 'Saint Lucia': 'LC', 'Liechtenstein': 'LI', 'Sri Lanka': 'LK',
  'Lesotho': 'LS', 'Lithuania': 'LT', 'Luxembourg': 'LU', 'Latvia': 'LV', 'Macao': 'MO',
  'Saint Martin (French Part)': 'MF', 'Morocco': 'MA', 'Moldova': 'MD', 'Madagascar': 'MG',
  'Maldives': 'MV', 'North Macedonia': 'MK', 'Mali': 'ML', 'Malta': 'MT',
  'Montenegro': 'ME', 'Mongolia': 'MN', 'Mozambique': 'MZ', 'Montserrat': 'MS',
  'Martinique': 'MQ', 'Mauritius': 'MU', 'Malawi': 'MW', 'Mayotte': 'YT', 'Namibia': 'NA',
  'Niger': 'NE', 'Nigeria': 'NG', 'Nicaragua': 'NI', 'Netherlands': 'NL', 'Norway': 'NO',
  'Nepal': 'NP', 'Nauru': 'NR', 'New Zealand': 'NZ', 'Oman': 'OM', 'Pakistan': 'PK',
  'Panama': 'PA', 'Peru': 'PE', 'Philippines': 'PH', 'Papua New Guinea': 'PG',
  'Poland': 'PL', 'Portugal': 'PT', 'Paraguay': 'PY', 'Palestine, State of': 'PS',
  'Qatar': 'QA', 'Réunion': 'RE', 'Romania': 'RO', 'Rwanda': 'RW', 'Saudi Arabia': 'SA',
  'Senegal': 'SN', 'Sierra Leone': 'SL', 'El Salvador': 'SV', 'Serbia': 'RS',
  'Suriname': 'SR', 'Slovakia': 'SK', 'Slovenia': 'SI', 'Sweden': 'SE', 'Eswatini': 'SZ',
  'Sint Maarten (Dutch Part)': 'SX', 'Seychelles': 'SC', 'Turks and Caicos Islands': 'TC',
  'Chad': 'TD', 'Togo': 'TG', 'Tajikistan': 'TJ', 'Timor - Leste': 'TL', 'Tonga': 'TO',
  'Trinidad and Tobago': 'TT', 'Tunisia': 'TN', 'Taiwan': 'TW', 'Tanzania': 'TZ',
  'Uganda': 'UG', 'Ukraine': 'UA', 'Uruguay': 'UY', 'Uzbekistan': 'UZ',
  'Vatican City': 'VA', 'Saint Vincent and the Grenadines': 'VC', 'Venezuela': 'VE',
  'British Virgin Islands': 'VG', 'Virgin Islands (U.S.)': 'VI', 'Vietnam': 'VN',
  'Vanuatu': 'VU', 'Samoa': 'WS', 'South Africa': 'ZA', 'Zambia': 'ZM', 'Zimbabwe': 'ZW',
  'Marie-Galante': 'GP', 'Puerto Rico': 'PR', 'Scotland': 'GB', 'Canary Islands': 'ES',
  'Madeira': 'PT', 'Azores': 'PT', 'Northern Cyprus': 'CY', 'Saba': 'BQ',
  'Sint Eustatius': 'BQ',
  // Regional packages
  'European Union and United Kingdom': 'EU', 'Europe': 'EU', 'Asia': 'AS',
  'Africa': 'AF', 'Caribbean Islands': 'CB', 'Discover Global': 'GL',
  'Latin America': 'LA', 'Middle East and North Africa': 'ME',
  'North America': 'NA', 'Oceania': 'OC', 'Africa Safari': 'AF',
};

// Region classification
const REGIONS = {
  'US': 'North America', 'CA': 'North America', 'MX': 'North America', 'PR': 'North America',
  'FR': 'Europe', 'ES': 'Europe', 'IT': 'Europe', 'DE': 'Europe', 'GB': 'Europe',
  'GR': 'Europe', 'AT': 'Europe', 'BE': 'Europe', 'BG': 'Europe', 'HR': 'Europe',
  'CY': 'Europe', 'CZ': 'Europe', 'DK': 'Europe', 'EE': 'Europe', 'FI': 'Europe',
  'HU': 'Europe', 'IE': 'Europe', 'IS': 'Europe', 'LT': 'Europe', 'LU': 'Europe',
  'LV': 'Europe', 'MT': 'Europe', 'NL': 'Europe', 'NO': 'Europe', 'PL': 'Europe',
  'PT': 'Europe', 'RO': 'Europe', 'SE': 'Europe', 'SI': 'Europe', 'SK': 'Europe',
  'CH': 'Europe', 'AD': 'Europe', 'AL': 'Europe', 'BA': 'Europe', 'GI': 'Europe',
  'IM': 'Europe', 'JE': 'Europe', 'LI': 'Europe', 'ME': 'Europe', 'MK': 'Europe',
  'MD': 'Europe', 'RS': 'Europe', 'UA': 'Europe', 'BY': 'Europe', 'FO': 'Europe',
  'GL': 'Europe', 'VA': 'Europe', 'MC': 'Europe',
  'CN': 'Asia', 'JP': 'Asia', 'KR': 'Asia', 'TH': 'Asia', 'SG': 'Asia', 'MY': 'Asia',
  'HK': 'Asia', 'IN': 'Asia', 'ID': 'Asia', 'PH': 'Asia', 'VN': 'Asia', 'KH': 'Asia',
  'BD': 'Asia', 'PK': 'Asia', 'LK': 'Asia', 'NP': 'Asia', 'MN': 'Asia', 'LA': 'Asia',
  'BN': 'Asia', 'BT': 'Asia', 'KZ': 'Asia', 'KG': 'Asia', 'TJ': 'Asia', 'UZ': 'Asia',
  'AZ': 'Asia', 'GE': 'Asia', 'AM': 'Asia', 'MO': 'Asia', 'TW': 'Asia', 'MV': 'Asia',
  'TR': 'Asia', 'TL': 'Asia',
  'AU': 'Oceania', 'NZ': 'Oceania', 'FJ': 'Oceania', 'PG': 'Oceania', 'VU': 'Oceania',
  'WS': 'Oceania', 'TO': 'Oceania', 'NR': 'Oceania', 'GU': 'Oceania',
  'BR': 'South America', 'AR': 'South America', 'CL': 'South America', 'CO': 'South America',
  'PE': 'South America', 'EC': 'South America', 'BO': 'South America', 'PY': 'South America',
  'UY': 'South America', 'VE': 'South America', 'GY': 'South America', 'SR': 'South America',
  'GF': 'South America',
  'GT': 'Central America', 'HN': 'Central America', 'SV': 'Central America',
  'NI': 'Central America', 'CR': 'Central America', 'PA': 'Central America', 'BZ': 'Central America',
  'AE': 'Middle East', 'SA': 'Middle East', 'QA': 'Middle East', 'KW': 'Middle East',
  'BH': 'Middle East', 'OM': 'Middle East', 'JO': 'Middle East', 'IQ': 'Middle East',
  'IL': 'Middle East', 'LB': 'Middle East', 'PS': 'Middle East',
  'ZA': 'Africa', 'EG': 'Africa', 'MA': 'Africa', 'TN': 'Africa', 'DZ': 'Africa',
  'NG': 'Africa', 'KE': 'Africa', 'GH': 'Africa', 'TZ': 'Africa', 'UG': 'Africa',
  'ET': 'Africa', 'RW': 'Africa', 'SN': 'Africa', 'CM': 'Africa', 'GA': 'Africa',
  'MG': 'Africa', 'MZ': 'Africa', 'MW': 'Africa', 'ZM': 'Africa', 'ZW': 'Africa',
  'NA': 'Africa', 'BW': 'Africa', 'LS': 'Africa', 'SZ': 'Africa', 'MU': 'Africa',
  'SC': 'Africa', 'CV': 'Africa', 'BJ': 'Africa', 'BF': 'Africa', 'CI': 'Africa',
  'GM': 'Africa', 'GN': 'Africa', 'GW': 'Africa', 'LR': 'Africa', 'ML': 'Africa',
  'NE': 'Africa', 'SL': 'Africa', 'TG': 'Africa', 'TD': 'Africa', 'CF': 'Africa',
  'CD': 'Africa', 'CG': 'Africa', 'YT': 'Africa',
  // Caribbean
  'JM': 'Caribbean', 'TT': 'Caribbean', 'BB': 'Caribbean', 'AG': 'Caribbean',
  'DM': 'Caribbean', 'GD': 'Caribbean', 'KN': 'Caribbean', 'LC': 'Caribbean',
  'VC': 'Caribbean', 'BS': 'Caribbean', 'HT': 'Caribbean', 'DO': 'Caribbean',
  'AW': 'Caribbean', 'CW': 'Caribbean', 'BQ': 'Caribbean', 'SX': 'Caribbean',
  'BL': 'Caribbean', 'MF': 'Caribbean', 'AI': 'Caribbean', 'BM': 'Caribbean',
  'VG': 'Caribbean', 'VI': 'Caribbean', 'TC': 'Caribbean', 'MS': 'Caribbean',
  'GP': 'Caribbean', 'MQ': 'Caribbean', 'RE': 'Caribbean',
};

function countryToFlag(code) {
  if (!code || code.length !== 2) return '🌍';
  // Regional codes
  const special = { EU: '🇪🇺', AS: '🌏', AF: '🌍', CB: '🏝️', GL: '🌍', LA: '🌎', ME: '🌍', NA: '🌎', OC: '🌏' };
  if (special[code]) return special[code];
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
}

function extractDuration(packageId) {
  const match = packageId.match(/(\d+)days?/i);
  if (match) return `${match[1]} ditë`;
  const yearMatch = packageId.match(/(\d+)days?/i) || packageId.match(/365/);
  if (yearMatch) return '365 ditë';
  return '30 ditë';
}

function calculateRetailPrice(netPrice, minSellingPrice) {
  // Set price at ~30% above minimum selling price for good margin
  // but ensure we're well above net price
  const np = parseFloat(netPrice);
  const msp = parseFloat(minSellingPrice);
  // Round to nice price point
  const target = Math.max(msp, np * 2);
  return Math.ceil(target * 100) / 100;
}

function parseCSV(content) {
  const lines = content.split('\n').filter(l => l.trim());
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((h, i) => row[h] = values[i] || '');
    return row;
  });
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes; continue; }
    if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue; }
    current += char;
  }
  result.push(current.trim());
  return result;
}

// ══════════ MAIN ══════════
function main() {
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const rows = parseCSV(csvContent);

  console.log(`📦 Total CSV rows: ${rows.length}`);

  // Ensure unique index exists
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_packages_airalo_unique ON packages(airalo_package_id)');

  const upsert = db.prepare(`
    INSERT INTO packages (name, region, flag, data, duration, price, currency, highlight, description,
                          airalo_package_id, country_code, networks, package_type, net_price, sms, voice)
    VALUES (@name, @region, @flag, @data, @duration, @price, @currency, @highlight, @description,
            @airalo_package_id, @country_code, @networks, @package_type, @net_price, @sms, @voice)
    ON CONFLICT(airalo_package_id) DO UPDATE SET
      price = @price, net_price = @net_price, data = @data, duration = @duration,
      networks = @networks, sms = @sms, voice = @voice, name = @name, description = @description
  `);

  let imported = 0;
  let skipped = 0;

  const importAll = db.transaction((rows) => {
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

      if (!packageId || !country || isNaN(netPrice) || isNaN(minPrice)) { skipped++; continue; }

      const countryCode = COUNTRY_CODES[country] || '';
      const flag = countryToFlag(countryCode);
      const region = REGIONS[countryCode] || getRegionForSpecial(country) || 'Other';
      const duration = extractDuration(packageId);
      const retailPrice = calculateRetailPrice(netPrice, minPrice);

      upsert.run({
        name: `${country} — ${data}`,
        region,
        flag,
        data,
        duration,
        price: retailPrice,
        currency: 'USD',
        highlight: 0,
        description: `${networks} — ${data} / ${duration}`,
        airalo_package_id: packageId,
        country_code: countryCode,
        networks,
        package_type: type,
        net_price: netPrice,
        sms,
        voice,
      });
      imported++;
    }
  });

  importAll(rows);

  console.log(`✅ Imported: ${imported} packages`);
  console.log(`⏭️  Skipped: ${skipped} packages`);

  // Stats
  const total = db.prepare('SELECT COUNT(*) as cnt FROM packages WHERE airalo_package_id IS NOT NULL').get();
  const simCount = db.prepare("SELECT COUNT(*) as cnt FROM packages WHERE airalo_package_id IS NOT NULL AND package_type = 'sim'").get();
  const countries = db.prepare('SELECT COUNT(DISTINCT country_code) as cnt FROM packages WHERE airalo_package_id IS NOT NULL').get();
  console.log(`\n📊 Database stats:`);
  console.log(`   Total Airalo packages: ${total.cnt}`);
  console.log(`   SIM packages: ${simCount.cnt}`);
  console.log(`   Countries: ${countries.cnt}`);
}

function getRegionForSpecial(country) {
  const map = {
    'European Union and United Kingdom': 'Europe', 'Europe': 'Europe',
    'Asia': 'Asia', 'Africa': 'Africa', 'Africa Safari': 'Africa',
    'Caribbean Islands': 'Caribbean', 'Discover Global': 'Global',
    'Latin America': 'South America', 'Middle East and North Africa': 'Middle East',
    'North America': 'North America', 'Oceania': 'Oceania',
  };
  return map[country] || null;
}

main();
