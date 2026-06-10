import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Search, CalendarDays, Receipt, Filter } from "lucide-react";
import useJournalEntries from "@/hooks/useJournalEntries";

export default function ListJournalEntries() {
  const { entries, loading } = useJournalEntries();
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredEntries = entries.filter(e => {
    const matchesSearch = e.description?.toLowerCase().includes(search.toLowerCase()) ||
                          e.id?.toLowerCase().includes(search.toLowerCase());
    
    const entryDate = new Date(e.date);
    const matchesDate = (!startDate || entryDate >= new Date(startDate)) &&
                        (!endDate || entryDate <= new Date(endDate));

    return matchesSearch && matchesDate;
  }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort: Newest first

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      
      {/* HEADER */}
      <div className="bg-white p-6 rounded-xl border-l-8 border-[#1e3a8a] shadow-sm">
        <h1 className="text-2xl font-bold uppercase tracking-tight">General Ledger</h1>
        <p className="text-sm text-slate-500 font-medium">Verified Double-Entry Records</p>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 shadow-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by description or ID..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-blue-600"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 items-center">
          <input type="date" className="p-2 border rounded-lg text-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <span className="text-slate-400">to</span>
          <input type="date" className="p-2 border rounded-lg text-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      {/* LIST */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center p-8 text-slate-400 animate-pulse">Loading Ledger...</div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center p-8 text-slate-400 bg-white rounded-xl border">No entries found.</div>
        ) : (
          filteredEntries.map((entry) => (
            <Card key={entry.id} className="overflow-hidden shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              {/* MASTER HEADER */}
              <div className="bg-slate-50 px-4 py-3 border-b flex justify-between items-center text-xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-blue-700 font-bold">
                    <Receipt size={16} />
                    <span className="font-mono">{entry.id.slice(-8).toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500"><CalendarDays size={14} /> {entry.date}</div>
                  <span className="font-semibold text-slate-800">{entry.description}</span>
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-400">
                  FY: {entry.fiscalYear || new Date(entry.date).getFullYear()}
                </div>
              </div>
              
              {/* BREAKDOWN */}
              <CardContent className="p-0">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/50 text-slate-500 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-4 py-2">Account Title</th>
                      <th className="px-4 py-2 text-right">Debit</th>
                      <th className="px-4 py-2 text-right">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {entry.entries?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2 font-medium text-slate-700">{item.accountName || item.accountId}</td>
                        <td className="px-4 py-2 text-right font-mono text-emerald-600 font-bold">
                          {item.debit > 0 ? `$${Number(item.debit).toFixed(2)}` : "-"}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-blue-600 font-bold">
                          {item.credit > 0 ? `$${Number(item.credit).toFixed(2)}` : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}