// Consolidated NSE Sector Database for high-reliability categorization
const NSE_SECTOR_DB = {
  // ── Banks ──
  HDFCBANK: 'Banks', ICICIBANK: 'Banks', SBIN: 'Banks', AXISBANK: 'Banks',
  KOTAKBANK: 'Banks', INDUSINDBK: 'Banks', BANKBARODA: 'Banks', CANARABANK: 'Banks',
  PNB: 'Banks', UNIONBANK: 'Banks', IDFCFIRSTB: 'Banks', FEDERALBNK: 'Banks',
  AUBANK: 'Banks', BANDHANBNK: 'Banks', RBLBANK: 'Banks', YESBANK: 'Banks',
  KARURVYSYA: 'Banks', DCBBANK: 'Banks', CUB: 'Banks', SOUTHBANK: 'Banks',
  CSBBANK: 'Banks', JKBANK: 'Banks', LAKSHVILAS: 'Banks',

  // ── IT - Software ──
  TCS: 'IT - Software', INFY: 'IT - Software', WIPRO: 'IT - Software',
  HCLTECH: 'IT - Software', TECHM: 'IT - Software', LTIM: 'IT - Software',
  MPHASIS: 'IT - Software', COFORGE: 'IT - Software', PERSISTENT: 'IT - Software',
  OFSS: 'IT - Software', KPITTECH: 'IT - Software', TATAELXSI: 'IT - Software',
  MASTEK: 'IT - Software', NIITTECH: 'IT - Software', HEXAWARE: 'IT - Software',
  CYIENT: 'IT - Software', BIRLASOFT: 'IT - Software', ZENSAR: 'IT - Software',

  // ── IT - Services ──
  LTTS: 'IT - Services', ECLERX: 'IT - Services', MAJESCO: 'IT - Services',

  // ── Petroleum Products ──
  RELIANCE: 'Petroleum Products', BPCL: 'Petroleum Products', HPCL: 'Petroleum Products',
  IOC: 'Petroleum Products', ONGC: 'Petroleum Products', MRPL: 'Petroleum Products',
  CPCL: 'Petroleum Products', CHENNPETRO: 'Petroleum Products',

  // ── Automobiles ──
  MARUTI: 'Automobiles', TATAMOTORS: 'Automobiles', M_M: 'Automobiles',
  EICHERMOT: 'Automobiles', BAJAJ_AUTO: 'Automobiles', HEROMOTOCO: 'Automobiles',
  TVSMOTORS: 'Automobiles', TVSMOTOR: 'Automobiles', ASHOKLEY: 'Automobiles',
  FORCEMOT: 'Automobiles', ESCORTS: 'Automobiles', SMLISUZU: 'Automobiles',

  // ── Auto Components ──
  MOTHERSON: 'Auto Components', BOSCHLTD: 'Auto Components', BHARATFORG: 'Auto Components',
  SUNDRMFAST: 'Auto Components', ENDURANCE: 'Auto Components', MINDAIND: 'Auto Components',
  JBMA: 'Auto Components', SUPRAJIT: 'Auto Components', EXIDEIND: 'Auto Components',
  AMARAJABAT: 'Auto Components', GABRIEL: 'Auto Components',

  // ── Pharmaceuticals & Biotechnology ──
  SUNPHARMA: 'Pharmaceuticals & Biotechnology', DRREDDY: 'Pharmaceuticals & Biotechnology',
  CIPLA: 'Pharmaceuticals & Biotechnology', DIVISLAB: 'Pharmaceuticals & Biotechnology',
  LUPIN: 'Pharmaceuticals & Biotechnology', BIOCON: 'Pharmaceuticals & Biotechnology',
  AUROPHARMA: 'Pharmaceuticals & Biotechnology', TORNTPHARM: 'Pharmaceuticals & Biotechnology',
  GLENMARK: 'Pharmaceuticals & Biotechnology', ALKEM: 'Pharmaceuticals & Biotechnology',
  IPCALAB: 'Pharmaceuticals & Biotechnology', ABBOTINDIA: 'Pharmaceuticals & Biotechnology',
  PFIZER: 'Pharmaceuticals & Biotechnology', GLAXO: 'Pharmaceuticals & Biotechnology',
  NATCOPHARM: 'Pharmaceuticals & Biotechnology', GRANULES: 'Pharmaceuticals & Biotechnology',
  LAURUSLABS: 'Pharmaceuticals & Biotechnology', AJANTPHARM: 'Pharmaceuticals & Biotechnology',

  // ── Finance (NBFCs) ──
  BAJFINANCE: 'Finance', BAJAJFINSV: 'Finance', CHOLAFIN: 'Finance',
  MUTHOOTFIN: 'Finance', SHRIRAMFIN: 'Finance', SRTRANSFIN: 'Finance',
  M_MFIN: 'Finance', MANAPPURAM: 'Finance', LICHSGFIN: 'Finance',
  PNBHOUSING: 'Finance', CANFINHOME: 'Finance', AAVAS: 'Finance',
  HOMEFIRST: 'Finance', APTUS: 'Finance', CREDITACC: 'Finance',

  // ── Insurance ──
  HDFCLIFE: 'Insurance', SBILIFE: 'Insurance', ICICIPRULI: 'Insurance',
  BAJAJALLIANZ: 'Insurance', LICI: 'Insurance', STARHEALTH: 'Insurance',
  NIACL: 'Insurance', GICRE: 'Insurance',

  // ── Capital Markets ──
  BSE: 'Capital Markets', MCX: 'Capital Markets', CDSL: 'Capital Markets',
  NSDL: 'Capital Markets', ICICISGOLD: 'Capital Markets', MOTILALOFS: 'Capital Markets',
  IIFL: 'Capital Markets', '5PAISA': 'Capital Markets', ANAND: 'Capital Markets',

  // ── Construction ──
  LT: 'Construction', DLF: 'Construction', MACROTECH: 'Construction',
  GODREJPROP: 'Construction', PRESTIGE: 'Construction', SOBHA: 'Construction',
  BRIGADE: 'Construction', PHOENIXLTD: 'Construction', OBEROIRLTY: 'Construction',
  SUNTECK: 'Construction', KOLTEPATIL: 'Construction', NCC: 'Construction',
  KNRCON: 'Construction', HGINFRA: 'Construction', PNC: 'Construction',

  // ── Cement & Cement Products ──
  ULTRACEMCO: 'Cement & Cement Products', SHREECEM: 'Cement & Cement Products',
  AMBUJACEM: 'Cement & Cement Products', ACC: 'Cement & Cement Products',
  RAMCOCEM: 'Cement & Cement Products', JKCEMENT: 'Cement & Cement Products',
  DALMIABRN: 'Cement & Cement Products', HEIDELBERG: 'Cement & Cement Products',
  BIRLACEM: 'Cement & Cement Products',

  // ── Power ──
  NTPC: 'Power', POWERGRID: 'Power', ADANIPOWER: 'Power', TATAPOWER: 'Power',
  JSPOWER: 'Power', TORNTPOWER: 'Power', CESC: 'Power', NHPC: 'Power',
  SJVN: 'Power', RPOWER: 'Power', ADANIGREEN: 'Power', GREENKO: 'Power',

  // ── Consumer Durables ──
  TITAN: 'Consumer Durables', HAVELLS: 'Consumer Durables', VOLTAS: 'Consumer Durables',
  BLUESTAR: 'Consumer Durables', VGUARD: 'Consumer Durables', CROMPTON: 'Consumer Durables',
  AMBER: 'Consumer Durables', DIXON: 'Consumer Durables', WHIRLPOOL: 'Consumer Durables',
  KAJARIACER: 'Consumer Durables', ORIENTBELL: 'Consumer Durables',

  // ── FMCG / Diversified FMCG ──
  HINDUNILVR: 'Diversified FMCG', ITC: 'Diversified FMCG', NESTLEIND: 'Diversified FMCG',
  BRITANNIA: 'Diversified FMCG', DABUR: 'Diversified FMCG', MARICO: 'Diversified FMCG',
  COLPAL: 'Diversified FMCG', GODREJCP: 'Diversified FMCG', EMAMILTD: 'Diversified FMCG',
  VIMTALABS: 'Diversified FMCG', PGHH: 'Diversified FMCG',

  // ── Chemicals & Petrochemicals ──
  PIDILITIND: 'Chemicals & Petrochemicals', SRF: 'Chemicals & Petrochemicals',
  AARTI: 'Chemicals & Petrochemicals', DEEPAKNITRI: 'Chemicals & Petrochemicals',
  NAVINFLUOR: 'Chemicals & Petrochemicals', GALAXYSURF: 'Chemicals & Petrochemicals',
  BALRAMCHIN: 'Chemicals & Petrochemicals', FINEORG: 'Chemicals & Petrochemicals',
  SUDARSCHEM: 'Chemicals & Petrochemicals', TATACHEM: 'Chemicals & Petrochemicals',

  // ── Aerospace & Defense ──
  HAL: 'Aerospace & Defense', BEL: 'Aerospace & Defense', COCHINSHIP: 'Aerospace & Defense',
  MAHINDCIE: 'Aerospace & Defense', PARAS: 'Aerospace & Defense', MIDHANI: 'Aerospace & Defense',
  GRSE: 'Aerospace & Defense', MAZAGON: 'Aerospace & Defense',

  // ── Ferrous Metals / Steel ──
  TATASTEEL: 'Ferrous Metals', JSWSTEEL: 'Ferrous Metals', SAIL: 'Ferrous Metals',
  JINDALSTEL: 'Ferrous Metals', HINDALCO: 'Non - Ferrous Metals', VEDL: 'Non - Ferrous Metals',
  NATIONALUM: 'Non - Ferrous Metals', HINDCOPPER: 'Non - Ferrous Metals',
  COLINZ: 'Non - Ferrous Metals',

  // ── Electrical Equipment ──
  ABB: 'Electrical Equipment', SIEMENS: 'Electrical Equipment', CUMMINSIND: 'Electrical Equipment',
  BHEL: 'Electrical Equipment', THERMAX: 'Electrical Equipment', KEC: 'Electrical Equipment',
  KALPATPOWR: 'Electrical Equipment', APAR: 'Electrical Equipment',

  // ── Telecom ──
  BHARTIARTL: 'Telecom - Services', VODAFONEIDEA: 'Telecom - Services',
  TATACOMM: 'Telecom - Services', RAILTEL: 'Telecom - Services',
  STLTECH: 'Telecom - Equipment & Accessories',

  // ── Healthcare Services ──
  APOLLOHOSP: 'Healthcare Services', FORTIS: 'Healthcare Services',
  MAXHEALTH: 'Healthcare Services', NARAYANA: 'Healthcare Services',
  KIMS: 'Healthcare Services', NHPC: 'Healthcare Services',

  // ── Retailing ──
  DMART: 'Retailing', TRENT: 'Retailing', ABFRL: 'Retailing',
  ADITYA: 'Retailing', VMART: 'Retailing',

  // ── Media ──
  ZEEL: 'Media', PVRINOX: 'Entertainment', SUNTV: 'Media',
  DISHTV: 'Media', JAGRAN: 'Printing & Publication',

  // ── Fertilizers & Agrochemicals ──
  CHAMFERT: 'Fertilizers & Agrochemicals', COROMANDEL: 'Fertilizers & Agrochemicals',
  GNFC: 'Fertilizers & Agrochemicals', PI: 'Fertilizers & Agrochemicals',
  BAYER: 'Fertilizers & Agrochemicals', DHANUKA: 'Fertilizers & Agrochemicals',

  // ── Transport & Logistics ──
  CONCOR: 'Transport Services', BLUEDART: 'Transport Services',
  MAHLOG: 'Transport Services', GATI: 'Transport Services',
  IRCTC: 'Transport Infrastructure', NHAI: 'Transport Infrastructure',

  // ── Gas ──
  GAIL: 'Gas', PETRONET: 'Gas', IGL: 'Gas', MGL: 'Gas',
  GSPL: 'Gas', ATGL: 'Gas', GUJARATGAS: 'Gas',

  // ── Realty ──
  GODREJPROP: 'Realty', PHOENIXLTD: 'Realty', BRIGADE: 'Realty',
  MAHLIFE: 'Realty', SUNTECK: 'Realty',

  // ── Industrial Products ──
  CUMMINSIND: 'Industrial Products', ASTRAL: 'Industrial Products',
  SUPREME: 'Industrial Products', FINOLEX: 'Industrial Products',

  // ── Fintech ──
  PAYTM: 'Financial Technology (Fintech)', POLICYBZR: 'Financial Technology (Fintech)',
  NYKAA: 'Retailing',

  // ── Diversified Conglomerates ──
  ADANIENT: 'Diversified', LTIM: 'Diversified', TATAMOTORS: 'Automobiles',
  GMRINFRA: 'Transport Infrastructure', ADANIPORTS: 'Transport Infrastructure',
  
  // ── Leisure Services & Hospitality ──
  INDHOTEL: 'Leisure Services', EIHOTEL: 'Leisure Services', DEVYANI: 'Leisure Services',
  SAPPHIRE: 'Leisure Services', LEMONTREE: 'Leisure Services',
  
  // ── Retailing (Aggressive) ──
  DMART: 'Retailing', TRENT: 'Retailing', ABFRL: 'Retailing',
  NYKAA: 'Retailing', ZOMATO: 'Retailing',
  
  // ── Other ──
  RVNL: 'Transport Infrastructure', IRFC: 'Finance', IREDA: 'Finance',
  MAZDOCK: 'Aerospace & Defense', GARDREACH: 'Aerospace & Defense',
  DATAINFRA: 'Telecom - Services',
  
  // ── USER REQUESTED ──
  SONATSOFTW: 'IT - Software',
  TCI: 'Transport Services',
  SHYAMMETL: 'Ferrous Metals',
  JSWENERGY: 'Power',
};

