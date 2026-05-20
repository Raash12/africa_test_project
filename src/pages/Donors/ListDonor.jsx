import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Plus, Search } from "lucide-react";
import { toast } from "sonner";

// 🔢 SHADCN COMPONENTS
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

import useDonors from "@/hooks/useDonors";
import { createDonor, updateDonor, deleteDonor } from "@/services/donors/donorService";
import CreateDonor, { ALL_COUNTRIES } from "./CreateDonor";

export default function ListDonor() {
  const { donors = [], refreshDonors } = useDonors();
  const [isOpen, setIsOpen] = useState(false);
  const [donorToEdit, setDonorToEdit] = useState(null);
  const [search, setSearch] = useState("");
  
  // 🗑️ DELETE STATES
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [donorToDelete, setDonorToDelete] = useState(null);

  // 🔢 PAGINATION STATES
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleEdit = (donor) => {
    setDonorToEdit(donor);
    setIsOpen(true);
  };

  const confirmDelete = (id) => {
    setDonorToDelete(id);
    setIsAlertOpen(true);
  };

  const executeDelete = async () => {
    try {
      await deleteDonor(donorToDelete);
      await refreshDonors();
      toast.success("Donor deleted successfully.");
    } catch (error) {
      toast.error("Failed to delete donor. Please try again.");
    } finally {
      setIsAlertOpen(false);
      setDonorToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setDonorToEdit(null);
  };

  const filteredDonors = useMemo(() => {
    const valid = (donors || []).filter(d => d && d.id && d.donorName);
    const searchLower = search.toLowerCase();
    return valid.filter((d) => {
      const donorPhone = d.phone ? String(d.phone).toLowerCase() : "";
      return (
        d.donorName.toLowerCase().includes(searchLower) ||
        (d.contactPerson && d.contactPerson.toLowerCase().includes(searchLower)) ||
        (d.country && d.country.toLowerCase().includes(searchLower)) ||
        donorPhone.includes(searchLower)
      );
    });
  }, [donors, search]);

  const totalPages = Math.max(Math.ceil(filteredDonors.length / itemsPerPage), 1);
  const paginatedDonors = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDonors.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDonors, currentPage]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border-l-8 border-[#1e3a8a] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Donors Directory</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manage and Track Africa Ihsan Aid Registered Partners</p>
        </div>
        <Button onClick={() => { setDonorToEdit(null); setIsOpen(true); }} className="bg-[#1e3a8a] hover:bg-[#172554] text-white">
          <Plus size={18} className="mr-2" /> Add New Donor
        </Button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search name, country or phone number..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white dark:bg-slate-900"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
        />
      </div>

      {/* DATA TABLE */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#1e3a8a] text-white uppercase text-xs font-bold">
              <tr>
                <th className="p-4">Partner</th>
                <th className="p-4">Location</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedDonors.map((donor) => (
                <tr key={donor.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-4">
                    <span className="font-bold">{donor.donorName}</span><br/>
                    <span className="text-slate-500">{donor.contactPerson || 'No contact person'}</span>
                  </td>
                  <td className="p-4">
                    {ALL_COUNTRIES.find(c => c.name === donor.country)?.flag} {donor.country}
                  </td>
                  <td className="p-4 font-mono">{donor.phone}<br/><span className="text-blue-600">{donor.email}</span></td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleEdit(donor)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={() => confirmDelete(donor.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* ALERT DIALOG */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the donor's information from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700">Yes, Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PAGINATION */}
      {filteredDonors.length > 0 && (
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

      <CreateDonor 
        isOpen={isOpen} 
        onClose={handleCloseModal} 
        refreshDonors={refreshDonors} 
        donorToEdit={donorToEdit}
        createDonor={createDonor}
        updateDonor={updateDonor}
      />
    </div>
  );
}