// src/sockets/useKucoinSocket.ts
import { useEffect, useState, useMemo, useRef } from "react";

type Order = [string, string];

export const useKucoinSocket = () => {
  const [bids, setBids] = useState<Order[]>([]);
  const [asks, setAsks] = useState<Order[]>([]);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const retryDelay = useRef<number>(5000); // start at 5s

  useEffect(() => {
    let ws: WebSocket | null = null;

    async function connect() {
      try {
        const API_BASE =
          import.meta.env.MODE === "development"
            ? "http://localhost:3001"
            : "https://pump-orderbook-3.onrender.com";

        const res = await fetch(`${API_BASE}/api/kucoin-session?product=futures`);
        if (!res.ok) throw new Error("Failed to fetch KuCoin session");
        const json = await res.json();

        const { token, instanceServers } = json.data;
        const endpoint = instanceServers[0].endpoint;

        const symbol = "PUMPUSDTM";
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

          // Reset retry delay on successful connect
          retryDelay.current = 5000;

          // Refresh before token expiry (~60s)
          if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
          reconnectTimer.current = setTimeout(() => {
            console.log("Refreshing KuCoin WS token...");
            ws?.close();
            connect();
          }, 55_000);
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);

            // ✅ Keepalive
            if (msg.type === "ping") {
              ws?.send(JSON.stringify({ id: msg.id || Date.now(), type: "pong" }));
              return;
            }

            // ✅ Market depth
            if (msg.topic === topic && msg.type === "message" && msg.data) {
              const { bids = [], asks = [] } = msg.data as {
                bids: [string, string][];
                asks: [string, string][];
              };

              setBids(bids);
              setAsks(asks);
            }
          } catch (err) {
            console.error("KuCoin WS parse error:", err, event.data);
          }
        };

        ws.onerror = (err) => console.error("KuCoin WS error:", err);

        ws.onclose = () => {
          console.warn("KuCoin WS closed ❌");

          // Retry with backoff
          if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
          reconnectTimer.current = setTimeout(() => {
            console.log(`Reconnecting in ${retryDelay.current / 1000}s...`);
            connect();
            retryDelay.current = Math.min(retryDelay.current * 2, 60000); // cap at 60s
          }, retryDelay.current);
        };
      } catch (err) {
        console.error("KuCoin WS setup failed:", err);

        // Retry with backoff
        if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
        reconnectTimer.current = setTimeout(() => {
          console.log(`Retrying connection in ${retryDelay.current / 1000}s...`);
          connect();
          retryDelay.current = Math.min(retryDelay.current * 2, 60000);
        }, retryDelay.current);
      }
    }

    connect();

    return () => {
      if (ws) ws.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, []);

  // Sort + slice for display
  const view = useMemo(() => {
    const bidsNum = bids.map(([p, q]) => [parseFloat(p), q] as [number, string]);
    const asksNum = asks.map(([p, q]) => [parseFloat(p), q] as [number, string]);

    const bidsHighToLow = bidsNum.sort((a, b) => b[0] - a[0]).slice(0, 10);
    const asksLowToHigh = asksNum.sort((a, b) => a[0] - b[0]).slice(0, 10);
    const asksHighToLow = [...asksLowToHigh].reverse();

    return {
      bids: bidsHighToLow.map(([p, q]) => [String(p), q] as Order),
      asks: asksHighToLow.map(([p, q]) => [String(p), q] as Order),
    };
  }, [bids, asks]);

  return view;
};