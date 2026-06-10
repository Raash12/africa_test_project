import { useState, useMemo } from "react";
import { Search, Calendar, Building2, Wallet } from "lucide-react";
import useJournalEntries from "@/hooks/useJournalEntries";
import useAccounts from "@/hooks/useAccounts"; // Using your existing hook

// Fiscal Year Logic (August 1st Start)
const calculateFiscalYear = (dateString) => {
  if (!dateString) return new Date().getFullYear();
  const d = new Date(dateString);
  const month = d.getMonth();
  const year = d.getFullYear();
  return month >= 7 ? year + 1 : year;
};

export default function ListGeneralLedger() {
  const { entries, loading: entriesLoading } = useJournalEntries();
  const { accounts, loading: accountsLoading } = useAccounts(); // Your existing hook
  
  const [search, setSearch] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("all");

  // 1. FILTERING ENGINE
  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    return entries.filter((e) => {
      const matchesSearch = e.description?.toLowerCase().includes(search.toLowerCase());
      const matchesAccount = selectedAccountId === "all" || 
                             e.entries?.some(item => item.accountId === selectedAccountId);
      return matchesSearch && matchesAccount;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [entries, search, selectedAccountId]);

  // 2. GET SELECTED ACCOUNT DATA (For Opening Balance)
  const selectedAccountData = useMemo(() => {
    return accounts.find(acc => acc.id === selectedAccountId);
  }, [accounts, selectedAccountId]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase">General Ledger</h1>
          <p className="text-slate-500 font-medium">Verified Double-Entry Audit Trail</p>
        </div>
      </div>

      {/* FILTER BAR - PREMIUM DESIGN */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="relative flex-grow min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            className="w-full pl-10 pr-4 py-3 bg-transparent text-sm outline-none placeholder:text-slate-400"
            placeholder="Search by description..."
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 px-4 border-l">
          <Building2 className="text-slate-400" size={18} />
          <select 
            className="text-sm bg-transparent outline-none cursor-pointer font-bold text-slate-700"
            onChange={(e) => setSelectedAccountId(e.target.value)}
            value={selectedAccountId}
          >
            <option value="all">All Accounts</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>{acc.accountName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* SUMMARY CARD (Opening Balance) */}
      {selectedAccountId !== "all" && selectedAccountData && (
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-6 text-white shadow-lg flex justify-between items-center">
          <div>
            <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider">Account Opening Balance</p>
            <h2 className="text-3xl font-bold mt-1">
              ${Number(selectedAccountData.openingBalance || 0).toLocaleString()}
            </h2>
            <p className="text-blue-200 text-sm mt-1">
              {selectedAccountData.accountName} • Code: {selectedAccountData.accountCode || "N/A"}
            </p>
          </div>
          <Wallet size={40} className="text-blue-300 opacity-50" />
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <th className="px-6 py-4">Date / ID</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Account Affected</th>
              <th className="px-6 py-4 text-right">Debit</th>
              <th className="px-6 py-4 text-right">Credit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(entriesLoading || accountsLoading) ? (
              <tr><td colSpan="5" className="p-12 text-center text-slate-400 animate-pulse">Loading Financial Data...</td></tr>
            ) : filteredEntries.length === 0 ? (
              <tr><td colSpan="5" className="p-12 text-center text-slate-400">No records found.</td></tr>
            ) : filteredEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-mono text-xs text-slate-500">{entry.date}</div>
                  <div className="text-[10px] font-bold text-slate-400">{entry.id.slice(-8).toUpperCase()}</div>
                </td>
                <td className="px-6 py-4 font-medium text-slate-900">{entry.description}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    {entry.entries?.map((ent, i) => (
                      <span key={i} className="text-[11px] text-slate-600 font-medium">
                        {/* LOOKUP NAME FROM ACCOUNTS LIST */}
                        {accounts.find(a => a.id === ent.accountId)?.accountName || ent.accountName || "Unknown Account"}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-mono text-emerald-600 font-bold">
                  {entry.entries?.reduce((acc, curr) => acc + (Number(curr.debit) || 0), 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right font-mono text-blue-600 font-bold">
                  {entry.entries?.reduce((acc, curr) => acc + (Number(curr.credit) || 0), 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}