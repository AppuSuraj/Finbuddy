
export default async function handler(req, res) {
  // Set cache headers to 1 hour for market data
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=1800');

  const fetchIndices = async () => {
    const indices = [
      { id: 'NIFTY 50', symbol: '^NSEI' },
      { id: 'SENSEX', symbol: '^BSESN' },
      { id: 'BANK NIFTY', symbol: '^NSEBANK' },
      { id: 'USD/INR', symbol: 'INR=X' }
    ];

    return await Promise.all(indices.map(async (idx) => {
      try {
        const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${idx.symbol}?range=1d&interval=1m`, {
           headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });
        const data = await response.json();
        const result = data?.chart?.result?.[0]?.meta;
        if (!result) throw new Error('No data');

        const price = result.regularMarketPrice;
        const prevClose = result.previousClose;
        const diff = price - prevClose;
        const percent = ((diff / prevClose) * 100).toFixed(2);

        return {
          label: idx.id,
          value: idx.id === 'USD/INR' ? `₹${price.toFixed(2)}` : price.toLocaleString('en-IN'),
          change: `${diff >= 0 ? '+' : ''}${percent}%`,
          up: diff >= 0
        };
      } catch (err) {
        // Fallback for individual index failure
        return { label: idx.id, value: 'Offline', change: '0.00%', up: true };
      }
    }));
  };

  const scrapeGold = async () => {
    try {
      const resp = await fetch('https://www.goodreturns.in/gold-rates/bangalore.html', {
        headers: {
           'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
           'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      if (!resp.ok) throw new Error('Gold Fetch Failed');
      const html = await resp.text();

      // Robust Regex-based extraction looking for the 24K 10g rate
      // The table row usually looks like: <td>10</td> <td>₹71,230</td>
      // We look for a pattern where 10 is followed by a price cell
      const tableMatch = html.match(/<td>\s*10\s*<\/td>\s*<td>\s*(₹?[\d,]+)\s*<\/td>/i);
      let price = tableMatch ? tableMatch[1] : null;

      if (!price) {
        // Fallback to searching descriptive text
        const textMatch = html.match(/Today's gold price in (Bangalore|India) stands at ₹([\d,]+) per gram/i);
        if (textMatch) {
          const perGram = parseInt(textMatch[2].replace(/,/g, ''));
          price = (perGram * 10).toLocaleString('en-IN');
        }
      }

      if (!price) throw new Error('Regex Failed to find Gold price');

      return {
        label: 'GOLD (INDIA)',
        value: price.startsWith('₹') ? price : `₹${price}`,
        change: '+0.00%', // Percentage change is harder via simple scrape, keeping neutral
        up: true
      };
    } catch (err) {
      console.error('Gold Scrape Error:', err.message);
      return { label: 'GOLD (INDIA)', value: '₹-- ---', change: 'Service Down', up: false };
    }
  };

  try {
    const [marketData, goldData] = await Promise.all([fetchIndices(), scrapeGold()]);
    
    // Merge into the pulse array
    const pulse = [...marketData];
    // Insert gold at position 3
    pulse.splice(3, 0, goldData);

    res.status(200).json(pulse);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
}
