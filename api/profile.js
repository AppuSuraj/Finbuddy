

const ALL_SECTORS = [
  'Aerospace & Defense', 'Agricultural Food & other Products', 'Agricultural, Commercial & Construction Vehicles', 'Auto Components', 'Automobiles', 'Banks', 'Beverages', 'Capital Markets', 'Cement & Cement Products', 'Chemicals & Petrochemicals', 'Cigarettes & Tobacco Products', 'Commercial Services & Supplies', 'Construction', 'Consumable Fuels', 'Consumer Durables', 'Diversified', 'Diversified FMCG', 'Diversified Metals', 'Electrical Equipment', 'Engineering Services', 'Entertainment', 'Ferrous Metals', 'Fertilizers & Agrochemicals', 'Finance', 'Financial Technology (Fintech)', 'Food Products', 'Gas', 'Healthcare Equipment & Supplies', 'Healthcare Services', 'Household Products', 'Industrial Manufacturing', 'Industrial Products', 'Insurance', 'IT - Hardware', 'IT - Services', 'IT - Software', 'Leisure Services', 'Media', 'Metals & Minerals Trading', 'Minerals & Mining', 'Non - Ferrous Metals', 'Oil', 'Other Construction Materials', 'Other Consumer Services', 'Other Utilities', 'Paper, Forest & Jute Products', 'Personal Products', 'Petroleum Products', 'Pharmaceuticals & Biotechnology', 'Power', 'Printing & Publication', 'Realty', 'Retailing', 'Telecom - Equipment & Accessories', 'Telecom - Services', 'Textiles & Apparels', 'Transport Infrastructure', 'Transport Services', 'Uncategorized'
];

const SECTOR_MAPPING = {
  'Banks': ['bank', 'hdfc', 'icici', 'sbi', 'axis', 'kotak', 'idfc'],
  'IT - Software': ['software', 'tcs', 'infosys', 'wipro', 'hcl', 'tech mahindra', 'mindtree'],
  'Automobiles': ['tata motors', 'maruti', 'mahindra', 'ashok leyland', 'eicher', 'bajaj auto'],
  'Petroleum Products': ['reliance', 'ongc', 'bpcl', 'hpcl', 'iocl', 'refinery'],
  'Aerospace & Defense': ['hal', 'bharat elect', 'mazagon', 'cochin shipyard', 'defence'],
  'Construction': ['larsen', 'l&t', 'dlf', 'macrotech', 'godrej prop', 'prestige'],
  'Pharmaceuticals & Biotechnology': ['sun pharma', 'dr reddy', 'cipla', 'divi', 'lupin', 'biocon'],
  'Finance': ['bajaj finance', 'chola', 'muthoot', 'shriram', 'invest'],
  'Power': ['ntpc', 'adani power', 'tata power', 'power grid', 'jsw energy'],
  'Metals & Minerals Trading': ['coal india', 'vedanta', 'hindalco', 'jsw steel', 'tata steel']
};

export default async function handler(req, res) {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'Symbol required' });

  try {
    let sector = 'Unknown';
    
    // 1. Yahoo Finance Profile Fetch
    try {
      const yfUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=assetProfile`;
      const yfRes = await fetch(yfUrl);
      const yfData = await yfRes.json();
      const profile = yfData.quoteSummary?.result?.[0]?.assetProfile;
      
      if (profile?.sector) {
         sector = profile.sector;
         // Keyword match for standard Indian sectors
         const searchStr = (profile.sector + ' ' + (profile.industry || '') + ' ' + symbol).toLowerCase();
         for (const [sec, keywords] of Object.entries(SECTOR_MAPPING)) {
            if (keywords.some(k => searchStr.includes(k.toLowerCase()))) {
               sector = sec;
               break;
            }
         }
      }
    } catch (e) {
      console.error("Yahoo Profile Error:", e.message);
    }

    // 2. Screener.in Deep Research Fallback
    if (sector === 'Unknown' || sector === 'Uncategorized') {
       try {
          const cleanTicker = symbol.split('.')[0];
          const screenerUrl = `https://www.screener.in/company/${cleanTicker}/`;
          const response = await fetch(screenerUrl, {
             headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
             timeout: 12000
          });
          
          if (response.ok) {
             const html = await response.text();
             const broadSectorMatch = html.match(/title="Broad Sector">(.*?)<\/a>/i);
             const sectorMatch = html.match(/title="Sector">(.*?)<\/a>/i);
             const broadIndustryMatch = html.match(/title="Broad Industry">(.*?)<\/a>/i);
             const industryMatch = html.match(/title="Industry">(.*?)<\/a>/i);
             
             const candidates = [
               broadIndustryMatch?.[1],
               broadSectorMatch?.[1],
               industryMatch?.[1],
               sectorMatch?.[1]
             ].filter(Boolean).map(s => s.trim().replace(/&amp;/g, '&'));

             if (candidates.length > 0) {
                let found = false;
                for (const candidate of candidates) {
                   const normTarget = candidate.toLowerCase().replace(/[^a-z0-9]/g, '');
                   const closest = ALL_SECTORS.find(s => {
                      const normS = s.toLowerCase().replace(/[^a-z0-9]/g, '');
                      return normTarget === normS || normTarget.includes(normS) || normS.includes(normTarget);
                   });
                   if (closest) { sector = closest; found = true; break; }
                }

                if (!found) {
                   const allText = candidates.join(' ').toLowerCase();
                   if (allText.includes('bank')) sector = 'Banks';
                   else if (allText.includes('petroleum') || allText.includes('refiner') || allText.includes('marketing')) sector = 'Petroleum Products';
                   else if (allText.includes('it-') || allText.includes('software')) sector = 'IT - Software';
                   else if (allText.includes('energy') || allText.includes('power')) sector = 'Power';
                   else if (allText.includes('finance') || allText.includes('invest')) sector = 'Finance';
                   else sector = candidates[0];
                }
             }
          }
       } catch (e) {
          console.error("Screener Scrape Error:", e.message);
       }
    }

    res.status(200).json({ sector });
  } catch (err) {
    res.status(500).json({ error: true, sector: 'Unknown' });
  }
}
