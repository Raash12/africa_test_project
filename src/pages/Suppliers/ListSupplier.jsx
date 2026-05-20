import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Plus, Search, Building2, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";

// SHADCN COMPONENTS
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

import useSuppliers from "@/hooks/useSuppliers";
import { createSupplier, updateSupplier, deleteSupplier } from "@/services/suppliers/supplierService";
import CreateSupplier from "./CreateSupplier";

export default function ListSupplier() {
  const { suppliers = [], refreshSuppliers } = useSuppliers();
  const [isOpen, setIsOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState(null);
  const [search, setSearch] = useState("");

  // DELETE STATES
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);

  // PAGINATION STATES
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleEdit = (supplier) => {
    setSupplierToEdit(supplier);
    setIsOpen(true);
  };

  // DELETE LOGIC
  const confirmDelete = (id) => {
    setSupplierToDelete(id);
    setIsAlertOpen(true);
  };

  const executeDelete = async () => {
    try {
      await deleteSupplier(supplierToDelete);
      await refreshSuppliers();
      toast.success("Supplier deleted successfully.");
    } catch (error) {
      toast.error("Failed to delete supplier. Please try again.");
    } finally {
      setIsAlertOpen(false);
      setSupplierToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setSupplierToEdit(null);
  };

  // SEARCH LOGIC
  const filteredSuppliers = useMemo(() => {
    const valid = (suppliers || []).filter(s => s && s.id && s.supplierName);
    const searchLower = search.toLowerCase();

    return valid.filter((s) => {
      return (
        s.supplierName.toLowerCase().includes(searchLower) ||
        s.company.toLowerCase().includes(searchLower) ||
        s.phone.includes(searchLower) ||
        (s.address && s.address.toLowerCase().includes(searchLower))
      );
    });
  }, [suppliers, search]);

  // PAGINATION LOGIC
  const totalPages = Math.max(Math.ceil(filteredSuppliers.length / itemsPerPage), 1);
  const paginatedSuppliers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSuppliers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSuppliers, currentPage]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border-l-8 border-[#1e3a8a] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Suppliers Register</h1>
          <p className="text-sm text-slate-500 font-medium">Manage External Vendors & Procurement Entities</p>
        </div>
        <Button onClick={() => { setSupplierToEdit(null); setIsOpen(true); }} className="bg-[#1e3a8a] hover:bg-[#172554] text-white">
          <Plus size={18} className="mr-2" /> Register New Supplier
        </Button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-md shadow-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search supplier name, company or phone..."
          className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white dark:bg-slate-900"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
        />
      </div>

      {/* DATA TABLE */}
      <Card className="shadow-sm">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#1e3a8a] text-white uppercase text-xs font-bold">
              <tr>
                <th className="p-4">Vendor / Company</th>
                <th className="p-4">Contact Person</th>
                <th className="p-4">Phone & Email</th>
                <th className="p-4">Office Address</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedSuppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-slate-50">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-[#1e3a8a]" />
                      <span className="font-bold">{supplier.company}</span>
                    </div>
                  </td>
                  <td className="p-4 font-semibold">{supplier.supplierName}</td>
                  <td className="p-4 font-mono text-xs">
                    <div className="flex items-center gap-1"><Phone size={12}/> {supplier.phone}</div>
                    <div className="text-slate-500">{supplier.email}</div>
                  </td>
                  <td className="p-4 text-xs"><div className="flex items-center gap-1"><MapPin size={12}/> {supplier.address}</div></td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleEdit(supplier)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={() => confirmDelete(supplier.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* DELETE ALERT DIALOG */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the supplier record from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700">Yes, Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PAGINATION */}
      {filteredSuppliers.length > 0 && (
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

      <CreateSupplier 
        isOpen={isOpen} 
        onClose={handleCloseModal} 
        refreshSuppliers={refreshSuppliers} 
        supplierToEdit={supplierToEdit}
        createSupplier={createSupplier}
        updateSupplier={updateSupplier}
      />
    </div>
  );
}