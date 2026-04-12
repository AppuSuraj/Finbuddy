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

// Extract a value from Screener.in HTML using the label text
// Screener structure: <span class="name">Market Cap</span> ... <span>12,345</span> Cr.
function extractScreenerVal(html, label) {
  // Escape regex special chars in label
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Primary: label in .name span followed by number-format value span
  const patterns = [
    // >Label</span ...<span ...><span>123</span>
    new RegExp(`>${escaped}<\\/span[\\s\\S]{0,200}?<span[^>]*>([\\d,\\.]+)<\\/span>`, 'i'),
    // Label anywhere followed by a <span> with digits within 300 chars
    new RegExp(`${escaped}[\\s\\S]{0,300}?<span[^>]*class="[^"]*number[^"]*"[^>]*>[^<]*<span>([\\d,\\.]+)`, 'i'),
    // Fallback: label then within 200 chars a standalone number in span
    new RegExp(`${escaped}[^<]{0,200}<span>([\\d,\\.]+)<\\/span>`, 'i'),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) {
      const n = parseFloat(m[1].replace(/,/g, ''));
      if (!isNaN(n)) return n;
    }
  }
  return null;
}

async function scrapeScreener(ticker) {
  const urls = [
    `https://www.screener.in/company/${ticker}/consolidated/`,
    `https://www.screener.in/company/${ticker}/`,
  ];

  for (const url of urls) {
    try {
      const ctrl = new AbortController();
      const id = setTimeout(() => ctrl.abort(), 9000);
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Referer': 'https://www.screener.in/',
        },
        signal: ctrl.signal,
      });
      clearTimeout(id);
      if (!res.ok) continue;
      const html = await res.text();

      // Check if we got a valid company page (not a 404/redirect)
      if (!html.includes('top-ratios') && !html.includes('company-ratios')) continue;

      // Extract company name from <h1> or title
      const nameMatch = html.match(/<h1[^>]*>\s*([^<\n]+)/i) || html.match(/<title>([^|<]+)/i);
      const companyName = nameMatch?.[1]?.trim()?.split('|')[0]?.trim() || ticker;

      // Extract 52W High / Low — Screener shows "High / Low" label
      let high52w = null, low52w = null;
      const hiloMatch = html.match(/High\s*\/\s*Low[\s\S]{0,300}?<span>\s*([\d,\.]+)\s*<\/span>\s*\/\s*<span>\s*([\d,\.]+)\s*<\/span>/i);
      if (hiloMatch) {
        high52w = parseFloat(hiloMatch[1].replace(/,/g, ''));
        low52w = parseFloat(hiloMatch[2].replace(/,/g, ''));
      }

      // Market Cap — Screener shows in Cr already
      const marketCap = extractScreenerVal(html, 'Market Cap');

      // Current Price
      const currentPriceMatch = html.match(/Current Price[\s\S]{0,200}?<span>\s*([\d,\.]+)/i);
      const currentPrice = currentPriceMatch ? parseFloat(currentPriceMatch[1].replace(/,/g, '')) : null;

      // P/E — "Stock P/E" label
      const pe = extractScreenerVal(html, 'Stock P\\/E') || extractScreenerVal(html, 'P\\/E');

      // Book Value
      const bookValue = extractScreenerVal(html, 'Book Value');

      // Dividend Yield
      const divYieldMatch = html.match(/Dividend Yield[\s\S]{0,200}?<span>\s*([\d,\.]+)/i);
      const dividendYield = divYieldMatch ? parseFloat(divYieldMatch[1].replace(/,/g, '')) : null;

      // ROCE
      const roceMatch = html.match(/ROCE[\s\S]{0,200}?<span>\s*([\d,\.]+)/i);
      const roce = roceMatch ? parseFloat(roceMatch[1].replace(/,/g, '')) : null;

      // ROE
      const roeMatch = html.match(/ROE[\s\S]{0,200}?<span>\s*([\d,\.]+)/i);
      const roe = roeMatch ? parseFloat(roeMatch[1].replace(/,/g, '')) : null;

      // Face Value
      const fvMatch = html.match(/Face Value[\s\S]{0,200}?<span>\s*([\d,\.]+)/i);
      const faceValue = fvMatch ? parseFloat(fvMatch[1].replace(/,/g, '')) : null;

      if (marketCap || pe || roe || roce) {
        return { companyName, marketCap, currentPrice, high52w, low52w, pe, bookValue, dividendYield, roce, roe, faceValue };
      }
    } catch (e) {
      // Try next URL
    }
  }
  return null;
}

