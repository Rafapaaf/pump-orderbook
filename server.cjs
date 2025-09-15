const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/kucoin-bullet", async (req, res) => {
  try {
    const kucoinRes = await fetch("https://api-futures.kucoin.com/api/v1/bullet-public", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const json = await kucoinRes.json();
    res.json(json);
  } catch (error) {
    console.error("❌ Error fetching KuCoin bullet-public:", error);
    res.status(500).json({ error: "Failed to fetch KuCoin WebSocket credentials" });
  }
});

app.listen(5001, () => console.log("✅ Proxy server running at http://localhost:5001"));