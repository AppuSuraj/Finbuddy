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
            
            // Map NLP Sentiment and convert to standard UI format
            news = itemsToParse.map(item => {
               const analysis = sentimentAnalyzer.analyze(item.title);
               let grade = 'Neutral';
               if (analysis.score > 0) grade = 'Positive';
               if (analysis.score < 0) grade = 'Negative';
               
               // Google News puts publisher after a dash in the title sometimes: "Headline - Source"
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
                 sentimentGrade: grade 
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
