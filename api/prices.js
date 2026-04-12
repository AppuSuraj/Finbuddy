// Batch Price Fetcher — all tickers in parallel via Yahoo Finance v8 chart
// Usage: GET /api/prices?tickers=RELIANCE,HDFCBANK,LT

export default async function handler(req, res) {
  const { tickers } = req.query;
  if (!tickers) return res.status(400).json({ error: 'tickers required' });

  const tickerList = decodeURIComponent(tickers).split(',').map(t => t.trim().toUpperCase()).slice(0, 50);

  const fetchOne = async (ticker) => {
    // Try .NS first, then .BO
    for (const suffix of ['.NS', '.BO']) {
      try {
        const ctrl = new AbortController();
        const id = setTimeout(() => ctrl.abort(), 5000);
        const r = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}${suffix}?range=1d&interval=1d`,
          { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: ctrl.signal }
        );
        clearTimeout(id);
        if (!r.ok) continue;
        const d = await r.json();
        const meta = d?.chart?.result?.[0]?.meta;
        if (!meta || !meta.regularMarketPrice) continue;
        return {
          price: meta.regularMarketPrice,
          previousClose: meta.chartPreviousClose || meta.previousClose,
          change: meta.regularMarketPrice - (meta.chartPreviousClose || meta.previousClose || meta.regularMarketPrice),
          changePercent: meta.chartPreviousClose
            ? (((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100).toFixed(2)
            : '0.00',
          high52w: meta.fiftyTwoWeekHigh,
          low52w: meta.fiftyTwoWeekLow,
          currency: meta.currency || 'INR',
          exchange: meta.exchangeName || suffix.replace('.', ''),
        };
      } catch (e) {
        // Try next suffix
      }
    }
    return null; // Both failed
  };

  // Fetch all in parallel
  const results = await Promise.all(tickerList.map(t => fetchOne(t)));

  const output = {};
  tickerList.forEach((t, i) => {
    if (results[i]) output[t] = results[i];
  });

  res.status(200).json(output);
}
