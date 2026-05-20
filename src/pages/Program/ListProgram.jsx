import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Plus, Search } from "lucide-react";
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

import usePrograms from "@/hooks/usePrograms";
import { createProgram, updateProgram, deleteProgram } from "@/services/program/programService";
import CreateProgram from "./CreateProgram";

export default function ListProgram() {
  const { programs = [], refreshPrograms, loading } = usePrograms();
  const [isOpen, setIsOpen] = useState(false);
  const [programToEdit, setProgramToEdit] = useState(null);
  const [search, setSearch] = useState("");

  // DELETE STATES
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState(null);

  // PAGINATION STATES
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleEdit = (program) => {
    setProgramToEdit(program);
    setIsOpen(true);
  };

  // DELETE LOGIC
  const confirmDelete = (id) => {
    setProgramToDelete(id);
    setIsAlertOpen(true);
  };

  const executeDelete = async () => {
    try {
      await deleteProgram(programToDelete);
      await refreshPrograms();
      toast.success("Program deleted successfully.");
    } catch (error) {
      toast.error("Failed to delete the program. Please try again.");
    } finally {
      setIsAlertOpen(false);
      setProgramToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setProgramToEdit(null);
  };

  // SEARCH LOGIC
  const filteredPrograms = useMemo(() => {
    const valid = (programs || []).filter(p => p && p.id && p.programName);
    const searchLower = search.toLowerCase();

    return valid.filter((p) => {
      return (
        p.programName.toLowerCase().includes(searchLower) ||
        p.programCode.toLowerCase().includes(searchLower) ||
        (p.description && p.description.toLowerCase().includes(searchLower))
      );
    });
  }, [programs, search]);

  // PAGINATION LOGIC
  const totalPages = Math.max(Math.ceil(filteredPrograms.length / itemsPerPage), 1);
  const paginatedPrograms = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPrograms.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPrograms, currentPage]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border-l-8 border-[#1e3a8a] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Organization Programs</h1>
          <p className="text-sm text-slate-500">Manage sectors and operational categories</p>
        </div>
        <Button onClick={() => { setProgramToEdit(null); setIsOpen(true); }} className="bg-[#1e3a8a] hover:bg-[#172554] text-white">
          <Plus size={18} className="mr-2" /> Add New Program
        </Button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search program name or code..."
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
                <th className="p-4">Program Name</th>
                <th className="p-4">Unique Code</th>
                <th className="p-4">Description</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedPrograms.map((prog) => (
                <tr key={prog.id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold">{prog.programName}</td>
                  <td className="p-4 font-mono font-bold text-[#1e3a8a]">{prog.programCode}</td>
                  <td className="p-4 text-slate-600">{prog.description || "No description"}</td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleEdit(prog)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={() => confirmDelete(prog.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
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
              This action cannot be undone. The program will be removed from the system and will no longer appear in dropdown lists.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PAGINATION */}
      {filteredPrograms.length > 0 && (
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

      <CreateProgram 
        isOpen={isOpen} 
        onClose={handleCloseModal} 
        refreshPrograms={refreshPrograms} 
        programToEdit={programToEdit}
        createProgram={createProgram}
        updateProgram={updateProgram}
      />
    </div>
  );
}