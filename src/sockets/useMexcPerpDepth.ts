// src/sockets/useMexcPerpDepth.ts
import { useEffect, useMemo, useRef, useState } from "react";

type Level = [string, string]; // [price, qty]

export function useMexcPerpDepth(symbol: string = "BTC_USDT", limit = 20, intervalMs = 1000) {
  const [bids, setBids] = useState<Level[]>([]);
  const [asks, setAsks] = useState<Level[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let aborted = false;

    async function fetchDepth() {
      try {
        const r = await fetch(
          `http://localhost:3001/api/mexc/perp-depth?symbol=${encodeURIComponent(symbol)}&limit=${limit}`
        );
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const json = (await r.json()) as { bids: [string, string][], asks: [string, string][] };

        if (!aborted) {
          setBids(json.bids || []);
          setAsks(json.asks || []);
        }
      } catch (e) {
        console.error("MEXC perp depth fetch error", e);
      }
    }

    fetchDepth();
    timerRef.current = window.setInterval(fetchDepth, intervalMs);

    return () => {
      aborted = true;
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [symbol, limit, intervalMs]);

  return useMemo(() => {
    const asksNum = asks.map(([p, q]) => [parseFloat(p), q] as [number, string]);
    const bidsNum = bids.map(([p, q]) => [parseFloat(p), q] as [number, string]);

    // asks: low → high (best ask first), then reverse for display
    const asksLowToHigh = asksNum.sort((a, b) => a[0] - b[0]).slice(0, 10);
    const asksHighToLow = [...asksLowToHigh].reverse();

    // bids: high → low
    const bidsHighToLow = bidsNum.sort((a, b) => b[0] - a[0]).slice(0, 10);

    // mid price
    const bestAsk = asksLowToHigh[0]?.[0];
    const bestBid = bidsHighToLow[0]?.[0];
    const mid = bestAsk && bestBid ? (bestAsk + bestBid) / 2 : 0;

    // totals for relative fill
    const totalAsk = Math.max(asksHighToLow.reduce((s, [, q]) => s + parseFloat(q), 0), 1);
    const totalBid = Math.max(bidsHighToLow.reduce((s, [, q]) => s + parseFloat(q), 0), 1);

    return {
      asksHL: asksHighToLow.map(([p, q]) => [String(p), q] as Level),
      bidsHL: bidsHighToLow.map(([p, q]) => [String(p), q] as Level),
      mid,
      totalAsk,
      totalBid,
    };
  }, [asks, bids]);
}