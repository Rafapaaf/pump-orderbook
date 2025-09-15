// server/mexc-proxy.ts
import express from "express";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import cors from "cors";

const app = express();
app.use(cors());

const server = createServer(app);

// Simple healthcheck
app.get("/api/mexc", (_, res) => {
  res.send("MEXC proxy running ✅");
});

// WebSocket proxy
const wss = new WebSocketServer({ server, path: "/ws/mexc" });

wss.on("connection", (client) => {
  console.log("Browser connected to proxy ✅");

  // Connect upstream to MEXC
  const upstream = new (require("ws"))("wss://contract.mexc.com/ws");

  upstream.on("open", () => {
    console.log("Connected to MEXC upstream ✅");

    // Subscribe to orderbook
    upstream.send(
      JSON.stringify({
        method: "sub.dealDepth",
        param: { symbol: "PUMPFUN_USDT", limit: 20 },
      })
    );
  });

  upstream.on("message", (msg: Buffer) => {
    // Forward to browser
    client.send(msg.toString());
  });

  upstream.on("close", () => {
    console.log("MEXC upstream closed ❌");
    client.close();
  });

  upstream.on("error", (err: any) => {
    console.error("MEXC upstream error:", err);
    client.close();
  });

  client.on("close", () => {
    console.log("Browser disconnected ❌");
    upstream.close();
  });
});

// Start proxy server
server.listen(3002, () => {
  console.log("MEXC proxy listening on http://localhost:3002");
});