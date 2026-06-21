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
    openingBalanceEquityAdjustment,
    changeInInventory,
    changeInLiabilities,
    openingCash,
    netChangeInCash,
    closingCash,
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
              {/* OPERATING ACTIVITIES */}
              <tr className="bg-slate-50/50 font-black text-[11px] text-[#1e3a8a] uppercase tracking-wide border-b border-slate-100">
                <td colSpan="2" className="px-6 py-3">1. Cash from Daily Operations</td>
              </tr>
              
              <tr className="border-b border-slate-100">
                <td className="px-12 py-3.5 text-slate-800 font-medium">Money Made / Net Profit</td>
                <td className="px-8 py-3.5 text-right font-semibold tabular-nums text-slate-900">{formatCurrency(netIncome)}</td>
              </tr>

              {/* Opening Balance Equity Adjustment Section */}
              {openingBalanceEquityAdjustment !== 0 && (
                <tr className="border-b border-slate-100">
                  <td className="px-12 py-3.5 text-purple-700 italic font-medium">Adjustments: Opening Balance Equity</td>
                  <td className="px-8 py-3.5 text-right font-semibold tabular-nums text-purple-700">{formatCurrency(openingBalanceEquityAdjustment)}</td>
                </tr>
              )}

              {/* Working Capital Adjustments */}
              <tr className="border-b border-slate-100">
                <td className="px-12 py-3.5 text-slate-600 pl-16">Money Tied Up in Stock (Inventory)</td>
                <td className="px-8 py-3.5 text-right font-semibold tabular-nums text-red-600">{formatCurrency(-changeInInventory)}</td>
              </tr>
              
              <tr className="border-b border-slate-100">
                <td className="px-12 py-3.5 text-slate-600 pl-16">Unpaid Bills / Money We Owe Others</td>
                <td className="px-8 py-3.5 text-right font-semibold tabular-nums text-emerald-600">{formatCurrency(changeInLiabilities)}</td>
              </tr>

              <tr className="bg-slate-50/30 font-bold text-slate-900 border-b-2 border-slate-200">
                <td className="px-8 py-3.5 font-bold text-slate-800 uppercase tracking-tight">Total Cash Made from Operations</td>
                <td className="px-8 py-3.5 text-right font-bold text-slate-900 tabular-nums">{formatCurrency(netChangeInCash)}</td>
              </tr>

              {/* SUMMARY RECONCILIATION */}
              <tr className="bg-slate-50/50 font-black text-[11px] text-slate-500 uppercase tracking-wide border-b border-slate-100">
                <td colSpan="2" className="px-6 py-3">2. Cash Summary</td>
              </tr>

              <tr className="border-b border-slate-100">
                <td className="px-12 py-3.5 font-medium text-slate-700">Starting Cash (Beginning of Year)</td>
                <td className="px-8 py-3.5 text-right font-semibold tabular-nums text-slate-600">{formatCurrency(openingCash)}</td>
              </tr>

              <tr className="border-b border-slate-100">
                <td className="px-12 py-3.5 font-medium text-blue-600">New Cash Added This Period</td>
                <td className="px-8 py-3.5 text-right font-bold tabular-nums text-blue-600">{formatCurrency(netChangeInCash)}</td>
              </tr>

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