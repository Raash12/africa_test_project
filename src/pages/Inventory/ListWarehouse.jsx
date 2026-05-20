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
  const itemsPerPage = 7; // Isku mid ka dhigay ListStockIn

  const handleEdit = (wh) => {
    setWarehouseToEdit(wh);
    setIsOpen(true);
  };

  const initiateDelete = (wh) => {
    setWarehouseToDelete(wh);
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!warehouseToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteWarehouse(warehouseToDelete.id);
      await refreshWarehouses();
      toast.success("Bakhaarkii waa la tirtiray!");
    } catch (error) {
      toast.error("Tirtirku wuu guuldarraystay.");
    } finally {
      setIsSubmitting(false);
      setIsDeleteAlertOpen(false);
      setWarehouseToDelete(null);
    }
  };

  const filteredWarehouses = useMemo(() => {
    const searchLower = search.toLowerCase();
    return warehouses.filter((w) => 
      w.warehouseName?.toLowerCase().includes(searchLower) ||
      w.location?.toLowerCase().includes(searchLower) ||
      w.manager?.toLowerCase().includes(searchLower)
    );
  }, [warehouses, search]);

  const totalPages = Math.max(Math.ceil(filteredWarehouses.length / itemsPerPage), 1);
  const paginatedWarehouses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredWarehouses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredWarehouses, currentPage]);

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* BANNER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border-l-8 border-[#1e3a8a] dark:border-blue-500 shadow-sm border border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Warehouses / Storage</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage Warehouse Locations & Storekeepers</p>
        </div>
        <Button onClick={() => { setWarehouseToEdit(null); setIsOpen(true); }} className="bg-[#1e3a8a] dark:bg-blue-600 text-white gap-2">
          <Plus size={18} /> New Warehouse
        </Button>
      </div>

      {/* FILTER */}
      <div className="relative max-w-md shadow-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search Warehouse, Location or Manager..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg outline-none bg-white"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
        />
      </div>

      {/* TABLE */}
      <Card className="bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-sm">
        <CardContent className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#1e3a8a] text-white text-xs uppercase font-bold">
              <tr>
                <th className="p-4">Warehouse Name</th>
                <th className="p-4">Location</th>
                <th className="p-4">Manager</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedWarehouses.map((wh) => (
                <tr key={wh.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-800 flex items-center gap-2">
                    <Home size={16} className="text-blue-600" /> {wh.warehouseName}
                  </td>
                  <td className="p-4 font-semibold text-slate-600">
                    <div className="flex items-center gap-1"><MapPin size={14} /> {wh.location}</div>
                  </td>
                  <td className="p-4 text-slate-600">
                    <div className="flex items-center gap-1"><User size={14} /> {wh.manager}</div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(wh)}><Edit2 size={16} className="text-blue-500" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => initiateDelete(wh)}><Trash2 size={16} className="text-red-500" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* PAGINATION */}
      {filteredWarehouses.length > 0 && (
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

      {/* DELETE DIALOG */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this record.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>cansel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateWarehouse isOpen={isOpen} onClose={() => setIsOpen(false)} refreshWarehouses={refreshWarehouses} warehouseToEdit={warehouseToEdit} />
    </div>
  );
}