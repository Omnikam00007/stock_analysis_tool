const FINNHUB_BASE = "https://finnhub.io/api/v1";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { endpoint, ...params } = req.query;
  // endpoint will be like "quote", "candles", "news", "profile", "financials"

  const routes = {
    quote: `/quote?symbol=${params.symbol}`,
    candles: `/stock/candle?symbol=${params.symbol}&resolution=${params.resolution || "D"}&from=${params.from}&to=${params.to}`,
    news: `/company-news?symbol=${params.symbol}&from=${params.from}&to=${params.to}`,
    profile: `/stock/profile2?symbol=${params.symbol}`,
    financials: `/stock/metric?symbol=${params.symbol}&metric=all`,
  };

  const path = routes[endpoint];
  if (!path) {
    return res.status(400).json({ error: `Unknown endpoint: ${endpoint}` });
  }

  try {
    const url = `${FINNHUB_BASE}${path}&token=${process.env.FINNHUB_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
