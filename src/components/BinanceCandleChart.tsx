import React, { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  LineData,
  Time,
} from "lightweight-charts";
import { useBinanceTrades } from "../sockets/useBinanceTrades";

type Candle = {
  open: number;
  high: number;
  low: number;
  close: number;
};

export default function BinanceCandleChart() {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartApi = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const ema20Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const ema50Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const ema200Ref = useRef<ISeriesApi<"Line"> | null>(null);

  const [candles, setCandles] = useState<Record<number, Candle>>({});
  const trades = useBinanceTrades("PUMPUSDT");

  // Init chart
  useEffect(() => {
    if (!chartRef.current) return;

    chartApi.current = createChart(chartRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#111" },
        textColor: "#DDD",
      },
      grid: {
        vertLines: { color: "#222" },
        horzLines: { color: "#222" },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
      },
      leftPriceScale: {
        borderColor: "#555",
        visible: true,
      },
      rightPriceScale: {
        borderColor: "#555",
        visible: true,
      },
    });

    // Candlesticks → RIGHT scale (6 decimals)
    seriesRef.current = chartApi.current.addCandlestickSeries({
      upColor: "#26a69a",
      borderUpColor: "#26a69a",
      wickUpColor: "#26a69a",
      downColor: "#ef5350",
      borderDownColor: "#ef5350",
      wickDownColor: "#ef5350",
      priceScaleId: "right",
      priceFormat: { type: "price", precision: 6, minMove: 0.000001 },
    });

    // EMAs → LEFT scale (6 decimals)
    const emaFmt = { type: "price", precision: 6, minMove: 0.000001 } as const;

    ema20Ref.current = chartApi.current.addLineSeries({
      color: "#f39c12",
      lineWidth: 2,
      priceScaleId: "left",
      priceFormat: emaFmt,
    });
    ema50Ref.current = chartApi.current.addLineSeries({
      color: "#2980b9",
      lineWidth: 2,
      priceScaleId: "left",
      priceFormat: emaFmt,
    });
    ema200Ref.current = chartApi.current.addLineSeries({
      color: "#9b59b6",
      lineWidth: 2,
      priceScaleId: "left",
      priceFormat: emaFmt,
    });

    return () => {
      chartApi.current?.remove();
    };
  }, []);

  // Turn trades into 1s candles
  useEffect(() => {
    if (trades.length === 0) return;

    setCandles((prev) => {
      const updated = { ...prev };

      trades.forEach((t) => {
        const price = Number(t.price);
        const ts = Number(t.time);
        const sec = Math.floor(ts / 1000);

        if (!updated[sec]) {
          updated[sec] = { open: price, high: price, low: price, close: price };
        } else {
          updated[sec].high = Math.max(updated[sec].high, price);
          updated[sec].low = Math.min(updated[sec].low, price);
          updated[sec].close = price;
        }
      });

      return updated;
    });
  }, [trades]);

  // EMA calculation
  const calcEMA = (values: number[], length: number): number[] => {
    const k = 2 / (length + 1);
    const ema: number[] = [];
    values.forEach((val, i) => {
      if (i === 0) ema.push(val);
      else ema.push(val * k + ema[i - 1] * (1 - k));
    });
    return ema;
  };

  // Push candles + EMAs to chart
  useEffect(() => {
    if (!seriesRef.current) return;

    const sorted: CandlestickData<Time>[] = Object.entries(candles)
      .map(([sec, c]) => {
        if (
          !c.open || !c.high || !c.low || !c.close ||
          c.open <= 0 || c.high <= 0 || c.low <= 0 || c.close <= 0
        ) {
          return null;
        }
        return {
          time: Number(sec) as Time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        };
      })
      .filter((c): c is CandlestickData<Time> => c !== null)
      .sort((a, b) => Number(a.time) - Number(b.time));

    if (sorted.length > 0) {
      seriesRef.current.setData(sorted);
      seriesRef.current.update(sorted[sorted.length - 1]);

      const closes = sorted.map((c) => c.close);
      const times = sorted.map((c) => c.time);

      const ema20 = calcEMA(closes, 20);
      const ema50 = calcEMA(closes, 50);
      const ema200 = calcEMA(closes, 200);

      ema20Ref.current?.setData(
        times.map((t, i) => ({ time: t, value: ema20[i] } as LineData<Time>))
      );
      ema50Ref.current?.setData(
        times.map((t, i) => ({ time: t, value: ema50[i] } as LineData<Time>))
      );
      ema200Ref.current?.setData(
        times.map((t, i) => ({ time: t, value: ema200[i] } as LineData<Time>))
      );
    }
  }, [candles]);

  return (
    <div
      ref={chartRef}
      style={{ width: "100%", height: "30vh" }}
    />
  );
}