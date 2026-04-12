import fs from 'fs';

const file = 'src/components/Dashboard.jsx';
let content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

// Replace lines 14-24 (0-indexed: 13-23) with new FEATURES + STEPS
const newFeatures = `const FEATURES = [
  {
    icon: Radar,
    color: '#2dd4bf',
    title: "Your Portfolio's Sentiment \u2014 Not The Market's",
    desc: 'Forget generic market heat. Finbuddy analyses news of only the stocks you own, giving you a personalised Bullish/Bearish score tailored to your exact holdings \u2014 no noise, all signal.',
  },
  {
    icon: ShieldCheck,
    color: '#0ea5e9',
    title: 'Deep Technical Scrutiny on Every Holding',
    desc: 'Click any stock to instantly get DMA50/200 positioning, Golden Cross & Death Cross alerts, RSI zone, Bollinger Band position, and candle pattern detection.',
  },
  {
    icon: Radio,
    color: '#8b5cf6',
    title: 'Oracle Forecast Built Around Your Wealth',
    desc: "Our 6-month projection isn't a NIFTY copy. It models your specific holdings, sector weights, and live sentiment to render a growth curve that is uniquely yours.",
  },
];

const STEPS = [
  { num: '01', icon: FileUp, title: 'Import Your Portfolio', desc: "Go to Smart Import \u2192 Upload your broker's Holdings CSV. Zerodha, Upstox, Groww, and Angel Broking are supported." },
  { num: '02', icon: Zap, title: 'Run AI Intelligence Sync', desc: 'Click "Live Quotes" in Portfolio \u2192 AI auto-classifies all stocks into SEBI sectors and fetches live market prices in one pass.' },
  { num: '03', icon: TrendingUp, title: 'Your Dashboard Goes Live', desc: 'Return here to see your personalised Oracle forecast, your portfolio sentiment score, and deep technical analysis on each holding.' },
];`;

// Find and replace lines 13 to 24 (0-indexed)
const before = lines.slice(0, 13);
const after = lines.slice(24);
const newLines = [...before, ...newFeatures.split('\n'), ...after];
fs.writeFileSync(file, newLines.join('\n'), 'utf8');
console.log('✅ Updated FEATURES + STEPS in Dashboard.jsx');
