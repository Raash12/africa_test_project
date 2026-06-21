import React from "react";
import { Loader2, TrendingUp, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import logo from "@/assets/logo.jpeg";
import useCashFlow from "@/hooks/useCashFlow";

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val || 0);
};

export default function CashFlowStatement() {
  const {
    netIncome,
    changeInInventory,
    changeInLiabilities,
    openingCash,
    netChangeInCash,
    closingCash,
    cashInflows = [],
    cashOutflows = [],
    loading
  } = useCashFlow();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50/50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-xs mt-2 text-blue-600 font-medium">Generating Cash Flow Report...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 bg-slate-50 min-h-screen antialiased text-slate-900">
      
      {/* Header */}
      <div className="bg-[#1e3a8a] rounded-2xl p-6 shadow-md text-white">
        <div className="flex items-center gap-4">
          <div className="bg-white p-1.5 rounded-xl">
            <img src={logo} alt="Logo" className="w-12 h-12 object-contain rounded-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold uppercase">African Ihsan Foundation</h1>
            <p className="text-blue-100 text-xs font-medium">Cash Flow Report (Money In & Money Out)</p>
          </div>
        </div>
      </div>

      {/* Summary Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white border border-slate-200 rounded-xl border-l-4 border-l-slate-400 shadow-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Starting Cash</p>
              <p className="text-base font-bold mt-0.5 tabular-nums text-slate-700">{formatCurrency(openingCash)}</p>
            </div>
            <ArrowDownRight className="text-slate-400" size={18} />
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 rounded-xl border-l-4 border-l-blue-600 shadow-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">New Cash Added</p>
              <p className="text-base font-bold mt-0.5 tabular-nums text-blue-600">{formatCurrency(netChangeInCash)}</p>
            </div>
            <TrendingUp className="text-blue-600" size={18} />
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 rounded-xl border-l-4 border-l-emerald-600 shadow-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Final Cash Balance</p>
              <p className="text-base font-bold mt-0.5 tabular-nums text-emerald-600">{formatCurrency(closingCash)}</p>
            </div>
            <ArrowUpRight className="text-emerald-600" size={18} />
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Table */}
      <Card className="border border-slate-200 shadow-none rounded-xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-8 py-3.5">Where Money Came From & Went</th>
                <th className="px-8 py-3.5 text-right">Amount (USD)</th>
              </tr>
            </thead>
              
            <tbody className="text-xs text-slate-700">
              {/* CASH INFLOWS */}
              <tr className="bg-blue-50/50 font-black text-[11px] text-blue-800 uppercase tracking-wide border-b border-slate-100">
                <td colSpan="2" className="px-6 py-2.5">1. Cash Inflows (Lacagta Soo Gashta)</td>
              </tr>
              {cashInflows.length === 0 ? (
                <tr className="border-b border-slate-100">
                  <td className="px-12 py-2 text-slate-400 italic">No income recorded</td>
                  <td className="px-8 py-2 text-right text-slate-400">$0.00</td>
                </tr>
              ) : (
                cashInflows.map((inflow, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="px-12 py-2.5 text-slate-800 pl-16 font-medium">{inflow.name}</td>
                    <td className="px-8 py-2.5 text-right font-semibold tabular-nums text-emerald-600">+{formatCurrency(inflow.amount)}</td>
                  </tr>
                ))
              )}

              {/* CASH OUTFLOWS */}
              <tr className="bg-red-50/40 font-black text-[11px] text-red-800 uppercase tracking-wide border-b border-slate-100 mt-2">
                <td colSpan="2" className="px-6 py-2.5">2. Cash Outflows (Lacagta Baxday)</td>
              </tr>
              {cashOutflows.length === 0 ? (
                <tr className="border-b border-slate-100">
                  <td className="px-12 py-2 text-slate-400 italic">No expenses recorded</td>
                  <td className="px-8 py-2 text-right text-slate-400">$0.00</td>
                </tr>
              ) : (
                cashOutflows.map((outflow, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="px-12 py-2.5 text-slate-800 pl-16 font-medium">{outflow.name}</td>
                    <td className="px-8 py-2.5 text-right font-semibold tabular-nums text-red-600">-{formatCurrency(outflow.amount)}</td>
                  </tr>
                ))
              )}

              {/* Working Capital Adjustments */}
              <tr className="bg-slate-50/50 font-black text-[11px] text-slate-700 uppercase tracking-wide border-b border-slate-100">
                <td colSpan="2" className="px-6 py-2.5">3. Other Operating Adjustments</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-12 py-2.5 text-slate-600 pl-16">Money Tied Up in Stock (Inventory)</td>
                <td className="px-8 py-2.5 text-right font-semibold tabular-nums text-red-600">{formatCurrency(-changeInInventory)}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-12 py-2.5 text-slate-600 pl-16">Unpaid Bills / Money We Owe Others</td>
                <td className="px-8 py-2.5 text-right font-semibold tabular-nums text-emerald-600">{formatCurrency(changeInLiabilities)}</td>
              </tr>

              {/* NET CHANGE */}
              <tr className="bg-slate-50/80 font-bold text-slate-900 border-b-2 border-slate-200">
                <td className="px-8 py-3 uppercase tracking-tight text-[11px]">Total Net Cash Change</td>
                <td className="px-8 py-3 text-right font-bold text-blue-600 tabular-nums">{formatCurrency(netChangeInCash)}</td>
              </tr>

              {/* SUMMARY RECONCILIATION */}
              <tr className="bg-slate-100 font-black border-t-2 border-slate-400">
                <td className="px-8 py-4 uppercase tracking-wider text-xs text-slate-800 font-black">Final Cash Balance (End of Year)</td>
                <td className="px-8 py-4 text-right tabular-nums text-base font-black text-emerald-600 border-b-4 border-double border-slate-900">
                  {formatCurrency(closingCash)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}