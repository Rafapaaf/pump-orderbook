// src/sockets/useMexcSocket.ts
import { useEffect, useMemo, useRef, useState } from "react";

type Level = [string, string];

export function useMexcSocket(symbol: string = "BTC_USDT") {
  const [bids, setBids] = useState<Level[]>([]);
  const [asks, setAsks] = useState<Level[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const pingTimer = useRef<number | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3001/ws/mexc");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("MEXC WS connected ✅");
      const subMsg = {
        method: "sub.dealDepth",
        params: ["BTC_USDT"], // start with BTC for debugging
        id: 1
      };
      ws.send(JSON.stringify(subMsg));

      // keepalive
      pingTimer.current = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ method: "ping" }));
        }
      }, 20000);
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.channel === "push.dealDepth" && msg.data) {
          const { asks = [], bids = [] } = msg.data as {
            asks: [number, number][];
            bids: [number, number][];
          };
          setAsks(asks.map(([p, s]) => [String(p), String(s)]));
          setBids(bids.map(([p, s]) => [String(p), String(s)]));
        }
      } catch {
        // ignore non-JSON
      }
    };

    ws.onerror = (err) => console.error("MEXC WS error:", err);

    ws.onclose = () => {
      console.warn("MEXC WS closed ❌");
      if (pingTimer.current) {
        clearInterval(pingTimer.current);
        pingTimer.current = null;
      }
    };

    return () => {
      if (pingTimer.current) clearInterval(pingTimer.current);
      ws.close();
    };
  }, [symbol]);

  const view = useMemo(() => {
    const asksNum = asks.map(([p, a]) => [parseFloat(p), a] as [number, string]);
    const bidsNum = bids.map(([p, a]) => [parseFloat(p), a] as [number, string]);

    const asksLowToHigh = asksNum.sort((a, b) => a[0] - b[0]).slice(0, 10);
    const bidsHighToLow = bidsNum.sort((a, b) => b[0] - a[0]).slice(0, 10);

    const asksHighToLow = [...asksLowToHigh].reverse();

    return {
      asksHL: asksHighToLow.map(([p, a]) => [String(p), a] as Level),
      bidsHL: bidsHighToLow.map(([p, a]) => [String(p), a] as Level),
    };
  }, [asks, bids]);

  return { bids: view.bidsHL, asks: view.asksHL };
}