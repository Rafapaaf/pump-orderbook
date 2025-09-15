import { useEffect, useState } from "react";

type Order = [string, string];

export const useBybitSocket = () => {
  const [bids, setBids] = useState<Order[]>([]);
  const [asks, setAsks] = useState<Order[]>([]);

  useEffect(() => {
    const ws = new WebSocket("wss://stream.bybit.com/v5/public/linear");

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          op: "subscribe",
          args: ["orderbook.50.PUMPFUNUSDT"], // PUMP
        })
      );
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (!msg.topic?.includes("orderbook.50")) return;

      // Handle snapshot
      if (msg.type === "snapshot") {
        const { b = [], a = [] } = msg.data || {};
        setBids(b.slice(0, 10)); // top 10 only
        setAsks(a.slice(0, 10));
      }

      // Handle delta updates
      if (msg.type === "delta") {
        const { b = [], a = [] } = msg.data || {};

        setBids((prev) => {
          const map = new Map(prev);
          b.forEach(([price, size]: Order) => {
            if (parseFloat(size) === 0) {
              map.delete(price); // remove level
            } else {
              map.set(price, size);
            }
          });
          return Array.from(map.entries())
            .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0])) // high → low
            .slice(0, 10);
        });

        setAsks((prev) => {
          const map = new Map(prev);
          a.forEach(([price, size]: Order) => {
            if (parseFloat(size) === 0) {
              map.delete(price);
            } else {
              map.set(price, size);
            }
          });
          return Array.from(map.entries())
            .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0])) // low → high
            .slice(0, 10);
        });
      }
    };

    ws.onerror = (err) => {
      console.error("Bybit WS error:", err);
    };

    ws.onclose = (event) => {
      console.warn("Bybit WS closed:", event);
    };

    return () => ws.close();
  }, []);

  return { bids, asks };
};