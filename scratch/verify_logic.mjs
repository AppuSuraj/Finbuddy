import { lookupSector } from '../api/nse-sector-db.js';

const testCases = [
  'LT', 'DIXON', 'RELIANCE', 'HDFCBANK', 'M&M', 'TATASTEEL'
];

console.log('--- Testing lookupSector ---');
testCases.forEach(ticker => {
  const sector = lookupSector(ticker);
  console.log(`${ticker} => ${sector}`);
});

const smartResolveTicker = (rawName) => {
    if (!rawName) return '';
    let name = String(rawName).toUpperCase().trim();
    
    const mappings = { 
      'HDFC BANK': 'HDFCBANK', 'TATA POWER': 'TATAPOWER', 'KOTAK MAHINDRA BANK': 'KOTAKBANK', 
      'ICICI BANK': 'ICICIBANK', 'ADANI ENTERPRISES': 'ADANIENT', 'TATA MOTORS': 'TATAMOTORS',
      'RELIANCE INDUSTRIES': 'RELIANCE', 'BAJAJ FINANCE': 'BAJFINANCE', 'BAJAJ FINSERV': 'BAJAJFINSV',
      'LARSEN & TOUBRO': 'LT', 'STATE BANK OF INDIA': 'SBIN', 'BHARTI AIRTEL': 'BHARTIARTL'
    };
    if (mappings[name]) return mappings[name];
    
    // Handle Zerodha/Groww variations like RELIANCE-EQ or RELIANCE_EQ or RELIANCE.EQ
    name = name.split('-')[0].split('_')[0].split('.')[0].trim();
    
    if (name.includes('(')) name = name.split('(')[0].trim();
    return name.split(' ')[0].replace(/[^A-Z0-9&]/g, '');
};

console.log('\n--- Testing smartResolveTicker ---');
const nameCases = [
    'LT (7 shares)',
    'DIXON (2 shares)',
    'Larsen & Toubro Limited',
    'RELIANCE-EQ',
    'M&M-EQ'
];

nameCases.forEach(name => {
    console.log(`"${name}" => ${smartResolveTicker(name)}`);
});
