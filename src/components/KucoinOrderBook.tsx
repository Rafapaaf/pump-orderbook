import React from "react";
import { useKucoinSocket } from "../sockets/useKucoinSocket";

export default function KucoinOrderBook() {
  const { bids, asks } = useKucoinSocket();
  const priceFmt = new Intl.NumberFormat("en-US", { minimumFractionDigits: 6 });
  const amtFmt = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0 });

  // Sort asks high → low
  const sortedAsks = [...asks]
    .map(([p, a]) => [parseFloat(p), a] as [number, string])
    .sort((a, b) => b[0] - a[0]);

  // Sort bids high → low
  const sortedBids = [...bids]
    .map(([p, a]) => [parseFloat(p), a] as [number, string])
    .sort((a, b) => b[0] - a[0]);

    const totalBid = bids.reduce((sum, [, a]) => sum + parseFloat(a), 0) || 1;
    const totalAsk = asks.reduce((sum, [, a]) => sum + parseFloat(a), 0) || 1;

  const midPrice =
    sortedBids.length && sortedAsks.length
      ? (sortedBids[0][0] + sortedAsks[0][0]) / 2
      : 0;

  return (
    <div className="p-2 bg-gray-900 rounded-md shadow-md inline-block mx-auto w-[23vw]">
      {/* Header */}
      <div className="flex items-center justify-center mb-2 gap-1">
        <img
          src="https://digitalcoinprice.com/generated-assets/assets/images/coins/200x200/kucoin-token.png"
          alt="KuCoin Logo"
          className="w-6 h-6 bg-white rounded p-0.5"
        />
        <h2 className="text-sm font-semibold text-white">
          PUMP/USDT (KuCoin Perps)
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
            {asks.slice(0, 10).map(([price, amt], i) => {
            const askAmt = parseFloat(amt);
            const aw = (askAmt / totalAsk) * 100;
            return (
                <tr key={`ask-${i}`}>
                <td className="px-1 py-0.5 text-red-400 font-mono">
                    {priceFmt.format(parseFloat(price))}
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
              colSpan={1}
              className="px-1 py-0.5 text-center text-yellow-400 font-mono"
            >
              {midPrice ? `${priceFmt.format(midPrice)}` : ""}
            </td>
          </tr>

          {/* Bids BELOW */}
            {bids.slice(0, 10).map(([price, amt], i) => {
            const bidAmt = parseFloat(amt);
            const bw = (bidAmt / totalBid) * 100;
            return (
                <tr key={`bid-${i}`}>
                <td className="px-1 py-0.5 text-green-400 font-mono">
                    {priceFmt.format(parseFloat(price))}
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
