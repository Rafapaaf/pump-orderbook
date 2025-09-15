import { useEffect, useState } from "react";

type Order = [string, string];

export const useBinanceSocket = (symbol: string = "PUMPUSDT") => {
  const [bids, setBids] = useState<Order[]>([]);
  const [asks, setAsks] = useState<Order[]>([]);

  useEffect(() => {
    const lowerSymbol = symbol.toLowerCase();
    const ws = new WebSocket(`wss://fstream.binance.com/ws/${lowerSymbol}@depth20@100ms`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // ✅ Correct fields for Binance Futures
      if (data.b && data.a) {
        console.log("WS Raw Data:", data);
        setBids(data.b.slice(0, 10)); // data.b = bids
        setAsks(data.a.slice(0, 10)); // data.a = asks
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    return () => ws.close();
  }, [symbol]);

  return { bids, asks };
};