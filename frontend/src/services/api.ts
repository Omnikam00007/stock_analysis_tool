/* ─── API Service ─────────────────────────────────────────
   All communication with our proxy server lives here.
   ─────────────────────────────────────────────────────── */

const PROXY_URL = import.meta.env.VITE_PROXY_URL || "http://localhost:3001";

// ── Types ────────────────────────────────────────────────

export interface StockQuote {
  c: number;   // current price
  d: number;   // change
  dp: number;  // percent change
  h: number;   // high
  l: number;   // low
  o: number;   // open
  pc: number;  // previous close
  t: number;   // timestamp
}

export interface StockCandle {
  c: number[];  // close
  h: number[];  // high
  l: number[];  // low
  o: number[];  // open
  v: number[];  // volume
  t: number[];  // timestamps
  s: string;    // status
}

export interface NewsItem {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

export interface CompanyProfile {
  country: string;
  currency: string;
  exchange: string;
  finnhubIndustry: string;
  ipo: string;
  logo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

// ── Stock Data APIs ──────────────────────────────────────

export async function getStockQuote(symbol: string): Promise<StockQuote> {
  const res = await fetch(`${PROXY_URL}/api/stock/quote?symbol=${encodeURIComponent(symbol)}`);
  if (!res.ok) throw new Error(`Quote fetch failed: ${res.statusText}`);
  return res.json();
}

export async function getStockCandles(
  symbol: string,
  resolution: string = "D",
  from: number,
  to: number
): Promise<StockCandle> {
  const params = new URLSearchParams({
    symbol,
    resolution,
    from: String(from),
    to: String(to),
  });
  const res = await fetch(`${PROXY_URL}/api/stock/candles?${params}`);
  if (!res.ok) throw new Error(`Candles fetch failed: ${res.statusText}`);
  return res.json();
}

export async function getCompanyNews(
  symbol: string,
  from: string,
  to: string
): Promise<NewsItem[]> {
  const params = new URLSearchParams({ symbol, from, to });
  const res = await fetch(`${PROXY_URL}/api/stock/news?${params}`);
  if (!res.ok) throw new Error(`News fetch failed: ${res.statusText}`);
  return res.json();
}

export async function getCompanyProfile(symbol: string): Promise<CompanyProfile> {
  const res = await fetch(`${PROXY_URL}/api/stock/profile?symbol=${encodeURIComponent(symbol)}`);
  if (!res.ok) throw new Error(`Profile fetch failed: ${res.statusText}`);
  return res.json();
}

export async function getBasicFinancials(symbol: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${PROXY_URL}/api/stock/financials?symbol=${encodeURIComponent(symbol)}`);
  if (!res.ok) throw new Error(`Financials fetch failed: ${res.statusText}`);
  return res.json();
}

// ── OpenAI Chat ──────────────────────────────────────────

export async function sendChatToProxy(
  messages: ChatMessage[],
  tools: unknown[]
): Promise<Response> {
  const res = await fetch(`${PROXY_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o",
      messages,
      tools,
      tool_choice: "auto",
      stream: false,
    }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Chat API error (${res.status}): ${errBody}`);
  }
  return res;
}
