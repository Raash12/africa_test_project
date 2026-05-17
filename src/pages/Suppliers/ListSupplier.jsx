import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Plus, Search, Building2, Phone, MapPin } from "lucide-react";

import useSuppliers from "@/hooks/useSuppliers";
import { createSupplier, updateSupplier, deleteSupplier } from "@/services/suppliers/supplierService";
import CreateSupplier from "./CreateSupplier"; // Maadaama ay hadda isku folder yihiin rasiid ahaan

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function ListSupplier() {
  const { suppliers = [], refreshSuppliers } = useSuppliers();
  const [isOpen, setIsOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState(null);
  const [search, setSearch] = useState("");

  // 🔢 PAGINATION STATES
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleEdit = (supplier) => {
    setSupplierToEdit(supplier);
    setIsOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Ma hubtaa inaad tirtirto supplier-kaan?")) return;
    await deleteSupplier(id);
    await refreshSuppliers();
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setSupplierToEdit(null);
  };

  // 🔍 SEARCH LOGIC
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

  // 🔢 PAGINATION LOGIC
  const totalPages = Math.max(Math.ceil(filteredSuppliers.length / itemsPerPage), 1);
  
  const paginatedSuppliers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSuppliers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSuppliers, currentPage]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* HEADER BANNER - Navy Style matched */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border-l-8 border-[#1e3a8a] dark:border-blue-500 shadow-sm border border-slate-100 dark:border-slate-800 transition-all">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 uppercase tracking-tight">Suppliers Register</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manage External Vendors & Procurement Entities</p>
        </div>

        <Button 
          type="button"
          onClick={() => { setSupplierToEdit(null); setIsOpen(true); }}
          className="bg-[#1e3a8a] dark:bg-blue-600 hover:bg-[#172554] dark:hover:bg-blue-700 text-white px-6 shadow-md border-none transition-all gap-2 cursor-pointer"
        >
          <Plus size={18} /> Register New Supplier
        </Button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-md shadow-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
        <input
          type="text"
          placeholder="Search supplier name, company or phone..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition-all bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1); 
          }}
        />
      </div>

      {/* DATA TABLE */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#1e3a8a] dark:bg-slate-800 text-white dark:text-slate-100 text-xs uppercase tracking-widest font-bold">
                <tr>
                  <th className="p-4">Vendor / Company</th>
                  <th className="p-4">Contact Person</th>
                  <th className="p-4">Phone & Email</th>
                  <th className="p-4">Office Address</th>
                  <th className="p-4 text-center w-32">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    
                    {/* Company info */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-[#1e3a8a] dark:text-blue-400" />
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">{supplier.company}</span>
                      </div>
                    </td>
                    
                    {/* Contact Person */}
                    <td className="p-4">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{supplier.supplierName}</span>
                    </td>

                    {/* Phone & Email */}
                    <td className="p-4 font-mono text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                      <div className="flex items-center gap-1"><Phone size={12} className="text-slate-400"/> {supplier.phone}</div>
                      {supplier.email && <div className="text-slate-400 text-[11px] font-sans">{supplier.email}</div>}
                    </td>

                    {/* Address */}
                    <td className="p-4 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1"><MapPin size={12} className="text-slate-400 shrink-0"/> {supplier.address}</div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all cursor-pointer"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id)}
                          className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSuppliers.length === 0 && (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500 italic">
              No suppliers registered yet. Create one to begin logistics.
            </div>
          )}

          {/* 🔢 PAGINATION SECTION */}
          {filteredSuppliers.length > 0 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <Pagination>
                <PaginationContent className="cursor-pointer">
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={`bg-white dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 ${currentPage === 1 ? "opacity-30 pointer-events-none" : ""}`}
                    />
                  </PaginationItem>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink 
                        isActive={currentPage === i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={currentPage === i + 1 
                          ? "bg-[#1e3a8a] dark:bg-blue-600 text-white border-[#1e3a8a] dark:border-blue-600" 
                          : "bg-white dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700"}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className={`bg-white dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 ${currentPage === totalPages ? "opacity-30 pointer-events-none" : ""}`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL COMPONENT */}
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