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

// Robust number extractor from Screener.in text
function extractNum(html, label) {
  // Matches patterns like: <td>Market Cap</td><td>12,345.67</td> or variations
  const re = new RegExp(`${label}[^<]*</[^>]+>[^<]*<[^>]+>\\s*([\\d,\\.]+)`, 'i');
  const m = html.match(re);
  if (m) return parseFloat(m[1].replace(/,/g, ''));
  return null;
}

// Fetch Screener.in page and extract all fundamentals
async function scrapeScreener(ticker) {
  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), 8000);

    const res = await fetch(`https://www.screener.in/company/${ticker}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
      signal: ctrl.signal,
    });
    clearTimeout(id);

    if (!res.ok) return null;
    const html = await res.text();

    // Extract company name
    const nameMatch = html.match(/<h1[^>]*class="[^"]*h2[^"]*"[^>]*>\s*([^<]+)/i) ||
      html.match(/<title>([^|<]+)/i);
    const companyName = nameMatch?.[1]?.trim().split('|')[0].trim() || ticker;

    // Screener.in shows numbers in the #top-ratios section
    // Regex patterns for Screener's specific layout
    const getVal = (label) => {
      const patterns = [
        new RegExp(`>${label}<\\/span>[^<]*<span[^>]*>\\s*([\\d,\\.]+)`, 'i'),
        new RegExp(`li[^>]*>\\s*<span[^>]*>[^<]*${label}[^<]*<\\/span>[^<]*<span[^>]*>\\s*([\\d,\\.]+)`, 'i'),
        new RegExp(`${label}[^<]{0,80}<span[^>]*>\\s*([\\d,\\.]+)`, 'i'),
      ];
      for (const re of patterns) {
        const m = html.match(re);
        if (m) return parseFloat(m[1].replace(/,/g, ''));
      }
      return null;
    };

    // Extract 52W High and Low from Screener
    const hiLoMatch = html.match(/52-week High\s*<\/span>[^<]*<span[^>]*>\s*([\d,\.]+)/i) ||
      html.match(/High\s*\/\s*Low[^<]*<\/span>[^<]*<span[^>]*>\s*([\d,\.]+)\s*\/\s*([\d,\.]+)/i);
    let high52w = null, low52w = null;
    if (hiLoMatch) {
      high52w = parseFloat(hiLoMatch[1]?.replace(/,/g, ''));
      low52w = hiLoMatch[2] ? parseFloat(hiLoMatch[2]?.replace(/,/g, '')) : null;
    }

    // Current price
    const priceMatch = html.match(/#chart-container[^>]*>[^<]*<span[^>]*>([^<]+)</i) ||
      html.match(/current[\s-]price[^<]*<[^>]*>\s*([\d,\.]+)/i) ||
      html.match(/"currentPrice":\s*([\d\.]+)/i);
    const currentPrice = priceMatch ? parseFloat(priceMatch[1]?.replace(/,/g, '')) : null;

    return {
      companyName,
      marketCap: getVal('Market Cap'),
      currentPrice,
      high52w,
      low52w,
      pe: getVal('Stock P\\/E') || getVal('P\\/E'),
      bookValue: getVal('Book Value'),
      dividendYield: getVal('Dividend Yield'),
      roce: getVal('ROCE'),
      roe: getVal('ROE'),
      faceValue: getVal('Face Value'),
    };
  } catch (e) {
    return null;
  }
}

// Fetch current price from Yahoo Finance v8 chart (reliable even from cloud)
async function fetchYahooPrice(symbol) {
  try {
    const r = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1d`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    if (!r.ok) return null;
    const d = await r.json();
    const meta = d?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    return {
      currentPrice: meta.regularMarketPrice,
      high52w: meta.fiftyTwoWeekHigh,
      low52w: meta.fiftyTwoWeekLow,
      longName: meta.longName || meta.shortName,
    };
  } catch (e) {
    return null;
  }
}

// RSS feed helper with timeout
async function fetchFeed(url) {
  try {
    return await parser.parseURL(url);
  } catch (e) {
    return null;
  }
}

