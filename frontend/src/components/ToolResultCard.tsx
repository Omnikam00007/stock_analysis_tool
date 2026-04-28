/* ─── ToolResultCard ──────────────────────────────────────
   Renders the visual result of a tool call inline in
   the output panel: quotes, charts, news, indicators, etc.
   ─────────────────────────────────────────────────────── */

import {
  BarChart3,
  TrendingUp,
  Newspaper,
  Building2,
  DollarSign,
  AlertTriangle,
  Activity,
} from "lucide-react";
import ChartWidget from "./ChartWidget";
import type { ToolResult } from "../services/tools";
import type { StockQuote, StockCandle, NewsItem, CompanyProfile } from "../services/api";
import type { IndicatorResult } from "../services/indicators";

interface ToolResultCardProps {
  result: ToolResult;
}

export default function ToolResultCard({ result }: ToolResultCardProps) {
  const { type, title } = result;

  const iconMap: Record<string, { icon: React.ReactNode; className: string }> = {
    quote: { icon: <DollarSign size={16} />, className: "quote" },
    chart: { icon: <BarChart3 size={16} />, className: "chart" },
    news: { icon: <Newspaper size={16} />, className: "news" },
    indicator: { icon: <Activity size={16} />, className: "indicator" },
    profile: { icon: <Building2 size={16} />, className: "profile" },
    financials: { icon: <TrendingUp size={16} />, className: "financials" },
    error: { icon: <AlertTriangle size={16} />, className: "quote" },
  };

  const { icon, className } = iconMap[type] || iconMap.error;

  return (
    <div className="tool-card" id={`tool-card-${type}-${result.symbol}`}>
      <div className="tool-card-header">
        <div className={`tool-card-icon ${className}`}>{icon}</div>
        <div>
          <div className="tool-card-title">{title}</div>
          <div className="tool-card-subtitle">{type.toUpperCase()} DATA</div>
        </div>
      </div>
      <div className="tool-card-body">{renderBody(result)}</div>
    </div>
  );
}

function renderBody(result: ToolResult) {
  switch (result.type) {
    case "quote":
      return <QuoteBody data={result.data as StockQuote} />;
    case "chart":
      return <ChartWidget candles={result.data as StockCandle} symbol={result.symbol} />;
    case "news":
      return <NewsBody data={result.data as NewsItem[]} />;
    case "indicator":
      return <IndicatorBody data={result.data as IndicatorResult[]} />;
    case "profile":
      return <ProfileBody data={result.data as CompanyProfile} />;
    case "financials":
      return <FinancialsBody data={result.data as Record<string, unknown>} />;
    case "error":
      return (
        <div className="error-banner">
          <AlertTriangle size={14} />
          {(result.data as { message: string }).message}
        </div>
      );
    default:
      return <pre>{JSON.stringify(result.data, null, 2)}</pre>;
  }
}

// ── Quote Body ───────────────────────────────────────────
function QuoteBody({ data }: { data: StockQuote }) {
  const changeClass = data.d >= 0 ? "positive" : "negative";
  return (
    <div className="quote-grid">
      <div className="quote-item">
        <div className="quote-item-label">Current</div>
        <div className="quote-item-value">${data.c?.toFixed(2)}</div>
      </div>
      <div className="quote-item">
        <div className="quote-item-label">Change</div>
        <div className={`quote-item-value ${changeClass}`}>
          {data.d >= 0 ? "+" : ""}
          {data.d?.toFixed(2)}
        </div>
      </div>
      <div className="quote-item">
        <div className="quote-item-label">Change %</div>
        <div className={`quote-item-value ${changeClass}`}>
          {data.dp >= 0 ? "+" : ""}
          {data.dp?.toFixed(2)}%
        </div>
      </div>
      <div className="quote-item">
        <div className="quote-item-label">Open</div>
        <div className="quote-item-value">${data.o?.toFixed(2)}</div>
      </div>
      <div className="quote-item">
        <div className="quote-item-label">High</div>
        <div className="quote-item-value">${data.h?.toFixed(2)}</div>
      </div>
      <div className="quote-item">
        <div className="quote-item-label">Low</div>
        <div className="quote-item-value">${data.l?.toFixed(2)}</div>
      </div>
    </div>
  );
}

