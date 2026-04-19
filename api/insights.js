import Parser from 'rss-parser';
import Sentiment from 'sentiment';

const parser = new Parser({ timeout: 7000 });
const sentimentAnalyzer = new Sentiment();

function deepScore(text) {
  const base = sentimentAnalyzer.analyze(text);
  let score = base.score;
  const t = text.toLowerCase();
  if (t.includes('crash') || t.includes('collapse') || t.includes('fraud') || t.includes('default')) score -= 5;
  if (t.includes('plunge') || t.includes('tumble') || t.includes('probe') || t.includes('sebi')) score -= 4;
  if (t.includes('downgrade') || t.includes('bearish') || t.includes('sell-off') || t.includes('miss')) score -= 3;
  if (t.includes('soar') || t.includes('surge') || t.includes('rally') || t.includes('all-time high')) score += 4;
  if (t.includes('upgrade') || t.includes('bullish') || t.includes('breakout') || t.includes('record')) score += 3;
  if (t.includes('dividend') || t.includes('buyback') || t.includes('beat') || t.includes('order win')) score += 3;
  return score;
}

// ── SURGICAL SCRAPER FOR INDIAN STOCK FUNDAMENTALS ──
async function fetchScreenerFundamentals(ticker) {
  try {
    const cleanTicker = ticker.split('.')[0].replace(/[^A-Za-z0-9]/g, '');
    const url = `https://www.screener.in/company/${cleanTicker}/`;
    
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36' },
      signal: ctrl.signal
    });
    clearTimeout(id);
    if (!r.ok) return null;
    
    const html = await r.text();
    
    // Surgical extraction: Look for the specific <li> structure in the core metrics table
    // This prevents matching meta tags or 'Pros/Cons' text
    const surgicalExtract = (label) => {
      // Structure: <span class="name">Label</span> <span class="value"> <span class="number">Value</span>
      const regex = new RegExp(`<span[^>]*class="name"[^>]*>\\s*${label}\\s*<\\/span>\\s*<span[^>]*class="nowrap value"[^>]*>(?:[^<]*|<span[^>]*>)*?<span[^>]*class="number"[^>]*>([^<]+)<\\/span>`, 'i');
      const match = html.match(regex);
      if (!match) return null;
      return match[1].replace(/,/g, '').trim();
    };

    return {
      marketCap: surgicalExtract('Market Cap') ? Math.round(parseFloat(surgicalExtract('Market Cap'))) : null,
      pe: surgicalExtract('Stock P/E') ? parseFloat(surgicalExtract('Stock P/E')) : null,
      dividendYield: surgicalExtract('Dividend Yield') ? parseFloat(surgicalExtract('Dividend Yield')) : null,
      roce: surgicalExtract('ROCE') ? parseFloat(surgicalExtract('ROCE')) : null,
      roe: surgicalExtract('ROE') ? parseFloat(surgicalExtract('ROE')) : null,
      bookValue: surgicalExtract('Book Value') ? parseFloat(surgicalExtract('Book Value')) : null,
      faceValue: surgicalExtract('Face Value') ? parseFloat(surgicalExtract('Face Value')) : null,
      dataSource: 'Institutional Screener (Fallback)'
    };
  } catch (e) {
    console.error('[INSTITUTIONAL] Screener Scrape Error:', e.message);
    return null;
  }
}

// Yahoo Finance v7 quote — uses improved headers and fallback
async function fetchYahooFundamentals(symbol) {
  const fields = [
    'regularMarketPrice', 'marketCap', 'trailingPE', 'forwardPE',
    'priceToBook', 'dividendYield', 'bookValue', 'epsTrailingTwelveMonths',
    'fiftyTwoWeekHigh', 'fiftyTwoWeekLow', 'longName', 'shortName',
    'returnOnEquity', 'returnOnAssets', 'debtToEquity',
  ].join(',');

  const endpoints = [
    `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}&fields=${fields}`,
    `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${symbol}&fields=${fields}`,
  ];

  for (const url of endpoints) {
    try {
      const ctrl = new AbortController();
      const id = setTimeout(() => ctrl.abort(), 6000);
      const r = await fetch(url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Referer': 'https://finance.yahoo.com/',
          'Origin': 'https://finance.yahoo.com'
        },
        signal: ctrl.signal,
      });
      clearTimeout(id);
      if (!r.ok) continue;
      const data = await r.json();
      const q = data?.quoteResponse?.result?.[0];
      if (!q) continue;
      return {
        currentPrice: q.regularMarketPrice,
        marketCap: q.marketCap ? Math.round(q.marketCap / 10000000) : null, // Convert to Cr
        pe: q.trailingPE ? Math.round(q.trailingPE * 10) / 10 : null,
        bookValue: q.bookValue ? Math.round(q.bookValue * 100) / 100 : null,
        dividendYield: q.dividendYield ? Math.round(q.dividendYield * 1000) / 10 : null, // As percentage
        roe: q.returnOnEquity ? Math.round(q.returnOnEquity * 1000) / 10 : null,
        roce: q.returnOnAssets ? Math.round(q.returnOnAssets * 1000) / 10 : null,
        high52w: q.fiftyTwoWeekHigh,
        low52w: q.fiftyTwoWeekLow,
        longName: q.longName || q.shortName,
        faceValue: null,
        dataSource: 'Yahoo Finance',
      };
    } catch (e) { /* try next endpoint */ }
  }
  return null;
}

