// components/purchase/ListPaymentEntry.jsx
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, DollarSign, Loader2, Calendar, CreditCard } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import CreatePaymentEntry from "./CreatePaymentEntry";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function ListPaymentEntry() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Waxaan toos u saxay magaca collection-ka oo hadda ah "payment_entries" sxb
  const refreshPayments = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "payment_entries"));
      setPayments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshPayments();
  }, []);

  const filteredPayments = useMemo(() => {
    const searchLower = search.toLowerCase();
    return payments.filter((p) => {
      return (
        p.invoiceNumber?.toLowerCase().includes(searchLower) ||
        p.supplierName?.toLowerCase().includes(searchLower) ||
        p.paymentMethod?.toLowerCase().includes(searchLower) ||
        p.referenceNo?.toLowerCase().includes(searchLower)
      );
    });
  }, [payments, search]);

  const totalPages = Math.max(Math.ceil(filteredPayments.length / itemsPerPage), 1);
  const paginatedPayments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPayments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPayments, currentPage]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-60">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* BANNER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border-l-8 border-[#1e3a8a] dark:border-blue-500 shadow-sm border border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Payment Entries</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Track and Record Supplier Payments</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="bg-[#1e3a8a] dark:bg-blue-600 text-white gap-2 cursor-pointer">
          <Plus size={18} /> Record Payment
        </Button>
      </div>

      {/* FILTER SEARCH */}
      <div className="relative max-w-md shadow-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search Invoice, Supplier, Method or Ref..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-lg outline-none bg-white dark:bg-slate-900 text-xs"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
        />
      </div>

      {/* TABLE */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#1e3a8a] dark:bg-slate-800 text-white text-xs uppercase font-bold tracking-wider">
                <tr>
                  <th className="p-4">Invoice No</th>
                  <th className="p-4">Supplier / Vendor</th>
                  <th className="p-4">Payment Date</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Ref / Txn No</th>
                  <th className="p-4 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold flex items-center gap-2">
                      <DollarSign size={16} className="text-blue-600" /> {pay.invoiceNumber}
                    </td>
                    <td className="p-4 font-medium">{pay.supplierName}</td>
                    <td className="p-4 text-xs">
                      <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <Calendar size={13} /> {pay.paymentDate}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-bold">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200/50 dark:border-slate-700 flex items-center gap-1 w-fit">
                        <CreditCard size={12} className="text-blue-500" /> {pay.paymentMethod}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-500">{pay.referenceNo || "N/A"}</td>
                    <td className="p-4 font-mono font-black text-right text-emerald-600 dark:text-emerald-400">
                      ${(pay.amountPaid || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center p-8 text-sm text-slate-400 italic">
                      Wax lacag bixin ah oo la helay ma jiraan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {filteredPayments.length > 0 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                      className={currentPage === 1 ? "opacity-30 pointer-events-none" : "cursor-pointer"} 
                    />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink 
                        isActive={currentPage === i + 1} 
                        onClick={() => setCurrentPage(i + 1)} 
                        className="cursor-pointer"
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                      className={currentPage === totalPages ? "opacity-30 pointer-events-none" : "cursor-pointer"} 
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL WINDOW */}
      <CreatePaymentEntry 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        refreshPayments={refreshPayments} 
      />
    </div>
  );
}