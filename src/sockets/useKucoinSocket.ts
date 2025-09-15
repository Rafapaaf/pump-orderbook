// src/sockets/useKucoinSocket.ts
import { useEffect, useState, useMemo } from "react";

type Order = [string, string];

export const useKucoinSocket = () => {
  const [bids, setBids] = useState<Order[]>([]);
  const [asks, setAsks] = useState<Order[]>([]);

  useEffect(() => {
    let ws: WebSocket | null = null;

    async function connect() {
      try {
        // Hit your local proxy server to get KuCoin session
        const API_BASE =
          import.meta.env.MODE === "development"
            ? "http://localhost:3001"
            : "https://pump-orderbook-3.onrender.com";

        const res = await fetch(`${API_BASE}/api/kucoin-session`);
        if (!res.ok) throw new Error("Failed to fetch KuCoin session");
        const json = await res.json();

        const { token, instanceServers } = json.data;
        const endpoint = instanceServers[0].endpoint;

        const symbol = "PUMPUSDTM"; // KuCoin perps symbol
        const topic = `/contractMarket/level2Depth50:${symbol}`;
        const LIMIT = 10;

        ws = new WebSocket(`${endpoint}?token=${token}`);

        ws.onopen = () => {
          console.log("KuCoin WS connected ✅");
          ws?.send(
            JSON.stringify({
              id: Date.now(),
              type: "subscribe",
              topic,
              privateChannel: false,
              response: true,
            })
          );
        };

        ws.onmessage = (event) => {
          const msg = JSON.parse(event.data);

          if (msg.topic === topic && msg.type === "message" && msg.data) {
            const { bids = [], asks = [] } = msg.data as {
              bids: [string, string][];
              asks: [string, string][];
            };

            // Store raw values (we'll sort in useMemo)
            setBids(bids);
            setAsks(asks);
          }
        };

        ws.onerror = (err) => console.error("KuCoin WS error:", err);
        ws.onclose = () => console.warn("KuCoin WS closed ❌");
      } catch (err) {
        console.error("KuCoin WS setup failed:", err);
      }
    }

    connect();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  // 🟢 Sort + slice for display
  const view = useMemo(() => {
    const bidsNum = bids.map(([p, q]) => [parseFloat(p), q] as [number, string]);
    const asksNum = asks.map(([p, q]) => [parseFloat(p), q] as [number, string]);

    // bids: high → low
    const bidsHighToLow = bidsNum.sort((a, b) => b[0] - a[0]).slice(0, 10);

    // asks: low → high (exchange best ask first), then reverse for high → low display
    const asksLowToHigh = asksNum.sort((a, b) => a[0] - b[0]).slice(0, 10);
    const asksHighToLow = [...asksLowToHigh].reverse();

    return {
      bids: bidsHighToLow.map(([p, q]) => [String(p), q] as Order),
      asks: asksHighToLow.map(([p, q]) => [String(p), q] as Order),
    };
  }, [bids, asks]);

  return view; // { bids, asks }
};