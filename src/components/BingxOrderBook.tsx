import React from "react";
import { useBingxSocket } from "../sockets/useBingxSocket";

export default function BingxOrderBook() {
  const { bids, asks } = useBingxSocket();

  const priceFormatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 6,
    maximumFractionDigits: 6,
  });

  const amountFormatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="p-4 bg-gray-900 rounded-md shadow-md inline-block mx-auto">
      <div className="flex items-center justify-center mb-4 gap-2">
        <img
          src="https://cryptologos.cc/logos/bingx-bingx-logo.svg?v=026"
          alt="BingX Logo"
          className="w-6 h-6"
        />
        <h2 className="text-lg font-semibold text-white">
          PUMP/USDT (BingX Perps)
        </h2>
      </div>

      <table className="text-sm table-fixed">
        <thead>
          <tr className="text-white text-right">
            <th className="w-1/3">Price</th>
            <th className="w-1/3">Bids&nbsp;|</th>
            <th className="w-1/3 text-left">|&nbsp;Asks</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 10 }).map((_, i) => {
            const bid = bids[i];
            const ask = asks[i];
            return (
              <tr key={i}>
                <td className="px-2 py-1 text-white text-right font-mono align-top">
                  {bid ? priceFormatter.format(parseFloat(bid[0])) : ""}
                  {ask && !bid ? priceFormatter.format(parseFloat(ask[0])) : ""}
                </td>
                <td className="px-2 py-1 text-green-400 text-right font-mono">
                  {bid ? amountFormatter.format(parseFloat(bid[1])) : ""}
                </td>
                <td className="px-2 py-1 text-red-400 text-left font-mono">
                  {ask ? amountFormatter.format(parseFloat(ask[1])) : ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}