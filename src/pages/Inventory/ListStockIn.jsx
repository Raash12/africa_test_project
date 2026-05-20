// pages/Inventory/ListStockIn.jsx
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Search, Loader2, Package, Home, Calendar } from "lucide-react";
import { toast } from "sonner"; 

import useStockIn from "@/hooks/useStockIn";
import { deleteStockIn } from "@/services/inventory/stockInService";
import CreateStockIn from "./CreateStockIn";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function ListStockIn() {
  const { stockInEntries = [], loading, refreshStockIn } = useStockIn();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // 1. FLAT LOGIC: Halkan ayaan alaabta ku soo saaraynaa meel kasta oo ay ku jirto
  const flattenedEntries = useMemo(() => {
    let result = [];
    stockInEntries.forEach(entry => {
      // Hubi in "items" uu jiro
      const items = entry.items || [];
      items.forEach(item => {
        result.push({
          ...item,
          docId: entry.id, // ID-ga weyn si aan u tirtirno
          warehouseName: entry.warehouseName || "N/A",
          receivedAt: entry.receivedAt || entry.createdAt
        });
      });
    });
    return result;
  }, [stockInEntries]);

  const filteredEntries = useMemo(() => {
    const searchLower = search.toLowerCase();
    return flattenedEntries.filter((e) => 
      e.itemName?.toLowerCase().includes(searchLower) || 
      e.warehouseName?.toLowerCase().includes(searchLower)
    );
  }, [flattenedEntries, search]);

  const totalPages = Math.max(Math.ceil(filteredEntries.length / itemsPerPage), 1);
  const paginatedEntries = filteredEntries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const initiateDelete = (entry) => {
    setEntryToDelete(entry);
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!entryToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteStockIn(entryToDelete.docId); // Waxaan tirtiraynaa document-ka waalidka
      await refreshStockIn();
      toast.success("Xogta waa la tirtiray!");
    } catch (error) {
      toast.error("Tirtirku wuu guuldarraystay.");
    } finally {
      setIsSubmitting(false);
      setIsDeleteAlertOpen(false);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* BANNER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border-l-8 border-[#1e3a8a] dark:border-blue-500 shadow-sm border border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Stock In Inventory</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage received inventory items in warehouses</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="bg-[#1e3a8a] dark:bg-blue-600 text-white gap-2">
          <Plus size={18} /> Add Stock In
        </Button>
      </div>

      {/* FILTER */}
      <div className="relative max-w-md shadow-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search items, warehouse..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg outline-none bg-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <Card className="bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-sm">
        <CardContent className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#1e3a8a] text-white text-xs uppercase font-bold">
              <tr>
                <th className="p-4">Item Name</th>
                <th className="p-4">Warehouse</th>
                <th className="p-4 text-center">Qty</th>
                <th className="p-4 text-right">Cost Price</th>
                <th className="p-4 text-right">Total</th>
                <th className="p-4 text-center">Date</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedEntries.map((e, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-800 flex items-center gap-2">
                    <Package size={16} className="text-blue-600" /> {e.itemName || "Unknown"}
                  </td>
                  <td className="p-4 font-semibold text-slate-600">
                    <div className="flex items-center gap-1"><Home size={14} /> {e.warehouseName}</div>
                  </td>
                  <td className="p-4 text-center font-bold">{e.quantity}</td>
                  <td className="p-4 text-right">${Number(e.costPrice || 0).toFixed(2)}</td>
                  <td className="p-4 text-right font-bold text-green-600">${(Number(e.quantity) * Number(e.costPrice || 0)).toFixed(2)}</td>
                  <td className="p-4 text-center text-slate-500">
                    {e.receivedAt ? new Date(e.receivedAt).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="p-4 text-center">
                    <Button variant="ghost" size="sm" onClick={() => initiateDelete(e)}>
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* MODALS & PAGINATION GALI Halkan... */}
      <CreateStockIn isOpen={isOpen} onClose={() => setIsOpen(false)} refreshStockIn={refreshStockIn} />
    </div>
  );
}