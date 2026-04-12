

export default async function handler(req, res) {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'Symbol required' });

  try {
    // 7-day sparkline fetch via Yahoo Chart API
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=7d&interval=1h`);
    const data = await response.json();
    
    const result = data.chart?.result?.[0];
    if (!result) return res.status(404).json({ error: 'No data found' });

    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0].close;
    
    const sparklineData = timestamps.map((t, i) => ({
      time: t,
      close: quotes[i]
    })).filter(d => d.close !== null);

    res.status(200).json(sparklineData);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
}
