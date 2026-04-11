# Finbuddy: Professional Portfolio Terminal & Market Intelligence Engine

Finbuddy is a React-powered, full-stack intelligence platform dedicated to seamlessly aggregating personal stock portfolios while scraping actionable AI insights natively from Google News and Yahoo Finance. 

Built strictly for single-minded portfolio intelligence, Finbuddy tracks Indian (NSE/BSE) stock health, provides smart CSV importer ingestion, and ranks incoming Google News via custom, deep-integrated Natural Language Processing (AFINN sentiment dictionary).

## 🚀 Key Features

* **Cinematic Analytics HUD**: An immersive, dark-mode 3x3 dashboard structure showcasing absolute asset exposure, Donut Allocations, and precise weighting tables using sleek glassmorphism panels.
* **NLP Intelligence Scraper (Sentiment Engine)**: An internal Vite API interceptor seamlessly tracks the Google News RSS endpoints to load targeted headlines. Those headlines are mathematically processed via a Natural Language Processing Sentiment Engine to badge breaking news with Live Market Sentiments (🟢 Positive, 🔴 Negative, ⚪ Neutral).
* **Deep Financial Proxy Framework**: Fully intercepts and wraps `yahoo-finance2` metrics under the hood perfectly dodging CORS to deliver Book Value, PE ratios, and dividend data directly into the DOM via a Z-Index 50 Absolute Screen Modal.
* **One-Click Vault Importer**: Intelligently auto-parses your raw CSV broker statements via regex heuristic pattern detection, seamlessly mapping arrays of new equity data strictly to your Supabase cloud backend in under a second. 

## 🛠️ Stack & Technologies Used

- **Frontend Core**: React Elements mapped via Vite (ESM routing powered by `react-router-dom`).
- **Styling Architecture**: Vanilla CSS with robust design variables, dynamic animations, and structural Glassmorphism aesthetics (`backdrop-filter`).
- **Intelligent Visualizations**: Recharts (Custom customized active-shape grouping algorithms routing the "Top 6" slicing).
- **Backend Infrastructure**: Supabase / PostgreSQL handling robust transactional logic and synchronizations across your cloud tables.
- **Custom Node Edge Pipelines**: 
  - `rss-parser` (Firing backend algorithmic queries mapping `GET` requests to Google News specifically engineered for the `en-IN` India locale feed).
  - `yahoo-finance2` (V3 Architecture integration for scraping granular metrics: Market Cap, 52W High/Lows, and ROA metrics).
  - `sentiment` (NLP Textual Analysis dictionary mapping tool calculating numeric weights inside the proxy before mapping back the JSON).

## 📦 Setup & Live Build Instructions

1. Retrieve the project and immediately execute `npm install` inside the root to securely reconstruct all client, charting, and backend node scraping packages.
2. Guarantee you have appropriately mounted the `.env` root keys defining `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Ignite the system using `npm run dev`. *The active Node Backend Server will actively mount the specialized middleware HTTP RSS proxy simultaneously while building the React UI!*
4. Access the command terminal bridge via `http://localhost:5173/`.