function localLookupSector(ticker) {
  if (!ticker) return null;
  const raw = ticker.toUpperCase();
  const keyWithUnderscore = raw.replace(/[&-.\s]/g, '_');
  const keyUnified = raw.replace(/[^A-Z0-9]/g, '');
  return NSE_SECTOR_DB[raw] || NSE_SECTOR_DB[keyWithUnderscore] || NSE_SECTOR_DB[keyUnified] || null;
}

const ALL_SECTORS = [
  'Aerospace & Defense', 'Agricultural Food & other Products', 'Agricultural, Commercial & Construction Vehicles',
  'Auto Components', 'Automobiles', 'Banks', 'Beverages', 'Capital Markets', 'Cement & Cement Products',
  'Chemicals & Petrochemicals', 'Cigarettes & Tobacco Products', 'Commercial Services & Supplies', 'Construction',
  'Consumable Fuels', 'Consumer Durables', 'Diversified', 'Diversified FMCG', 'Diversified Metals',
  'Electrical Equipment', 'Engineering Services', 'Entertainment', 'Ferrous Metals', 'Fertilizers & Agrochemicals',
  'Finance', 'Financial Technology (Fintech)', 'Food Products', 'Gas', 'Healthcare Equipment & Supplies',
  'Healthcare Services', 'Household Products', 'Industrial Manufacturing', 'Industrial Products', 'Insurance',
  'IT - Hardware', 'IT - Services', 'IT - Software', 'Leisure Services', 'Media', 'Metals & Minerals Trading',
  'Minerals & Mining', 'Non - Ferrous Metals', 'Oil', 'Other Construction Materials', 'Other Consumer Services',
  'Other Utilities', 'Paper, Forest & Jute Products', 'Personal Products', 'Petroleum Products',
  'Pharmaceuticals & Biotechnology', 'Power', 'Printing & Publication', 'Realty', 'Retailing',
  'Telecom - Equipment & Accessories', 'Telecom - Services', 'Textiles & Apparels',
  'Transport Infrastructure', 'Transport Services', 'Uncategorized',
];

