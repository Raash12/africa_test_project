// src/pages/FinancialReport/IncomeStatement.jsx
import React, { useState, useMemo } from "react";
import { 
  Loader2, 
  FileText, 
  FileSpreadsheet as ExcelIcon,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Scale
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Hooks-ka dhabta ah ee xogta laga keenayo
import useAccounts from "@/hooks/useAccounts";
import usePaymentEntry from "@/hooks/usePaymentEntry"; 
import useGrants from "@/hooks/useGrants";
import usePurchaseInvoices from "@/hooks/usePurchaseInvoices"; 
import useProjects from "@/hooks/useProjects"; 

import { downloadPDF, downloadExcel } from "@/utils/ExportUtils";
import logo from "@/assets/logo.jpeg";

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val || 0);
};

export default function IncomeStatement() {
  const [exporting, setExporting] = useState(false);

  // 1. Soo wac dhamaan xogtii dhabta ahayd ee database-ka
  const hooksAccounts = useAccounts() || {};
  const hooksPayments = usePaymentEntry() || {};
  const hooksGrants = useGrants() || {};
  const hooksInvoices = usePurchaseInvoices() || {}; 
  const hooksProjects = useProjects() || {}; 

  const accounts = hooksAccounts.accounts || hooksAccounts.data || [];
  const payments = hooksPayments.payments || hooksPayments.paymentEntries || hooksPayments.data || [];
  const grants = hooksGrants.grants || hooksGrants.data || [];
  const purchaseInvoices = hooksInvoices.purchaseInvoices || []; 
  const projects = hooksProjects.projects || []; 

  const isLoading = 
    hooksAccounts.loading || 
    hooksPayments.loading || 
    hooksGrants.loading || 
    hooksInvoices.loading || 
    hooksProjects.loading;

  // 2. Map-ka Chart of Accounts si loo ogaado Account Type-ka rasmiga ah
  const accountMap = useMemo(() => {
    return accounts.reduce((acc, curr) => {
      const accId = curr.id || curr.docId;
      if (accId) {
        acc[accId] = { 
          id: accId,
          name: curr.accountName || curr.name || "Unnamed Account", 
          accountType: curr.accountType || curr.category || "Assets", // e.g., "Revenue", "Expenses"
        };
      }
      return acc;
    }, {});
  }, [accounts]);

  // 3. Engine-ka saxda ah ee Income Statement (Shaandheynta Accounts-ka)
  const { revenueList, expenseList, totalRevenue, totalExpense, netIncome } = useMemo(() => {
    const revenueSummary = {};
    const expenseSummary = {};

    // A. Akhriso Grants (Kaliya ogolow haddii ay tahay Revenue/Income)
    grants.forEach(g => {
      const amt = Number(g.amount || 0);
      if (amt <= 0) return;
      
      const revId = g.revenueAccountId;
      const accInfo = accountMap[revId];
      const type = accInfo ? accInfo.accountType?.toLowerCase() : "revenue";

      // Hubi in koontadu dhab ahaan tahay dakhli
      if (type.includes("revenue") || type.includes("income")) {
        const name = accInfo ? accInfo.name : (g.grantName || "Grant Funding");
        revenueSummary[name] = (revenueSummary[name] || 0) + amt;
      }
    });

    // B. Akhriso Payments (Kaliya ogolow haddii koontadu tahay Expense)
    payments.forEach(p => {
      const amt = Number(p.amount ?? p.amountPaid ?? 0);
      if (amt <= 0) return;

      const debId = p.chargedToAccountId || p.expenseAccountId;
      const accInfo = accountMap[debId];
      
      if (accInfo) {
        const type = accInfo.accountType?.toLowerCase() || "";
        // KALIYA QAAD haddii koodhku leeyahay Expense (kana dhowr Assets/Liabilities)
        if (type.includes("expense") || type.includes("expenses")) {
          expenseSummary[accInfo.name] = (expenseSummary[accInfo.name] || 0) + amt;
        }
      }
    });

    // C. Akhriso Purchase Invoices (Kaliya ogolow haddii lagu dalacay Expense account)
    purchaseInvoices.forEach(inv => {
      const amt = Number(inv.totalAmount || 0);
      if (amt <= 0) return;

      const invAccId = inv.inventoryAccountId || inv.expenseAccountId;
      const accInfo = accountMap[invAccId];

      if (accInfo) {
        const type = accInfo.accountType?.toLowerCase() || "";
        if (type.includes("expense") || type.includes("expenses")) {
          expenseSummary[accInfo.name] = (expenseSummary[accInfo.name] || 0) + amt;
        }
      }
    });

    // D. Akhriso Projects (Mashaariicda qaybtooda kharashka dhabta ah)
    projects.forEach(proj => {
      const amt = Number(proj.totalValue || 0);
      if (amt <= 0) return;

      const expId = proj.expenseAccountId;
      const accInfo = accountMap[expId];

      if (accInfo) {
        const type = accInfo.accountType?.toLowerCase() || "";
        if (type.includes("expense") || type.includes("expenses")) {
          expenseSummary[accInfo.name] = (expenseSummary[accInfo.name] || 0) + amt;
        }
      }
    });

    // U bedel qaab Array ah si shaxda loogu daaboco
    const finalRevenue = Object.keys(revenueSummary).map(name => ({ name, amount: revenueSummary[name] }));
    const finalExpense = Object.keys(expenseSummary).map(name => ({ name, amount: expenseSummary[name] }));

    const totRev = finalRevenue.reduce((sum, r) => sum + r.amount, 0);
    const totExp = finalExpense.reduce((sum, e) => sum + e.amount, 0);

    return {
      revenueList: finalRevenue,
      expenseList: finalExpense,
      totalRevenue: totRev,
      totalExpense: totExp,
      netIncome: totRev - totExp
    };
  }, [accounts, payments, grants, purchaseInvoices, projects, accountMap]);

  // 4. Daabacaadda Excel
  const handleExportExcel = async () => {
    if (revenueList.length === 0 && expenseList.length === 0) return;
    setExporting(true);
    try {
      const excelReadyData = [
        { "Statement Group": "REVENUE", "Account Title": "", "Amount": "" },
        ...revenueList.map(r => ({ "Statement Group": "", "Account Title": r.name, "Amount": r.amount })),
        { "Statement Group": "TOTAL REVENUE", "Account Title": "", "Amount": totalRevenue },
        { "Statement Group": "EXPENSES", "Account Title": "", "Amount": "" },
        ...expenseList.map(e => ({ "Statement Group": "", "Account Title": e.name, "Amount": e.amount })),
        { "Statement Group": "TOTAL EXPENSES", "Account Title": "", "Amount": totalExpense },
        { "Statement Group": "NET INCOME", "Account Title": "", "Amount": netIncome }
      ];

      downloadExcel(excelReadyData, "Income_Statement_Report");
      toast.success("Excel downloaded successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export Excel.");
    } finally {
      setExporting(false);
    }
  };

  // 5. Daabacaadda PDF
  const handleExportPDF = async () => {
    if (revenueList.length === 0 && expenseList.length === 0) return;
    setExporting(true);
    try {
      const columns = ["Statement Group", "Account Title", "Amount"];
      const pdfReadyData = [
        ["REVENUE", "", ""],
        ...revenueList.map(r => ["", r.name, formatCurrency(r.amount)]),
        ["TOTAL REVENUE", "", formatCurrency(totalRevenue)],
        ["EXPENSES", "", ""],
        ...expenseList.map(e => ["", e.name, formatCurrency(e.amount)]),
        ["TOTAL EXPENSES", "", formatCurrency(totalExpense)],
        ["NET INCOME (PROFIT/LOSS)", "", formatCurrency(netIncome)]
      ];

      downloadPDF(columns, pdfReadyData, "Income_Statement_Report");
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export PDF.");
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50/50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-xs mt-2 text-blue-600 font-medium tracking-wide">Processing Profit & Loss Statement...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 bg-slate-50 min-h-screen font-sans antialiased text-slate-900">
      {/* Header */}
      <div className="bg-[#1e3a8a] rounded-2xl p-6 shadow-md text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white p-1.5 rounded-xl">
              <img src={logo} alt="Logo" className="w-12 h-12 object-contain rounded-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight uppercase">African Ihsan Foundation</h1>
              <p className="text-blue-100 text-xs font-medium">Income Statement — Profit & Loss</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportExcel} disabled={exporting || (revenueList.length === 0 && expenseList.length === 0)} className="bg-white text-[#1e3a8a] hover:bg-blue-50 font-semibold rounded-xl text-xs shadow-none">
              <ExcelIcon size={14} className="mr-1.5" /> Excel
            </Button>
            <Button onClick={handleExportPDF} disabled={exporting || (revenueList.length === 0 && expenseList.length === 0)} className="bg-blue-900 text-white hover:bg-blue-950 font-semibold rounded-xl text-xs shadow-none border border-blue-800">
              {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText size={14} className="mr-1.5" />} PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white border border-slate-200 shadow-none rounded-xl border-l-4 border-l-emerald-600">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Revenue</p>
              <p className="text-lg font-bold mt-0.5 text-emerald-600 tabular-nums">{formatCurrency(totalRevenue)}</p>
            </div>
            <TrendingUp className="text-emerald-600" size={18} />
          </CardContent>
        </Card>
        <Card className="bg-white border border-slate-200 shadow-none rounded-xl border-l-4 border-l-rose-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Expenses</p>
              <p className="text-lg font-bold mt-0.5 text-rose-600 tabular-nums">{formatCurrency(totalExpense)}</p>
            </div>
            <TrendingDown className="text-rose-500" size={18} />
          </CardContent>
        </Card>
        <Card className={`bg-white border border-slate-200 shadow-none rounded-xl border-l-4 ${netIncome >= 0 ? "border-l-blue-600" : "border-l-rose-600"}`}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Net Operational Income</p>
              <p className="text-lg font-bold mt-0.5 text-slate-900 tabular-nums">{formatCurrency(netIncome)}</p>
            </div>
            {netIncome >= 0 ? <ShieldCheck className="text-blue-600" size={18} /> : <Scale className="text-rose-600" size={18} />}
          </CardContent>
        </Card>
      </div>

      {/* Main Financial Statement */}
      <Card className="border border-slate-200 shadow-none rounded-xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-8 py-3.5">Financial Account Title</th>
                <th className="px-8 py-3.5 text-right">Statement Value (USD)</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-700">
              
              {/* SECTION: REVENUE */}
              <tr className="bg-slate-50/50 font-black text-[11px] text-[#1e3a8a] uppercase tracking-wide border-b border-slate-100">
                <td colSpan="2" className="px-6 py-3">1. Revenue / Incoming Grants</td>
              </tr>
              {revenueList.length === 0 ? (
                <tr className="text-slate-400 font-medium italic"><td colSpan="2" className="px-12 py-3">No revenue registered inside this cycle.</td></tr>
              ) : (
                revenueList.map((row, idx) => (
                  <tr key={`rev-${idx}`} className="hover:bg-slate-50/30 border-b border-slate-100">
                    <td className="px-12 py-3.5 font-bold text-slate-800">{row.name}</td>
                    <td className="px-8 py-3.5 text-right font-semibold text-emerald-600 tabular-nums">{formatCurrency(row.amount)}</td>
                  </tr>
                ))
              )}
              <tr className="bg-slate-50/30 font-bold text-slate-900 border-b-2 border-slate-200">
                <td className="px-8 py-3.5 uppercase tracking-tight text-slate-500">Total Income Class</td>
                <td className="px-8 py-3.5 text-right text-base font-bold text-slate-900 tabular-nums">{formatCurrency(totalRevenue)}</td>
              </tr>

              {/* SECTION: EXPENSES */}
              <tr className="bg-slate-50/50 font-black text-[11px] text-rose-700 uppercase tracking-wide border-b border-slate-100">
                <td colSpan="2" className="px-6 py-3 mt-4">2. Operating Expenses</td>
              </tr>
              {expenseList.length === 0 ? (
                <tr className="text-slate-400 font-medium italic"><td colSpan="2" className="px-12 py-3">No expenses registered inside this cycle.</td></tr>
              ) : (
                expenseList.map((row, idx) => (
                  <tr key={`exp-${idx}`} className="hover:bg-slate-50/30 border-b border-slate-100">
                    <td className="px-12 py-3.5 font-bold text-slate-800">{row.name}</td>
                    <td className="px-8 py-3.5 text-right font-semibold text-rose-600 tabular-nums">{formatCurrency(row.amount)}</td>
                  </tr>
                ))
              )}
              <tr className="bg-slate-50/30 font-bold text-slate-900 border-b-2 border-slate-200">
                <td className="px-8 py-3.5 uppercase tracking-tight text-slate-500">Total Expense Class</td>
                <td className="px-8 py-3.5 text-right text-base font-bold text-slate-900 tabular-nums">{formatCurrency(totalExpense)}</td>
              </tr>

              {/* NET SUMMARY BLOCK */}
              <tr className={`border-t-2 font-black ${netIncome >= 0 ? "bg-[#1e3a8a]/5 text-[#1e3a8a]" : "bg-rose-50 text-rose-700"}`}>
                <td className="px-8 py-5 uppercase tracking-wider text-xs font-black">Net Statement Income (Profit / Loss)</td>
                <td className="px-8 py-5 text-right tabular-nums text-lg font-black border-b-4 border-double border-current">
                  {formatCurrency(netIncome)}
                </td>
              </tr>

            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}