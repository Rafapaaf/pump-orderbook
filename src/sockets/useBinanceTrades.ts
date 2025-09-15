// src/sockets/useBinanceTrades.ts
import { useEffect, useState } from "react";

type Trade = {
  time: number;   // ms timestamp
  price: number;
  qty: number;
  side: "buy" | "sell";
};

export function useBinanceTrades(symbol: string = "PUMPFUNUSDT") {
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    const ws = new WebSocket(
      `wss://fstream.binance.com/ws/${symbol.toLowerCase()}@trade`
    );

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      const trade: Trade = {
        time: msg.T, // trade time
        price: parseFloat(msg.p),
        qty: parseFloat(msg.q),
        side: msg.m ? "sell" : "buy", // maker=true → sell
      };
      setTrades((prev) => [...prev.slice(-1000), trade]); // keep last 1000 trades
    };

    return () => ws.close();
  }, [symbol]);

  return trades;
}