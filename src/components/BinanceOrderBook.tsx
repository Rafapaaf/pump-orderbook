import React from "react";
import { useBinanceSocket } from "../sockets/useBinanceSocket";

export default function BinanceOrderBook() {
  const { bids, asks } = useBinanceSocket();
  const priceFmt = new Intl.NumberFormat("en-US", { minimumFractionDigits: 6 });
  const amtFmt = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0 });

  // Sort asks: high → low (your preference)
  const sortedAsks = [...asks]
    .map(([p, a]) => [parseFloat(p), a] as [number, string])
    .sort((a, b) => b[0] - a[0]);

  // Sort bids: high → low
  const sortedBids = [...bids]
    .map(([p, a]) => [parseFloat(p), a] as [number, string])
    .sort((a, b) => b[0] - a[0]);

  // Totals for relative gauges
  const totalBid = sortedBids.reduce((sum, [, a]) => sum + parseFloat(a), 0) || 1;
  const totalAsk = sortedAsks.reduce((sum, [, a]) => sum + parseFloat(a), 0) || 1;

  // Mid price
  const midPrice =
    sortedBids.length && sortedAsks.length
      ? (sortedBids[0][0] + sortedAsks[0][0]) / 2
      : 0;

  return (
    <div className="p-2 bg-gray-900 rounded-md shadow-md inline-block mx-auto w-[23vw]">
      {/* Header */}
      <div className="flex items-center justify-center mb-2 gap-1">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Binance_Logo.png/600px-Binance_Logo.png"
          alt="Binance Logo"
          className="w-6 h-6 bg-white rounded p-0.5"
        />
        <h2 className="text-sm font-semibold text-white">
          PUMP/USDT (Binance Perps)
        </h2>
      </div>

      {/* Table */}
      <table className="text-xs table-fixed w-full">
        <thead>
          <tr className="text-white text-left">
            <th className="w-1/3">Price</th>
            <th className="w-1/3">Amount</th>
            <th className="w-1/3">Gauge</th>
          </tr>
        </thead>
        <tbody>
          {/* Asks ABOVE */}
          {sortedAsks.slice(0, 10).map(([price, amt], i) => {
            const askAmt = parseFloat(amt);
            const aw = (askAmt / totalAsk) * 100;
            return (
              <tr key={`ask-${i}`}>
                <td className="px-1 py-0.5 text-red-400 font-mono">
                  {priceFmt.format(price)}
                </td>
                <td className="px-1 py-0.5 text-red-400 font-mono">
                  {amtFmt.format(askAmt)}
                </td>
                <td className="px-1 py-0.5">
                  <div className="relative h-2 bg-gray-800 rounded overflow-hidden w-full">
                    <div
                      className="absolute top-0 bottom-0 left-0 bg-red-400"
                      style={{ width: `${aw}%` }}
                    />
                  </div>
                </td>
              </tr>
            );
          })}

          {/* Mid Price */}
          <tr>
            <td
              colSpan={3}
              className="px-1 py-0.5 text-center text-yellow-400 font-mono"
            >
              {midPrice ? `${priceFmt.format(midPrice)}` : ""}
            </td>
          </tr>

          {/* Bids BELOW */}
          {sortedBids.slice(0, 10).map(([price, amt], i) => {
            const bidAmt = parseFloat(amt);
            const bw = (bidAmt / totalBid) * 100;
            return (
              <tr key={`bid-${i}`}>
                <td className="px-1 py-0.5 text-green-400 font-mono">
                  {priceFmt.format(price)}
                </td>
                <td className="px-1 py-0.5 text-green-400 font-mono">
                  {amtFmt.format(bidAmt)}
                </td>
                <td className="px-1 py-0.5">
                  <div className="relative h-2 bg-gray-800 rounded overflow-hidden w-full">
                    <div
                      className="absolute top-0 bottom-0 left-0 bg-green-400"
                      style={{ width: `${bw}%` }}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}