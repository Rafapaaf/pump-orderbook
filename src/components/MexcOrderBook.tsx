import React from "react";
import { useMexcPerpDepth } from "../sockets/useMexcPerpDepth";

export default function MexcOrderBook() {
  const { asksHL, bidsHL, mid, totalAsk, totalBid } = useMexcPerpDepth("PUMPFUN_USDT", 20);

  const priceFmt = new Intl.NumberFormat("en-US", { minimumFractionDigits: 6 });
  const amtFmt   = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0 });

  return (
    <div className="p-2 bg-gray-900 rounded-md shadow-md inline-block mx-auto w-[23vw]">
      {/* Header */}
      <div className="flex items-center justify-center mb-2 gap-1">
        <img
          src="https://altcoinsbox.com/wp-content/uploads/2023/01/mexc-logo.png"
          alt="MEXC Logo"
          className="w-6 h-6 bg-white rounded p-0.5"
        />
        <h2 className="text-sm font-semibold text-white">PUMPFUN/USDT (MEXC Perps)</h2>
      </div>

      <table className="text-xs table-fixed w-full">
        <thead>
          <tr className="text-white text-left">
            <th className="w-1/3">Price</th>
            <th className="w-1/3">Amount</th>
            <th className="w-1/3">Gauge</th>
          </tr>
        </thead>
        <tbody>
          {asksHL.map(([price, amt], i) => {
            const a = parseFloat(amt);
            const fill = (a / totalAsk) * 100;
            return (
              <tr key={`ask-${i}`}>
                <td className="px-1 py-0.5 text-red-400 font-mono">{priceFmt.format(parseFloat(price))}</td>
                <td className="px-1 py-0.5 text-red-400 font-mono">{amtFmt.format(a)}</td>
                <td className="px-1 py-0.5">
                  <div className="relative h-2 bg-gray-800 rounded overflow-hidden w-full">
                    <div className="absolute top-0 bottom-0 left-0 bg-red-400" style={{ width: `${fill}%` }} />
                  </div>
                </td>
              </tr>
            );
          })}

          <tr>
            <td colSpan={3} className="px-1 py-0.5 text-center text-yellow-400 font-mono">
              {mid ? priceFmt.format(mid) : ""}
            </td>
          </tr>

          {bidsHL.map(([price, amt], i) => {
            const b = parseFloat(amt);
            const fill = (b / totalBid) * 100;
            return (
              <tr key={`bid-${i}`}>
                <td className="px-1 py-0.5 text-green-400 font-mono">{priceFmt.format(parseFloat(price))}</td>
                <td className="px-1 py-0.5 text-green-400 font-mono">{amtFmt.format(b)}</td>
                <td className="px-1 py-0.5">
                  <div className="relative h-2 bg-gray-800 rounded overflow-hidden w-full">
                    <div className="absolute top-0 bottom-0 left-0 bg-green-400" style={{ width: `${fill}%` }} />
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