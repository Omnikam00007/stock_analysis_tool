/* ─── ChartWidget ─────────────────────────────────────────
   Renders a TradingView Lightweight Chart from candle data.
   ─────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";
import { createChart, type IChartApi, ColorType } from "lightweight-charts";
import type { StockCandle } from "../services/api";

interface ChartWidgetProps {
  candles: StockCandle;
  symbol: string;
}

export default function ChartWidget({ candles, symbol }: ChartWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || !candles?.t?.length) return;

    // Dispose previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#94a3b8",
        fontFamily: "'Inter', sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.06)" },
        horzLines: { color: "rgba(148, 163, 184, 0.06)" },
      },
      crosshair: {
        vertLine: {
          color: "rgba(99, 102, 241, 0.4)",
          width: 1,
          style: 2,
          labelBackgroundColor: "#6366f1",
        },
        horzLine: {
          color: "rgba(99, 102, 241, 0.4)",
          width: 1,
          style: 2,
          labelBackgroundColor: "#6366f1",
        },
      },
      rightPriceScale: {
        borderColor: "rgba(148, 163, 184, 0.1)",
      },
      timeScale: {
        borderColor: "rgba(148, 163, 184, 0.1)",
        timeVisible: false,
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });

    chartRef.current = chart;

    // Build candle data sorted by time
    const data = candles.t
      .map((t, i) => ({
        time: t as number,
        open: candles.o[i],
        high: candles.h[i],
        low: candles.l[i],
        close: candles.c[i],
      }))
      .sort((a, b) => a.time - b.time);

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    candleSeries.setData(data as any);

    // Volume histogram
    if (candles.v?.length) {
      const volumeSeries = chart.addHistogramSeries({
        color: "rgba(99, 102, 241, 0.2)",
        priceFormat: { type: "volume" },
        priceScaleId: "",
      });

      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.85, bottom: 0 },
      });

      const volumeData = candles.t
        .map((t, i) => ({
          time: t as number,
          value: candles.v[i],
          color:
            candles.c[i] >= candles.o[i]
              ? "rgba(34, 197, 94, 0.25)"
              : "rgba(239, 68, 68, 0.25)",
        }))
        .sort((a, b) => a.time - b.time);

      volumeSeries.setData(volumeData as any);
    }

    chart.timeScale().fitContent();

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        chart.applyOptions({ width, height });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [candles, symbol]);

  return (
    <div className="chart-container">
      <div ref={containerRef} className="chart-container-full" />
    </div>
  );
}