// Yahoo Finance v10 chart
async function fetchYahooPrice(symbol) {
  const tryFetch = async (domain) => {
    try {
      const r = await fetch(
        `https://${domain}/v10/finance/chart/${symbol}?range=1d&interval=1d`,
        { headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Referer': 'https://finance.yahoo.com/'
          } 
        }
      );
      if (!r.ok) return null;
      const d = await r.json();
      const meta = d?.chart?.result?.[0]?.meta;
      if (!meta?.regularMarketPrice) return null;
      return { 
        currentPrice: meta.regularMarketPrice, 
        high52w: meta.fiftyTwoWeekHigh, 
        low52w: meta.fiftyTwoWeekLow, 
        longName: meta.longName || meta.shortName 
      };
    } catch (e) { return null; }
  };

  return (await tryFetch('query1.finance.yahoo.com')) || (await tryFetch('query2.finance.yahoo.com'));
}

async function fetchFeed(url) {
  try { return await parser.parseURL(url); } catch (e) { return null; }
}

export default async function handler(req, res) {
  const { symbol, name } = req.query;
  if (!symbol) return res.status(400).json({ error: 'Symbol required' });

  const ticker = symbol.toUpperCase();
  const isIndian = ticker.endsWith('.NS') || ticker.endsWith('.BO') || ticker.length < 8;
  const yahooSymbol = (ticker.includes('.') || ticker.length > 10) ? ticker : `${ticker}.NS`;
  const rawName = name ? decodeURIComponent(name).split('(')[0].trim() : ticker.split('.')[0];

  res.setHeader('Cache-Control', 'no-store, max-age=0');

  // Parallel fetch from Yahoo and Screener
  const [yahooFundamentals, priceData, screenerData] = await Promise.all([
    fetchYahooFundamentals(yahooSymbol),
    fetchYahooPrice(yahooSymbol),
    isIndian ? fetchScreenerFundamentals(yahooSymbol) : Promise.resolve(null)
  ]);

  const companyFullName = yahooFundamentals?.longName || priceData?.longName || rawName;

  // Selective Data Merging: Market Cap and P/E are prioritized from Yahoo, but fell back to Screener
  const profile = {
    currentPrice: yahooFundamentals?.currentPrice || priceData?.currentPrice,
    high52w: yahooFundamentals?.high52w || priceData?.high52w,
    low52w: yahooFundamentals?.low52w || priceData?.low52w,
    marketCap: yahooFundamentals?.marketCap || screenerData?.marketCap,
    pe: yahooFundamentals?.pe || screenerData?.pe,
    bookValue: yahooFundamentals?.bookValue || screenerData?.bookValue,
    dividendYield: yahooFundamentals?.dividendYield || screenerData?.dividendYield,
    roe: yahooFundamentals?.roe || screenerData?.roe,
    roce: yahooFundamentals?.roce || screenerData?.roce,
    faceValue: screenerData?.faceValue,
    companyName: companyFullName,
    dataSource: yahooFundamentals ? 'Yahoo Finance' : screenerData ? 'Institutional Screener' : priceData ? 'Yahoo Finance (price only)' : null,
  };

  // News Search
  const searchName = companyFullName.replace(/Ltd\.?|Limited|Corp\.?|Corporation/gi, '').split(' ').slice(0, 3).join(' ').trim();
  const querySuffix = isIndian && searchName.length < 15 ? ' stock news' : ' news';

  const [googleFeed, recentFeed, etFeed] = await Promise.all([
    fetchFeed(`https://news.google.com/rss/search?q=${encodeURIComponent(`"${searchName}"${querySuffix}`)}&hl=en-IN&gl=IN&ceid=IN:en`),
    fetchFeed(`https://news.google.com/rss/search?q=${encodeURIComponent(searchName)}&hl=en-IN&gl=IN&ceid=IN:en`),
    fetchFeed(`https://economictimes.indiatimes.com/rsssearchresult.cms?query=${encodeURIComponent(searchName)}`),
  ]);

  const seen = new Set();
  const news = [];

  const processItems = (items = [], sourceName) => {
    (items || []).slice(0, 12).forEach(item => {
      let title = item.title || '';
      let publisher = sourceName;
      if (title.includes(' - ')) {
        const parts = title.split(' - ');
        const last = parts[parts.length - 1];
        if (last.length < 50) { publisher = parts.pop(); title = parts.join(' - '); }
      }
      title = title.trim();
      const titleSig = title.slice(0, 45).toLowerCase();
      if (!title || seen.has(titleSig)) return;
      seen.add(titleSig);

      const fullText = title + ' ' + (item.contentSnippet || '');
      const score = deepScore(fullText);
      const grade = score > 1 ? 'Positive' : score < -1 ? 'Negative' : 'Neutral';
      const publishTime = item.isoDate || item.pubDate || new Date().toISOString();
      
      news.push({
        title, link: item.link || item.guid, publisher,
        providerPublishTime: publishTime,
        sentimentGrade: grade, deepSentimentGrade: grade,
        contentSnippet: item.contentSnippet || 'Comprehensive financial update available.',
        baseScore: score, deepScore: score,
      });
    });
  };

  processItems(googleFeed?.items, 'Google News');
  processItems(recentFeed?.items, 'Market Intelligence');
  processItems(etFeed?.items, 'Economic Times');

  const sortedNews = news.sort((a, b) => new Date(b.providerPublishTime) - new Date(a.providerPublishTime));

  res.status(200).json({ profile, news: sortedNews.slice(0, 10) });
}
