# StockPilot — AI Stock Analysis Tool

A frontend-first stock analysis tool powered by OpenAI's GPT-4o with tool calling, real-time market data from Finnhub, and interactive TradingView charts — all in the browser.

## Architecture

```
┌──────────────────────────────────────────────┐
│            React App (Vite + TS)             │
│  Chat UI ←→ OpenAI (tool calling) ←→ Tools  │
│  └─ Charts (lightweight-charts)              │
│  └─ Indicators (technicalindicators)         │
└──────────────┬───────────────────────────────┘
               │ fetch()
       ┌───────▼───────────┐
       │  Express Proxy    │  ← Holds API keys,
       │  (15 lines)       │    bypasses CORS
       └───────┬───────────┘
               │
       ┌───────▼───────────┐
       │  OpenAI + Finnhub │
       └───────────────────┘
```

## Quick Start

### 1. Setup API Keys

```bash
# In the proxy/ directory, create a .env file:
cd proxy
cp .env.example .env
# Edit .env and add your keys:
#   OPENAI_API_KEY=sk-...
#   FINNHUB_API_KEY=...
```

Get your free Finnhub API key at: https://finnhub.io/register

### 2. Install Dependencies

```bash
# Proxy
cd proxy
pnpm install     # or npm install

# Frontend
cd ../frontend
pnpm install     # or npm install
```

### 3. Run

Open **two terminals**:

```bash
# Terminal 1 — Proxy (port 3001)
cd proxy
pnpm start       # or node server.js

# Terminal 2 — Frontend (port 5173)
cd frontend
pnpm dev         # or npm run dev
```

Open http://localhost:5173 in your browser.

## Features

- 💬 **Chat Interface** — Ask about any stock in natural language
- 📊 **Interactive Charts** — Candlestick + volume charts via TradingView Lightweight Charts
- 📈 **Technical Indicators** — RSI, MACD, Bollinger Bands, SMA, EMA — computed in-browser
- 📰 **Company News** — Latest headlines from Finnhub
- 🏢 **Company Profiles** — Industry, market cap, IPO date
- 💰 **Key Financials** — P/E, EPS, Beta, ROE, and more
- 🤖 **OpenAI Tool Calling** — GPT-4o decides which tools to call automatically

## Example Prompts

- "Analyze AAPL stock"
- "Show me a 6-month chart for TSLA"
- "What's the RSI and MACD for NVDA?"
- "Get the latest news on AMZN"
- "Compare the financials of MSFT and GOOG"
