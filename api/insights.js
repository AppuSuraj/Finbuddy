import Parser from 'rss-parser';
import Sentiment from 'sentiment';

const parser = new Parser({ timeout: 7000 });
const sentimentAnalyzer = new Sentiment();

const TRUSTED_FINANCIAL_SOURCES = [
  'economic times', 'moneycontrol', 'livemint', 'mint', 'financial express', 
  'business standard', 'ndtv profit', 'cnbc', 'bloomberg', 'reuters', 
  'business today', 'the hindu business line', 'money control', 'zee business'
];

const TICKER_EXCLUSIONS = {
  'LT': ['foods', 'governor', 'governer', 'lt gen', 'lieutenant', 'fairfax'],
  'SAFARI': ['dua lipa', 'wildlife', 'park', 'trip', 'tourist', 'booking', 'review']
};

function deepScore(text) {
  const base = sentimentAnalyzer.analyze(text);
  let score = base.score;
  const t = text.toLowerCase();
  if (t.includes('crash') || t.includes('collapse') || t.includes('fraud') || t.includes('default')) score -= 5;
  if (t.includes('plunge') || t.includes('tumble') || t.includes('probe') || t.includes('sebi')) score -= 4;
  if (t.includes('soar') || t.includes('surge') || t.includes('rally') || t.includes('all-time high')) score += 4;
  if (t.includes('dividend') || t.includes('buyback') || t.includes('beat') || t.includes('order win')) score += 3;
  return score;
}

// ── SURGICAL SCRAPER FOR INDIAN STOCK FUNDAMENTALS ──
async function fetchScreenerFundamentals(ticker) {
  try {
    const cleanTicker = ticker.split('.')[0].replace(/[^A-Za-z0-9]/g, '');
    const url = `https://www.screener.in/company/${cleanTicker}/`;
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36' }
    });
    if (!r.ok) return null;
    const html = await r.text();
    
    const surgicalExtract = (label) => {
      const regex = new RegExp(`<span[^>]*class="name"[^>]*>\\s*${label}\\s*<\\/span>\\s*<span[^>]*class="nowrap value"[^>]*>(?:[^<]*|<span[^>]*>)*?<span[^>]*class="number"[^>]*>([^<]+)<\\/span>`, 'i');
      const match = html.match(regex);
      return match ? match[1].replace(/,/g, '').trim() : null;
    };

    const hlRegex = /High \/ Low[\s\S]*?class="number">([^<]+)<\/span>\s*\/\s*<span[^>]*class="number">([^<]+)<\/span>/i;
    const hl = html.match(hlRegex);

    return {
      currentPrice: surgicalExtract('Current Price') ? parseFloat(surgicalExtract('Current Price')) : null,
      high52w: hl ? parseFloat(hl[1].replace(/,/g, '')) : null,
      low52w: hl ? parseFloat(hl[2].replace(/,/g, '')) : null,
      marketCap: surgicalExtract('Market Cap') ? Math.round(parseFloat(surgicalExtract('Market Cap'))) : null,
      pe: surgicalExtract('Stock P/E') ? parseFloat(surgicalExtract('Stock P/E')) : null,
      dividendYield: surgicalExtract('Dividend Yield') ? parseFloat(surgicalExtract('Dividend Yield')) : null,
      roce: surgicalExtract('ROCE') ? parseFloat(surgicalExtract('ROCE')) : null,
      roe: surgicalExtract('ROE') ? parseFloat(surgicalExtract('ROE')) : null,
      bookValue: surgicalExtract('Book Value') ? parseFloat(surgicalExtract('Book Value')) : null,
      dataSource: 'Institutional Screener (Fallback)'
    };
  } catch { return null; }
}

async function fetchYahooPrice(symbol) {
  try {
    const r = await fetch(`https://query1.finance.yahoo.com/v10/finance/chart/${symbol}?range=1d&interval=1d`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36' }
    });
    if (!r.ok) return null;
    const d = await r.json();
    const meta = d?.chart?.result?.[0]?.meta;
    return meta ? { currentPrice: meta.regularMarketPrice, high52w: meta.fiftyTwoWeekHigh, low52w: meta.fiftyTwoWeekLow, longName: meta.longName || meta.shortName } : null;
  } catch { return null; }
}

async function fetchFeed(url) {
  try { return await parser.parseURL(url); } catch { return null; }
}

