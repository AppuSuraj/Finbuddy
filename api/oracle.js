import Parser from 'rss-parser';
import Sentiment from 'sentiment';

const parser = new Parser();
const sentiment = new Sentiment();

export default async function handler(req, res) {
  const { names } = req.query;
  if (!names) return res.status(200).json({ growthPercent: 4.0 });
  
  try {
     const nameArray = names.split(',');
     let macroScore = 0;
     let microScore = 0;
     let articleCount = 0;

     // 1. Fetch Macro Geopolitical News
     const macroQuery = encodeURIComponent(`"India market economy geopolitics forecast"`);
     try {
         const mFeed = await parser.parseURL(`https://news.google.com/rss/search?q=${macroQuery}&hl=en-IN&gl=IN&ceid=IN:en`);
         mFeed.items.slice(0, 5).forEach(item => {
             const analysis = sentiment.analyze(item.title);
             macroScore += analysis.score;
             articleCount++;
         });
     } catch(e){}

     // 2. Fetch Micro Portfolio Sentiment
     for (const name of nameArray) {
        const rawName = name.split('(')[0].trim();
        const query = encodeURIComponent(`"${rawName}" stock forecast IN`);
        try {
          const feed = await parser.parseURL(`https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`);
          feed.items.slice(0, 2).forEach(item => {
             const analysis = sentiment.analyze(item.title);
             microScore += analysis.score;
             articleCount++;
          });
        } catch(e){}
     }
     
     const avgMacro = macroScore / 5;
     const avgMicro = nameArray.length > 0 ? microScore / (nameArray.length * 2) : 0;
     
     // Heuristic Prediction Math
     const baseBeta = 4.0;
     const sentimentAlpha = (avgMacro * 0.8) + (avgMicro * 1.5);
     
     let predictedGrowth = baseBeta + sentimentAlpha;
     if (predictedGrowth > 35) predictedGrowth = 35;
     if (predictedGrowth < -20) predictedGrowth = -20;
     
     res.status(200).json({ 
         growthPercent: Number(predictedGrowth.toFixed(2)),
         macroScore: Number(avgMacro.toFixed(2)),
         microScore: Number(avgMicro.toFixed(2)),
         articleCount
     });
  } catch (err) {
     res.status(200).json({ growthPercent: 4.0, articleCount: 0 });
  }
}
