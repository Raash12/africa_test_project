import React, { useState, useMemo } from "react";
import { Search, FileSpreadsheet, Download } from "lucide-react";
import useGrants from "@/hooks/useGrants";
import usePaymentEntry from "@/hooks/usePaymentEntry";
import useAccounts from "@/hooks/useAccounts";

const formatCurrency = (val) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

export default function MasterGeneralLedger() {
  const { grants = [] } = useGrants() || {};
  const { payments = [] } = usePaymentEntry() || {};
  const { accounts = [] } = useAccounts() || {};

  const [selectedAccountId, setSelectedAccountId] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const rowsPerPage = 10;

  const accountMap = useMemo(() => {
    return accounts.reduce((acc, curr) => {
      acc[curr.id] = { name: curr.accountName, openingBalance: Number(curr.openingBalance || 0) };
      return acc;
    }, {});
  }, [accounts]);

  // 1. Data Engine
  const ledgerData = useMemo(() => {
    let entries = [];

    // Inject Opening Balance Rows
    accounts.forEach(acc => {
      entries.push({
        id: `open-${acc.id}`, date: '2026-01-01', description: 'Opening Balance',
        counterparty: '-', debit: 0, credit: 0,
        isOpening: true,
        accountId: acc.id,
        accountName: acc.accountName,
        openingValue: Number(acc.openingBalance || 0)
      });
    });

    // Map Transactions
    grants.forEach(g => {
      entries.push({
        id: g.id, date: g.startDate, description: `Grant: ${g.grantName}`,
        counterparty: g.donorName, debit: Number(g.amount || 0), credit: 0,
        accountId: g.receivingAccountId,
        accountName: accountMap[g.receivingAccountId]?.name || "Unknown"
      });
    });

    payments.forEach(p => {
      entries.push({
        id: `${p.journalEntryId}-bank`, date: p.paymentDate, description: `Payment: ${p.invoiceNumber}`,
        counterparty: p.supplierName, debit: 0, credit: Number(p.amountPaid || 0),
        accountId: p.fromAccountId,
        accountName: accountMap[p.fromAccountId]?.name || "Unknown"
      });
      entries.push({
        id: `${p.journalEntryId}-exp`, date: p.paymentDate, description: `Payment: ${p.invoiceNumber}`,
        counterparty: p.supplierName, debit: Number(p.amountPaid || 0), credit: 0,
        accountId: p.expenseAccountId,
        accountName: accountMap[p.expenseAccountId]?.name || "Unknown"
      });
    });

    return entries.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [grants, payments, accounts, accountMap]);

  // 2. Calculation Engine
  const processedData = useMemo(() => {
    const currentBalances = {};
    Object.keys(accountMap).forEach(id => currentBalances[id] = accountMap[id].openingBalance);

    return ledgerData
      .filter(e => {
        const matchesAccount = selectedAccountId === "all" || e.accountId === selectedAccountId;
        const matchesSearch = e.description.toLowerCase().includes(search.toLowerCase()) || 
                              e.counterparty.toLowerCase().includes(search.toLowerCase());
        return matchesAccount && matchesSearch;
      })
      .map(entry => {
        if (!entry.isOpening) {
          currentBalances[entry.accountId] += (entry.debit - entry.credit);
        }
        return { ...entry, runningBalance: currentBalances[entry.accountId] };
      });
  }, [ledgerData, selectedAccountId, search, accountMap]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return processedData.slice(start, start + rowsPerPage);
  }, [processedData, currentPage]);

  return (
    <div className="p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">General Ledger</h1>
          <p className="text-slate-500 mt-2 font-medium">Audit-Ready Financial Tracking</p>
        </div>
        <select 
          className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm"
          onChange={(e) => { setSelectedAccountId(e.target.value); setCurrentPage(1); }}
        >
          <option value="all">All Accounts (Consolidated)</option>
          {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.accountName}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center bg-white">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" 
              placeholder="Search..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} 
            />
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold">Export CSV</button>
            <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold">Download PDF</button>
          </div>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              <th className="px-8 py-5">Date</th>
              <th className="px-8 py-5">Account</th>
              <th className="px-8 py-5">Description</th>
              <th className="px-8 py-5 text-right">Debit</th>
              <th className="px-8 py-5 text-right">Credit</th>
              <th className="px-8 py-5 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedData.map((row, idx) => (
              <tr key={idx} className={`${row.isOpening ? 'bg-slate-50/80 italic' : 'hover:bg-slate-50'} transition-colors`}>
                <td className="px-8 py-5 text-xs font-mono text-slate-500">{row.date}</td>
                <td className="px-8 py-5 text-xs font-bold text-slate-900">{row.accountName}</td>
                <td className="px-8 py-5 text-sm font-semibold text-slate-900">{row.description}</td>
                <td className="px-8 py-5 text-right text-emerald-600 font-bold tabular-nums">
                  {row.debit > 0 ? formatCurrency(row.debit) : "-"}
                </td>
                <td className="px-8 py-5 text-right text-red-600 font-bold tabular-nums">
                  {row.credit > 0 ? formatCurrency(row.credit) : "-"}
                </td>
                <td className="px-8 py-5 text-right font-black text-slate-900 tabular-nums">
                  {formatCurrency(row.runningBalance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}