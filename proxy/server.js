require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "2mb" }));

// ─── Health ──────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ─── Gemini Chat Completions (OpenAI-compatible proxy) ───
app.post("/api/chat", async (req, res) => {
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    // If streaming, pipe raw bytes back
    if (req.body.stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      const reader = response.body.getReader();
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) { res.end(); return; }
          res.write(value);
        }
      };
      await pump();
    } else {
      const data = await response.json();
      res.json(data);
    }
  } catch (err) {
    console.error("Gemini proxy error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Finnhub: Stock Quote ────────────────────────────────
app.get("/api/stock/quote", async (req, res) => {
  try {
    const { symbol } = req.query;
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`;
    const data = await fetch(url).then((r) => r.json());
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Finnhub: Stock Candles (historical prices) ─────────
app.get("/api/stock/candles", async (req, res) => {
  try {
    const { symbol, resolution, from, to } = req.query;
    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution || "D"}&from=${from}&to=${to}&token=${process.env.FINNHUB_API_KEY}`;
    const data = await fetch(url).then((r) => r.json());
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Finnhub: Company News ──────────────────────────────
app.get("/api/stock/news", async (req, res) => {
  try {
    const { symbol, from, to } = req.query;
    const url = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${process.env.FINNHUB_API_KEY}`;
    const data = await fetch(url).then((r) => r.json());
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Finnhub: Company Profile ───────────────────────────
app.get("/api/stock/profile", async (req, res) => {
  try {
    const { symbol } = req.query;
    const url = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`;
    const data = await fetch(url).then((r) => r.json());
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Finnhub: Basic Financials ──────────────────────────
app.get("/api/stock/financials", async (req, res) => {
  try {
    const { symbol } = req.query;
    const url = `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${process.env.FINNHUB_API_KEY}`;
    const data = await fetch(url).then((r) => r.json());
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
});
