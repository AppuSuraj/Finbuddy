# Finbuddy: SaaS Financial Intelligence Terminal

**Finbuddy** is a professional-grade SaaS application designed to provide high-fidelity insights into your Indian stock portfolio. Built with React, Supabase, and a custom "Full Scrutiny" AI research engine.

## 🚀 Live Environment
The application is deployed and accessible in the cloud:
- **Production URL**: [https://finbuddy-git-vercel-install-818f51-surajsan1998-5474s-projects.vercel.app](https://finbuddy-git-vercel-install-818f51-surajsan1998-5474s-projects.vercel.app)

---

## 🔥 Key Intelligence Features

### 1. Quad-Layer Scrutiny Engine (Deep AI)
Unlike standard trackers, Finbuddy uses a multi-layer scraping architecture to accurately classify Indian assets:
- **Broad Sector / Industry Matching**: Automatic mapping of 5000+ NSE/BSE stocks to 58 precise SEBI industry categories.
- **On-Demand Research**: The "Deep Scrutiny" button triggers a focused 12-second AI browse of Screener.in and Yahoo Finance metadata to recover stubborn or unlisted assets.

### 2. Interactive Sector Analytics
- **Pie-Chart Drilldowns**: Click any sector segment on the donut chart to instantly filter your holdings list.
- **Real-Time Sentiment**: NLP-driven sentiment analysis on news feeds for every portfolio asset.

### 3. SaaS Multi-Tenant Security
- **Independent Portfolios**: Secure row-level security (RLS) via Supabase ensures guests see only their own data.
- **Smart Importer**: Heuristic CSV parsing with an automated "Onboarding Guide" for first-time users.

---

## 🛠️ Technical Stack
- **Frontend**: React 19 + Vite (High Performance)
- **Styling**: Oceanic Glassmorphism (Vanilla CSS)
- **Backend & Auth**: Supabase (PostgreSQL with RLS)
- **Hosting**: Vercel Serverless Functions (Node.js 20+)
- **Data Engine**: `yahoo-finance2`, `rss-parser`, `sentiment`.

## 📈 Roadmap
- [x] Production Vercel Migration.
- [x] Collapsible Responsive Sidebar.
- [x] Interactive Charts.
- [ ] Bank Statement Auto-Tagging.

---
*Created by Suraj for the Finbuddy Terminal Project.*
