import React, { useState, useMemo } from "react";
import { 
  Search, 
  Loader2, 
  FileText, 
  FileSpreadsheet as ExcelIcon,
  Filter,
  X,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Scale
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useAccounts from "@/hooks/useAccounts";
import usePaymentEntry from "@/hooks/usePaymentEntry"; 
import useGrants from "@/hooks/useGrants";
import usePurchaseInvoices from "@/hooks/usePurchaseInvoices"; 
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

export default function TrialBalance() {
  const hooksAccounts = useAccounts() || {};
  const hooksPayments = usePaymentEntry() || {};
  const hooksGrants = useGrants() || {};
  const hooksInvoices = usePurchaseInvoices() || {}; 

  const accounts = hooksAccounts.accounts || hooksAccounts.data || [];
  const payments = hooksPayments.payments || hooksPayments.paymentEntries || hooksPayments.data || [];
  const grants = hooksGrants.grants || hooksGrants.data || [];
  const purchaseInvoices = hooksInvoices.purchaseInvoices || []; 

  const isLoading = hooksAccounts.loading || hooksPayments.loading || hooksGrants.loading || hooksInvoices.loading;

  const [selectedType, setSelectedType] = useState("");
  const [balanceFilter, setBalanceFilter] = useState(""); 
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  // Ledger Engine & Aggregation for Trial Balance
  const trialBalanceData = useMemo(() => {
    if (accounts.length === 0) return [];

    const balances = {};
    
    // 1. Diiwaangeli Opening Balances-ka si sax ah
    accounts.forEach(acc => {
      const accId = acc.id || acc.docId;
      if (accId) {
        const oBalance = Number(acc.openingBalance ?? acc.balance ?? 0);
        balances[accId] = {
          code: acc.accountCode || "-",
          name: acc.accountName || acc.name || "Unnamed Account",
          accountType: acc.accountType || "Assets",
          debit: acc.normalBalance === "Debit" ? oBalance : 0,
          credit: acc.normalBalance === "Credit" ? oBalance : 0,
        };
      }
    });

    // 2. Xisaabi Payments (Debit iyo Credit)
    payments.forEach(p => {
      const amt = Number(p.amount ?? p.amountPaid ?? p.mountPaid ?? 0);
      if (amt <= 0) return;
      const debId = p.chargedToAccountId || p.expenseAccountId;
      const credId = p.paidFromAccountId || p.fromAccountId;
      if (debId && balances[debId]) balances[debId].debit += amt;
      if (credId && balances[credId]) balances[credId].credit += amt;
    });

    // 3. Xisaabi Grants
    grants.forEach(g => {
      const amt = Number(g.amount || 0);
      if (amt <= 0) return;
      const recId = g.receivingAccountId;
      const revId = g.revenueAccountId;
      if (recId && balances[recId]) balances[recId].debit += amt;
      if (revId && balances[revId]) balances[revId].credit += amt;
    });

    // 4. Xisaabi Purchase Invoices
    purchaseInvoices.forEach(inv => {
      const amt = Number(inv.totalAmount || 0);
      if (amt <= 0) return;
      const invId = inv.inventoryAccountId;
      const liabId = inv.liabilityAccountId;
      if (invId && balances[invId]) balances[invId].debit += amt;
      if (liabId && balances[liabId]) balances[liabId].credit += amt;
    });

    // 5. Netting Off (U baddal xogta kama dambaysta ah ee Debit ama Credit ah)
    return Object.values(balances).map(acc => {
      let finalDebit = 0;
      let finalCredit = 0;

      if (acc.debit >= acc.credit) {
        finalDebit = acc.debit - acc.credit;
      } else {
        finalCredit = acc.credit - acc.debit;
      }

      return {
        code: acc.code,
        name: acc.name,
        accountType: acc.accountType,
        debit: finalDebit,
        credit: finalCredit
      };
    }).filter(acc => acc.debit > 0 || acc.credit > 0);
  }, [accounts, payments, grants, purchaseInvoices]);

  const accountTypes = useMemo(() => {
    return [...new Set(trialBalanceData.map(acc => acc.accountType))].sort();
  }, [trialBalanceData]);

  const filteredData = useMemo(() => {
    let result = [...trialBalanceData];

    if (selectedType) {
      result = result.filter(acc => acc.accountType === selectedType);
    }

    if (balanceFilter === "debit") {
      result = result.filter(acc => acc.debit > 0);
    } else if (balanceFilter === "credit") {
      result = result.filter(acc => acc.credit > 0);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(acc => 
        acc.name?.toLowerCase().includes(searchLower) ||
        acc.code?.toLowerCase().includes(searchLower) ||
        acc.accountType?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [trialBalanceData, selectedType, balanceFilter, search]);

  const totals = useMemo(() => {
    return trialBalanceData.reduce((acc, curr) => {
      acc.debit += curr.debit;
      acc.credit += curr.credit;
      return acc;
    }, { debit: 0, credit: 0 });
  }, [trialBalanceData]);

  const isBalanced = Math.abs(totals.debit - totals.credit) < 0.01;

  const handleExportExcel = async () => {
    if (filteredData.length === 0) return;
    setExporting(true);
    try {
      const excelReadyData = filteredData.map(row => ({
        "Account Code": row.code,
        "Account Name": row.name,
        "Type": row.accountType,
        "Debit": row.debit,
        "Credit": row.credit
      }));

      excelReadyData.push({
        "Account Code": "GRAND TOTALS",
        "Account Name": "",
        "Type": "",
        "Debit": totals.debit,
        "Credit": totals.credit
      });

      downloadExcel(excelReadyData, "Trial_Balance_Report");
      toast.success("Excel downloaded successfully!");
    } catch (error) {
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (filteredData.length === 0) return;
    setExporting(true);
    try {
      const columns = ["Account Code", "Account Name", "Type", "Debit", "Credit"];
      
      const pdfReadyData = filteredData.map(row => [
        row.code,
        row.name,
        row.accountType,
        row.debit > 0 ? formatCurrency(row.debit) : "-",
        row.credit > 0 ? formatCurrency(row.credit) : "-"
      ]);

      pdfReadyData.push([
        "GRAND TOTALS",
        "",
        "",
        formatCurrency(totals.debit),
        formatCurrency(totals.credit)
      ]);

      downloadPDF(columns, pdfReadyData, "Trial_Balance_Report");
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setSelectedType("");
    setBalanceFilter("");
    setSearch("");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50/50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-sm mt-2 text-blue-600 font-medium">Processing Ledger Aggregations...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen font-sans antialiased">
      
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] rounded-2xl p-6 shadow-lg text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white p-1.5 rounded-xl shadow-inner">
              <img src={logo} alt="Logo" className="w-12 h-12 object-contain rounded-lg" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight">African Ihsan Foundation</h1>
              <p className="text-blue-100 text-xs font-semibold">Trial Balance Sheet - Ledger Verification</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportExcel} disabled={exporting || filteredData.length === 0} className="bg-white text-[#1e3a8a] hover:bg-blue-50 font-bold rounded-xl shadow-sm">
              <ExcelIcon size={15} className="mr-1.5" /> Excel
            </Button>
            <Button onClick={handleExportPDF} disabled={exporting || filteredData.length === 0} className="bg-blue-950 text-white hover:bg-blue-900 font-bold rounded-xl shadow-sm border border-blue-800">
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText size={15} className="mr-1.5" />} PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Audit Filters */}
      <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-5 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Scale size={16} className="text-blue-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Audit Filters</h3>
              <span className="text-[11px] font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-100">
                {filteredData.length} Ledgers listed
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg">
              <X size={14} className="mr-1" /> Clear
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Account Group Type</label>
              <select className="w-full mt-1 p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 outline-none focus:border-blue-600 focus:bg-white transition-all" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                <option value="">All Account Classes</option>
                {accountTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Balance Block</label>
              <select className="w-full mt-1 p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 outline-none focus:border-blue-600 focus:bg-white transition-all" value={balanceFilter} onChange={(e) => setBalanceFilter(e.target.value)}>
                <option value="">Show All Balances</option>
                <option value="debit">Debit Balances Only</option>
                <option value="credit">Credit Balances Only</option>
              </select>
            </div>
          </div>

          <div className="relative mt-4">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={15} />
            <input type="text" placeholder="Search account code, title or types..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:border-blue-600 outline-none bg-slate-50 text-xs transition-all focus:bg-white" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm bg-blue-50/70 rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Total Debit Operations</p>
              <p className="text-xl font-black mt-0.5 text-blue-950">{formatCurrency(totals.debit)}</p>
            </div>
            <TrendingUp className="text-blue-600 opacity-80" size={20} />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-purple-50/70 rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Total Credit Operations</p>
              <p className="text-xl font-black mt-0.5 text-purple-950">{formatCurrency(totals.credit)}</p>
            </div>
            <TrendingDown className="text-purple-600 opacity-80" size={20} />
          </CardContent>
        </Card>
        <Card className={`border-none shadow-sm rounded-2xl ${isBalanced ? "bg-emerald-50/70" : "bg-rose-50/70"}`}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${isBalanced ? "text-emerald-600" : "text-rose-600"}`}>Ledger Status</p>
              <p className="text-sm font-black mt-1.5 flex items-center gap-1 text-slate-900">
                {isBalanced ? (
                  <><ShieldCheck size={16} className="text-emerald-600" /> Balanced Statements</>
                ) : (
                  <><Scale size={16} className="text-rose-600" /> Out of Balance</>
                )}
              </p>
            </div>
            <Scale className={isBalanced ? "text-emerald-600" : "text-rose-600"} size={20} />
          </CardContent>
        </Card>
      </div>

      {/* Ledger Table */}
      <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1e3a8a] text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Account Code</th>
                <th className="px-6 py-4">Account Title</th>
                <th className="px-6 py-4">Classification Group</th>
                <th className="px-6 py-4 text-right">Debit Balance</th>
                <th className="px-6 py-4 text-right">Credit Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-800 font-medium">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-16 text-slate-400 bg-slate-50/50">
                    <p className="font-semibold text-xs">No records available inside this scope.</p>
                  </td>
                </tr>
              ) : (
                <>
                  {filteredData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-mono text-blue-600 text-[11px] font-bold">{row.code}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{row.name}</td>
                      <td className="px-6 py-4 text-slate-500 font-semibold">{row.accountType}</td>
                      <td className="px-6 py-4 text-right font-bold tabular-nums text-slate-900">
                        {row.debit > 0 ? formatCurrency(row.debit) : "—"}
                      </td>
                      <td className="px-6 py-4 text-right font-bold tabular-nums text-slate-500">
                        {row.credit > 0 ? formatCurrency(row.credit) : "—"}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-900 text-white font-bold text-xs">
                    <td colSpan="3" className="px-6 py-4 uppercase tracking-wider">Grand Ledger Totals</td>
                    <td className="px-6 py-4 text-right tabular-nums text-blue-300 text-sm">
                      {formatCurrency(totals.debit)}
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums text-purple-300 text-sm">
                      {formatCurrency(totals.credit)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}