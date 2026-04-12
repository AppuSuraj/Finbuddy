import Parser from 'rss-parser';
import Sentiment from 'sentiment';

const parser = new Parser();
const sentimentAnalyzer = new Sentiment();

// Deep Sentiment Heuristic - Finance-aware keyword overrides
function deepAnalyze(text) {
  const base = sentimentAnalyzer.analyze(text);
  let score = base.score;
  const t = text.toLowerCase();

  // Finance-specific penalty lexicon
  if (t.includes('crash') || t.includes('collapse')) score -= 5;
  if (t.includes('plunge') || t.includes('tumble')) score -= 4;
  if (t.includes('crack') || t.includes('cracks')) score -= 3;
  if (t.includes('bearish') || t.includes('sell-off')) score -= 3;
  if (t.includes('downgrade') || t.includes('cut price')) score -= 3;
  if (t.includes('miss') || t.includes('disappoint')) score -= 2;
  if (t.includes('default') || t.includes('fraud')) score -= 5;
  if (t.includes('probe') || t.includes('sebi notice')) score -= 4;

  // Finance-specific additive lexicon
  if (t.includes('soar') || t.includes('surge') || t.includes('rally')) score += 4;
  if (t.includes('breakout') || t.includes('bullish')) score += 3;
  if (t.includes('upgrade') || t.includes('target price')) score += 3;
  if (t.includes('beat') || t.includes('outperform')) score += 3;
  if (t.includes('dividend') || t.includes('buyback')) score += 2;
  if (t.includes('record') || t.includes('all-time high')) score += 4;

  return score;
}

export default async function handler(req, res) {
  const { names, deep } = req.query;
  if (!names) return res.status(200).json({ percent: 50 });

  const isDeep = deep === 'true';
  const articlesPerStock = isDeep ? 6 : 3; // Deep mode reads 6 articles per stock
  const maxStocks = isDeep ? 10 : 4;       // Deep mode covers top 10

  try {
    const nameArray = decodeURIComponent(names).split(',').slice(0, maxStocks);
    let totalScore = 0;
    let articleCount = 0;
    const perStockBreakdown = [];

    for (const name of nameArray) {
      const rawName = decodeURIComponent(name).split('(')[0].trim();
      let stockScore = 0;
      let stockArticles = 0;
      const headlines = [];

      // 1. Stock-specific news
      try {
        const query = encodeURIComponent(`"${rawName}" stock NSE BSE`);
        const feed = await parser.parseURL(`https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`);
        feed.items.slice(0, articlesPerStock).forEach(item => {
          const fullText = item.title + ' ' + (item.contentSnippet || '');
          const score = deepAnalyze(fullText);
          stockScore += score;
          stockArticles++;
          articleCount++;
          totalScore += score;
          if (isDeep) {
            let publisher = item.title.includes(' - ') ? item.title.split(' - ').pop() : 'News';
            let title = item.title.includes(' - ') ? item.title.split(' - ').slice(0, -1).join(' - ') : item.title;
            headlines.push({ title, publisher, pubDate: item.isoDate || item.pubDate, score });
          }
        });
      } catch (e) {}

      // 2. Broader earnings/results news for deeper research
      if (isDeep) {
        try {
          const query2 = encodeURIComponent(`"${rawName}" quarterly results earnings`);
          const feed2 = await parser.parseURL(`https://news.google.com/rss/search?q=${query2}&hl=en-IN&gl=IN&ceid=IN:en`);
          feed2.items.slice(0, 2).forEach(item => {
            const score = deepAnalyze(item.title);
            stockScore += score;
            stockArticles++;
            articleCount++;
            totalScore += score;
          });
        } catch (e) {}
      }

      if (isDeep && stockArticles > 0) {
        const avgStock = stockScore / stockArticles;
        let pct = Math.round(50 + (avgStock * 18));
        pct = Math.min(100, Math.max(0, pct));
        perStockBreakdown.push({
          name: rawName,
          percent: pct,
          sentiment: pct > 65 ? 'Bullish' : pct < 45 ? 'Bearish' : 'Neutral',
          articleCount: stockArticles,
          headlines: headlines.slice(0, 3),
        });
      }
    }

    const avgScore = articleCount > 0 ? totalScore / articleCount : 0;
    let percent = Math.round(50 + (avgScore * 18));
    percent = Math.min(100, Math.max(0, percent));

    res.status(200).json({
      percent,
      articleCount,
      ...(isDeep && { breakdown: perStockBreakdown }),
    });
  } catch (err) {
    res.status(200).json({ percent: 50, articleCount: 0 });
  }
}
