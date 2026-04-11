import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import YahooFinance from 'yahoo-finance2'
import Sentiment from 'sentiment'
import Parser from 'rss-parser'

// Initialize the API handler for v3 & Sentiment Engine
const yahooFinance = new YahooFinance();
const sentimentAnalyzer = new Sentiment();
const rssParser = new Parser();

// custom plugin for scraping api
const finbuddyInsightsPlugin = () => ({
  name: 'finbuddy-insights',
  configureServer(server) {
    server.middlewares.use('/api/insights', async (req, res, next) => {
      // Need to parse full URL since req.url is just the partial path
      const url = new URL(req.originalUrl || req.url, `http://${req.headers.host}`);
      const symbol = url.searchParams.get('symbol');
      const nameStr = url.searchParams.get('name');
      const rawName = nameStr ? nameStr.split('(')[0].trim() : symbol; // Strip " (2 shares)" syntax
      
      if (!symbol) {
         return next();
      }
      
      try {
         const quote = await yahooFinance.quoteSummary(symbol, { 
             modules: ['summaryDetail', 'assetProfile', 'defaultKeyStatistics', 'financialData', 'price'] 
         });
         
         let news = [];
         try {
            // 1. Ticker Specific News
            const query = encodeURIComponent(`"${rawName}" stock news IN`);
            const feed = await rssParser.parseURL(`https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`);
            let itemsToParse = feed.items.slice(0, 4);
            
            // 2. Sector Broad News
            const sectorStr = url.searchParams.get('sector');
            if (sectorStr && sectorStr !== 'undefined' && sectorStr !== 'null') {
               const sQuery = encodeURIComponent(`"${sectorStr}" sector market news IN`);
               try {
                  const sFeed = await rssParser.parseURL(`https://news.google.com/rss/search?q=${sQuery}&hl=en-IN&gl=IN&ceid=IN:en`);
                  itemsToParse = [...itemsToParse, ...sFeed.items.slice(0, 3)];
               } catch(e){}
            }
            
            // Map NLP Sentiment with Heavy Heuristic Overrides
            news = itemsToParse.map(item => {
               // Standard title analysis
               const analysis = sentimentAnalyzer.analyze(item.title);
               let grade = 'Neutral';
               if (analysis.score > 0) grade = 'Positive';
               if (analysis.score < 0) grade = 'Negative';
               
               // Deep Scan Engine (Reading beyond the title)
               const snippet = item.contentSnippet || '';
               const fullText = (item.title + " " + snippet).toLowerCase();
               let deepScore = analysis.score;
               
               // Finance-specific penalty lexicon
               if (fullText.includes('crack') || fullText.includes('cracks')) deepScore -= 3;
               if (fullText.includes('crash')) deepScore -= 4;
               if (fullText.includes('plunge')) deepScore -= 3;
               if (fullText.includes('tumble')) deepScore -= 3;
               if (fullText.includes('bearish')) deepScore -= 2;
               
               // Finance-specific additive lexicon
               if (fullText.includes('soar')) deepScore += 3;
               if (fullText.includes('surge')) deepScore += 3;
               if (fullText.includes('bullish')) deepScore += 2;
               if (fullText.includes('breakout')) deepScore += 2;
               
               let deepGrade = 'Neutral';
               if (deepScore > 0) deepGrade = 'Positive';
               if (deepScore < 0) deepGrade = 'Negative';

               // Parse Google News Publisher
               let title = item.title;
               let publisher = item.source || 'Financial News';
               if (title.includes(' - ')) {
                 const parts = title.split(' - ');
                 publisher = parts.pop();
                 title = parts.join(' - ');
               }

               return { 
                 title: title, 
                 link: item.link,
                 publisher: publisher,
                 providerPublishTime: item.isoDate || item.pubDate,
                 sentimentGrade: grade,
                 deepSentimentGrade: deepGrade,
                 contentSnippet: snippet || 'Detailed breakdown not provided by publisher.',
                 baseScore: analysis.score,
                 deepScore: deepScore
               };
            });
         } catch(e) { }

         res.setHeader('Content-Type', 'application/json');
         res.end(JSON.stringify({ profile: quote, news }));
      } catch (err) {
         console.error(err);
         res.statusCode = 500;
         res.end(JSON.stringify({ error: err.message || 'Failed to fetch insights' }));
      }
    });

    // Sub-Route: Sparkline Array for Mini Charts
    server.middlewares.use('/api/sparkline', async (req, res, next) => {
      const url = new URL(req.originalUrl || req.url, `http://${req.headers.host}`);
      const symbol = url.searchParams.get('symbol');
      if (!symbol) return next();
      
      try {
         const d = new Date();
         d.setDate(d.getDate() - 10); // Look back 10 days to ensure we capture ~7 trading days
         const period1 = d.toISOString().split('T')[0];
         const sparkData = await yahooFinance.historical(symbol, { period1, interval: '1d' });
         res.setHeader('Content-Type', 'application/json');
         res.end(JSON.stringify(sparkData));
      } catch (err) {
         res.setHeader('Content-Type', 'application/json');
         res.end(JSON.stringify({ error: err.message }));
      }
    });

    // Sub-Route: Heavy Background Sentiment Calculation
    server.middlewares.use('/api/portfolio-sentiment', async (req, res, next) => {
      const url = new URL(req.originalUrl || req.url, `http://${req.headers.host}`);
      const namesStr = url.searchParams.get('names');
      if (!namesStr) return next();
      
      try {
         const names = namesStr.split(',');
         let totalScore = 0;
         let articleCount = 0;
         
         // Aggregate parsing across requested symbols
         for (const name of names) {
            const rawName = name.split('(')[0].trim();
            const query = encodeURIComponent(`"${rawName}" stock news IN`);
            try {
              const feed = await rssParser.parseURL(`https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`);
              feed.items.slice(0, 3).forEach(item => {
                 const analysis = sentimentAnalyzer.analyze(item.title);
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
         
         res.setHeader('Content-Type', 'application/json');
         res.end(JSON.stringify({ percent: Math.round(percent), articleCount }));
      } catch (err) {
         res.setHeader('Content-Type', 'application/json');
         res.end(JSON.stringify({ error: err.message, percent: 50 }));
      }
    });

    // Sub-Route: Oracle Prediction Algorithm
    server.middlewares.use('/api/oracle', async (req, res, next) => {
      const url = new URL(req.originalUrl || req.url, `http://${req.headers.host}`);
      const namesStr = url.searchParams.get('names');
      if (!namesStr) return next();
      
      try {
         const names = namesStr.split(',');
         let macroScore = 0;
         let microScore = 0;
         let articleCount = 0;

         // 1. Fetch Macro Geopolitical News (Simulating Federal/RBI/Geopolitical triggers)
         const macroQuery = encodeURIComponent(`"India market economy geopolitics forecast"`);
         try {
             const mFeed = await rssParser.parseURL(`https://news.google.com/rss/search?q=${macroQuery}&hl=en-IN&gl=IN&ceid=IN:en`);
             mFeed.items.slice(0, 5).forEach(item => {
                 const analysis = sentimentAnalyzer.analyze(item.title);
                 macroScore += analysis.score;
                 articleCount++;
             });
         } catch(e){}

         // 2. Fetch Micro Portfolio Sentiment
         for (const name of names) {
            const rawName = name.split('(')[0].trim();
            const query = encodeURIComponent(`"${rawName}" stock forecast IN`);
            try {
              const feed = await rssParser.parseURL(`https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`);
              feed.items.slice(0, 2).forEach(item => {
                 const analysis = sentimentAnalyzer.analyze(item.title);
                 microScore += analysis.score;
                 articleCount++;
              });
            } catch(e){}
         }
         
         const avgMacro = macroScore / 5;
         const avgMicro = names.length > 0 ? microScore / (names.length * 2) : 0;
         
         // Heuristic Prediction Math (Mimics ML weight distribution)
         // Assuming base neutral market growth is 8% annually -> 4% over 6 months
         const baseBeta = 4.0;
         // Alpha = Macro + Micro scalar. A combined score of +2 translates to roughly +3% excess return
         const sentimentAlpha = (avgMacro * 0.8) + (avgMicro * 1.5);
         
         let predictedGrowth = baseBeta + sentimentAlpha;
         if (predictedGrowth > 35) predictedGrowth = 35; // Cap maximum projection
         if (predictedGrowth < -20) predictedGrowth = -20; // Cap maximum drawdown
         
         res.setHeader('Content-Type', 'application/json');
         res.end(JSON.stringify({ 
             growthPercent: Number(predictedGrowth.toFixed(2)),
             macroScore: Number(avgMacro.toFixed(2)),
             microScore: Number(avgMicro.toFixed(2)),
             articleCount
         }));
      } catch (err) {
         res.setHeader('Content-Type', 'application/json');
         res.end(JSON.stringify({ error: err.message, growthPercent: 4.0 }));
      }
    });

    // Sub-Route: Heavy Background Sector Lookup
    server.middlewares.use('/api/profile', async (req, res, next) => {
      const url = new URL(req.originalUrl || req.url, `http://${req.headers.host}`);
      const symbol = url.searchParams.get('symbol');
      if (!symbol) return next();
      try {
         const profile = await yahooFinance.quoteSummary(symbol, { modules: ['assetProfile'] });
         res.setHeader('Content-Type', 'application/json');
         res.end(JSON.stringify({ sector: profile.assetProfile?.sector || 'Unknown' }));
      } catch (err) {
         res.setHeader('Content-Type', 'application/json');
         res.end(JSON.stringify({ error: true, sector: 'Unknown' }));
      }
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), finbuddyInsightsPlugin()],
  server: {
    proxy: {
      '/api/finance': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/finance/, '/v8/finance/chart')
      }
    }
  }
})