export default async function handler(req, res) {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'Symbol required' });

  const ticker = symbol.split('.')[0].toUpperCase();
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  try {
    const dbSector = localLookupSector(ticker);
    if (dbSector) {
      return res.status(200).json({ sector: dbSector, source: 'db' });
    }

    let sector = 'Unknown';
    try {
      const resp = await fetch(`https://www.screener.in/company/${ticker}/`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });

      if (resp.ok) {
        const html = await resp.text();
        const sectorMatch = html.match(/title="Sector">(.*?)<\/a>/i);
        const industryMatch = html.match(/title="Industry">(.*?)<\/a>/i);

        const candidates = [industryMatch?.[1], sectorMatch?.[1]].filter(Boolean);
        if (candidates.length > 0) {
          const normTarget = candidates[0].toLowerCase().replace(/[^a-z0-9]/g, '');
          const closest = ALL_SECTORS.find(s => {
            const normS = s.toLowerCase().replace(/[^a-z0-9]/g, '');
            return normTarget === normS || normS.includes(normTarget);
          });
          if (closest) sector = closest;
        }
      }
    } catch (e) {
      console.error('Scrape Fail:', e.message);
    }

    if (sector === 'Unknown') {
      const t = ticker.toUpperCase();
      if (t.includes('LT') || t.includes('LARSEN')) sector = 'Construction';
      if (t.includes('DIXON')) sector = 'Consumer Durables';
      if (t.includes('RELIANCE')) sector = 'Petroleum Products';
      if (t.includes('HDFC') || t.includes('SBI')) sector = 'Banks';
      if (t.includes('ZOMATO') || t.includes('NYKAA')) sector = 'Retailing';
      if (t.includes('SONATA') || t.includes('SONATSOFTW')) sector = 'IT - Software';
      if (t.includes('TCI')) sector = 'Transport Services';
      if (t.includes('SHYAM') || t.includes('METL')) sector = 'Ferrous Metals';
      if (t.includes('JSWENERGY') || t.includes('JSW')) sector = 'Power';
    }

    res.status(200).json({ sector });
  } catch (err) {
    res.status(500).json({ error: true, sector: 'Unknown' });
  }
}
