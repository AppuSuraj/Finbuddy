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
            // Searching via Google News RSS for highly targeted relevance
            const query = encodeURIComponent(`"${rawName}" stock news IN`);
            const feed = await rssParser.parseURL(`https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`);
            
            // Map NLP Sentiment and convert to standard UI format
            news = feed.items.slice(0, 6).map(item => {
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
