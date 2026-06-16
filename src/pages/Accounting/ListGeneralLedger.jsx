import React, { useState, useMemo } from "react";
import { Search, FileSpreadsheet, Download, Loader2, Calendar } from "lucide-react";
import useGrants from "@/hooks/useGrants";
import usePaymentEntry from "@/hooks/usePaymentEntry";
import useAccounts from "@/hooks/useAccounts"; 

const formatCurrency = (val) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

export default function ListGeneralLedger() {
  const { accounts = [], loading: loadingAccounts } = useAccounts() || {};
  const { grants = [], loading: loadingGrants } = useGrants() || {};
  const { payments = [], loading: loadingPayments } = usePaymentEntry() || {};

  const [selectedAccountId, setSelectedAccountId] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const rowsPerPage = 10;

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
          createdAt: curr.createdAt
        };
      }
      return acc;
    }, {});
  }, [accounts]);

  // 2. Data Engine: Ledger Transactions
  const ledgerData = useMemo(() => {
    let entries = [];

    grants.forEach(g => {
      const amt = Number(g.amount || 0);
      if (g.receivingAccountId) {
        entries.push({
          id: `${g.id}-grant`, 
          date: formatFirestoreDate(g.startDate),
          rawDate: getRawDate(g.startDate),
          description: `Grant Received: ${g.grantName}`,
          counterparty: g.donorName || "-", debit: amt, credit: 0, accountId: g.receivingAccountId,
          accountName: accountMap[g.receivingAccountId]?.name || "Bank Account",
          typeOrder: 2
        });
      }
    });

    payments.forEach(p => {
      const amt = Number(p.amountPaid || p.amount || 0);
      if (p.fromAccountId) {
        entries.push({
          id: `${p.journalEntryId}-pay-bank`, 
          date: formatFirestoreDate(p.paymentDate),
          rawDate: getRawDate(p.paymentDate),
          description: `Expense Payment: ${p.invoiceNumber || ""}`,
          counterparty: p.supplierName || "-", debit: 0, credit: amt, accountId: p.fromAccountId,
          accountName: accountMap[p.fromAccountId]?.name || "Bank Account",
          typeOrder: 3
        });
      }
    });

    return entries;
  }, [grants, payments, accountMap]);

  // 3. Process Engine: Filters, Balances & Real Dates
  const processedData = useMemo(() => {
    let baseEntries = [];

    if (selectedAccountId === "all") {
      accounts.forEach(acc => {
        const accId = acc.id || acc.docId;
        const target = accountMap[accId];
        if (target && target.openingBalance > 0) {
          baseEntries.push({
            id: `open-${accId}`, 
            date: formatFirestoreDate(target.createdAt),
            rawDate: new Date(0), 
            description: `📥 Opening Balance: ${target.name}`, counterparty: '-',
            debit: 0, credit: 0, isOpening: true, accountId: accId,
            accountName: target.name, accountRunningBalance: target.openingBalance,
            typeOrder: 1
          });
        }
      });
    } else {
      const selectedAcc = accountMap[selectedAccountId];
      if (selectedAcc) {
        baseEntries.push({
          id: `open-${selectedAccountId}`, 
          date: formatFirestoreDate(selectedAcc.createdAt),
          rawDate: new Date(0), 
          description: `📥 Opening Balance (From Chart of Accounts)`, counterparty: '-',
          debit: 0, credit: 0, isOpening: true, accountId: selectedAccountId,
          accountName: selectedAcc.name, accountRunningBalance: selectedAcc.openingBalance,
          typeOrder: 1
        });
      }
    }

    let allEntries = [...baseEntries, ...ledgerData];

    let filteredEntries = allEntries.filter(e => {
      const matchesAccount = selectedAccountId === "all" || String(e.accountId) === String(selectedAccountId);
      const matchesSearch = (e.description || "").toLowerCase().includes(search.toLowerCase()) || 
                           (e.accountName || "").toLowerCase().includes(search.toLowerCase());
      return matchesAccount && matchesSearch;
    });

    let sortedOldestFirst = [...filteredEntries].sort((a, b) => {
      if (a.rawDate.getTime() !== b.rawDate.getTime()) {
        return a.rawDate - b.rawDate;
      }
      return a.typeOrder - b.typeOrder;
    });

    const rollingBalances = {};
    accounts.forEach(acc => {
      const accId = acc.id || acc.docId;
      rollingBalances[accId] = accountMap[accId]?.openingBalance || 0;
    });

    let calculated = sortedOldestFirst.map((entry) => {
      if (entry.isOpening) return entry;
      
      const accId = entry.accountId;
      const norm = accountMap[accId]?.normalBalance || "Debit";
      if (norm === "Debit") {
        rollingBalances[accId] += (entry.debit - entry.credit);
      } else {
        rollingBalances[accId] += (entry.credit - entry.debit);
      }
      return { ...entry, accountRunningBalance: rollingBalances[accId] };
    });

    return calculated.sort((a, b) => {
      if (a.isOpening && !b.isOpening) return 1;
      if (!a.isOpening && b.isOpening) return -1;
      if (a.rawDate.getTime() === b.rawDate.getTime()) {
        return b.typeOrder - a.typeOrder; 
      }
      return b.rawDate - a.rawDate;
    });
  }, [ledgerData, selectedAccountId, search, accounts, accountMap]);

  // PAGINATION CALCULATION
  const totalPages = Math.ceil(processedData.length / rowsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return processedData.slice(start, start + rowsPerPage);
  }, [processedData, currentPage]);

  if (loadingAccounts) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-slate-800" />
        <p className="text-sm mt-2 text-slate-500 font-medium">Processing general ledger data...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen font-sans antialiased">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">General Ledger</h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">Audit-Ready Financial Tracking</p>
        </div>
        <select 
          className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm outline-none text-slate-800 cursor-pointer hover:border-slate-300 transition-all"
          value={selectedAccountId}
          onChange={(e) => { setSelectedAccountId(e.target.value); setCurrentPage(1); }}
        >
          <option value="all">All Accounts (Consolidated)</option>
          {accounts.map(acc => {
            const accId = acc.id || acc.docId;
            return <option key={accId} value={accId}>{acc.accountCode ? `[${acc.accountCode}] ` : ""}{acc.accountName}</option>;
          })}
        </select>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Actions bar */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none text-slate-800 placeholder-slate-400 focus:bg-white focus:border-slate-900 transition-all" 
              placeholder="Search descriptions or accounts..." 
              value={search} 
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} 
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-emerald-700 transition-all cursor-pointer">
              <FileSpreadsheet size={14} /> Export CSV
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-slate-800 transition-all cursor-pointer">
              <Download size={14} /> Download PDF
            </button>
          </div>
        </div>

        {/* Professional Table Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Account</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Debit</th>
                <th className="px-6 py-4 text-right">Credit</th>
                <th className="px-6 py-4 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 text-slate-700">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-sm font-medium text-slate-400 bg-white">
                    No transactions found in the general ledger.
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
                      {row.isOpening ? <span className="text-slate-900 font-bold">{row.description}</span> : row.description}
                    </td>
                    <td className="px-6 py-4 text-right text-emerald-600 font-semibold tabular-nums">
                      {row.debit > 0 ? formatCurrency(row.debit) : "-"}
                    </td>
                    <td className="px-6 py-4 text-right text-rose-600 font-semibold tabular-nums">
                      {row.credit > 0 ? formatCurrency(row.credit) : "-"}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900 tabular-nums">
                      {formatCurrency(row.accountRunningBalance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION BUTTONS SECTION */}
        {processedData.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-white text-xs text-slate-500 font-medium">
            <div>
              Showing page <span className="font-bold text-slate-800">{currentPage}</span> of <span className="font-bold text-slate-800">{totalPages}</span> (<span className="font-bold text-slate-800">{processedData.length}</span> total entries)
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 border rounded-lg font-bold transition-all ${currentPage === 1 ? 'border-slate-100 text-slate-300 cursor-not-allowed' : 'border-slate-200 text-slate-700 hover:border-slate-300 bg-white cursor-pointer'}`}
              >
                Previous
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1.5 border rounded-lg font-bold transition-all ${currentPage === totalPages ? 'border-slate-100 text-slate-300 cursor-not-allowed' : 'border-slate-200 text-slate-700 hover:border-slate-300 bg-white cursor-pointer'}`}
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}