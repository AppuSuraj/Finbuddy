import Parser from 'rss-parser';
import Sentiment from 'sentiment';

const parser = new Parser();
const sentiment = new Sentiment();

export default async function handler(req, res) {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'Symbol required' });

  try {
    const ticker = symbol.split('.')[0];
    
    // Parallel Fetch: Yahoo Profile (Meta Vault) + RSS News
    const [profileRes, rssRes] = await Promise.allSettled([
      fetch(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=price,summaryDetail,financialData,assetProfile`),
      parser.parseURL(`https://finance.yahoo.com/rss/headline?s=${symbol}`)
    ]);

    let profileData = {};
    if (profileRes.status === 'fulfilled') {
      const yfData = await profileRes.value.json();
      const result = yfData.quoteSummary?.result?.[0];
      if (result) {
        profileData = {
          price: result.price?.regularMarketPrice?.raw,
          change: result.price?.regularMarketChangePercent?.raw,
          marketCap: result.summaryDetail?.marketCap?.fmt,
          peRatio: result.summaryDetail?.trailingPE?.fmt,
          divYield: result.summaryDetail?.dividendYield?.fmt,
          targetPrice: result.financialData?.targetMeanPrice?.raw,
          recommendation: result.financialData?.recommendationKey,
          businessSummary: result.assetProfile?.longBusinessSummary
        };
      }
    }

    let news = [];
    if (rssRes.status === 'fulfilled') {
      news = rssRes.value.items.slice(0, 5).map(item => {
        const analysis = sentiment.analyze(item.title + ' ' + (item.contentSnippet || ''));
        return {
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          sentiment: analysis.score > 0 ? 'Positive' : (analysis.score < 0 ? 'Negative' : 'Neutral'),
          score: analysis.score
        };
      });
    }

    res.status(200).json({
      profile: profileData,
      news: news
    });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
}
