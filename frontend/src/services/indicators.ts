/* ─── Technical Indicators Service ────────────────────────
   Wraps the `technicalindicators` npm library.
   All computation runs purely in the browser.
   ─────────────────────────────────────────────────────── */

import { RSI, MACD, BollingerBands, SMA, EMA } from "technicalindicators";

export interface IndicatorResult {
  name: string;
  value: number | string;
  signal?: string; // "bullish" | "bearish" | "neutral"
  details?: Record<string, number | string>;
}

// ── RSI ──────────────────────────────────────────────────
export function calculateRSI(closes: number[], period: number = 14): IndicatorResult {
  const values = RSI.calculate({ values: closes, period });
  const latest = values[values.length - 1];

  let signal: string = "neutral";
  if (latest < 30) signal = "bullish"; // oversold
  if (latest > 70) signal = "bearish"; // overbought

  return {
    name: "RSI",
    value: Math.round(latest * 100) / 100,
    signal,
    details: {
      period,
      interpretation:
        latest < 30 ? "Oversold" : latest > 70 ? "Overbought" : "Neutral",
    },
  };
}

// ── MACD ─────────────────────────────────────────────────
export function calculateMACD(
  closes: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): IndicatorResult {
  const values = MACD.calculate({
    values: closes,
    fastPeriod,
    slowPeriod,
    signalPeriod,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });

  const latest = values[values.length - 1];
  const macdVal = latest?.MACD ?? 0;
  const signalVal = latest?.signal ?? 0;
  const histogram = latest?.histogram ?? 0;

  let signal: string = "neutral";
  if (macdVal > signalVal) signal = "bullish";
  if (macdVal < signalVal) signal = "bearish";

  return {
    name: "MACD",
    value: Math.round(macdVal * 100) / 100,
    signal,
    details: {
      macd: Math.round(macdVal * 100) / 100,
      signal: Math.round(signalVal * 100) / 100,
      histogram: Math.round(histogram * 100) / 100,
    },
  };
}

// ── Bollinger Bands ──────────────────────────────────────
export function calculateBollingerBands(
  closes: number[],
  period: number = 20,
  stdDev: number = 2
): IndicatorResult {
  const values = BollingerBands.calculate({
    period,
    values: closes,
    stdDev,
  });

  const latest = values[values.length - 1];
  const currentPrice = closes[closes.length - 1];

  let signal: string = "neutral";
  if (currentPrice <= latest.lower) signal = "bullish";
  if (currentPrice >= latest.upper) signal = "bearish";

  return {
    name: "Bollinger Bands",
    value: Math.round(latest.middle * 100) / 100,
    signal,
    details: {
      upper: Math.round(latest.upper * 100) / 100,
      middle: Math.round(latest.middle * 100) / 100,
      lower: Math.round(latest.lower * 100) / 100,
      bandwidth: Math.round(((latest.upper - latest.lower) / latest.middle) * 10000) / 100,
    },
  };
}

// ── SMA ──────────────────────────────────────────────────
export function calculateSMA(closes: number[], period: number = 20): IndicatorResult {
  const values = SMA.calculate({ period, values: closes });
  const latest = values[values.length - 1];
  const currentPrice = closes[closes.length - 1];

  let signal: string = "neutral";
  if (currentPrice > latest) signal = "bullish";
  if (currentPrice < latest) signal = "bearish";

  return {
    name: `SMA(${period})`,
    value: Math.round(latest * 100) / 100,
    signal,
    details: { period, currentPrice: Math.round(currentPrice * 100) / 100 },
  };
}

// ── EMA ──────────────────────────────────────────────────
export function calculateEMA(closes: number[], period: number = 20): IndicatorResult {
  const values = EMA.calculate({ period, values: closes });
  const latest = values[values.length - 1];
  const currentPrice = closes[closes.length - 1];

  let signal: string = "neutral";
  if (currentPrice > latest) signal = "bullish";
  if (currentPrice < latest) signal = "bearish";

  return {
    name: `EMA(${period})`,
    value: Math.round(latest * 100) / 100,
    signal,
    details: { period, currentPrice: Math.round(currentPrice * 100) / 100 },
  };
}

// ── Run All Indicators ───────────────────────────────────
export function runAllIndicators(closes: number[]): IndicatorResult[] {
  if (!closes || closes.length < 30) {
    return [{ name: "Error", value: "Not enough data points (need 30+)", signal: "neutral" }];
  }

  return [
    calculateRSI(closes),
    calculateMACD(closes),
    calculateBollingerBands(closes),
    calculateSMA(closes, 20),
    calculateSMA(closes, 50),
    calculateEMA(closes, 12),
    calculateEMA(closes, 26),
  ];
}
