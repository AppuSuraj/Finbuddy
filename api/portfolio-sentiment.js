import Parser from 'rss-parser';
import Sentiment from 'sentiment';

const parser = new Parser();
const sentiment = new Sentiment();

export default async function handler(req, res) {
  const { names } = req.query;
  if (!names) return res.status(200).json({ percent: 50 });
  
  try {
    const nameArray = names.split(',');
    let totalScore = 0;
    let articleCount = 0;
    
    // Aggregate parsing across requested symbols
    for (const name of nameArray) {
       const rawName = name.split('(')[0].trim();
       const query = encodeURIComponent(`"${rawName}" stock news IN`);
       try {
         const feed = await parser.parseURL(`https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`);
         feed.items.slice(0, 3).forEach(item => {
            const analysis = sentiment.analyze(item.title);
            totalScore += analysis.score;
            articleCount++;
         });
       } catch(e){}
    }
    
    const avgScore = articleCount > 0 ? (totalScore / articleCount) : 0;
    // Exaggerate sentiment algorithmically for visual weather: Base 50% = Neural
    let percent = 50 + (avgScore * 18); 
    if (percent > 100) percent = 100;
    if (percent < 0) percent = 0;
    
    res.status(200).json({ percent: Math.round(percent), articleCount });
  } catch (err) {
    res.status(200).json({ percent: 50, articleCount: 0 });
  }
}
