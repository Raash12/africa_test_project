import React, { useState, useMemo, useRef } from "react";
import { Search, FileSpreadsheet, Download, Loader2, Calendar, Printer } from "lucide-react";
import useGrants from "@/hooks/useGrants";
import usePaymentEntry from "@/hooks/usePaymentEntry";
import useAccounts from "@/hooks/useAccounts";
import useJournalEntries from "@/hooks/useJournalEntries";
import jsPDF from "jspdf";
import "jspdf-autotable";

const formatCurrency = (val) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

export default function ListGeneralLedger() {
  const { accounts = [], loading: loadingAccounts } = useAccounts() || {};
  const { grants = [], loading: loadingGrants } = useGrants() || {};
  const { payments = [], loading: loadingPayments } = usePaymentEntry() || {};
  const { entries: journalEntries = [], loading: loadingJournal } = useJournalEntries() || {};

  const [selectedAccountId, setSelectedAccountId] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const rowsPerPage = 10;
  const tableRef = useRef();

  const loading = loadingAccounts || loadingGrants || loadingPayments || loadingJournal;

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

  // 1. Chart of Accounts Map - Use balance as the current balance
  const accountMap = useMemo(() => {
    return accounts.reduce((acc, curr) => {
      const accId = curr.id || curr.docId;
      if (accId) {
        const oBalance = Number(curr.openingBalance ?? 0);
        const currentBalance = Number(curr.balance ?? curr.currentBalance ?? oBalance ?? 0);
        acc[accId] = { 
          id: accId,
          name: curr.accountName || "Unnamed Account", 
          code: curr.accountCode || "",
          openingBalance: oBalance, 
          currentBalance: currentBalance,
          normalBalance: curr.normalBalance || "Debit",
          accountType: curr.accountType || "Assets",
          createdAt: curr.createdAt,
        };
      }
      return acc;
    }, {});
  }, [accounts]);

  // 2. Data Engine: Ledger Transactions from ALL sources
  const ledgerData = useMemo(() => {
    let entries = [];

    // A) GRANTS - Income
    grants.forEach(g => {
      const amt = Number(g.amount || 0);
      if (g.receivingAccountId && amt > 0) {
        const accId = g.receivingAccountId;
        entries.push({
          id: `${g.id}-grant`, 
          date: formatFirestoreDate(g.startDate || g.createdAt),
          rawDate: getRawDate(g.startDate || g.createdAt),
          description: `💰 Grant Received: ${g.grantName || 'Grant'}`,
          counterparty: g.donorName || "-", 
          debit: amt, 
          credit: 0, 
          accountId: accId,
          accountName: accountMap[accId]?.name || "Bank Account",
          typeOrder: 2,
          source: 'Grant'
        });
      }
    });

    // B) PAYMENTS - Bank payments (from payment collection)
    payments.forEach(p => {
      const amt = Number(p.amountPaid || p.amount || 0);
      if (p.fromAccountId && amt > 0) {
        entries.push({
          id: `${p.journalEntryId}-pay-bank`, 
          date: formatFirestoreDate(p.paymentDate || p.date),
          rawDate: getRawDate(p.paymentDate || p.date),
          description: `💳 Payment: ${p.invoiceNumber || p.description || 'Expense Payment'}`,
          counterparty: p.supplierName || "-", 
          debit: 0, 
          credit: amt, 
          accountId: p.fromAccountId,
          accountName: accountMap[p.fromAccountId]?.name || "Bank Account",
          typeOrder: 3,
          source: 'Payment'
        });
      }
    });

    // C) JOURNAL ENTRIES - Includes Payroll, Transfers, Adjustments
    journalEntries.forEach(je => {
      const items = je.items || je.entries || [];
      const jeDate = je.date || je.createdAt || new Date();
      const rawDate = getRawDate(jeDate);
      const formattedDate = formatFirestoreDate(jeDate);

      items.forEach(item => {
        const debit = Number(item.debit || 0);
        const credit = Number(item.credit || 0);
        
        // Skip zero transactions and opening balance entries (handled separately)
        if (debit === 0 && credit === 0) return;
        if (je.description?.includes('Opening Balance Setup')) return;

        // Find account ID
        let accountId = item.accountId;
        if (!accountId && item.accountName) {
          const found = accounts.find(acc => 
            acc.accountName?.toLowerCase() === item.accountName?.toLowerCase()
          );
          if (found) accountId = found.id || found.docId;
        }

        // Use account name from map or item
        const accountName = accountId ? 
          (accountMap[accountId]?.name || item.accountName || 'Unknown Account') : 
          (item.accountName || 'Unknown Account');

        const entry = {
          id: `${je.id}-${item.accountName || item.accountId}-${Date.now()}`,
          date: formattedDate,
          rawDate: rawDate,
          description: `📋 ${je.description || 'Journal Entry'}`,
          counterparty: item.memo || je.description || '-',
          debit: debit,
          credit: credit,
          accountId: accountId || item.accountId,
          accountName: accountName,
          typeOrder: 2.5,
          source: 'Journal',
          jeId: je.id
        };
        
        entries.push(entry);
      });
    });

    return entries;
  }, [grants, payments, journalEntries, accountMap, accounts]);

  // 3. Process Engine: Filters, Balances & Real Dates
  const processedData = useMemo(() => {
    let baseEntries = [];

    // Get current balances for accounts
    const accountBalances = {};
    accounts.forEach(acc => {
      const accId = acc.id || acc.docId;
      // Use the balance from the database as the starting point
      accountBalances[accId] = Number(acc.balance ?? acc.currentBalance ?? 0);
    });

    // We DON'T add opening balance entries as separate transactions
    // Instead, we use the balance field directly

    let allEntries = [...ledgerData];

    // Apply date filters
    let filteredEntries = allEntries.filter(e => {
      const matchesAccount = selectedAccountId === "all" || String(e.accountId) === String(selectedAccountId);
      const matchesSearch = (e.description || "").toLowerCase().includes(search.toLowerCase()) || 
                           (e.accountName || "").toLowerCase().includes(search.toLowerCase()) ||
                           (e.counterparty || "").toLowerCase().includes(search.toLowerCase());

      // Date filtering
      let matchesDate = true;
      const entryDate = getRawDate(e.rawDate);
      
      if (startDate && entryDate.getTime() > 0) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (entryDate < start) matchesDate = false;
      }
      if (endDate && entryDate.getTime() > 0) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (entryDate > end) matchesDate = false;
      }

      return matchesAccount && matchesSearch && matchesDate;
    });

    // Sort by date for correct balance calculation
    let sortedEntries = [...filteredEntries].sort((a, b) => {
      if (a.rawDate.getTime() !== b.rawDate.getTime()) {
        return a.rawDate - b.rawDate;
      }
      return a.typeOrder - b.typeOrder;
    });

    // Calculate running balances
    // Start with the account's current balance from database
    const runningBalances = {};
    accounts.forEach(acc => {
      const accId = acc.id || acc.docId;
      // Initialize with the balance from the database
      runningBalances[accId] = Number(acc.balance ?? acc.currentBalance ?? 0);
    });

    // We need to work backwards to show the correct running balance
    // First, get all transactions for each account
    const accountTransactions = {};
    sortedEntries.forEach(entry => {
      if (!entry.accountId) return;
      if (!accountTransactions[entry.accountId]) {
        accountTransactions[entry.accountId] = [];
      }
      accountTransactions[entry.accountId].push(entry);
    });

    // For each account, calculate running balances starting from the current balance
    // and working backwards, then reverse for display
    Object.keys(accountTransactions).forEach(accId => {
      const transactions = accountTransactions[accId];
      const acc = accountMap[accId];
      if (!acc) return;

      // Start with the current balance from database
      let currentBalance = runningBalances[accId];
      const norm = acc.normalBalance || "Debit";

      // Work backwards to assign balances
      const reversed = [...transactions].reverse();
      reversed.forEach(entry => {
        if (norm === "Debit") {
          // For debit accounts: balance = balance - debit + credit
          currentBalance = currentBalance - entry.debit + entry.credit;
        } else {
          // For credit accounts: balance = balance - credit + debit
          currentBalance = currentBalance - entry.credit + entry.debit;
        }
        entry.accountRunningBalance = currentBalance;
      });

      // Now reverse back to original order with correct balances
      // The balances are already correct from the reverse calculation
    });

    // Sort newest first for display
    return sortedEntries.sort((a, b) => {
      if (a.rawDate.getTime() === b.rawDate.getTime()) {
        return b.typeOrder - a.typeOrder;
      }
      return b.rawDate - a.rawDate;
    });
  }, [ledgerData, selectedAccountId, search, startDate, endDate, accounts, accountMap]);

  // PAGINATION CALCULATION
  const totalPages = Math.ceil(processedData.length / rowsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return processedData.slice(start, start + rowsPerPage);
  }, [processedData, currentPage]);

  // EXPORT FUNCTIONS
  const exportCSV = () => {
    const headers = ['Date', 'Account', 'Description', 'Counterparty', 'Debit', 'Credit', 'Balance', 'Source'];
    const rows = processedData.map(row => [
      row.date,
      row.accountName,
      row.description,
      row.counterparty || '-',
      row.debit || 0,
      row.credit || 0,
      row.accountRunningBalance || 0,
      row.source || 'General'
    ]);
    
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `General_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text('General Ledger Report', pageWidth/2, 20, { align: 'center' });
    
    // Subtitle with date range
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    let dateRange = 'All Dates';
    if (startDate || endDate) {
      dateRange = `${startDate || 'Start'} to ${endDate || 'End'}`;
    }
    doc.text(`Report Date: ${new Date().toLocaleDateString()} | ${dateRange}`, pageWidth/2, 28, { align: 'center' });
    
    // Account filter
    const accountName = selectedAccountId === 'all' ? 'All Accounts' : 
      accountMap[selectedAccountId]?.name || 'Selected Account';
    doc.text(`Account: ${accountName}`, pageWidth/2, 34, { align: 'center' });
    
    // Table
    const tableData = processedData.map(row => [
      row.date,
      row.accountName,
      row.description.length > 30 ? row.description.substring(0, 27) + '...' : row.description,
      row.counterparty || '-',
      row.debit || 0,
      row.credit || 0,
      row.accountRunningBalance || 0
    ]);
    
    doc.autoTable({
      startY: 40,
      head: [['Date', 'Account', 'Description', 'Counterparty', 'Debit', 'Credit', 'Balance']],
      body: tableData,
      theme: 'striped',
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [30, 58, 138], fontSize: 8, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 35 },
        2: { cellWidth: 55 },
        3: { cellWidth: 30 },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 30, halign: 'right' }
      }
    });
    
    // Footer
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Total Entries: ${processedData.length} | Generated on ${new Date().toLocaleString()}`, pageWidth/2, finalY, { align: 'center' });
    
    doc.save(`General_Ledger_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-slate-800" />
        <p className="text-sm mt-2 text-slate-500 font-medium">Processing general ledger data...</p>
      </div>
    );
  }

  // Get account summary data
  const accountSummaries = {};
  accounts.forEach(acc => {
    const accId = acc.id || acc.docId;
    const balance = Number(acc.balance ?? acc.currentBalance ?? 0);
    accountSummaries[accId] = {
      name: acc.accountName,
      code: acc.accountCode,
      balance: balance
    };
  });

  return (
    <div className="p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen font-sans antialiased">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">General Ledger</h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">Audit-Ready Financial Tracking</p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm outline-none text-slate-800 cursor-pointer hover:border-slate-300 transition-all min-w-[200px]"
            value={selectedAccountId}
            onChange={(e) => { setSelectedAccountId(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">All Accounts (Consolidated)</option>
            {accounts.map(acc => {
              const accId = acc.id || acc.docId;
              return <option key={accId} value={accId}>[{acc.accountCode || ''}] {acc.accountName}</option>;
            })}
          </select>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4 items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none text-slate-800 placeholder-slate-400 focus:bg-white focus:border-slate-900 transition-all" 
            placeholder="Search descriptions or accounts..." 
            value={search} 
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} 
          />
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="date" 
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-800 focus:bg-white focus:border-slate-900 outline-none"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span className="text-slate-400 text-xs font-bold">to</span>
          <input 
            type="date" 
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-800 focus:bg-white focus:border-slate-900 outline-none"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="flex gap-2 ml-auto">
          <button 
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-emerald-700 transition-all cursor-pointer"
          >
            <FileSpreadsheet size={14} /> Export CSV
          </button>
          <button 
            onClick={exportPDF}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-slate-800 transition-all cursor-pointer"
          >
            <Download size={14} /> Download PDF
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Professional Table Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" ref={tableRef}>
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Account</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Counterparty</th>
                <th className="px-6 py-4 text-right">Debit</th>
                <th className="px-6 py-4 text-right">Credit</th>
                <th className="px-6 py-4 text-right">Balance</th>
                <th className="px-6 py-4 text-center">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 text-slate-700">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-sm font-medium text-slate-400 bg-white">
                    No transactions found in the general ledger.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/40 transition-all">
                    <td className="px-6 py-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-400" />
                        {row.date}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-900 whitespace-nowrap">{row.accountName}</td>
                    <td className="px-6 py-4 text-sm font-normal text-slate-800">{row.description}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{row.counterparty || '-'}</td>
                    <td className="px-6 py-4 text-right text-emerald-600 font-semibold tabular-nums">
                      {row.debit > 0 ? formatCurrency(row.debit) : "-"}
                    </td>
                    <td className="px-6 py-4 text-right text-rose-600 font-semibold tabular-nums">
                      {row.credit > 0 ? formatCurrency(row.credit) : "-"}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900 tabular-nums">
                      {row.accountRunningBalance !== undefined ? formatCurrency(row.accountRunningBalance) : "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        row.source === 'Grant' ? 'bg-green-100 text-green-700' :
                        row.source === 'Payment' ? 'bg-blue-100 text-blue-700' :
                        row.source === 'Journal' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {row.source || 'General'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Footer with totals */}
            {processedData.length > 0 && (
              <tfoot className="bg-slate-50/80 border-t border-slate-200">
                <tr>
                  <td colSpan="4" className="px-6 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Total Summary
                  </td>
                  <td className="px-6 py-3 text-right font-bold text-emerald-700 tabular-nums">
                    {formatCurrency(processedData.reduce((sum, r) => sum + (r.debit || 0), 0))}
                  </td>
                  <td className="px-6 py-3 text-right font-bold text-rose-700 tabular-nums">
                    {formatCurrency(processedData.reduce((sum, r) => sum + (r.credit || 0), 0))}
                  </td>
                  <td colSpan="2" className="px-6 py-3 text-right text-xs text-slate-400">
                    {processedData.length} entries
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* PAGINATION BUTTONS SECTION */}
        {processedData.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-white text-xs text-slate-500 font-medium">
            <div>
              Showing page <span className="font-bold text-slate-800">{currentPage}</span> of <span className="font-bold text-slate-800">{totalPages}</span> 
              (<span className="font-bold text-slate-800">{processedData.length}</span> total entries)
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

      {/* Account Summary Cards */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(accountSummaries).slice(0, 4).map(([accId, acc]) => (
          <div key={accId} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-400 font-bold uppercase">{acc.code || 'GL'}</p>
            <p className="text-sm font-bold text-slate-800 truncate">{acc.name}</p>
            <p className="text-lg font-black text-slate-900">{formatCurrency(acc.balance)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}