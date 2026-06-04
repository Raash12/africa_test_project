import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, FileSpreadsheet, Eye, CalendarDays } from "lucide-react";
import useJournalEntries from "@/hooks/useJournalEntries";
import CreateJournalEntry from "./CreateJournalEntry";

export default function ListJournalEntries() {
  const { entries, loading, refreshEntries } = useJournalEntries();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredEntries = entries.filter(e => 
    e.description?.toLowerCase().includes(search.toLowerCase()) ||
    e.docNo?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border-l-8 border-[#1e3a8a] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">General Ledger Entries</h1>
          <p className="text-sm text-slate-500 font-medium">View and manage double-entry accounting records</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="bg-[#1e3a8a] hover:bg-[#172554] text-white">
          <Plus size={18} className="mr-2" /> New Journal Entry
        </Button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-md shadow-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search entry by reference or narration..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white dark:bg-slate-900 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ENTRIES LIST CONTAINER */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center p-8 text-slate-400 font-medium animate-pulse">Loading general ledger...</div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center p-8 text-slate-400 font-medium bg-white rounded-xl border">No journal entries found.</div>
        ) : (
          filteredEntries.map((entry) => (
            <Card key={entry.id} className="overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              {/* Entry Master Header Row */}
              <div className="bg-slate-50/80 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="font-mono bg-blue-50 text-[#1e3a8a] font-bold px-2 py-0.5 rounded">{entry.docNo}</span>
                  <div className="flex items-center gap-1 text-slate-500"><CalendarDays size={14} /> {entry.date}</div>
                  <div className="font-medium text-slate-700 dark:text-slate-300"><span className="text-slate-400">Narration:</span> {entry.description}</div>
                </div>
                <div className="font-bold font-mono text-[#1e3a8a] text-sm">Amount: ${Number(entry.totalAmount).toFixed(2)}</div>
              </div>
              
              {/* Entry Double-Lines Breakdown */}
              <CardContent className="p-0">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100/50 dark:bg-slate-800/30 text-slate-500 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-4 py-2 w-1/3">Account Details</th>
                      <th className="px-4 py-2 w-1/4">Memo</th>
                      <th className="px-4 py-2 text-right w-1/6">Debit</th>
                      <th className="px-4 py-2 text-right w-1/6">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                    {entry.items?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10">
                        <td className="px-4 py-2">
                          <span className="font-semibold text-slate-400 font-mono mr-2">[{item.accountCode}]</span>
                          <span className={`font-medium ${item.credit > 0 ? "pl-6 text-slate-600" : "text-slate-900 dark:text-slate-100"}`}>
                            {item.accountName}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-slate-400 italic">{item.memo || "-"}</td>
                        <td className="px-4 py-2 text-right font-mono font-semibold text-emerald-600">{item.debit > 0 ? `$${Number(item.debit).toFixed(2)}` : ""}</td>
                        <td className="px-4 py-2 text-right font-mono font-semibold text-blue-600">{item.credit > 0 ? `$${Number(item.credit).toFixed(2)}` : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <CreateJournalEntry isOpen={isOpen} onClose={() => setIsOpen(false)} refreshEntries={refreshEntries} />
    </div>
  );
}