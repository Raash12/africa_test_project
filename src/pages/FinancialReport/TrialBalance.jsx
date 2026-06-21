import React, { useState, useMemo } from "react";
import { 
  Search, 
  Loader2, 
  FileText, 
  FileSpreadsheet as ExcelIcon,
  X,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Scale,
  Filter
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
    let totalOpeningDebit = 0;
    let totalOpeningCredit = 0;
    
    // 1. Diiwaangeli Opening Balances-ka si sax ah
    accounts.forEach(acc => {
      const accId = acc.id || acc.docId;
      if (accId) {
        const oBalance = Number(acc.openingBalance ?? acc.balance ?? 0);
        
        const isCreditAccount = acc.normalBalance === "Credit" || 
                                acc.accountType === "Revenue" || 
                                acc.accountType === "Liability" || 
                                acc.accountType === "Equity";

        if (isCreditAccount) {
          totalOpeningCredit += oBalance;
        } else {
          totalOpeningDebit += oBalance;
        }

        balances[accId] = {
          code: acc.accountCode || "-",
          name: acc.accountName || acc.name || "Unnamed Account",
          accountType: acc.accountType || "Assets",
          debit: isCreditAccount ? 0 : oBalance,
          credit: isCreditAccount ? oBalance : 0,
        };
      }
    });

    // AUTO-BALANCE OPENING BALANCES
    const openingDiff = totalOpeningDebit - totalOpeningCredit;
    if (Math.abs(openingDiff) > 0.01) {
      balances["opening_balance_equity_auto_id"] = {
        code: "3000",
        name: "Opening Balance Equity",
        accountType: "Equity",
        debit: openingDiff < 0 ? Math.abs(openingDiff) : 0,
        credit: openingDiff > 0 ? Math.abs(openingDiff) : 0,
      };
    }

    // 2. Xisaabi Payments
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

    // 5. Netting Off
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
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-xs mt-2 text-blue-600 font-medium tracking-wide">Processing Ledger Aggregations...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen font-sans antialiased text-slate-900">
      
      {/* Clean Premium Blue Header */}
      <div className="bg-[#1e3a8a] rounded-2xl p-6 shadow-md text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white p-1.5 rounded-xl">
              <img src={logo} alt="Logo" className="w-12 h-12 object-contain rounded-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight uppercase">African Ihsan Foundation</h1>
              <p className="text-blue-100 text-xs font-medium">Trial Balance Sheet — Ledger Verification</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportExcel} disabled={exporting || filteredData.length === 0} className="bg-white text-[#1e3a8a] hover:bg-blue-50 font-semibold rounded-xl text-xs shadow-none">
              <ExcelIcon size={14} className="mr-1.5" /> Excel
            </Button>
            <Button onClick={handleExportPDF} disabled={exporting || filteredData.length === 0} className="bg-blue-900 text-white hover:bg-blue-950 font-semibold rounded-xl text-xs shadow-none border border-blue-800">
              {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText size={14} className="mr-1.5" />} PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Balanced Summary Cards (Using Blue Accents) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white border border-slate-200 shadow-none rounded-xl border-l-4 border-l-blue-600">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Debit Operations</p>
              <p className="text-lg font-bold mt-0.5 text-slate-900 tabular-nums">{formatCurrency(totals.debit)}</p>
            </div>
            <TrendingUp className="text-blue-600" size={18} />
          </CardContent>
        </Card>
        <Card className="bg-white border border-slate-200 shadow-none rounded-xl border-l-4 border-l-blue-400">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Credit Operations</p>
              <p className="text-lg font-bold mt-0.5 text-slate-900 tabular-nums">{formatCurrency(totals.credit)}</p>
            </div>
            <TrendingDown className="text-blue-400" size={18} />
          </CardContent>
        </Card>
        <Card className={`bg-white border border-slate-200 shadow-none rounded-xl border-l-4 ${isBalanced ? "border-l-emerald-500" : "border-l-rose-500"}`}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ledger Status</p>
              <p className="text-xs font-bold mt-1.5 flex items-center gap-1.5 text-slate-800">
                {isBalanced ? (
                  <><ShieldCheck size={15} className="text-emerald-600" /> Balanced Statements</>
                ) : (
                  <><Scale size={15} className="text-rose-500" /> Out of Balance</>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Block */}
      <Card className="border border-slate-200 shadow-none rounded-xl overflow-hidden bg-white">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-700 tracking-wider">
              <Filter size={14} className="text-[#1e3a8a]" />
              <span>Audit Filters</span>
              <span className="text-[10px] font-bold bg-blue-50 text-[#1e3a8a] px-2 py-0.5 rounded-md ml-1 border border-blue-100">
                {filteredData.length} Ledgers listed
              </span>
            </div>
            {(selectedType || balanceFilter || search) && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md px-2">
                <X size={12} className="mr-1" /> Clear
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Account Group Type</label>
              <select className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs bg-slate-50 outline-none focus:border-[#1e3a8a] focus:bg-white transition-all" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                <option value="">All Account Classes</option>
                {accountTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Balance Block</label>
              <select className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs bg-slate-50 outline-none focus:border-[#1e3a8a] focus:bg-white transition-all" value={balanceFilter} onChange={(e) => setBalanceFilter(e.target.value)}>
                <option value="">Show All Balances</option>
                <option value="debit">Debit Balances Only</option>
                <option value="credit">Credit Balances Only</option>
              </select>
            </div>
          </div>

          <div className="relative mt-2">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input type="text" placeholder="Search account code, title or types..." className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg outline-none text-xs bg-slate-50 transition-all focus:border-[#1e3a8a] focus:bg-white" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Modern Blue Accounting Table */}
      <Card className="border border-slate-200 shadow-none rounded-xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3.5">Account Code</th>
                <th className="px-6 py-3.5">Account Title</th>
                <th className="px-6 py-3.5">Classification Group</th>
                <th className="px-6 py-3.5 text-right">Debit Balance</th>
                <th className="px-6 py-3.5 text-right">Credit Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-slate-400 bg-slate-50/10">
                    <p className="font-semibold text-xs">No records available inside this scope.</p>
                  </td>
                </tr>
              ) : (
                <>
                  {filteredData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5 font-mono text-blue-700 font-bold tracking-tight">{row.code}</td>
                      <td className="px-6 py-3.5 font-bold text-slate-900">{row.name}</td>
                      <td className="px-6 py-3.5 text-slate-500 font-medium">{row.accountType}</td>
                      <td className="px-6 py-3.5 text-right font-semibold tabular-nums text-slate-900">
                        {row.debit > 0 ? formatCurrency(row.debit) : "—"}
                      </td>
                      <td className="px-6 py-3.5 text-right font-semibold tabular-nums text-slate-900">
                        {row.credit > 0 ? formatCurrency(row.credit) : "—"}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-[#1e3a8a]/5 border-t border-b-2 border-t-[#1e3a8a]/20 border-b-[#1e3a8a]/30 text-[#1e3a8a] font-bold">
                    <td colSpan="3" className="px-6 py-4 uppercase tracking-wider text-xs">Grand Ledger Totals</td>
                    <td className="px-6 py-4 text-right tabular-nums text-sm font-bold border-b border-double border-[#1e3a8a]/40">
                      {formatCurrency(totals.debit)}
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums text-sm font-bold border-b border-double border-[#1e3a8a]/40">
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