async function fetchYahooPrice(symbol) {
  try {
    const r = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1d`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    if (!r.ok) return null;
    const d = await r.json();
    const meta = d?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return null;
    return {
      currentPrice: meta.regularMarketPrice,
      high52w: meta.fiftyTwoWeekHigh,
      low52w: meta.fiftyTwoWeekLow,
      longName: meta.longName || meta.shortName,
    };
  } catch (e) { return null; }
}

async function fetchFeed(url) {
  try { return await parser.parseURL(url); } catch (e) { return null; }
}

export default async function handler(req, res) {
  const { symbol, name, sector } = req.query;
  if (!symbol) return res.status(400).json({ error: 'Symbol required' });

  const ticker = symbol.split('.')[0].toUpperCase();
  const rawName = name ? decodeURIComponent(name).split('(')[0].trim() : ticker;

  const [screenerData, yahooPrice] = await Promise.all([
    scrapeScreener(ticker),
    fetchYahooPrice(symbol),
  ]);

  const companyFullName = screenerData?.companyName || yahooPrice?.longName || rawName;
  const currentPrice = yahooPrice?.currentPrice || screenerData?.currentPrice;
  const high52w = yahooPrice?.high52w || screenerData?.high52w;
  const low52w = yahooPrice?.low52w || screenerData?.low52w;

  const profile = {
    currentPrice,
    high52w,
    low52w,
    marketCap: screenerData?.marketCap,
    pe: screenerData?.pe,
    bookValue: screenerData?.bookValue,
    dividendYield: screenerData?.dividendYield,
    roce: screenerData?.roce,
    roe: screenerData?.roe,
    faceValue: screenerData?.faceValue,
    companyName: companyFullName,
    dataSource: screenerData && (screenerData.marketCap || screenerData.pe) ? 'Screener.in' : yahooPrice ? 'Yahoo Finance' : null,
  };

  // Fetch news from 3 Indian sources in parallel
  const searchName = companyFullName.split(' ').slice(0, 3).join(' ');
  const [googleFeed, earningsFeed, etFeed] = await Promise.all([
    fetchFeed(`https://news.google.com/rss/search?q=${encodeURIComponent(`"${searchName}" NSE stock`)}&hl=en-IN&gl=IN&ceid=IN:en`),
    fetchFeed(`https://news.google.com/rss/search?q=${encodeURIComponent(`"${searchName}" results earnings quarterly`)}&hl=en-IN&gl=IN&ceid=IN:en`),
    fetchFeed(`https://economictimes.indiatimes.com/rsssearchresult.cms?query=${encodeURIComponent(searchName)}`),
  ]);

  const seen = new Set();
  const news = [];

  const processItems = (items = [], sourceName) => {
    items.slice(0, 4).forEach(item => {
      let title = item.title || '';
      let publisher = sourceName;
      if (title.includes(' - ')) {
        const parts = title.split(' - ');
        const last = parts[parts.length - 1];
        if (last.length < 50) { publisher = parts.pop(); title = parts.join(' - '); }
      }
      title = title.trim();
      if (!title || seen.has(title.slice(0, 40))) return;
      seen.add(title.slice(0, 40));
      const fullText = title + ' ' + (item.contentSnippet || item.summary || '');
      const score = deepScore(fullText);
      const grade = score > 1 ? 'Positive' : score < -1 ? 'Negative' : 'Neutral';
      news.push({
        title, link: item.link || item.guid, publisher,
        providerPublishTime: item.isoDate || item.pubDate,
        sentimentGrade: grade, deepSentimentGrade: grade,
        contentSnippet: item.contentSnippet || item.summary || 'Read the full article.',
        baseScore: score, deepScore: score,
      });
    });
  };

  processItems(googleFeed?.items, 'Google News');
  processItems(earningsFeed?.items, 'Earnings News');
  processItems(etFeed?.items, 'Economic Times');

  res.status(200).json({ profile, news: news.slice(0, 8) });
}
