

export default async function handler(req, res) {
  // Extract symbol from path if needed, or query
  // Since we proxy /api/finance/[symbol] to /api/finance.js?symbol=[symbol] on Vercel
  const { symbol } = req.query;
  
  if (!symbol) return res.status(400).json({ error: 'Symbol required' });

  try {
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`);
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
}
