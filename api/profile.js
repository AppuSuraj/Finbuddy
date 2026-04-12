import { lookupSector } from './nse-sector-db.js';

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

  try {
    // ── LAYER 1: Instant DB Lookup (zero latency) ──
    const dbSector = lookupSector(ticker);
    if (dbSector) {
      return res.status(200).json({ sector: dbSector, source: 'db' });
    }

    // ── LAYER 2: Screener.in HTML Tag Extraction ──
    let sector = 'Unknown';
    try {
      const ctrl = new AbortController();
      const id = setTimeout(() => ctrl.abort(), 12000);
      const response = await fetch(`https://www.screener.in/company/${ticker}/`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: ctrl.signal,
      });
      clearTimeout(id);

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
          sectorMatch?.[1],
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
            // Broader keyword fallback on combined candidate text
            const allText = candidates.join(' ').toLowerCase();
            if (allText.includes('bank')) sector = 'Banks';
            else if (allText.includes('pharma') || allText.includes('biotech')) sector = 'Pharmaceuticals & Biotechnology';
            else if (allText.includes('software') || allText.includes('it service')) sector = 'IT - Software';
            else if (allText.includes('petroleum') || allText.includes('refin')) sector = 'Petroleum Products';
            else if (allText.includes('power') || allText.includes('energy')) sector = 'Power';
            else if (allText.includes('steel') || allText.includes('metal')) sector = 'Ferrous Metals';
            else if (allText.includes('automobile') || allText.includes('vehicle')) sector = 'Automobiles';
            else if (allText.includes('cement')) sector = 'Cement & Cement Products';
            else if (allText.includes('insurance')) sector = 'Insurance';
            else if (allText.includes('finance') || allText.includes('nbfc')) sector = 'Finance';
            else if (allText.includes('telecom')) sector = 'Telecom - Services';
            else if (allText.includes('realty') || allText.includes('real estate')) sector = 'Realty';
            else if (allText.includes('chemical')) sector = 'Chemicals & Petrochemicals';
            else if (allText.includes('fmcg') || allText.includes('consumer goods')) sector = 'Diversified FMCG';
            else sector = candidates[0]; // Use raw Screener value as last resort
          }
        }
      }
    } catch (e) {
      console.error('Screener Scrape Error:', e.message);
    }

    res.status(200).json({ sector });
  } catch (err) {
    res.status(500).json({ error: true, sector: 'Unknown' });
  }
}
