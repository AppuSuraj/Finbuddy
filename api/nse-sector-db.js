// NSE Sector Database — 300+ most-held Indian stocks
// Zero-latency lookup: check this before any API calls
// Format: 'NSE_TICKER': 'Finbuddy Sector Label'

export const NSE_SECTOR_DB = {
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
  
  // ── Retailing ──
  DMART: 'Retailing', TRENT: 'Retailing', ABFRL: 'Retailing',
  NYKAA: 'Retailing', ZOMATO: 'Retailing',
  
  // ── Other ──
  RVNL: 'Transport Infrastructure', IRFC: 'Finance', IREDA: 'Finance',
  MAZDOCK: 'Aerospace & Defense', GARDREACH: 'Aerospace & Defense',
  DATAINFRA: 'Telecom - Services',
};

// Normalized lookup: handles case, spaces, dashes, underscores
export function lookupSector(ticker) {
  if (!ticker) return null;
  const raw = ticker.toUpperCase();
  // Try exact match, then replace special chars with underscores, then remove them entirely
  const keyWithUnderscore = raw.replace(/[&-.\s]/g, '_');
  const keyUnified = raw.replace(/[^A-Z0-9]/g, '');
  
  return NSE_SECTOR_DB[raw] || 
         NSE_SECTOR_DB[keyWithUnderscore] || 
         NSE_SECTOR_DB[keyUnified] || 
         null;
}
