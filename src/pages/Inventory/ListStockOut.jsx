import { useState, useMemo, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase"; 
import { collection, getDocs, query, orderBy } from "firebase/firestore"; 
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2, Home, FileText } from "lucide-react";
import useStockIn from "@/hooks/useStockIn"; 

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

  const fetchStockOutFromProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      
      const projectsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // KOOXAYNTA (GROUP BY ITEM NAME)
      const groups = {};

      projectsData.forEach((p) => {
        const projectName = p.name || p.grantName || p.projectName || "N/A";
        const currentDate = p.createdAt || null;

        if (p.allocations && Array.isArray(p.allocations) && p.allocations.length > 0) {
          p.allocations.forEach((alloc) => {
            const targetId = alloc.poiId || alloc.poId || alloc.stockItemId || alloc.itemId || p.poiId || p.poId;

            const matchedStock = (stockInEntries || []).find((stock) => {
              if (String(stock.id) === String(targetId)) return true;
              if (stock.items && Array.isArray(stock.items)) {
                return stock.items.some(item => String(item.itemId || item.id) === String(targetId));
              }
              return false;
            });

            let foundItemName = alloc.itemName || alloc.name || alloc.item || "Unknown Item";
            if (foundItemName === "Unknown Item" && matchedStock) {
              if (matchedStock.itemName) {
                foundItemName = matchedStock.itemName;
              } else if (matchedStock.items && Array.isArray(matchedStock.items)) {
                const subItem = matchedStock.items.find(item => String(item.itemId || item.id) === String(targetId));
                foundItemName = subItem?.itemName || subItem?.name || matchedStock.invoiceNumber || "Matched Stock Item";
              }
            }

            const qtyOut = Number(alloc.quantity || alloc.qty || alloc.qtyOut || alloc.amount || 0);
            const warehouseName = alloc.warehouseName || alloc.warehouse || p.warehouseName || matchedStock?.warehouseName || "Main Warehouse";
            
            // Sharixaadda ama faahfaahinta mashruuca
            const description = p.description || `Qaybinta ${projectName}`;

            // Haddi uusan magaca alaabta hore u jirin, abuuri koox cusub
            if (!groups[foundItemName]) {
              groups[foundItemName] = {
                itemName: foundItemName,
                projectName: projectName, // Kii ugu dambeeyay
                quantityOut: 0,
                warehouseName: warehouseName,
                createdAt: currentDate, // Taariikhda ugu dambaysa maadaama query-gu uu yahay 'desc'
                description: description, // Sharaxaddii ugu dambaysay
              };
            }

            // Isku dar xogta tirada (Quantity)
            groups[foundItemName].quantityOut += qtyOut;
          });
        } else {
          // Fallback ee mashaariicda aan array-ga lahayn
          const targetId = p.stockItemId || p.poiId || p.poId;
          const matchedStock = (stockInEntries || []).find((stock) => String(stock.id) === String(targetId));

          const itemName = p.stockItemName || p.itemName || matchedStock?.itemName || "Unknown Item";
          const qtyOut = Number(p.quantity || p.qty || 0);
          const warehouseName = p.warehouseName || p.warehouse || "Main Warehouse";
          const description = p.description || `Qaybinta ${projectName}`;

          if (!groups[itemName]) {
            groups[itemName] = {
              itemName,
              projectName,
              quantityOut: 0,
              warehouseName,
              createdAt: currentDate,
              description: description,
            };
          }

          groups[itemName].quantityOut += qtyOut;
        }
      });

      // U badal object-ka array caadi ah si loogu soo saaro Table-ka
      const displayList = Object.values(groups);
      setProjectStockOuts(displayList);
    } catch (error) {
      console.error("Error fetching projects sxb:", error);
    } finally {
      setProjectsLoading(false);
    }
  }, [stockInEntries]);

  useEffect(() => {
    fetchStockOutFromProjects();
  }, [fetchStockOutFromProjects]);

  const filteredStockOut = useMemo(() => {
    const searchLower = search.toLowerCase();
    return projectStockOuts.filter(e => 
      e.itemName?.toLowerCase().includes(searchLower) ||
      e.projectName?.toLowerCase().includes(searchLower) ||
      e.warehouseName?.toLowerCase().includes(searchLower) ||
      e.description?.toLowerCase().includes(searchLower)
    );
  }, [projectStockOuts, search]);

  const totalPages = Math.max(Math.ceil(filteredStockOut.length / itemsPerPage), 1);
  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStockOut.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStockOut, currentPage]);

  const formatEntryDate = (dateField) => {
    if (!dateField) return "N/A";
    if (dateField.seconds) return new Date(dateField.seconds * 1000).toLocaleDateString("en-GB");
    return new Date(dateField).toLocaleDateString("en-GB");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen relative">
      {projectsLoading && (
        <div className="absolute inset-0 bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-2 rounded-xl">
          <Loader2 className="animate-spin text-[#1e3a8a] dark:text-blue-500" size={35} />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Soo raraya xogta...</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border-l-8 border-[#1e3a8a] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900 dark:text-white">Stock Out Summary Log</h1>
          <p className="text-sm text-slate-500">Kala soco wadarta guud ee alaabta baxday iyo faahfaahintooda u dambaysay</p>
        </div>
      </div>

      <div className="relative max-w-md shadow-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search item, description or project..."
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
                <th className="p-4">Last Project</th>
                <th className="p-4 text-center">Total Qty Out</th>
                <th className="p-4">Warehouse</th>
                <th className="p-4">Latest Description</th>
                <th className="p-4 text-center">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {paginatedEntries.length === 0 && !projectsLoading ? (
                <tr>
                  <td colSpan={6} className="text-center text-slate-400 py-10">Wax xog ah oo la helay ma jirto sxb.</td>
                </tr>
              ) : (
                paginatedEntries.map((e) => (
                  <tr key={e.itemName} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-slate-800 dark:text-slate-200 uppercase">{e.itemName}</td>
                    <td className="p-4 font-medium text-blue-700 dark:text-blue-400">{e.projectName}</td>
                    <td className="p-4 text-center font-mono font-bold text-red-600">-{e.quantityOut}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                        <Home size={14} className="text-amber-500" /> {e.warehouseName}
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      <div className="flex items-center gap-1">
                        <FileText size={13} className="text-slate-400 flex-shrink-0" />
                        <span>{e.description}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center font-mono text-slate-500 font-medium">{formatEntryDate(e.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

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