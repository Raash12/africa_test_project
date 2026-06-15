import { useState } from "react";
import { useEmployees } from "@/hooks/useEmployees";
import { toast } from "sonner";

// UI Components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

// Icons
import { Plus, Search, Edit2, Trash2, Loader2 } from "lucide-react";
import CreateEmployee from "./CreateEmployee";

export default function EmployeesList() {
  // Waxaan halkan uga wacaynaa custom hook-gii aan samaynay
  const { employees, loading, addEmployee, editEmployee, removeEmployee } = useEmployees();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filtered = employees.filter((e) =>
    e.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const initiateDelete = (emp) => {
    setEmployeeToDelete(emp);
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    setIsDeleting(true);
    try {
      await removeEmployee(employeeToDelete.id);
      toast.success("Staff member deleted successfully.");
    } catch (error) {
      toast.error("Failed to delete staff member.");
    } finally {
      setIsDeleting(false);
      setIsDeleteAlertOpen(false);
      setEmployeeToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-[#1e3a8a] dark:text-blue-500" size={40} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border-l-8 border-[#1e3a8a] dark:border-blue-500 shadow-sm transition-all">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 uppercase tracking-tight">Staff Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manage Africa Ihsan Aid Employees</p>
        </div>

        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if(!val) setSelectedEmp(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedEmp(null)} className="bg-[#1e3a8a] dark:bg-blue-600 hover:bg-[#172554] text-white px-6 shadow-md border-none">
              <Plus size={18} className="mr-2" /> Add Employee
            </Button>
          </DialogTrigger>

          <DialogContent className="dark:bg-slate-900 dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-[#1e3a8a] dark:text-blue-400">{selectedEmp ? "Edit Staff Details" : "New Staff Registration"}</DialogTitle>
              <DialogDescription>Please provide accurate professional information.</DialogDescription>
            </DialogHeader>
            
            {/* Waxaan halkan ku baasaynaa shaqooyinkii hook-ga ku jiray */}
            <CreateEmployee 
              editData={selectedEmp} 
              actions={{ addEmployee, editEmployee }} 
              onSuccess={() => setOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* SEARCH BOX */}
      <div className="relative max-w-md shadow-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search staff members..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg outline-none bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
        />
      </div>

      {/* DATA TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#1e3a8a] dark:bg-blue-900 text-white text-xs uppercase font-bold">
            <tr>
              <th className="p-4">Staff Name</th>
              <th className="p-4">Contact Info</th>
              <th className="p-4">Salary</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {currentItems.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="p-4">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{e.fullName}</div>
                  <div className="text-[10px] text-slate-400 font-bold">ID: {e.id.slice(-5)}</div>
                </td>
                <td className="p-4">
                  <div className="text-slate-600 dark:text-slate-400">{e.email}</div>
                  <div className="text-xs text-slate-500">{e.phone}</div>
                </td>
                <td className="p-4 font-medium">
                  <Badge variant="outline" className="text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950/30 dark:border-green-900">${e.salary}</Badge>
                </td>
                <td className="p-4 text-center">
                  <div className="flex justify-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedEmp(e); setOpen(true); }}><Edit2 size={16} className="text-blue-500" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => initiateDelete(e)}><Trash2 size={16} className="text-red-500" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} className={currentPage === 1 ? "opacity-30 pointer-events-none" : "cursor-pointer"} />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink onClick={() => setCurrentPage(i + 1)} isActive={currentPage === i + 1} className="cursor-pointer">{i + 1}</PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} className={currentPage === totalPages ? "opacity-30 pointer-events-none" : "cursor-pointer"} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      {/* DELETE ALERT DIALOG */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="dark:bg-slate-900 dark:border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-slate-100">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-slate-400">This action will permanently remove the staff member from the system.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="dark:bg-slate-800 dark:text-slate-200">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? <Loader2 size={16} className="animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}