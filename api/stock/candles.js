export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { symbol, resolution, from, to } = req.query;

  try {
    // Use Yahoo Finance chart API (free, no key required)
    const interval = resolution === "D" || resolution === "1" ? "1d" : resolution === "W" ? "1wk" : "1d";
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${from}&period2=${to}&interval=${interval}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });
    const raw = await response.json();

    const result = raw?.chart?.result?.[0];
    if (!result || !result.timestamp) {
      return res.status(200).json({ s: "no_data" });
    }

    const quotes = result.indicators?.quote?.[0];

    // Convert Yahoo format to Finnhub-compatible format
    const data = {
      t: result.timestamp,
      o: quotes?.open || [],
      h: quotes?.high || [],
      l: quotes?.low || [],
      c: quotes?.close || [],
      v: quotes?.volume || [],
      s: "ok",
    };

    res.status(200).json(data);
  } catch (err) {
    console.error("Candles error:", err);
    res.status(500).json({ error: err.message });
  }
}