// ── News Body ────────────────────────────────────────────
function NewsBody({ data }: { data: NewsItem[] }) {
  if (!data?.length) {
    return <p style={{ color: "var(--text-tertiary)", fontSize: "0.82rem" }}>No recent news found.</p>;
  }
  return (
    <div className="news-list">
      {data.map((item) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="news-item"
          style={{ textDecoration: "none" }}
        >
          <div className="news-item-content">
            <h4>{item.headline}</h4>
            <p>{item.summary?.slice(0, 120)}…</p>
            <div className="news-item-meta">
              <span>{item.source}</span>
              <span>{new Date(item.datetime * 1000).toLocaleDateString()}</span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

// ── Indicator Body ───────────────────────────────────────
function IndicatorBody({ data }: { data: IndicatorResult[] }) {
  return (
    <div className="indicator-grid">
      {data.map((ind, i) => (
        <div className="indicator-item" key={i}>
          <div className="indicator-item-label">{ind.name}</div>
          <div className="indicator-item-value">{ind.value}</div>
          {ind.signal && (
            <div
              className={`indicator-item-signal ${
                ind.signal === "bullish"
                  ? "signal-bullish"
                  : ind.signal === "bearish"
                  ? "signal-bearish"
                  : "signal-neutral"
              }`}
            >
              {ind.signal}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Profile Body ─────────────────────────────────────────
function ProfileBody({ data }: { data: CompanyProfile }) {
  if (!data?.name) {
    return <p style={{ color: "var(--text-tertiary)", fontSize: "0.82rem" }}>No profile data available.</p>;
  }

  const fields = [
    { label: "Name", value: data.name },
    { label: "Ticker", value: data.ticker },
    { label: "Industry", value: data.finnhubIndustry },
    { label: "Country", value: data.country },
    { label: "Exchange", value: data.exchange },
    { label: "IPO Date", value: data.ipo },
    {
      label: "Market Cap",
      value: data.marketCapitalization
        ? `$${(data.marketCapitalization / 1000).toFixed(1)}B`
        : "N/A",
    },
    { label: "Website", value: data.weburl || "N/A" },
  ];

  return (
    <div className="profile-info">
      {fields.map((f, i) => (
        <div className="profile-field" key={i}>
          <div className="profile-field-label">{f.label}</div>
          <div className="profile-field-value">{f.value}</div>
        </div>
      ))}
    </div>
  );
}

// ── Financials Body ──────────────────────────────────────
function FinancialsBody({ data }: { data: Record<string, unknown> }) {
  const metric = (data?.metric || {}) as Record<string, number | string | null>;

  const keyMetrics = [
    { label: "P/E Ratio", key: "peBasicExclExtraTTM" },
    { label: "EPS (TTM)", key: "epsBasicExclExtraItemsTTM" },
    { label: "52W High", key: "52WeekHigh" },
    { label: "52W Low", key: "52WeekLow" },
    { label: "Div Yield %", key: "dividendYieldIndicatedAnnual" },
    { label: "Beta", key: "beta" },
    { label: "ROE (TTM)", key: "roeTTM" },
    { label: "Revenue/Share", key: "revenuePerShareTTM" },
    { label: "Net Margin", key: "netProfitMarginTTM" },
  ];

  const available = keyMetrics.filter((m) => metric[m.key] != null);
  if (!available.length) {
    return <p style={{ color: "var(--text-tertiary)", fontSize: "0.82rem" }}>No financials available.</p>;
  }

  return (
    <div className="indicator-grid">
      {available.map((m, i) => {
        const val = metric[m.key];
        return (
          <div className="indicator-item" key={i}>
            <div className="indicator-item-label">{m.label}</div>
            <div className="indicator-item-value">
              {typeof val === "number" ? val.toFixed(2) : String(val)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
