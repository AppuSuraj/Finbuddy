import Parser from 'rss-parser';
import Sentiment from 'sentiment';

const parser = new Parser();
const sentimentAnalyzer = new Sentiment();

export default async function handler(req, res) {
  const { names } = req.query;
  if (!names) return res.status(200).json({ growthPercent: 4.0 });

  try {
    const nameArray = decodeURIComponent(names).split(',').slice(0, 5); // Limit to 5 to avoid timeout
    let macroScore = 0;
    let microScore = 0;
    let macroCount = 0;
    let microCount = 0;

    // Run macro + all micro fetches fully in parallel with individual timeouts
    const fetchWithTimeout = async (url, ms = 6000) => {
      const ctrl = new AbortController();
      const id = setTimeout(() => ctrl.abort(), ms);
      try {
        const res = await parser.parseURL(url, { signal: ctrl.signal });
        clearTimeout(id);
        return res;
      } catch (e) {
        clearTimeout(id);
        return null;
      }
    };

    const macroQuery = encodeURIComponent(`India stock market NIFTY economy outlook`);
    const microQueries = nameArray.map(n => {
      const rawName = n.split('(')[0].trim();
      return encodeURIComponent(`"${rawName}" stock target price forecast`);
    });

    const [macroFeed, ...microFeeds] = await Promise.all([
      fetchWithTimeout(`https://news.google.com/rss/search?q=${macroQuery}&hl=en-IN&gl=IN&ceid=IN:en`),
      ...microQueries.map(q => fetchWithTimeout(`https://news.google.com/rss/search?q=${q}&hl=en-IN&gl=IN&ceid=IN:en`)),
    ]);

    // Score macro
    if (macroFeed) {
      macroFeed.items.slice(0, 5).forEach(item => {
        macroScore += sentimentAnalyzer.analyze(item.title).score;
        macroCount++;
      });
    }

    // Score micro
    microFeeds.forEach(feed => {
      if (!feed) return;
      feed.items.slice(0, 3).forEach(item => {
        microScore += sentimentAnalyzer.analyze(item.title).score;
        microCount++;
      });
    });

    const avgMacro = macroCount > 0 ? macroScore / macroCount : 0;
    const avgMicro = microCount > 0 ? microScore / microCount : 0;

    // Heuristic: base annual NIFTY growth ~8% → ~4% over 6 months
    const baseBeta = 4.0;
    const sentimentAlpha = (avgMacro * 0.8) + (avgMicro * 1.5);
    let predictedGrowth = baseBeta + sentimentAlpha;
    predictedGrowth = Math.min(35, Math.max(-20, predictedGrowth));

    res.status(200).json({
      growthPercent: Number(predictedGrowth.toFixed(2)),
      macroScore: Number(avgMacro.toFixed(2)),
      microScore: Number(avgMicro.toFixed(2)),
      articleCount: macroCount + microCount,
    });
  } catch (err) {
    // Fallback to stable 4% projection so chart always renders
    res.status(200).json({ growthPercent: 4.0, articleCount: 0 });
  }
}
