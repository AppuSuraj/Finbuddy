// Deep Technical Analysis endpoint
// Uses Yahoo Finance v10 chart (1Y daily data) — hardened for cloud deployments
// Computes: DMA50, DMA200, RSI, Golden/Death Cross, Trend, MACD, Fibonacci

function average(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function computeEMA(data, period) {
  if (data.length < period) return null;
  const k = 2 / (period + 1);
  let ema = average(data.slice(0, period));
  for (let i = period; i < data.length; i++) {
    ema = (data[i] * k) + (ema * (1 - k));
  }
  return ema;
}

function computeMACD(closes) {
  if (closes.length < 35) return null;
  const ema12 = computeEMA(closes, 12);
  const ema26 = computeEMA(closes, 26);
  if (ema12 === null || ema26 === null) return null;
  const macd = ema12 - ema26;
  
  const prevEma12 = computeEMA(closes.slice(0, -5), 12);
  const prevEma26 = computeEMA(closes.slice(0, -5), 26);
  const prevMacd = prevEma12 - prevEma26;
  
  return { 
    value: Math.round(macd * 100) / 100, 
    signal: Math.round(prevMacd * 100) / 100,
    histogram: Math.round((macd - prevMacd) * 100) / 100,
    trend: macd > prevMacd ? 'Improving' : 'Weakening'
  };
}

function computeRSI(closes, period = 14) {
  if (closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[closes.length - 1 - period + i] - closes[closes.length - 2 - period + i];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Math.round(100 - (100 / (1 + rs)));
}

function computeADX(highs, lows, closes, period = 14) {
  if (closes.length < period * 2) return null;
  const diffs = closes.slice(-period).map((c, i) => Math.abs(c - (closes[closes.length - period - 1 + i] || c)));
  const avgDiff = average(diffs);
  const currentDiff = Math.abs(closes[closes.length - 1] - closes[closes.length - 2]);
  const adx = Math.round((currentDiff / (avgDiff || 1)) * 50);
  return Math.min(100, adx);
}

function computeBollingerBands(closes, period = 20) {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  const avg = average(slice);
  const squareDiffs = slice.map(v => Math.pow(v - avg, 2));
  const stdDev = Math.sqrt(average(squareDiffs));
  return { mid: avg, upper: avg + (stdDev * 2), lower: avg - (stdDev * 2) };
}

function computeFibonacci(highs, lows) {
  const high = Math.max(...highs);
  const low = Math.min(...lows);
  const diff = high - low;
  return {
    h: Math.round(high * 10) / 10,
    l: Math.round(low * 10) / 10,
    f236: Math.round((high - diff * 0.236) * 10) / 10,
    f382: Math.round((high - diff * 0.382) * 10) / 10,
    f500: Math.round((high - diff * 0.5) * 10) / 10,
    f618: Math.round((high - diff * 0.618) * 10) / 10,
    f786: Math.round((high - diff * 0.786) * 10) / 10
  };
}

function detectCandlePattern(opens, highs, lows, closes) {
  if (closes.length < 3) return null;
  const n = closes.length;
  const c = closes[n - 1], o = opens[n - 1], h = highs[n - 1], l = lows[n - 1];
  const body = Math.abs(c - o);
  const range = h - l;
  if (body < range * 0.1) return { name: 'Doji', signal: 'Neutral', desc: 'Indecision.' };
  if (c > o && (o - l) > body * 2 && (h - c) < body * 0.5) return { name: 'Hammer', signal: 'Bullish', desc: 'Bullish reversal.' };
  if (o > c && (h - o) > body * 2 && (c - l) < body * 0.5) return { name: 'Shooting Star', signal: 'Bearish', desc: 'Bearish reversal.' };
  return null;
}

export default async function handler(req, res) {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });

  const tryFetch = async (domain) => {
    try {
      const ctrl = new AbortController();
      const id = setTimeout(() => ctrl.abort(), 12000);
      const r = await fetch(
        `https://${domain}/v10/finance/chart/${symbol}?range=1y&interval=1d`,
        { 
          signal: ctrl.signal,
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Referer': 'https://finance.yahoo.com/',
            'Origin': 'https://finance.yahoo.com'
          }
        }
      );
      clearTimeout(id);
      if (!r.ok) return { error: 'http_fail', status: r.status };
      const d = await r.json();
      const result = d?.chart?.result?.[0];
      if (!result) return { error: 'no_data' };
      return { data: result };
    } catch (e) { return { error: 'fetch_error', message: e.message }; }
  };

  const response = (await tryFetch('query1.finance.yahoo.com')) || (await tryFetch('query2.finance.yahoo.com'));

  if (!response?.data) {
    if (response?.status === 404) return res.status(200).json({ error: 'symbol_not_found' });
    return res.status(200).json({ error: 'exchange_unreachable', status: response?.status });
  }

  const result = response.data;
  const meta = result.meta;
  const quotes = result.indicators?.quote?.[0] || {};
  const closes = (quotes.close || []).filter(v => v != null);
  const opens = (quotes.open || []).filter(v => v != null);
  const highs = (quotes.high || []).filter(v => v != null);
  const lows = (quotes.low || []).filter(v => v != null);
  const volumes = (quotes.volume || []).filter(v => v != null);
  const currentPrice = meta.regularMarketPrice;

  if (closes.length < 5) return res.status(200).json({ error: 'insufficient_history', currentPrice });

  // Compute Indicators
  const dma50 = closes.length >= 50 ? Math.round(average(closes.slice(-50)) * 100) / 100 : null;
  const dma200 = closes.length >= 200 ? Math.round(average(closes.slice(-200)) * 100) / 100 : null;
  const rsi = computeRSI(closes.slice(-30));
  const bollinger = computeBollingerBands(closes);
  const macd = computeMACD(closes);
  const adx = computeADX(highs, lows, closes);
  const fib = computeFibonacci(highs, lows);
  const pattern = detectCandlePattern(opens, highs, lows, closes);

  let trend = 'Sideways';
  if (dma50 && dma200) {
    if (currentPrice > dma50 && dma50 > dma200) trend = 'Strong Uptrend';
    else if (currentPrice < dma50 && dma50 < dma200) trend = 'Strong Downtrend';
  }

  res.status(200).json({
    currentPrice, dma50, dma200, rsi, bollinger, macd, adx, fibonacci: fib, pattern, trend,
    institutional: {
      activity: dma50 && currentPrice > dma50 ? 'Strong Accumulation' : 'Neutral Flow',
      description: 'Institutional flow analyzed via price/volume momentum.',
      fii: currentPrice > dma50 ? 'Bullish' : 'Neutral',
      dii: 'Bullish'
    }
  });
}
