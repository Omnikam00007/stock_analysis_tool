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

    // Use a small delay to ensure the container has rendered with proper dimensions
    const timer = setTimeout(() => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.clientWidth || 600;
      const containerHeight = 380;

      const chart = createChart(containerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: "#111827" },
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
        width: containerWidth,
        height: containerHeight,
      });

      chartRef.current = chart;

      // Build candle data — filter out null values from Yahoo Finance
      const data = candles.t
        .map((t, i) => ({
          time: t as number,
          open: candles.o[i],
          high: candles.h[i],
          low: candles.l[i],
          close: candles.c[i],
        }))
        .filter(
          (d) =>
            d.open != null &&
            d.high != null &&
            d.low != null &&
            d.close != null &&
            !isNaN(d.open) &&
            !isNaN(d.close)
        )
        .sort((a, b) => a.time - b.time);

      if (data.length === 0) return;

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
          .filter((d) => d.value != null && !isNaN(d.value))
          .sort((a, b) => a.time - b.time);

        volumeSeries.setData(volumeData as any);
      }

      chart.timeScale().fitContent();

      // Resize observer
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width } = entry.contentRect;
          if (width > 0) {
            chart.applyOptions({ width, height: containerHeight });
          }
        }
      });

      resizeObserver.observe(containerRef.current!);

      // Store cleanup
      return () => {
        resizeObserver.disconnect();
        chart.remove();
        chartRef.current = null;
      };
    }, 100);

    return () => {
      clearTimeout(timer);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [candles, symbol]);

  return (
    <div className="chart-container">
      <div ref={containerRef} className="chart-container-full" />
    </div>
  );
}
