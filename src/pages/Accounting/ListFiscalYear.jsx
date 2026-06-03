import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Plus, Search, CalendarDays, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

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

import useFiscalYears from "@/hooks/useFiscalYears";
import { createFiscalYear, updateFiscalYear, deleteFiscalYear } from "@/services/accounting/fiscalYearService";
import CreateFiscalYear from "./CreateFiscalYear"; // Maadaama ay isku folder yihiin, waa ./

export default function ListFiscalYear() {
  const { fiscalYears = [], refreshFiscalYears } = useFiscalYears();
  const [isOpen, setIsOpen] = useState(false);
  const [fiscalYearToEdit, setFiscalYearToEdit] = useState(null);
  const [search, setSearch] = useState("");

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [fiscalYearToDelete, setFiscalYearToDelete] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleEdit = (year) => {
    setFiscalYearToEdit(year);
    setIsOpen(true);
  };

  const confirmDelete = (id) => {
    setFiscalYearToDelete(id);
    setIsAlertOpen(true);
  };

  const executeDelete = async () => {
    try {
      await deleteFiscalYear(fiscalYearToDelete);
      await refreshFiscalYears();
      toast.success("Fiscal year deleted successfully.");
    } catch (error) {
      toast.error("Failed to delete record. Please try again.");
    } finally {
      setIsAlertOpen(false);
      setFiscalYearToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setFiscalYearToEdit(null);
  };

  const filteredYears = useMemo(() => {
    const valid = (fiscalYears || []).filter(y => y && y.id && y.yearName);
    const searchLower = search.toLowerCase();

    return valid.filter((y) => y.yearName.toLowerCase().includes(searchLower));
  }, [fiscalYears, search]);

  const totalPages = Math.max(Math.ceil(filteredYears.length / itemsPerPage), 1);
  const paginatedYears = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredYears.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredYears, currentPage]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border-l-8 border-[#1e3a8a] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Fiscal Years Setup</h1>
          <p className="text-sm text-slate-500 font-medium">Define Accounting Periods & Financial Timeline</p>
        </div>
        <Button onClick={() => { setFiscalYearToEdit(null); setIsOpen(true); }} className="bg-[#1e3a8a] hover:bg-[#172554] text-white">
          <Plus size={18} className="mr-2" /> Setup New Fiscal Year
        </Button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-md shadow-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search fiscal year name (e.g. FY-2026)..."
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
                <th className="p-4">Fiscal Year Title</th>
                <th className="p-4">Start Date</th>
                <th className="p-4">End Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedYears.map((year) => (
                <tr key={year.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={16} className="text-[#1e3a8a]" />
                      <span className="font-bold">{year.yearName}</span>
                    </div>
                  </td>
                  <td className="p-4 font-semibold font-mono text-xs">{year.startDate}</td>
                  <td className="p-4 font-semibold font-mono text-xs">{year.endDate}</td>
                  <td className="p-4">
                    {year.status === "Active" ? (
                      <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-md w-fit">
                        <CheckCircle2 size={12} /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-500 text-xs font-bold bg-slate-100 px-2 py-1 rounded-md w-fit">
                        <XCircle size={12} /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleEdit(year)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={() => confirmDelete(year.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
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
              Deleting this fiscal year will remove this financial cycle period from the accounting module.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700">Yes, Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PAGINATION */}
      {filteredYears.length > 0 && (
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

      <CreateFiscalYear 
        isOpen={isOpen} 
        onClose={handleCloseModal} 
        refreshFiscalYears={refreshFiscalYears} 
        fiscalYearToEdit={fiscalYearToEdit}
        createFiscalYear={createFiscalYear}
        updateFiscalYear={updateFiscalYear}
      />
    </div>
  );
}