export default async function handler(req, res) {
  const { symbol, name, sector } = req.query;
  if (!symbol) return res.status(400).json({ error: 'Symbol required' });

  const ticker = symbol.split('.')[0].toUpperCase();
  const rawName = name ? decodeURIComponent(name).split('(')[0].trim() : ticker;

  // Run Screener + Yahoo price in parallel (don't wait for one before the other)
  const [screenerData, yahooPrice] = await Promise.all([
    scrapeScreener(ticker),
    fetchYahooPrice(symbol),
  ]);

  // Merge: Screener is primary for fundamentals, Yahoo v8 for live price
  const companyFullName = screenerData?.companyName || yahooPrice?.longName || rawName;
  const currentPrice = yahooPrice?.currentPrice || screenerData?.currentPrice;
  const high52w = yahooPrice?.high52w || screenerData?.high52w;
  const low52w = yahooPrice?.low52w || screenerData?.low52w;

  // Return a clean, flat profile object that Portfolio.jsx will read
  const profile = {
    currentPrice,
    high52w,
    low52w,
    marketCap: screenerData?.marketCap,    // In Cr (Screener shows in Cr)
    pe: screenerData?.pe,
    bookValue: screenerData?.bookValue,
    dividendYield: screenerData?.dividendYield,
    roce: screenerData?.roce,
    roe: screenerData?.roe,
    faceValue: screenerData?.faceValue,
    companyName: companyFullName,
    dataSource: screenerData ? 'Screener.in' : yahooPrice ? 'Yahoo Finance' : null,
  };

  // Fetch news from 3 Indian financial sources in parallel
  const searchTerm = companyFullName.length > 3 ? companyFullName.split(' ').slice(0, 3).join(' ') : rawName;
  const tickerQuery = encodeURIComponent(`"${searchTerm}" NSE stock`);
  const earningsQuery = encodeURIComponent(`"${searchTerm}" results quarterly earnings`);
  const etQuery = encodeURIComponent(`"${searchTerm}" stock`);

  const [googleFeed, etFeed, mcFeed, earningsFeed] = await Promise.all([
    fetchFeed(`https://news.google.com/rss/search?q=${tickerQuery}&hl=en-IN&gl=IN&ceid=IN:en`),
    fetchFeed(`https://economictimes.indiatimes.com/rsssearchresult.cms?query=${etQuery}`),
    fetchFeed(`https://www.moneycontrol.com/rss/results.xml?q=${encodeURIComponent(searchTerm)}`),
    fetchFeed(`https://news.google.com/rss/search?q=${earningsQuery}&hl=en-IN&gl=IN&ceid=IN:en`),
  ]);

  const seen = new Set();
  const news = [];

  const processItems = (items = [], sourceName) => {
    items.slice(0, 4).forEach(item => {
      const title = (() => {
        let t = item.title || '';
        if (t.includes(' - ')) {
          const parts = t.split(' - ');
          const maybePublisher = parts[parts.length - 1];
          if (maybePublisher.length < 50) { t = parts.slice(0, -1).join(' - '); }
        }
        return t.trim();
      })();

      if (!title || seen.has(title.slice(0, 40))) return;
      seen.add(title.slice(0, 40));

      const fullText = title + ' ' + (item.contentSnippet || item.summary || '');
      const score = deepScore(fullText);
      const grade = score > 1 ? 'Positive' : score < -1 ? 'Negative' : 'Neutral';

      let publisher = sourceName;
      if (item.title?.includes(' - ')) {
        const parts = item.title.split(' - ');
        if (parts[parts.length - 1].length < 50) publisher = parts.pop();
      }

      news.push({
        title,
        link: item.link || item.guid,
        publisher,
        providerPublishTime: item.isoDate || item.pubDate,
        sentimentGrade: grade,
        deepSentimentGrade: grade,
        contentSnippet: item.contentSnippet || item.summary || 'Read the full article for detailed analysis.',
        baseScore: score,
        deepScore: score,
      });
    });
  };

  processItems(googleFeed?.items, 'Google News');
  processItems(earningsFeed?.items, 'Earnings News');
  processItems(etFeed?.items, 'Economic Times');
  processItems(mcFeed?.items, 'Moneycontrol');

  res.status(200).json({ profile, news: news.slice(0, 8) });
}