export default async function handler(req, res) {
  const { symbol, name } = req.query;
  if (!symbol) return res.status(400).json({ error: 'Symbol required' });

  const ticker = symbol.toUpperCase().split('.')[0];
  const yahooSymbol = ticker.length < 10 ? `${ticker}.NS` : ticker;
  const decodedName = name ? decodeURIComponent(name).split('(')[0].trim() : ticker;

  res.setHeader('Cache-Control', 'no-store, max-age=0');
  const [priceData, screenerData] = await Promise.all([
    fetchYahooPrice(yahooSymbol),
    fetchScreenerFundamentals(yahooSymbol)
  ]);

  const profile = {
    currentPrice: priceData?.currentPrice || screenerData?.currentPrice,
    marketCap: screenerData?.marketCap,
    pe: screenerData?.pe,
    bookValue: screenerData?.bookValue,
    dividendYield: screenerData?.dividendYield,
    roe: screenerData?.roe,
    roce: screenerData?.roce,
    companyName: priceData?.longName || decodedName,
    dataSource: screenerData ? 'Institutional Screener' : 'Yahoo Finance',
  };

  // ── PURE BUSINESS NEWS ENGINE ──
  const searchName = profile.companyName.replace(/Ltd\.?|Limited|Corp\.?|Corporation/gi, '').trim();
  const exclusions = TICKER_EXCLUSIONS[ticker] || [];
  
  // High-precision search query: Name + Financial Domain Lock
  const financialSites = [
    'site:economictimes.indiatimes.com', 'site:moneycontrol.com', 'site:livemint.com', 
    'site:financialexpress.com', 'site:business-standard.com', 'site:ndtv.com/profit', 
    'site:businesstoday.in', 'site:thehindubusinessline.com', 'site:reuters.com', 'site:bloomberg.com'
  ].join(' OR ');
  
  const queryPrefix = ticker === 'LT' ? `"Larsen & Toubro" OR "L&T"` : `"${searchName}"`;
  const mainQuery = `(${queryPrefix}) (${financialSites})`;
  
  const [newsFeed, etFeed] = await Promise.all([
    fetchFeed(`https://news.google.com/rss/search?q=${encodeURIComponent(mainQuery)}&hl=en-IN&gl=IN&ceid=IN:en`),
    fetchFeed(`https://economictimes.indiatimes.com/rsssearchresult.cms?query=${encodeURIComponent(searchName + ' stock')}`)
  ]);

  const seen = new Set();
  const news = [];

  const processItems = (items = [], baseSource) => {
    (items || []).forEach(item => {
      const title = item.title || '';
      const lowerTitle = title.toLowerCase();
      const content = (item.contentSnippet || '').toLowerCase();
      const publisher = (item.source || baseSource || '').toLowerCase();

      // 1. DEDUPLICATION
      const sig = lowerTitle.slice(0, 40).replace(/[^a-z]/g, '');
      if (seen.has(sig)) return;

      // 2. SOURCE VALIDATION (WHITELIST)
      const isTrusted = TRUSTED_FINANCIAL_SOURCES.some(s => publisher.includes(s) || title.toLowerCase().includes(s));
      if (!isTrusted) return;

      // 3. NOISE EXCLUSION
      if (exclusions.some(exc => lowerTitle.includes(exc) || content.includes(exc))) return;

      // 4. SMART RELEVANCY Check: Title must contain core words
      const coreWords = searchName.toLowerCase().split(' ').filter(w => w.length > 2);
      const matchesCore = coreWords.some(w => lowerTitle.includes(w)) || (ticker.length > 1 && lowerTitle.includes(ticker.toLowerCase()));
      if (!matchesCore) return;

      seen.add(sig);
      const score = deepScore(lowerTitle + ' ' + content);
      news.push({
        title: title.split(' - ')[0].trim(),
        link: item.link,
        publisher: item.source || baseSource,
        providerPublishTime: item.isoDate || item.pubDate,
        sentimentGrade: score > 1 ? 'Positive' : score < -1 ? 'Negative' : 'Neutral',
        contentSnippet: item.contentSnippet || 'Financial overview available.',
        deepScore: score
      });
    });
  };

  processItems(newsFeed?.items, 'Google Business');
  processItems(etFeed?.items, 'Economic Times');

  const sortedNews = news.sort((a, b) => new Date(b.providerPublishTime) - new Date(a.providerPublishTime));
  res.status(200).json({ profile, news: sortedNews.slice(0, 10) });
}
