// pages/Inventory/ListWarehouse.jsx
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Plus, Search, Loader2, Home, MapPin, User } from "lucide-react";
import { toast } from "sonner"; 

import useWarehouse from "@/hooks/useWarehouse";
import { deleteWarehouse } from "@/services/inventory/warehouseService";
import CreateWarehouse from "./CreateWarehouse";

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

export default function ListWarehouse() {
  const { warehouses = [], loading, refreshWarehouses } = useWarehouse();
  const [isOpen, setIsOpen] = useState(false);
  const [warehouseToEdit, setWarehouseToEdit] = useState(null);
  const [search, setSearch] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [warehouseToDelete, setWarehouseToDelete] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleEdit = (wh) => {
    setWarehouseToEdit(wh);
    setIsOpen(true);
  };

  const initiateDelete = (wh) => {
    setWarehouseToDelete(wh);
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!warehouseToDelete || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await deleteWarehouse(warehouseToDelete.id);
      await refreshWarehouses();
      toast.success(`Bakhaarkii ${warehouseToDelete.warehouseName} waa la tirtiray!`);
    } catch (error) {
      toast.error("Wuu guuldarraystay tirtirku sxb.");
    } finally {
      setIsSubmitting(false);
      setIsDeleteAlertOpen(false);
      setWarehouseToDelete(null);
    }
  };

  const filteredWarehouses = useMemo(() => {
    const searchLower = search.toLowerCase();
    return warehouses.filter((w) => {
      return (
        w.warehouseName?.toLowerCase().includes(searchLower) ||
        w.location?.toLowerCase().includes(searchLower) ||
        w.manager?.toLowerCase().includes(searchLower)
      );
    });
  }, [warehouses, search]);

  const totalPages = Math.max(Math.ceil(filteredWarehouses.length / itemsPerPage), 1);
  const paginatedWarehouses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredWarehouses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredWarehouses, currentPage]);

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
          <h1 className="text-2xl font-bold uppercase tracking-tight">Warehouses / Storage</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage Warehouse Locations & Storekeepers</p>
        </div>
        <Button onClick={() => { setWarehouseToEdit(null); setIsOpen(true); }} className="bg-[#1e3a8a] dark:bg-blue-600 text-white gap-2 cursor-pointer border-none">
          <Plus size={18} /> New Warehouse
        </Button>
      </div>

      {/* FILTER SEARCH */}
      <div className="relative max-w-md shadow-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search Warehouse, Location or Manager..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-lg outline-none bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
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
                  <th className="p-4">Warehouse Name</th>
                  <th className="p-4">Location / Address</th>
                  <th className="p-4">Manager / Keeper</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedWarehouses.map((wh) => (
                  <tr key={wh.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold flex items-center gap-2 tracking-tight text-xs uppercase">
                      <Home size={16} className="text-blue-600 dark:text-blue-500" /> {wh.warehouseName}
                    </td>
                    <td className="p-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <MapPin size={14} className="text-slate-400" /> {wh.location}
                      </div>
                    </td>
                    <td className="p-4 text-xs font-medium">
                      <div className="flex items-center gap-1">
                        <User size={14} className="text-slate-400" /> {wh.manager}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => handleEdit(wh)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg cursor-pointer border-none bg-transparent" title="Edit"><Edit2 size={16} /></button>
                        <button onClick={() => initiateDelete(wh)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer border-none bg-transparent" title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}

                {paginatedWarehouses.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center p-12 text-sm text-slate-400 italic">
                      Bakhaarro diiwaangashan lama helin sxb.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {filteredWarehouses.length > 0 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <Pagination>
                <PaginationContent>
                  <PaginationItem><PaginationPrevious onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className={currentPage === 1 ? "opacity-30 pointer-events-none" : "cursor-pointer"} /></PaginationItem>
                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink isActive={currentPage === i + 1} onClick={() => setCurrentPage(i + 1)} className="cursor-pointer">{i + 1}</PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem><PaginationNext onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className={currentPage === totalPages ? "opacity-30 pointer-events-none" : "cursor-pointer"} /></PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ALERT DIALOG DELETE */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Ma hubtaa sxb?</AlertDialogTitle>
            <AlertDialogDescription>Bakhaarka {warehouseToDelete?.warehouseName} waa la tirtiri doonaa si joogto ah.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Maya</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white">
              {isSubmitting && <Loader2 size={14} className="animate-spin mr-1" />} Haa, Tirtir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CREATE MODAL LINKING */}
      <CreateWarehouse isOpen={isOpen} onClose={() => { setIsOpen(false); setWarehouseToEdit(null); }} refreshWarehouses={refreshWarehouses} warehouseToEdit={warehouseToEdit} />
    </div>
  );
}