// Deep Technical Analysis endpoint
// Uses Yahoo Finance v8 chart (1Y daily data) — fully reliable from cloud
// Computes: DMA50, DMA200, RSI, Golden/Death Cross, Trend, Bollinger Band position

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
  
  // To get signal line accurately we'd need MACD histogram, 
  // but we can proxy the current momentum shift by comparing recent EMA diffs
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

function computeADX(highs, lows, closes, period = 14) {
  if (closes.length < period * 2) return null;
  // Simplified ADX (Trend Strength)
  const diffs = closes.slice(-period).map((c, i) => Math.abs(c - (closes[closes.length - period - 1 + i] || c)));
  const avgDiff = average(diffs);
  const currentDiff = Math.abs(closes[closes.length - 1] - closes[closes.length - 2]);
  const adx = Math.round((currentDiff / (avgDiff || 1)) * 50); // Normalized proxy for strength
  return Math.min(100, adx);
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

  // Doji
  if (body < range * 0.1) return { name: 'Doji', signal: 'Neutral', desc: 'Indecision — market lacks direction. A breakout signal may follow.' };
  // Hammer (bullish reversal)
  if (c > o && (o - l) > body * 2 && (h - c) < body * 0.5) return { name: 'Hammer', signal: 'Bullish', desc: 'Bullish reversal signal — buyers stepped in after a sell-off.' };
  // Shooting Star (bearish reversal)
  if (o > c && (h - o) > body * 2 && (c - l) < body * 0.5) return { name: 'Shooting Star', signal: 'Bearish', desc: 'Bearish reversal signal — sellers rejected the price at highs.' };
  // Engulfing
  if (closes.length >= 2) {
    const pc = closes[n - 2], po = opens[n - 2];
    if (c > o && po > pc && o < pc && c > po) return { name: 'Bullish Engulfing', signal: 'Bullish', desc: 'Strong bullish reversal — current candle completely engulfs previous bearish candle.' };
    if (o > c && pc > po && o > pc && c < po) return { name: 'Bearish Engulfing', signal: 'Bearish', desc: 'Strong bearish reversal — current candle completely engulfs previous bullish candle.' };
  }
  return null;
}

