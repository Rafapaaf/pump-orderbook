// server/kucoin-session.ts
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import { createServer } from "http";
import { WebSocketServer, WebSocket as WS } from "ws";

const app = express();
const port = process.env.PORT || 3001;

  // CORS for your Vite dev server
  app.use(
    cors({
      origin: "*",
    })
  );

  // ---------- KuCoin REST proxy ----------
    app.get("/api/kucoin-session", async (req, res) => {
      try {
        const product = String(req.query.product || "spot").toLowerCase();
        const base =
          product === "futures"
            ? "https://api-futures.kucoin.com"
            : "https://api.kucoin.com";

        const response = await fetch(`${base}/api/v1/bullet-public`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error(`KuCoin API error: ${response.status}`);
        }

        const json = await response.json();
        res.json(json);
      } catch (error: any) {
        console.error("KuCoin session error:", error);
        res
          .status(500)
          .json({ error: error.message || "Failed to fetch KuCoin session" });
      }
    });

// ---------- MEXC Perps depth proxy ----------
    app.get("/api/mexc/perp-depth", async (req, res) => {
      try {
        const symbol = String(req.query.symbol || "BTC_USDT").toUpperCase();
        const limit =
          Math.min(parseInt(String(req.query.limit || "50"), 10) || 50, 100);

        // MEXC contract API requires underscore
        const formattedSymbol = symbol.replace("-", "_");

        const url = `https://contract.mexc.com/api/v1/contract/depth/${formattedSymbol}?limit=${limit}`;
        const response = await fetch(url);
        if (!response.ok)
          throw new Error(`MEXC perp depth error: ${response.status}`);

        // 👇 cast JSON so TS allows .data access
        const json = (await response.json()) as { data?: unknown };

        res.json(json.data ?? {}); // use ?? for safety
      } catch (err: any) {
        console.error("MEXC perp depth proxy error:", err);
        res.status(500).json({
          error: err.message || "Failed to fetch MEXC perp depth",
        });
      }
    });

// ---------- HTTP server + MEXC WS proxy ----------
const server = createServer(app);

// WS proxy endpoint your frontend connects to: ws://localhost:3001/ws/mexc
const wss = new WebSocketServer({ server, path: "/ws/mexc" });

wss.on("connection", (client) => {
  console.log("Frontend connected to /ws/mexc ✅");

  const upstream = new WS("wss://contract.mexc.com/ws"); // <-- instead of contract.mexc.com/ws
  let upstreamOpen = false;

  // Buffer messages from the frontend until upstream is ready
  const queue: string[] = [];

  const forwardToUpstream = (raw: string) => {
    // Try to normalize MEXC payloads
    try {
      const msg = JSON.parse(raw);

      // Normalize sub payload (params -> param) and symbol separators
      if (msg && typeof msg === "object") {
        if (msg.params && !msg.param) {
          msg.param = msg.params;
          delete msg.params;
        }
        if (msg.param && typeof msg.param.symbol === "string") {
          msg.param.symbol = msg.param.symbol.replace("-", "_");
        }
      }
      const out = JSON.stringify(msg);
      upstream.send(out);
    } catch {
      // Not JSON? Just pass through as-is (rare)
      upstream.send(raw);
    }
  };

  upstream.on("open", () => {
    upstreamOpen = true;
    console.log("Connected to MEXC ✅");

    // If the client never sent a sub yet, you can subscribe by default:
    // (Safe default while debugging: BTC_USDT depth 20)
    if (!queue.length) {
      const defaultSub = {
        method: "sub.dealDepth",
        params: ["BTC_USDT"],
        id: 1
      };
      upstream.send(JSON.stringify(defaultSub));
    }

    // Flush queued messages
    while (queue.length) {
      const msg = queue.shift()!;
      forwardToUpstream(msg);
    }
  });

  upstream.on("message", (data) => {
    // Just relay whatever MEXC sends back to the browser
    client.send(typeof data === "string" ? data : data.toString());
  });

  upstream.on("close", () => {
    console.log("Upstream MEXC closed ❌");
    try {
      client.close();
    } catch {}
  });

  upstream.on("error", (err) => {
    console.error("Upstream MEXC error:", err);
    try {
      client.close();
    } catch {}
  });

  client.on("message", (data) => {
    const raw = typeof data === "string" ? data : data.toString();
    if (upstreamOpen) {
      forwardToUpstream(raw);
    } else {
      queue.push(raw);
    }
  });

  client.on("close", () => {
    console.log("Frontend disconnected ❌");
    try {
      upstream.close();
    } catch {}
  });
});

server.listen(port, () => {
  console.log(`Proxy listening on http://localhost:${port}`);
});