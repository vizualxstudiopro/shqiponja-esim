/**
 * Shared helpers for Airalo CSV import.
 * Used by both scripts/import-airalo-csv.js and db/migrate.js
 */

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
  'European Union and United Kingdom': 'EU', 'Europe': 'EU', 'Asia': 'AS',
  'Africa': 'AF', 'Caribbean Islands': 'CB', 'Discover Global': 'GL',
  'Latin America': 'LA', 'Middle East and North Africa': 'ME',
  'North America': 'NA', 'Oceania': 'OC', 'Africa Safari': 'AF',
};

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
  const special = { EU: '🇪🇺', AS: '🌏', AF: '🌍', CB: '🏝️', GL: '🌍', LA: '🌎', ME: '🌍', NA: '🌎', OC: '🌏' };
  if (special[code]) return special[code];
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
}

function extractDuration(packageId) {
  const match = packageId.match(/(\d+)days?/i);
  if (match) return `${match[1]} ditë`;
  return '30 ditë';
}

function calculateRetailPrice(netPrice, minSellingPrice) {
  const np = parseFloat(netPrice);
  const msp = parseFloat(minSellingPrice);
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

module.exports = { COUNTRY_CODES, REGIONS, countryToFlag, extractDuration, calculateRetailPrice, parseCSV, getRegionForSpecial };