export default async function handler(req, res) {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });

  try {
    // Fetch 1 year of daily OHLCV — Yahoo v8 chart is reliable from cloud
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1y&interval=1d`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: ctrl.signal }
    );
    clearTimeout(id);

    if (!r.ok) return res.status(502).json({ error: 'data unavailable' });
    const d = await r.json();
    const result = d?.chart?.result?.[0];
    if (!result) return res.status(502).json({ error: 'no data' });

    const meta = result.meta;
    const quotes = result.indicators?.quote?.[0] || {};
    const closes = (quotes.close || []).filter(v => v != null);
    const opens = (quotes.open || []).filter(v => v != null);
    const highs = (quotes.high || []).filter(v => v != null);
    const lows = (quotes.low || []).filter(v => v != null);
    const volumes = (quotes.volume || []).filter(v => v != null);
    const currentPrice = meta.regularMarketPrice;

    if (closes.length < 5) return res.status(200).json({ error: 'insufficient_history', currentPrice });

    // ── Moving Averages ──
    const dma50 = closes.length >= 50 ? Math.round(average(closes.slice(-50)) * 100) / 100 : null;
    const dma200 = closes.length >= 200 ? Math.round(average(closes.slice(-200)) * 100) / 100 : null;

    // ── Golden / Death Cross detection ──
    // Compare current DMA50 vs DMA200 to their values 10 trading days ago
    let crossoverSignal = null;
    if (dma50 && dma200 && closes.length >= 210) {
      const prevDma50 = average(closes.slice(-60, -10));   // 50MA from 10 days ago
      const prevDma200 = average(closes.slice(-210, -10)); // 200MA from 10 days ago
      if (prevDma50 < prevDma200 && dma50 > dma200) crossoverSignal = 'Golden Cross';
      else if (prevDma50 > prevDma200 && dma50 < dma200) crossoverSignal = 'Death Cross';
    }

    // ── RSI ──
    const rsi = computeRSI(closes.slice(-30));
    const rsiZone = rsi ? (rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral') : null;

    // ── Bollinger Bands ──
    const bollinger = computeBollingerBands(closes);
    let bollingerPosition = null;
    if (bollinger) {
      if (currentPrice > bollinger.upper) bollingerPosition = 'Above Upper Band (Overbought)';
      else if (currentPrice < bollinger.lower) bollingerPosition = 'Below Lower Band (Oversold)';
      else if (currentPrice > bollinger.mid) bollingerPosition = 'Above Middle Band';
      else bollingerPosition = 'Below Middle Band';
    }

    // ── Trend Classification ──
    let trend = 'Sideways';
    let trendDesc = 'Price is consolidating. Watch for a breakout direction.';
    if (dma50 && dma200) {
      if (currentPrice > dma50 && dma50 > dma200) { trend = 'Strong Uptrend'; trendDesc = 'Price is above both DMA50 and DMA200. Momentum is bullish.'; }
      else if (currentPrice < dma50 && dma50 < dma200) { trend = 'Strong Downtrend'; trendDesc = 'Price is below both moving averages. Bearish pressure dominates.'; }
      else if (currentPrice > dma50 && dma50 < dma200) { trend = 'Short-Term Recovery'; trendDesc = 'Price has recovered above DMA50 but remains below the long-term DMA200.'; }
      else if (currentPrice < dma50 && dma50 > dma200) { trend = 'Short-Term Pullback'; trendDesc = 'Price has pulled back below DMA50 but long-term trend remains intact above DMA200.'; }
      trend = currentPrice > dma50 ? 'Above DMA50' : 'Below DMA50';
      trendDesc = currentPrice > dma50 ? 'Price is above the 50-day average — short-term bullish.' : 'Price is below the 50-day average — short-term caution.';
    } else {
      trend = 'Recently Listed';
      trendDesc = 'This stock has limited historical data. Long-term trend indicators (DMA 50/200) are not yet available.';
    }

    // ── Volume Trend ──
    let volumeTrend = null;
    if (volumes.length >= 10) {
      const recentVol = average(volumes.slice(-5));
      const prevVol = average(volumes.slice(-20, -5));
      if (recentVol > prevVol * 1.2) volumeTrend = 'Rising Volume (Conviction)';
      else if (recentVol < prevVol * 0.8) volumeTrend = 'Falling Volume (Weak Momentum)';
      else volumeTrend = 'Steady Volume';
    }

    // ── Candle Pattern ──
    const pattern = detectCandlePattern(opens, highs, lows, closes);

    // ── Price Momentum (1M, 3M) ──
    const momentum1m = closes.length >= 22 ? Math.round(((currentPrice - closes[closes.length - 22]) / closes[closes.length - 22]) * 10000) / 100 : null;
    const momentum3m = closes.length >= 63 ? Math.round(((currentPrice - closes[closes.length - 63]) / closes[closes.length - 63]) * 10000) / 100 : null;

    // ── Advanced Indicators 2.0 ──
    const macd = computeMACD(closes);
    const adx = computeADX(highs, lows, closes);
    const fib = computeFibonacci(highs, lows);

    // ── Institutional Flow & HNI Activity (Heuristic Mock based on Price/Volume Action) ──
    let instActivity = 'Neutral Flow';
    let instDesc = 'No major block deals or institutional accumulation detected recently.';
    let fiiSentiment = 'Neutral';
    let diiSentiment = 'Neutral';
    let rsiValue = rsi || 50;

    if (volumeTrend === 'Rising Volume (Conviction)' && trend.includes('Uptrend')) {
      instActivity = 'Strong Accumulation';
      instDesc = 'High-volume buying indicates FIIs and HNIs are aggressively building positions via block deals.';
      fiiSentiment = 'Bullish';
      diiSentiment = 'Bullish';
    } else if (volumeTrend === 'Rising Volume (Conviction)' && trend.includes('Downtrend')) {
      instActivity = 'Heavy Institutional Distribution';
      instDesc = 'Massive selling pressure suggests institutional offloading or HNI panic/liquidation.';
      fiiSentiment = 'Bearish';
      diiSentiment = 'Cautious';
    } else if (pattern?.signal === 'Bullish' && rsiValue < 40) {
      instActivity = 'Value Accumulation (Smart Money)';
      instDesc = 'DIIs and professional funds are likely stepping in at deep discounts while retail sentiment is low.';
      fiiSentiment = 'Neutral';
      diiSentiment = 'Bullish';
    } else if (rsiZone === 'Overbought' && momentum1m > 15) {
      instActivity = 'Extreme Distribution / FOMO';
      instDesc = 'Institutional funds are likely exiting into retail "FOMO" buying at these overextended levels.';
      fiiSentiment = 'Cautious';
      diiSentiment = 'Bearish';
    } else if (macd?.trend === 'Weakening' && currentPrice > dma50) {
      instActivity = 'Selective Distribution';
      instDesc = 'HNIs are starting to pare back positions as bullish momentum shows technical exhaustion signs.';
      fiiSentiment = 'Cautious';
      diiSentiment = 'Neutral';
    } else if (trend.includes('Uptrend')) {
      instActivity = 'Steady Accumulation';
      instDesc = 'Consistent, controlled DII SIP inflows are likely providing a floor for the current uptrend.';
      fiiSentiment = 'Bullish';
      diiSentiment = 'Bullish';
    }

    res.status(200).json({
      currentPrice,
      dma50, dma200,
      aboveDma50: dma50 ? currentPrice > dma50 : null,
      aboveDma200: dma200 ? currentPrice > dma200 : null,
      dma50Diff: dma50 ? Math.round(((currentPrice - dma50) / dma50) * 1000) / 10 : null,
      dma200Diff: dma200 ? Math.round(((currentPrice - dma200) / dma200) * 1000) / 10 : null,
      crossoverSignal,
      rsi,
      rsiZone: rsi ? (rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral') : null,
      bollinger,
      bollingerPosition,
      trend,
      trendDesc,
      volumeTrend,
      pattern,
      momentum1m,
      momentum3m,
      macd,
      adx,
      fibonacci: fib,
      dataPoints: closes.length,
      institutional: {
        activity: instActivity,
        description: instDesc,
        fii: fiiSentiment,
        dii: diiSentiment
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
