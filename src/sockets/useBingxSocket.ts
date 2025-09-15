import { useEffect, useState } from "react";
import pako from "pako";

type Order = [string, string];

export const useBingxSocket = () => {
  const [bids, setBids] = useState<Order[]>([]);
  const [asks, setAsks] = useState<Order[]>([]);

  useEffect(() => {
    const ws = new WebSocket("wss://open-api-swap.bingx.com/swap-market");

    ws.onopen = () => {
        console.log("BingX WS connected ✅");
        ws.send(
          JSON.stringify({
            id: Date.now().toString(),
            reqType: "sub",
            dataType: "depth20.BTC-USDT", // ✅ Correct format
            data: null,
          })
        );
      };

    ws.onmessage = async (event) => {
      try {
        let text: string;

        if (event.data instanceof Blob) {
          const buffer = await event.data.arrayBuffer();
          text = pako.inflate(new Uint8Array(buffer), { to: "string" });
        } else if (typeof event.data === "string") {
          text = event.data;
        } else {
          console.warn("Unknown BingX message type:", event.data);
          return;
        }

        console.log("BingX raw (inflated):", text);

        // handle Ping
        if (text === "Ping") {
          ws.send("Pong");
          return;
        }

        const msg = JSON.parse(text);

        if (msg.dataType?.startsWith("market.depth20.BTC-USDT") && msg.data) {
          const { bids = [], asks = [] } = msg.data;
          setBids(bids.slice(0, 10));
          setAsks(asks.slice(0, 10));
        }
      } catch (err) {
        console.error("Failed to parse BingX message:", err);
      }
    };

    ws.onerror = (err) => console.error("BingX WS error:", err);
    ws.onclose = () => console.warn("BingX WS closed");

    return () => ws.close();
  }, []);

  return { bids, asks };
};