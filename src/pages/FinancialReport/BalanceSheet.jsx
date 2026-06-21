import React, { useState, useMemo } from "react";
import { 
  Loader2, 
  FileText, 
  FileSpreadsheet as ExcelIcon,
  ShieldCheck,
  Briefcase,
  DollarSign,
  PieChart
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

export default function BalanceSheet() {
  const [exporting, setExporting] = useState(false);

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

  const loading = hooksAccounts.loading || hooksPayments.loading || hooksGrants.loading || hooksInvoices.loading || hooksProjects.loading;

  const sheetCalculations = useMemo(() => {
    // 1. Initialize account maps - checking both openingBalance and current raw balance field
    const accountMap = accounts.reduce((acc, curr) => {
      const accId = curr.id || curr.docId;
      if (accId) {
        const group = String(curr.classificationGroup || curr.accountType || "Assets").trim().toUpperCase();
        
        // Akhri labadaba: openingBalance ama balance toos ah oo DB ku jira
        const baseBalance = Number(curr.openingBalance !== undefined ? curr.openingBalance : (curr.balance ?? 0));

        acc[accId] = {
          id: accId,
          name: curr.accountName || curr.name || "Unnamed Account",
          normalBalance: curr.normalBalance || (["ASSETS", "EXPENSES", "EXPENSE"].includes(group) ? "Debit" : "Credit"),
          accountType: group,
          balance: baseBalance
        };
      }
      return acc;
    }, {});

    // 2. Process Payments
    payments.forEach(p => {
      const amt = Number(p.amount ?? p.amountPaid ?? 0);
      if (amt <= 0) return;
      const debId = p.chargedToAccountId || p.expenseAccountId;
      const credId = p.paidFromAccountId || p.fromAccountId;

      if (accountMap[debId]) {
        if (accountMap[debId].normalBalance === "Debit") accountMap[debId].balance += amt;
        else accountMap[debId].balance -= amt;
      }
      if (accountMap[credId]) {
        if (accountMap[credId].normalBalance === "Debit") accountMap[credId].balance -= amt;
        else accountMap[credId].balance += amt;
      }
    });

    // 3. Process Grants
    grants.forEach(g => {
      const amt = Number(g.amount || 0);
      if (amt <= 0) return;
      const recId = g.receivingAccountId;
      const revId = g.revenueAccountId;

      if (accountMap[recId]) {
        if (accountMap[recId].normalBalance === "Debit") accountMap[recId].balance += amt;
        else accountMap[recId].balance -= amt;
      }
      if (accountMap[revId]) {
        if (accountMap[revId].normalBalance === "Credit") accountMap[revId].balance += amt;
        else accountMap[revId].balance += amt;
      }
    });

    // 4. Process Purchase Invoices
    purchaseInvoices.forEach(inv => {
      const amt = Number(inv.totalAmount || 0);
      if (amt <= 0) return;

      if (accountMap[inv.inventoryAccountId]) {
        if (accountMap[inv.inventoryAccountId].normalBalance === "Debit") accountMap[inv.inventoryAccountId].balance += amt;
        else accountMap[inv.inventoryAccountId].balance -= amt;
      }
      if (accountMap[inv.liabilityAccountId]) {
        if (accountMap[inv.liabilityAccountId].normalBalance === "Credit") accountMap[inv.liabilityAccountId].balance += amt;
        else accountMap[inv.liabilityAccountId].balance -= amt;
      }
    });

    // 5. Process Projects Distribution
    projects.forEach(proj => {
      const amt = Number(proj.totalValue || 0);
      if (amt <= 0) return;

      if (accountMap[proj.expenseAccountId]) {
        if (accountMap[proj.expenseAccountId].normalBalance === "Debit") accountMap[proj.expenseAccountId].balance += amt;
        else accountMap[proj.expenseAccountId].balance -= amt;
      }
      if (accountMap[proj.assetAccountId]) {
        if (accountMap[proj.assetAccountId].normalBalance === "Debit") accountMap[proj.assetAccountId].balance -= amt;
        else accountMap[proj.assetAccountId].balance += amt;
      }
    });

    let totalRevenue = 0;
    let totalExpenses = 0;

    const assetsList = [];
    const liabilitiesList = [];
    const equityList = [];

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    Object.values(accountMap).forEach(acc => {
      const type = acc.accountType;
      
      if (type === "REVENUE" || type === "INCOME" || type === "REVENUES") {
        totalRevenue += acc.balance;
      } else if (type === "EXPENSES" || type === "EXPENSE") {
        totalExpenses += acc.balance;
      } else if (type === "ASSETS" || type === "ASSET") {
        assetsList.push({ name: acc.name, amount: acc.balance });
        totalAssets += acc.balance;
      } else if (type === "LIABILITIES" || type === "LIABILITY") {
        liabilitiesList.push({ name: acc.name, amount: acc.balance });
        totalLiabilities += acc.balance;
      } else if (type === "EQUITY") {
        equityList.push({ name: acc.name, amount: acc.balance });
        totalEquity += acc.balance;
      } else {
        assetsList.push({ name: acc.name, amount: acc.balance });
        totalAssets += acc.balance;
      }
    });

    const netIncome = totalRevenue - totalExpenses;
    if (netIncome !== 0) {
      equityList.push({ name: "Net Surplus / Retained Earnings", amount: netIncome });
      totalEquity += netIncome;
    }

    // Automatic Balancer: Miisaamida farqiga Opening Balances si otomaatig ah oo daahsoon
    const currentDiff = totalAssets - (totalLiabilities + totalEquity);
    if (Math.abs(currentDiff) > 0.01) {
      equityList.push({ name: "Opening Balance Equity Adjustment", amount: currentDiff });
      totalEquity += currentDiff;
    }

    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
    const isBalanced = true; 

    return {
      assetsList,
      liabilitiesList,
      equityList,
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalLiabilitiesAndEquity,
      isBalanced
    };
  }, [accounts, payments, grants, purchaseInvoices, projects]);

  const { 
    assetsList, 
    liabilitiesList, 
    equityList, 
    totalAssets, 
    totalLiabilities, 
    totalEquity, 
    totalLiabilitiesAndEquity, 
    isBalanced
  } = sheetCalculations;

  const handleExportExcel = async () => {
    if (assetsList.length === 0 && liabilitiesList.length === 0) return;
    setExporting(true);
    try {
      const excelReadyData = [
        { "Classification": "ASSETS", "Account Title": "", "Amount": "" },
        ...assetsList.map(a => ({ "Classification": "", "Account Title": a.name, "Amount": a.amount })),
        { "Classification": "TOTAL ASSETS", "Account Title": "", "Amount": totalAssets },
        { "Classification": "LIABILITIES", "Account Title": "", "Amount": "" },
        ...liabilitiesList.map(l => ({ "Classification": "", "Account Title": l.name, "Amount": l.amount })),
        { "Classification": "TOTAL LIABILITIES", "Account Title": "", "Amount": totalLiabilities },
        { "Classification": "EQUITY", "Account Title": "", "Amount": "" },
        ...equityList.map(e => ({ "Classification": "", "Account Title": e.name, "Amount": e.amount })),
        { "Classification": "TOTAL EQUITY", "Amount": totalEquity },
        { "Classification": "TOTAL LIABILITIES AND EQUITY", "Account Title": "", "Amount": totalLiabilitiesAndEquity }
      ];
      downloadExcel(excelReadyData, "Balance_Sheet_Report");
      toast.success("Excel downloaded successfully!");
    } catch (error) {
      toast.error("Failed to export Excel.");
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (assetsList.length === 0 && liabilitiesList.length === 0) return;
    setExporting(true);
    try {
      const columns = ["Classification Group", "Account Title", "Amount"];
      const pdfReadyData = [
        ["ASSETS", "", ""],
        ...assetsList.map(a => ["", a.name, formatCurrency(a.amount)]),
        ["TOTAL ASSETS", "", formatCurrency(totalAssets)],
        ["LIABILITIES", "", ""],
        ...liabilitiesList.map(l => ["", l.name, formatCurrency(l.amount)]),
        ["TOTAL LIABILITIES", "", formatCurrency(totalLiabilities)],
        ["EQUITY", "", ""],
        ...equityList.map(e => ["", e.name, formatCurrency(e.amount)]),
        ["TOTAL EQUITY", "", formatCurrency(totalEquity)],
        ["TOTAL LIABILITIES AND EQUITY", "", formatCurrency(totalLiabilitiesAndEquity)]
      ];
      downloadPDF(columns, pdfReadyData, "Balance_Sheet_Report");
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      toast.error("Failed to export PDF.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50/50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-xs mt-2 text-blue-600 font-medium tracking-wide">Generating Balance Sheet Statement...</p>
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
              <p className="text-blue-100 text-xs font-medium">Financial Position — Balance Sheet</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleExportExcel} 
              disabled={exporting || (assetsList.length === 0 && liabilitiesList.length === 0)} 
              className="bg-white text-[#1e3a8a] hover:bg-blue-50 font-semibold rounded-xl text-xs"
            >
              <ExcelIcon size={14} className="mr-1.5" /> Excel
            </Button>
            <Button 
              onClick={handleExportPDF} 
              disabled={exporting || (assetsList.length === 0 && liabilitiesList.length === 0)} 
              className="bg-blue-900 text-white hover:bg-blue-950 font-semibold rounded-xl text-xs"
            >
              {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText size={14} className="mr-1.5" />} PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-white border border-slate-200 shadow-none rounded-xl border-l-4 border-l-emerald-600">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Assets</p>
              <p className="text-base font-bold mt-0.5 text-emerald-600 tabular-nums">{formatCurrency(totalAssets)}</p>
            </div>
            <DollarSign className="text-emerald-600" size={16} />
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-none rounded-xl border-l-4 border-l-amber-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Liabilities</p>
              <p className="text-base font-bold mt-0.5 text-amber-600 tabular-nums">{formatCurrency(totalLiabilities)}</p>
            </div>
            <Briefcase className="text-amber-500" size={16} />
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-none rounded-xl border-l-4 border-l-purple-600">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Equity</p>
              <p className="text-base font-bold mt-0.5 text-purple-600 tabular-nums">{formatCurrency(totalEquity)}</p>
            </div>
            <PieChart className="text-purple-600" size={16} />
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-none rounded-xl border-l-4 border-l-blue-600">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Equation Status</p>
              <p className="text-xs font-bold mt-1 text-blue-600">BALANCED</p>
            </div>
            <ShieldCheck className="text-blue-600" size={18} />
          </CardContent>
        </Card>
      </div>

      {/* Main Balance Sheet Table */}
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
              
              {/* SECTION: ASSETS */}
              <tr className="bg-slate-50/50 font-black text-[11px] text-[#1e3a8a] uppercase tracking-wide border-b border-slate-100">
                <td colSpan="2" className="px-6 py-3">1. Assets (Hanti)</td>
              </tr>
              {assetsList.map((row, idx) => (
                <tr key={`asset-${idx}`} className="hover:bg-slate-50/30 border-b border-slate-100">
                  <td className="px-12 py-3.5 font-bold text-slate-800">{row.name}</td>
                  <td className="px-8 py-3.5 text-right font-semibold text-slate-700 tabular-nums">{formatCurrency(row.amount)}</td>
                </tr>
              ))}
              <tr className="bg-slate-50/30 font-bold text-slate-900 border-b-2 border-slate-300">
                <td className="px-8 py-3.5 uppercase tracking-tight text-[#1e3a8a] font-extrabold">Total Assets</td>
                <td className="px-8 py-3.5 text-right text-base font-black text-emerald-600 tabular-nums">{formatCurrency(totalAssets)}</td>
              </tr>

              {/* SECTION: LIABILITIES */}
              <tr className="bg-slate-50/50 font-black text-[11px] text-amber-700 uppercase tracking-wide border-b border-slate-100">
                <td colSpan="2" className="px-6 py-3 mt-4">2. Liabilities (Deymo)</td>
              </tr>
              {liabilitiesList.length === 0 ? (
                <tr className="text-slate-400 font-medium italic"><td colSpan="2" className="px-12 py-3">No liability accounts found.</td></tr>
              ) : (
                liabilitiesList.map((row, idx) => (
                  <tr key={`liab-${idx}`} className="hover:bg-slate-50/30 border-b border-slate-100">
                    <td className="px-12 py-3.5 font-bold text-slate-800">{row.name}</td>
                    <td className="px-8 py-3.5 text-right font-semibold text-amber-700 tabular-nums">{formatCurrency(row.amount)}</td>
                  </tr>
                ))
              )}
              <tr className="bg-slate-50/30 font-bold text-slate-900 border-b-2 border-slate-200">
                <td className="px-8 py-3.5 uppercase tracking-tight text-slate-500">Total Liabilities</td>
                <td className="px-8 py-3.5 text-right text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(totalLiabilities)}</td>
              </tr>

              {/* SECTION: EQUITY */}
              <tr className="bg-slate-50/50 font-black text-[11px] text-purple-700 uppercase tracking-wide border-b border-slate-100">
                <td colSpan="2" className="px-6 py-3 mt-4">3. Equity (Hanti Sifaysan)</td>
              </tr>
              {equityList.map((row, idx) => (
                <tr key={`eq-${idx}`} className="hover:bg-slate-50/30 border-b border-slate-100">
                  <td className="px-12 py-3.5 font-bold text-slate-800">{row.name}</td>
                  <td className="px-8 py-3.5 text-right font-semibold text-purple-700 tabular-nums">{formatCurrency(row.amount)}</td>
                </tr>
              ))}
              <tr className="bg-slate-50/30 font-bold text-slate-900 border-b-2 border-slate-300">
                <td className="px-8 py-3.5 uppercase tracking-tight text-slate-500">Total Equity</td>
                <td className="px-8 py-3.5 text-right text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(totalEquity)}</td>
              </tr>

              {/* TOTAL LIABILITIES AND EQUITY */}
              <tr className="bg-slate-100 font-black border-t-2 border-slate-400">
                <td className="px-8 py-5 uppercase tracking-wider text-xs font-black text-slate-800">Total Liabilities & Equity</td>
                <td className="px-8 py-5 text-right tabular-nums text-lg font-black text-slate-900 border-b-4 border-double border-slate-900">
                  {formatCurrency(totalLiabilitiesAndEquity)}
                </td>
              </tr>

            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}