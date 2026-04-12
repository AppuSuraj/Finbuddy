# Finbuddy: SaaS Financial Intelligence Terminal

**Finbuddy** is a professional-grade SaaS application designed to provide high-fidelity insights into your Indian stock portfolio. It acts as a personalised financial command centre, built with React, Supabase, and a custom "Deep Scrutiny" AI research engine.

## 🚀 Live Environment
The application is deployed and accessible in the cloud:
- **Production URL**: [https://finbuddy-pi.vercel.app/](https://finbuddy-pi.vercel.app/)

---

## 🔥 Key Intelligence Features

### 1. Deep Technical Scrutiny
Finbuddy analyses 1-year of daily OHLCV data to compute actionable signals:
- **Trend Detection**: Strong Uptrend, Downtrend, or Sideways consolidation.
- **Moving Averages**: Live DMA 50 and DMA 200 tracking with **Golden Cross** and **Death Cross** alerts.
- **Momentum & Strength**: RSI (Relative Strength Index) and Bollinger Band positioning.
- **Candle Pattern Recognition**: Automatic detection of Hammer, Doji, and Engulfing patterns.

### 2. Institutional Flow Analysis (Premium)
Heuristic processing of price and volume action to identify big player activity:
- **FII/DII Sentiment**: Real-time sentiment scoring for institutional players.
- **Flow Logic**: Detection of Accumulation vs Distribution phases.

### 3. Oracle: AI Growth Forecast
- **Smart Projections**: Predictive 6-month wealth trajectory based on your specific portfolio weights and live market sentiment.

### 4. Alpha Performance Tracking
- **Market Benchmarking**: Real-time comparison of your portfolio trajectory against **NIFTY 50** and **SENSEX**.
- **Relative Momentum**: Normalized performance indexing to identify if you are outperforming the broader Indian market.

### 5. Portfolio Health & Risk Monitoring
- **Institutional Grading**: Sophisticated scoring engine (A+ to F) based on sector concentration and asset distribution.
- **Risk Mitigation Tips**: Automated "Correction Tips" that provide actionable advice on how to fix sector tilts and diversify risk.

### 6. Passive Income Monitor
- **Cash Flow Intelligence**: Automated tracking of estimated annual and monthly dividend income across all holdings.

---

## 🛠️ Technical Stack & Tools

Finbuddy utilizes a modern, serverless architecture for maximum reliability and speed:

| Tool | Purpose |
| :--- | :--- |
| **React 19 & Vite** | Core UI framework providing a lightning-fast, single-page experience. |
| **Supabase (PostgreSQL)** | Persistent storage with Row Level Security (RLS) and OAuth/Email authentication. |
| **Vercel Serverless** | Global API deployment for fetching live finance data and news feeds. |
| **Yahoo Finance (v7/v8)** | Primary source for high-fidelity market fundamentals and historical charts. |
| **RSS-Parser** | Aggregating news from Google News, Economic Times, and Moneycontrol. |
| **Sentiment (NLP)** | Natural Language Processing to score market headlines for bullish/bearish bias. |
| **Recharts** | Rendering high-performance, interactive portfolio and forecast charts. |
| **Lucide React** | A suite of premium, lightweight UI icons. |

## 📈 Current Roadmap
- [x] Persistent Global Data Caching.
- [x] "Analyst Note" Human-Readable Summaries.
- [x] Premium Tier Logic for Institutional Flows.
- [x] Oracle Predictive Forecast.
- [x] Dividend Yield Tracker & Income Forecast.
- [x] Portfolio Benchmarking (Alpha tracking vs NIFTY/Sensex).
- [ ] Automated Tax-Loss Harvesting Alerts.
- [ ] Multi-Currency Support (USD/EUR).

---
*Created by Suraj for the Finbuddy Terminal Project.*
