import { useState, useMemo } from "react";
import { db } from "@/lib/firebase"; 
import { doc, deleteDoc } from "firebase/firestore"; 
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Plus, Home, Trash2 } from "lucide-react";
import useAdjustment from "@/hooks/useAdjustment";
import useStockIn from "@/hooks/useStockIn"; 
import CreateAdjustment from "./CreateAdjustment";
import { toast } from "sonner";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function ListAdjustment() {
  const { adjustments = [], loading: adjustmentLoading, refreshAdjustmentData } = useAdjustment();
  const { stockInEntries = [], loading: stockInLoading, refreshStockIn } = useStockIn();
  
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const handleDelete = async (id, itemName) => {
    toast(`Ma hubtaa inaad tirtirto ${itemName}?`, {
      description: "Ficilkaan dib looma soo celin karo sxb.",
      action: {
        label: "Haa, Tirtir",
        onClick: async () => {
          try {
            await deleteDoc(doc(db, "stock_adjustments", id));
            toast.success("Si guul leh ayaa loo tirtiray sxb!");
            await handleRefreshAll();
          } catch (error) {
            console.error("Delete Error sxb:", error);
            toast.error("Waa laga waayay ogolaanshaha tirtirista!");
          }
        },
      },
      cancel: {
        label: "Ka noqo",
        onClick: () => toast.dismiss(),
      },
    });
  };

  const handleRefreshAll = async () => {
    await refreshAdjustmentData();
    if (refreshStockIn) await refreshStockIn();
  };

  // 🛠️ Halkan waxaa lagu saxay Fallback-ga Magaca alaabta iyo kala soocidda nadiifta ah
  const processedAdjustments = useMemo(() => {
    const mapped = adjustments.map(e => {
      // Ku raadi invoiceNumber ama stockItemId gudaha Stock-in entries
      let matchedStockIn = stockInEntries.find(si => 
        si.id === e.stockItemId || 
        si.invoiceNumber === e.invoiceNumber ||
        si.invoiceNumber === e.stockItemId
      );

      // Haddii wali la waayo, ku raadi magaca haddii uu jiro
      if (!matchedStockIn && e.itemName) {
        matchedStockIn = stockInEntries.find(si => 
          si.items?.some(item => (item.itemName || item.name) === e.itemName)
        );
      }

      // RADINTA MAGACA ALAABTA (ITEM NAME)
      let finalItemName = e.itemName || e.stockItemName || e.name;
      
      // Haddii uu "Unknown" yahay, si toos ah uga soo dhuuq matchedStockIn
      if (!finalItemName || finalItemName === "Unknown") {
        if (matchedStockIn) {
          // Haddii uu hal item yahay ama array items ah yahay ka qaad kii ugu horreeyey
          const firstItem = matchedStockIn.items?.[0];
          finalItemName = firstItem?.itemName || firstItem?.name || matchedStockIn.itemName || matchedStockIn.name;
        }
      }

      // Haddii wali dhulka lala jiro, sii fallback-gii hore ee aad haysatay (sida "cow" ama "lo")
      if (!finalItemName || finalItemName === "Unknown") {
        finalItemName = e.selectedItemName || "Item Available";
      }

      // RADINTA WAREHOUSE
      const foundWarehouse = matchedStockIn?.warehouseName || matchedStockIn?.warehouse;
      let finalWarehouse = e.warehouseName || e.warehouse || e.werehouse;
      if (!finalWarehouse || finalWarehouse === "N/A") {
        finalWarehouse = foundWarehouse || "MUQDISHO STORE";
      }

      return {
        ...e,
        itemName: finalItemName,
        displayWarehouse: finalWarehouse
      };
    });

    // 🌟 FIX: Si badbaado leh u kala sooc adigoo adeegsanaya .slice() si uusan array-gii asalka ahaa u jabin
    return mapped.slice().sort((a, b) => {
      const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
      const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [adjustments, stockInEntries]);

  const filteredAdjustments = useMemo(() => {
    const searchLower = search.toLowerCase();
    return processedAdjustments.filter(e => 
      e.itemName?.toLowerCase().includes(searchLower) ||
      e.invoiceNumber?.toLowerCase().includes(searchLower) ||
      e.displayWarehouse?.toLowerCase().includes(searchLower)
    );
  }, [processedAdjustments, search]);

  const totalPages = Math.max(Math.ceil(filteredAdjustments.length / itemsPerPage), 1);
  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAdjustments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAdjustments, currentPage]);

  const formatEntryDate = (dateField) => {
    if (!dateField) return "N/A";
    if (dateField.seconds) return new Date(dateField.seconds * 1000).toLocaleDateString("en-GB");
    return new Date(dateField).toLocaleDateString("en-GB");
  };

  const isLoading = adjustmentLoading || stockInLoading;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-2 rounded-xl">
          <Loader2 className="animate-spin text-[#1e3a8a] dark:text-blue-500" size={35} />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Soo raraya xogta...</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border-l-8 border-[#1e3a8a] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900 dark:text-white">Stock Adjustment History</h1>
          <p className="text-sm text-slate-500">Manage manual corrections and additions for warehouse stock</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="bg-[#1e3a8a] hover:bg-[#172554] text-white gap-2 font-medium text-xs h-9">
          <Plus size={16} /> Add Stock Adjustment
        </Button>
      </div>

      <div className="relative max-w-md shadow-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search item, invoice or warehouse..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-lg outline-none bg-white dark:bg-slate-900 text-xs"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
        />
      </div>

      <Card className="bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-sm">
        <CardContent className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#1e3a8a] text-white text-xs uppercase font-bold">
              <tr>
                <th className="p-4">Item Name</th>
                <th className="p-4">Warehouse</th>
                <th className="p-4">Adjustment Type</th>
                <th className="p-4 text-center">Qty Changed</th>
                <th className="p-4">Old → New</th>
                <th className="p-4">Notes / Reason</th>
                <th className="p-4 text-center">Date</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {paginatedEntries.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center text-slate-400 py-10">Wax xog ah oo la helay ma jirto sxb.</td>
                </tr>
              ) : (
                paginatedEntries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                      <div>{e.itemName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Inv: {e.invoiceNumber || "N/A"}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                        <Home size={13} className="text-amber-500" /> {e.displayWarehouse}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${e.adjustmentType === "Addition" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                        {e.adjustmentType === "Addition" ? "Kordhin" : "Dhimis"}
                      </span>
                    </td>
                    <td className={`p-4 text-center font-mono font-bold ${e.adjustmentType === "Addition" ? "text-emerald-600" : "text-red-600"}`}>
                      {e.adjustmentType === "Addition" ? `+${e.quantityChanged}` : `-${e.quantityChanged}`}
                    </td>
                    <td className="p-4 font-mono text-slate-500">
                      {e.oldQuantity} → <span className="font-bold text-slate-700 dark:text-slate-200">{e.newQuantity}</span>
                    </td>
                    <td className="p-4 italic text-slate-600 dark:text-slate-400">{e.notes}</td>
                    <td className="p-4 text-center font-mono text-slate-400">{formatEntryDate(e.createdAt)}</td>
                    <td className="p-4 text-center">
                      <button type="button" onClick={() => handleDelete(e.id, e.itemName)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {filteredAdjustments.length > 0 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
            </PaginationItem>
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink onClick={() => setCurrentPage(i + 1)} isActive={currentPage === i + 1}>{i + 1}</PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <CreateAdjustment isOpen={isOpen} onClose={() => setIsOpen(false)} stockItems={stockInEntries} refreshData={handleRefreshAll} />
    </div>
  );
}