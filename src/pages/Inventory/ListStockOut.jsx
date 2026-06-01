import { useState, useMemo, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase"; 
import { collection, getDocs, query, orderBy, doc, deleteDoc } from "firebase/firestore"; 
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2, Home, Trash2, Calendar } from "lucide-react";
import useStockIn from "@/hooks/useStockIn"; 
import { toast } from "sonner";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function ListStockOut() {
  const { stockInEntries = [], refreshStockIn } = useStockIn();
  
  const [projectStockOuts, setProjectStockOuts] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Format Date & Time
  const formatDateTime = (dateField) => {
    if (!dateField) return "N/A";
    const date = dateField.seconds ? new Date(dateField.seconds * 1000) : new Date(dateField);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  const handleDelete = async (id, itemName) => {
    toast(`Ma hubtaa inaad tirtirto ${itemName}?`, {
      description: "Ficilkaan dib looma soo celin karo sxb.",
      action: {
        label: "Haa, Tirtir",
        onClick: async () => {
          try {
            setProjectsLoading(true);
            await deleteDoc(doc(db, "projects", id));
            toast.success("Si guul leh ayaa loo tirtiray sxb!");
            await handleRefreshAll();
          } catch (error) {
            console.error("Delete Error sxb:", error);
            toast.error("Waa laga waayay ogolaanshaha tirtirista!");
          } finally {
            setProjectsLoading(false);
          }
        },
      },
      cancel: {
        label: "Ka noqo",
        onClick: () => toast.dismiss(),
      },
    });
  };

  const fetchStockOutFromProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      
      const projectsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const aggregatedMap = {};

      // 🛠️ HALKAN AYAA LA SAXAY: Shardiga wuu ka dabacsan yahay hadda si mashaariicda oo dhan ay u soo baxaan
      projectsData.forEach((p) => {
          // Haddi uu leeyahay stockItemId ama magac alaab (itemName / stockItemName)
          if (p.stockItemId === "none") return; 

          const matchedStock = stockInEntries.find(
            (item) => String(item.id) === String(p.stockItemId)
          );
          
          const itemName = p.stockItemName || p.itemName || matchedStock?.itemName || "Unknown Item";
          const projectName = p.name || "N/A";
          const warehouseName = p.warehouseName || p.warehouse || p.werehouse || matchedStock?.warehouseName || matchedStock?.warehouse || "Main Warehouse";
          const currentQty = Number(p.quantity || p.qty || 0);
          const currentDate = p.createdAt || p.startDate || null;

          // Haddi mashruucu uusan lahaayn wax quantity ah ama alaab ah, iska dhaaf row-gaas
          if (!itemName || itemName === "Unknown Item") return;

          const uniqueKey = `${itemName.toLowerCase().trim()}_${projectName.toLowerCase().trim()}`;

          if (aggregatedMap[uniqueKey]) {
            aggregatedMap[uniqueKey].quantityOut += currentQty;
            if (currentDate) {
              const existingDate = aggregatedMap[uniqueKey].createdAt;
              const d1 = existingDate?.seconds ? existingDate.seconds * 1000 : new Date(existingDate).getTime();
              const d2 = currentDate?.seconds ? currentDate.seconds * 1000 : new Date(currentDate).getTime();
              if (d2 > d1) aggregatedMap[uniqueKey].createdAt = currentDate;
            }
          } else {
            aggregatedMap[uniqueKey] = {
              id: p.id,
              itemName,
              projectName,
              quantityOut: currentQty,
              warehouseName,
              createdAt: currentDate,
            };
          }
        });

      setProjectStockOuts(Object.values(aggregatedMap));
    } catch (error) {
      console.error("Error fetching projects sxb:", error);
    } finally {
      setProjectsLoading(false);
    }
  }, [stockInEntries]);

  // 🛠️ HALKANNA LA SAXAY: Haddi xataa stockInEntries uu eber yahay, ha loo ogolaado inuu mashaariicda soo akhriyo
  useEffect(() => {
    fetchStockOutFromProjects();
  }, [stockInEntries, fetchStockOutFromProjects]);

  const handleRefreshAll = async () => {
    await fetchStockOutFromProjects();
    if (refreshStockIn) await refreshStockIn();
  };

  const filteredStockOut = useMemo(() => {
    const searchLower = search.toLowerCase();
    return projectStockOuts.filter(e => 
      e.itemName?.toLowerCase().includes(searchLower) ||
      e.projectName?.toLowerCase().includes(searchLower) ||
      e.warehouseName?.toLowerCase().includes(searchLower) ||
      formatDateTime(e.createdAt).toLowerCase().includes(searchLower)
    );
  }, [projectStockOuts, search]);

  const totalPages = Math.max(Math.ceil(filteredStockOut.length / itemsPerPage), 1);
  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStockOut.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStockOut, currentPage]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen relative">
      {projectsLoading && (
        <div className="absolute inset-0 bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-2 rounded-xl">
          <Loader2 className="animate-spin text-[#1e3a8a] dark:text-blue-500" size={35} />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Soo raraya xogta...</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border-l-8 border-[#1e3a8a] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900 dark:text-white">Stock Out Log</h1>
          <p className="text-sm text-slate-500">Kala soco halkan alaabta mashaariicda loo saaray iyo taariikhda la cusbooneysiiyey.</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md shadow-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search item, project, warehouse or date..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-lg outline-none bg-white dark:bg-slate-900 text-xs"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
        />
      </div>

      {/* Table */}
      <Card className="bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-sm">
        <CardContent className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#1e3a8a] text-white text-xs uppercase font-bold">
              <tr>
                <th className="p-4">Item Name</th>
                <th className="p-4">Project Name</th>
                <th className="p-4 text-center">Qty Out</th>
                <th className="p-4">Warehouse</th>
                <th className="p-4 text-left">Date & Time</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {paginatedEntries.length === 0 && !projectsLoading ? (
                <tr>
                  <td colSpan={6} className="text-center text-slate-400 py-10">Wax xog ah oo la helay ma jirto sxb.</td>
                </tr>
              ) : (
                paginatedEntries.map((e, idx) => (
                  <tr key={e.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{e.itemName}</td>
                    <td className="p-4 font-medium text-blue-700 dark:text-blue-400">{e.projectName}</td>
                    <td className="p-4 text-center font-mono font-bold text-red-600">-{e.quantityOut}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                        <Home size={14} className="text-amber-500" /> {e.warehouseName}
                      </div>
                    </td>
                    <td className="p-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-400" />
                        {formatDateTime(e.createdAt)}
                      </div>
                    </td>
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

      {/* Pagination */}
      {filteredStockOut.length > 0 && (
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
    </div>
  );
}