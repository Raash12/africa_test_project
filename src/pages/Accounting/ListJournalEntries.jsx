import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Search, CalendarDays, Receipt, ArrowDownRight, ArrowUpRight } from "lucide-react";
import useJournalEntries from "@/hooks/useJournalEntries";
import useAccounts from "@/hooks/useAccounts";
import useGrants from "@/hooks/useGrants";

export default function ListJournalEntries() {
  const { entries = [], loading: loadingEntries } = useJournalEntries() || {};
  const { accounts = [], loading: loadingAccounts } = useAccounts() || {};
  const { grants = [], loading: loadingGrants } = useGrants() || {};

  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loading = loadingEntries || loadingAccounts || loadingGrants;

  const parseEntryDate = (dateField) => {
    if (!dateField) return new Date();
    if (typeof dateField.toDate === "function") return dateField.toDate();
    if (dateField.seconds) return new Date(dateField.seconds * 1000);
    const d = new Date(dateField);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  // 1. CONSOLIDATED ENGINE
  const consolidatedEntries = useMemo(() => {
    let allEntries = [...entries];

    // Accounts Opening Balances
    accounts.forEach(acc => {
      const oBalance = Number(acc.openingBalance ?? acc.balance ?? 0);
      if (oBalance > 0) {
        if (!allEntries.some(e => e.id === `auto-open-${acc.id || acc.docId}`)) {
          allEntries.push({
            id: `auto-open-${acc.id || acc.docId}`,
            docNo: `JE-OPEN`,
            date: acc.createdAt || new Date().toISOString(),
            description: `📥 Opening Balance Setup: ${acc.accountName}`,
            items: [
              { accountName: acc.accountName, debit: acc.normalBalance === "Debit" ? oBalance : 0, credit: acc.normalBalance === "Credit" ? oBalance : 0, memo: "Initial account setup balance" },
              { accountName: "Owner's Equity / Opening Balance Equity", debit: acc.normalBalance === "Credit" ? oBalance : 0, credit: acc.normalBalance === "Debit" ? oBalance : 0, memo: "Equity balancing offset" }
            ]
          });
        }
      }
    });

    // Grants Auto Entries (Halkan baa laga beddelayaa magaca account-ka sxb)
    grants.forEach(g => {
      const amt = Number(g.amount || 0);
      if (amt > 0) {
        if (!allEntries.some(e => e.id === `auto-grant-${g.id}`)) {
          
          // 🌟 DYNAMIC ACCOUNT NAME: Wuxuu soo qabanayaa account-kii lacagta lagu shubay ee rasmiga ah
          const donorName = g.donorName || "Donor";
          const activeBankAccount = g.receivingAccount || g.bankAccount || g.accountName || `Cash/Bank Account (${donorName})`;

          allEntries.push({
            id: `auto-grant-${g.id}`,
            docNo: `JE-GRANT`,
            date: g.createdAt || g.startDate || new Date().toISOString(),
            description: `💰 Grant Funding Received: ${g.grantName}`,
            items: [
              { 
                accountName: activeBankAccount, // Halkan hadda wuxuu soo daabacayaa magacii saxda ahaa ee lacagtu ku dhacday sxb
                debit: amt, 
                credit: 0, 
                memo: `Funds successfully deposited into account from ${donorName}` 
              },
              { 
                accountName: `Grant Revenue (${donorName})`, 
                debit: 0, 
                credit: amt, 
                memo: "Recognized grant funding revenue" 
              }
            ]
          });
        }
      }
    });

    return allEntries;
  }, [entries, accounts, grants]);

  // 2. FILTER & SORT ENGINE
  const filteredEntries = useMemo(() => {
    return consolidatedEntries.filter(e => {
      const matchesSearch = 
        (e.description || "").toLowerCase().includes(search.toLowerCase()) ||
        (e.id || "").toLowerCase().includes(search.toLowerCase()) ||
        (e.docNo || "").toLowerCase().includes(search.toLowerCase());
      
      const entryDate = parseEntryDate(e.date);
      const checkDate = new Date(entryDate);
      checkDate.setHours(0,0,0,0);

      let matchesDate = true;
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (checkDate < start) matchesDate = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (checkDate > end) matchesDate = false;
      }

      return matchesSearch && matchesDate;
    }).sort((a, b) => parseEntryDate(b.date).getTime() - parseEntryDate(a.date).getTime());
  }, [consolidatedEntries, search, startDate, endDate]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen font-sans">
      
      {/* HEADER */}
      <div className="bg-white p-6 rounded-xl border-l-8 border-[#1e3a8a] shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-950">Journal Entries</h1>
          <p className="text-sm text-slate-500 font-medium">Double-Entry Accounting Ledger</p>
        </div>
        <div className="text-xs bg-slate-100 text-slate-700 font-mono px-3 py-1.5 rounded-md border border-slate-200">
          Total Logs: {filteredEntries.length}
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 shadow-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search descriptions, accounts, or doc number..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm outline-none text-slate-800 focus:ring-2 focus:ring-blue-600 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 items-center">
          <input type="date" className="p-2 border rounded-lg text-sm bg-white text-slate-800" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <span className="text-slate-400 text-xs font-bold uppercase">to</span>
          <input type="date" className="p-2 border rounded-lg text-sm bg-white text-slate-800" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      {/* LIST */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center p-12 text-sm font-medium text-slate-400 animate-pulse bg-white rounded-xl border">
            Processing Ledger Logs...
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center p-12 text-sm font-medium text-slate-400 bg-white rounded-xl border border-slate-200 shadow-sm">
            No journal entries found matching criteria.
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const displayDate = parseEntryDate(entry.date).toLocaleDateString("en-US", {
              year: 'numeric', month: 'short', day: '2-digit'
            });

            const rows = entry.items || entry.entries || [];
            const totalDebits = rows.reduce((sum, item) => sum + Number(item.debit || 0), 0);
            const totalCredits = rows.reduce((sum, item) => sum + Number(item.credit || 0), 0);

            return (
              <Card key={entry.id} className="overflow-hidden shadow-sm border border-slate-200 bg-white rounded-xl hover:shadow-md transition-all">
                {/* MASTER HEADER */}
                <div className="bg-slate-50 px-5 py-3.5 border-b flex justify-between items-center text-xs">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-blue-900 font-bold bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                      <Receipt size={14} />
                      <span className="font-mono text-[11px] tracking-wide">{entry.docNo || "JE-CUSTOM"}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 font-semibold bg-white border px-2 py-0.5 rounded">
                      <CalendarDays size={13} className="text-slate-400" /> {displayDate}
                    </div>
                    <span className="font-bold text-slate-800 text-sm tracking-tight">{entry.description}</span>
                  </div>
                </div>
                
                {/* TABLE BREAKDOWN */}
                <CardContent className="p-0">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-2.5 w-1/2">Account Title & Narration</th>
                        <th className="px-6 py-2.5 text-right w-1/4">Debit</th>
                        <th className="px-6 py-2.5 text-right w-1/4">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {rows.map((item, idx) => {
                        const isCredit = Number(item.credit || 0) > 0;
                        return (
                          <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                            <td className={`px-6 py-3 transition-all ${isCredit ? 'pl-14 bg-slate-50/20' : 'pl-6'}`}>
                              <div className="flex items-center gap-2">
                                {isCredit ? (
                                  <ArrowUpRight size={14} className="text-blue-400 shrink-0" />
                                ) : (
                                  <ArrowDownRight size={14} className="text-emerald-400 shrink-0" />
                                )}
                                <span className={`font-semibold ${isCredit ? 'text-slate-600' : 'text-slate-900'}`}>
                                  {item.accountName || item.accountId || "Unnamed Account"}
                                </span>
                              </div>
                              {item.memo && (
                                <p className="text-[11px] text-slate-400 italic font-normal mt-0.5 pl-5">
                                  — {item.memo}
                                </p>
                              )}
                            </td>
                            <td className="px-6 py-3 text-right font-mono text-emerald-600 font-bold text-sm bg-emerald-50/5">
                              {Number(item.debit || 0) > 0 ? `$${Number(item.debit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                            </td>
                            <td className="px-6 py-3 text-right font-mono text-blue-600 font-bold text-sm bg-blue-50/5">
                              {isCredit ? `$${Number(item.credit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50/60 border-t border-slate-200 font-mono text-xs text-slate-900 font-bold">
                      <tr>
                        <td className="px-6 py-3 text-right text-[11px] uppercase tracking-wider text-slate-400 font-sans">
                          Total Balancing Verification:
                        </td>
                        <td className="px-6 py-3 text-right text-emerald-700 border-l border-slate-200 bg-emerald-50/10 text-sm">
                          ${totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-3 text-right text-blue-700 border-l border-slate-200 bg-blue-50/10 text-sm">
                          ${totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}