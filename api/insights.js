import Parser from 'rss-parser';
import Sentiment from 'sentiment';

const parser = new Parser();
const sentimentAnalyzer = new Sentiment();

// Finance-domain deep NLP
function deepScore(text) {
  const base = sentimentAnalyzer.analyze(text);
  let score = base.score;
  const t = text.toLowerCase();
  if (t.includes('crash') || t.includes('collapse') || t.includes('fraud') || t.includes('default')) score -= 5;
  if (t.includes('plunge') || t.includes('tumble') || t.includes('probe') || t.includes('sebi notice')) score -= 4;
  if (t.includes('downgrade') || t.includes('bearish') || t.includes('sell-off') || t.includes('miss')) score -= 3;
  if (t.includes('soar') || t.includes('surge') || t.includes('rally') || t.includes('all-time high')) score += 4;
  if (t.includes('upgrade') || t.includes('bullish') || t.includes('breakout') || t.includes('record')) score += 3;
  if (t.includes('dividend') || t.includes('buyback') || t.includes('beat') || t.includes('outperform')) score += 3;
  return score;
}

export default async function handler(req, res) {
  const { symbol, name, sector } = req.query;
  if (!symbol) return res.status(400).json({ error: 'Symbol required' });

  // Resolve display name: "HDFCBANK (50 shares)" → "HDFCBANK"
  const rawName = name ? decodeURIComponent(name).split('(')[0].trim() : symbol.split('.')[0];

  try {
    // 1. Fetch Yahoo Finance quoteSummary (return full nested structure matching Portfolio.jsx expectations)
    let profile = null;
    let companyFullName = rawName;

    try {
      const yfRes = await fetch(
        `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=price,summaryDetail,defaultKeyStatistics,financialData,assetProfile`,
        { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } }
      );
      if (yfRes.ok) {
        const yfData = await yfRes.json();
        const result = yfData?.quoteSummary?.result?.[0];
        if (result) {
          profile = result; // Return entire nested structure as-is
          companyFullName = result.price?.longName || result.price?.shortName || rawName;
        }
      }
    } catch (e) {}

    // Retry with query1 if query2 failed
    if (!profile) {
      try {
        const yfRes2 = await fetch(
          `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=price,summaryDetail,defaultKeyStatistics,financialData,assetProfile`,
          { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } }
        );
        if (yfRes2.ok) {
          const yfData2 = await yfRes2.json();
          const result2 = yfData2?.quoteSummary?.result?.[0];
          if (result2) {
            profile = result2;
            companyFullName = result2.price?.longName || result2.price?.shortName || rawName;
          }
        }
      } catch (e) {}
    }

    // 2. Fetch news using FULL company name (not ambiguous ticker like "LT")
    const news = [];
    try {
      // Use full company name for much more accurate and relevant results
      const searchTerm = companyFullName.length > 3 ? companyFullName : rawName;
      const sectorTerm = sector && sector !== 'undefined' ? ` ${sector}` : '';
      const query = encodeURIComponent(`"${searchTerm}"${sectorTerm} NSE stock`);
      const feed = await parser.parseURL(`https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`);

      // Also fetch company-specific earnings news in parallel
      const query2 = encodeURIComponent(`"${searchTerm}" results earnings quarterly`);
      let feed2Items = [];
      try {
        const feed2 = await parser.parseURL(`https://news.google.com/rss/search?q=${query2}&hl=en-IN&gl=IN&ceid=IN:en`);
        feed2Items = feed2.items.slice(0, 2);
      } catch (e) {}

      const combined = [...feed.items.slice(0, 5), ...feed2Items];

      combined.forEach(item => {
        const fullText = item.title + ' ' + (item.contentSnippet || '');
        const score = deepScore(fullText);
        const sentimentGrade = score > 1 ? 'Positive' : score < -1 ? 'Negative' : 'Neutral';

        // Parse Google-style "Title - Publisher" format
        let title = item.title;
        let publisher = item.source?.['$']?.url || 'News';
        if (title.includes(' - ')) {
          const parts = title.split(' - ');
          publisher = parts.pop();
          title = parts.join(' - ');
        }

        news.push({
          title,
          link: item.link,
          publisher,
          providerPublishTime: item.isoDate || item.pubDate,
          sentimentGrade,
          deepSentimentGrade: sentimentGrade,
          contentSnippet: item.contentSnippet || 'Read the full article for details.',
          baseScore: score,
          deepScore: score,
        });
      });
    } catch (e) {}

    res.status(200).json({ profile, news });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
}
