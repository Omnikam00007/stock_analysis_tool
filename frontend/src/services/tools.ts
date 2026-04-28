/* ─── Tool Definitions & Executor ─────────────────────────
   Defines the OpenAI function-calling tool schemas and
   executes tool calls by dispatching to our API + indicator
   services.
   ─────────────────────────────────────────────────────── */

import {
  getStockQuote,
  getStockCandles,
  getCompanyNews,
  getCompanyProfile,
  getBasicFinancials,
  type StockQuote,
  type StockCandle,
  type NewsItem,
  type CompanyProfile,
} from "./api";
import {
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateSMA,
  calculateEMA,
  runAllIndicators,
  type IndicatorResult,
} from "./indicators";

// ── Tool result types ────────────────────────────────────

export type ToolResultType =
  | "quote"
  | "chart"
  | "news"
  | "indicator"
  | "profile"
  | "financials"
  | "error";

export interface ToolResult {
  type: ToolResultType;
  title: string;
  symbol: string;
  data: unknown;
}

// ── OpenAI Tool Schemas ──────────────────────────────────

export const TOOL_DEFINITIONS = [
  {
    type: "function" as const,
    function: {
      name: "get_stock_quote",
      description:
        "Get the current real-time stock quote for a given ticker symbol. Returns current price, daily change, high, low, open, and previous close.",
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "The stock ticker symbol (e.g., AAPL, TSLA, MSFT)",
          },
        },
        required: ["symbol"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_stock_chart",
      description:
        "Get historical candlestick price data for a stock to render a chart. Specify the ticker symbol and number of days to look back.",
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "The stock ticker symbol (e.g., AAPL, TSLA)",
          },
          days: {
            type: "number",
            description: "Number of days of history to retrieve (default 90, max 365)",
          },
        },
        required: ["symbol"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_technical_indicators",
      description:
        "Calculate technical indicators (RSI, MACD, Bollinger Bands, SMA, EMA) for a stock. Uses the last 180 days of data.",
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "The stock ticker symbol",
          },
          indicator: {
            type: "string",
            enum: ["RSI", "MACD", "BOLLINGER", "SMA", "EMA", "ALL"],
            description:
              "Which indicator to calculate. Use ALL to run all indicators.",
          },
          period: {
            type: "number",
            description: "Period for the indicator (e.g., 14 for RSI, 20 for SMA). Optional — uses defaults if omitted.",
          },
        },
        required: ["symbol"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_company_news",
      description:
        "Get the latest news articles about a company. Returns headlines, sources, and summaries.",
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "The stock ticker symbol",
          },
          days: {
            type: "number",
            description: "How many days back to search for news (default 7)",
          },
        },
        required: ["symbol"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_company_profile",
      description:
        "Get the company profile including name, industry, market cap, IPO date, logo, and website.",
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "The stock ticker symbol",
          },
        },
        required: ["symbol"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_financials",
      description:
        "Get basic financial metrics and ratios for a company, including PE ratio, EPS, 52-week high/low, dividend yield, etc.",
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "The stock ticker symbol",
          },
        },
        required: ["symbol"],
      },
    },
  },
];

// ── Tool Executor ────────────────────────────────────────

export async function executeTool(
  toolName: string,
  argsStr: string
): Promise<ToolResult> {
  const args = JSON.parse(argsStr);
  const symbol: string = (args.symbol || "").toUpperCase();

  try {
    switch (toolName) {
      case "get_stock_quote": {
        const quote: StockQuote = await getStockQuote(symbol);
        return { type: "quote", title: `${symbol} Quote`, symbol, data: quote };
      }

      case "get_stock_chart": {
        const days = Math.min(args.days || 90, 365);
        const to = Math.floor(Date.now() / 1000);
        const from = to - days * 24 * 60 * 60;
        const candles: StockCandle = await getStockCandles(symbol, "D", from, to);
        if (candles.s === "no_data") {
          return {
            type: "error",
            title: `No chart data for ${symbol}`,
            symbol,
            data: { message: "No candle data available for this symbol/range." },
          };
        }
        return { type: "chart", title: `${symbol} — ${days}D Chart`, symbol, data: candles };
      }

      case "get_technical_indicators": {
        const days = 180;
        const to = Math.floor(Date.now() / 1000);
        const from = to - days * 24 * 60 * 60;
        const candles: StockCandle = await getStockCandles(symbol, "D", from, to);
        if (candles.s === "no_data" || !candles.c) {
          return {
            type: "error",
            title: "Indicator Error",
            symbol,
            data: { message: "Not enough price data to calculate indicators." },
          };
        }

        const closes = candles.c;
        const indicator = (args.indicator || "ALL").toUpperCase();
        const period = args.period;

        let results: IndicatorResult[];
        switch (indicator) {
          case "RSI":
            results = [calculateRSI(closes, period || 14)];
            break;
          case "MACD":
            results = [calculateMACD(closes)];
            break;
          case "BOLLINGER":
            results = [calculateBollingerBands(closes, period || 20)];
            break;
          case "SMA":
            results = [calculateSMA(closes, period || 20)];
            break;
          case "EMA":
            results = [calculateEMA(closes, period || 20)];
            break;
          default:
            results = runAllIndicators(closes);
        }

        return {
          type: "indicator",
          title: `${symbol} — ${indicator === "ALL" ? "All Indicators" : indicator}`,
          symbol,
          data: results,
        };
      }

      case "get_company_news": {
        const days = args.days || 7;
        const to = new Date();
        const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
        const fmt = (d: Date) => d.toISOString().split("T")[0];
        const news: NewsItem[] = await getCompanyNews(symbol, fmt(from), fmt(to));
        return {
          type: "news",
          title: `${symbol} — Latest News`,
          symbol,
          data: news.slice(0, 8),
        };
      }

      case "get_company_profile": {
        const profile: CompanyProfile = await getCompanyProfile(symbol);
        return { type: "profile", title: `${symbol} — Company Profile`, symbol, data: profile };
      }

      case "get_financials": {
        const financials = await getBasicFinancials(symbol);
        return { type: "financials", title: `${symbol} — Key Financials`, symbol, data: financials };
      }

      default:
        return {
          type: "error",
          title: "Unknown Tool",
          symbol: "",
          data: { message: `Unknown tool: ${toolName}` },
        };
    }
  } catch (err) {
    return {
      type: "error",
      title: `Error: ${toolName}`,
      symbol,
      data: { message: (err as Error).message },
    };
  }
}
