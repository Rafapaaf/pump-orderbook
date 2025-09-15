import React from "react";
import BinanceCandleChart from "./components/BinanceCandleChart";
import BinanceOrderBook from "./components/BinanceOrderBook";
import BybitOrderBook from "./components/BybitOrderBook";
import KucoinOrderBook from "./components/KucoinOrderBook";
import MexcOrderBook from "./components/MexcOrderBook";

function App() {
  return (
    <div className="min-h-screen flex flex-col justify-end bg-black px-6 pb-6">
      {/* Top candlestick chart */}
      <BinanceCandleChart />

      {/* Bottom order books */}
      <div className="flex justify-center flex-wrap gap-4">
        <BinanceOrderBook />
        <BybitOrderBook />
        <KucoinOrderBook />
        <MexcOrderBook />
      </div>
    </div>
  );
}

export default App;