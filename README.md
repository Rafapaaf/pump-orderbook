# Pump Orderbook 📊

A **real-time trading dashboard** that aggregates **perpetual futures order books** and **candlestick charts** from multiple crypto exchanges into one unified view.  

Built with **React + Vite + TailwindCSS** (frontend) and **Express + WebSockets** (backend proxy).  

---

## ✨ Features  

- 📈 **Live candlestick chart** (1-second candles) for Binance **PUMP/USDT Perps**  
  - With **EMA20, EMA50, EMA200 overlays**  
  - 6-decimal precision for microcap accuracy  

- 📊 **Order Books from multiple exchanges** (20 levels depth, 10 bids + 10 asks):  
  - Binance (Perps)  
  - Bybit (Perps)  
  - KuCoin (Perps)  
  - MEXC (Perps)  

- 🔌 **WebSocket integration** for ultra-fast updates  
- ⚡ **Proxy server** to bypass CORS and manage exchange sessions  
- 🎨 **TradingView-like UI** with Tailwind + Lightweight Charts  

---

## 📷 Screenshots  

*(Add screenshots of your running app here — candlestick chart + order books grid)*  

---

## 🛠️ Tech Stack  

- **Frontend:** React, Vite, TypeScript, TailwindCSS  
- **Charting:** [Lightweight-Charts](https://github.com/tradingview/lightweight-charts)  
- **Backend Proxy:** Node.js, Express, WebSockets  
- **Exchanges Integrated:** Binance, Bybit, KuCoin, MEXC  

---

## 🚀 Getting Started  

### 1. Clone the repo  

```bash
git clone https://github.com/Rafapaaf/pump-orderbook.git
cd pump-orderbook