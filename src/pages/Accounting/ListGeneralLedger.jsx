import React, { useState, useMemo } from "react";
import { Search, Calendar, FileText, Loader2, FileSpreadsheet as ExcelIcon } from "lucide-react";
import useAccounts from "@/hooks/useAccounts";
import usePaymentEntry from "@/hooks/usePaymentEntry"; 
import useGrants from "@/hooks/useGrants";
import usePurchaseInvoices from "@/hooks/usePurchaseInvoices"; 
import { downloadPDF, downloadExcel } from "@/utils/exportUtils";

const formatCurrency = (val) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

export default function ListGeneralLedger() {
  const hooksAccounts = useAccounts() || {};
  const hooksPayments = usePaymentEntry() || {};
  const hooksGrants = useGrants() || {};
  const hooksInvoices = usePurchaseInvoices() || {}; 

  const accounts = hooksAccounts.accounts || hooksAccounts.data || [];
  const payments = hooksPayments.payments || hooksPayments.paymentEntries || hooksPayments.data || [];
  const grants = hooksGrants.grants || hooksGrants.data || [];
  const purchaseInvoices = hooksInvoices.purchaseInvoices || []; 

  const loadingAccounts = hooksAccounts.loading;
  const loadingPayments = hooksPayments.loading;
  const loadingGrants = hooksGrants.loading;
  const loadingInvoices = hooksInvoices.loading; 

  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);
  const rowsPerPage = 10;

  const isLoading = loadingAccounts || loadingPayments || loadingGrants || loadingInvoices;

  const getRawDate = (dateField) => {
    if (!dateField) return new Date(0);
    if (typeof dateField.toDate === "function") return dateField.toDate();
    if (dateField.seconds) return new Date(dateField.seconds * 1000);
    return new Date(dateField);
  };

  const formatFirestoreDate = (dateField) => {
    const d = getRawDate(dateField);
    if (isNaN(d.getTime()) || d.getTime() === 0) return "N/A";
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // 1. Chart of Accounts Map
  const accountMap = useMemo(() => {
    return accounts.reduce((acc, curr) => {
      const accId = curr.id || curr.docId;
      if (accId) {
        const oBalance = Number(curr.openingBalance ?? curr.balance ?? 0);
        acc[accId] = { 
          id: accId,
          name: curr.accountName || "Unnamed Account", 
          code: curr.accountCode || "",
          openingBalance: oBalance, 
          normalBalance: curr.normalBalance || "Debit",
          accountType: curr.accountType || "Assets",
          createdAt: curr.createdAt,
        };
      }
      return acc;
    }, {});
  }, [accounts]);

  // 2. Combined Ledger Engine
  const processedData = useMemo(() => {
    let entries = [];

    // A. Opening Balances
    Object.keys(accountMap).forEach(accId => {
      const target = accountMap[accId];
      if (target && target.openingBalance > 0) {
        entries.push({
          id: `open-${accId}`, 
          date: formatFirestoreDate(target.createdAt),
          rawDate: new Date(0), 
          createdTimestamp: new Date(0), // Opening balance mar walba waa bilowga dunida
          description: `📥 Opening Balance: ${target.name}`, 
          counterparty: '-',
          debit: target.normalBalance === "Debit" ? target.openingBalance : 0, 
          credit: target.normalBalance === "Credit" ? target.openingBalance : 0, 
          isOpening: true, 
          accountId: accId,
          accountName: target.name, 
          typeOrder: 1
        });
      }
    });

    // B. Payment Entries
    payments.forEach(p => {
      const amt = Number(p.amount ?? p.amountPaid ?? p.mountPaid ?? 0);
      if (amt <= 0) return; 

      let typeLabel = p.type ? `[${p.type.toUpperCase()}]` : "📋 Expense";
      let invoiceLabel = p.invoiceNumber ? ` (${p.invoiceNumber})` : "";
      let descriptionStr = `${typeLabel} ${p.description || "Payment Entry"}${invoiceLabel}`;
      
      const txDate = p.date || p.paymentDate || p.createdAt;
      const insertionDate = p.createdAt || p.date; // 🌟 Firestore Entry Timestamp

      const targetDebAccId = p.chargedToAccountId || p.expenseAccountId;
      const targetDebName = p.chargedToAccount || accountMap[targetDebAccId]?.name || "Expense Account";

      const targetCredAccId = p.paidFromAccountId || p.fromAccountId;
      const targetCredName = p.paidFromAccount || accountMap[targetCredAccId]?.name || "Bank Account";

      if (targetDebAccId) {
        entries.push({
          id: `${p.id || Math.random()}-dr`, 
          date: formatFirestoreDate(txDate),
          rawDate: getRawDate(txDate),
          createdTimestamp: getRawDate(insertionDate), // 🌟 Save entry time
          description: `DR | ${descriptionStr}`,
          counterparty: p.supplierName || p.employeeName || "-",
          debit: amt, 
          credit: 0,
          accountId: targetDebAccId,
          accountName: targetDebName,
          typeOrder: 2
        });
      }

      if (targetCredAccId) {
        entries.push({
          id: `${p.id || Math.random()}-cr`, 
          date: formatFirestoreDate(txDate),
          rawDate: getRawDate(txDate),
          createdTimestamp: getRawDate(insertionDate), // 🌟 Save entry time
          description: `CR | ${descriptionStr}`,
          counterparty: p.supplierName || p.employeeName || "-",
          debit: 0,
          credit: amt, 
          accountId: targetCredAccId,
          accountName: targetCredName,
          typeOrder: 3 
        });
      }
    });

    // C. Grants
    grants.forEach(g => {
      const amt = Number(g.amount || g.amountPaid || 0);
      if (amt <= 0) return;

      const accId = g.receivingAccountId || g.accountId || g.bankAccountId;
      const targetAccName = accountMap[accId]?.name || g.receivingAccount || "Bank Account";
      const insertionDate = g.createdAt || g.date; // 🌟 Firestore Entry Timestamp

      if (accId) {
        entries.push({
          id: g.id || `grant-${Math.random()}`,
          date: formatFirestoreDate(g.date || g.createdAt),
          rawDate: getRawDate(g.date || g.createdAt),
          createdTimestamp: getRawDate(insertionDate), // 🌟 Save entry time
          description: `🎁 Grant Revenue: ${g.grantName || g.description || 'Donor Funding'}`,
          counterparty: g.donorName || g.donor || "-",
          debit: amt, 
          credit: 0,
          accountId: accId,
          accountName: targetAccName,
          typeOrder: 2
        });
      }
    });

    // D. PURCHASE INVOICES DOUBLE-ENTRY
    purchaseInvoices.forEach(inv => {
      const amt = Number(inv.totalAmount || 0);
      if (amt <= 0) return;

      const txDate = inv.dueDate || inv.createdAt;
      const insertionDate = inv.createdAt || inv.dueDate; // 🌟 Firestore Entry Timestamp
      const descStr = `🧾 Purchase Invoice: ${inv.invoiceNumber || "N/A"} (PO: ${inv.poNumber || "N/A"})`;

      if (inv.inventoryAccountId) {
        const invAccName = accountMap[inv.inventoryAccountId]?.name || inv.inventoryAccountName || "Inventory Account";
        entries.push({
          id: `${inv.id || Math.random()}-pi-dr`,
          date: formatFirestoreDate(txDate),
          rawDate: getRawDate(txDate),
          createdTimestamp: getRawDate(insertionDate), // 🌟 Save entry time
          description: `DR | ${descStr}`,
          counterparty: inv.supplierName || "-",
          debit: amt,
          credit: 0,
          accountId: inv.inventoryAccountId,
          accountName: invAccName,
          typeOrder: 2
        });
      }

      if (inv.liabilityAccountId) {
        const liabAccName = accountMap[inv.liabilityAccountId]?.name || inv.liabilityAccountName || "Accounts Payable";
        entries.push({
          id: `${inv.id || Math.random()}-pi-cr`,
          date: formatFirestoreDate(txDate),
          rawDate: getRawDate(txDate),
          createdTimestamp: getRawDate(insertionDate), // 🌟 Save entry time
          description: `CR | ${descStr}`,
          counterparty: inv.supplierName || "-",
          debit: 0,
          credit: amt,
          accountId: inv.liabilityAccountId,
          accountName: liabAccName,
          typeOrder: 3
        });
      }
    });

    // STEP 1: Sort chronological (Oldest to Newest) based on rawDate for proper rolling balances
    entries.sort((a, b) => {
      if (a.rawDate.getTime() !== b.rawDate.getTime()) return a.rawDate - b.rawDate;
      return a.typeOrder - b.typeOrder;
    });

    // Calculate Running Balance
    const rollingBalances = {};
    entries.forEach(entry => {
      const accId = entry.accountId;
      if (rollingBalances[accId] === undefined) {
        rollingBalances[accId] = accountMap[accId]?.openingBalance || 0;
      }

      if (entry.isOpening) {
        entry.rowRunningBalance = rollingBalances[accId];
        return;
      }

      const norm = accountMap[accId]?.normalBalance || "Debit";
      if (norm === "Debit") {
        rollingBalances[accId] += (entry.debit - entry.credit);
      } else {
        rollingBalances[accId] += (entry.credit - entry.debit);
      }
      entry.rowRunningBalance = rollingBalances[accId];
    });

    // Filter by search
    let filtered = entries.filter(e => {
      return (e.description || "").toLowerCase().includes(search.toLowerCase()) || 
             (e.accountName || "").toLowerCase().includes(search.toLowerCase()) ||
             (e.counterparty || "").toLowerCase().includes(search.toLowerCase());
    });

    // STEP 2: 🌟 DISPLAY SORTING BY FIRESTORE ENTRY TIME (Newest to Oldest)
    // Kii ugu dambeeyey ee database-ka gala (createdAt kii ugu dambeeyey) ayaa mar walba liiska ugu korreeya.
    const finalSorted = filtered.sort((a, b) => {
      if (b.createdTimestamp.getTime() !== a.createdTimestamp.getTime()) {
        return b.createdTimestamp - a.createdTimestamp; 
      }
      return b.typeOrder - a.typeOrder;
    });

    return finalSorted;

  }, [accounts, payments, grants, purchaseInvoices, accountMap, search]);

  // Pagination Logic
  const totalPages = Math.ceil(processedData.length / rowsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return processedData.slice(start, start + rowsPerPage);
  }, [processedData, currentPage]);

  // Export Functions
  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const companyName = "AFRICAN IHSAN FOUNDATION";
      await downloadPDF(processedData, "General_Ledger_Report", companyName);
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const companyName = "AFRICAN IHSAN FOUNDATION";
      await downloadExcel(processedData, "General_Ledger_Report", companyName);
    } catch (error) {
      console.error("Excel Export Error:", error);
      alert("Failed to export Excel. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-slate-800" />
        <p className="text-sm mt-2 text-slate-500 font-medium">Loading ledger data...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen font-sans antialiased">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">General Ledger</h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">Audit-Ready Financial Tracking</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none text-slate-800 placeholder-slate-400 focus:bg-white focus:border-slate-900 transition-all" 
              placeholder="Search descriptions, grants, invoices or accounts..." 
              value={search} 
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} 
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleExportExcel}
              disabled={exporting || processedData.length === 0}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                exporting || processedData.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExcelIcon size={14} />}
              Export Excel
            </button>
            
            <button 
              onClick={handleExportPDF}
              disabled={exporting || processedData.length === 0}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                exporting || processedData.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText size={14} />}
              Export PDF
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Account</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Debit</th>
                <th className="px-6 py-4 text-right">Credit</th>
                <th className="px-6 py-4 text-right">Account Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 text-slate-700">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-sm font-medium text-slate-400 bg-white">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => (
                  <tr key={idx} className={`${row.isOpening ? 'bg-slate-50/50 font-medium text-slate-900' : 'hover:bg-slate-50/40'} transition-all`}>
                    <td className="px-6 py-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-400" />
                        {row.date}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-900 whitespace-nowrap">{row.accountName}</td>
                    <td className="px-6 py-4 text-sm font-normal text-slate-800">
                      {row.description}
                      {row.counterparty && row.counterparty !== "-" && (
                        <span className="ml-2 text-xs text-slate-400">· {row.counterparty}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-emerald-600 font-semibold tabular-nums">
                      {row.debit > 0 ? formatCurrency(row.debit) : "-"}
                    </td>
                    <td className="px-6 py-4 text-right text-rose-600 font-semibold tabular-nums">
                      {row.credit > 0 ? formatCurrency(row.credit) : "-"}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900 tabular-nums">
                      {formatCurrency(row.rowRunningBalance ?? 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {processedData.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-white text-xs text-slate-500 font-medium">
            <div>
              Showing page <span className="font-bold text-slate-800">{currentPage}</span> of <span className="font-bold text-slate-800">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                disabled={currentPage === 1} 
                className="px-3 py-1.5 border rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                disabled={currentPage === totalPages} 
                className="px-3 py-1.5 border rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {exporting && (
        <div className="fixed bottom-4 right-4 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Exporting your report...</span>
        </div>
      )}
    </div>
  );
}