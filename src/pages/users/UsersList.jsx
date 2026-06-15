import { useEffect, useState, useMemo } from "react";
import { getUsers, deleteUser } from "@/services/userService";
// HALKAN KA BEDDEL:
import { getEmployeesService } from "/src/services/employees/employeeService.js";
import { toast } from "sonner"; // Sonner Toast
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import CreateUserForm from "./CreateUser";

// SHADCN PAGINATION IMPORT
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null); // State-ka user-ka la tirtirayo

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchData = async () => {
    const [u, e] = await Promise.all([getUsers(), getEmployees()]);
    setUsers(u);
    setEmployees(e);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    setCurrentPage(1);
    return users
      .map(u => ({
        ...u,
        fullName: employees.find(e => e.id === u.employeeId)?.fullName || null
      }))
      .filter(u => u.fullName && u.fullName.toLowerCase().includes(search.toLowerCase()));
  }, [users, employees, search]);

  const totalPages = Math.max(Math.ceil(filteredData.length / itemsPerPage), 1);
  
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

  // Function-ka Tirtirista oo la casriyeeyay
  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete.id);
      setUsers(users.filter(u => u.id !== userToDelete.id));
      toast.success("User deleted successfully");
      setUserToDelete(null);
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border-l-8 border-[#1e3a8a] dark:border-blue-500 shadow-sm transition-all">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 uppercase tracking-tight">System Users</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manage User Accounts & Permissions</p>
        </div>
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if(!val) setSelectedUser(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedUser(null)} className="bg-[#1e3a8a] dark:bg-blue-600 hover:bg-[#172554] dark:hover:bg-blue-700 text-white px-6 shadow-md border-none transition-all">
              <Plus size={18} className="mr-2" /> Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-[#1e3a8a] dark:text-blue-400">{selectedUser ? "Edit" : "Add"} User</DialogTitle>
            </DialogHeader>
            <CreateUserForm 
                employees={employees} 
                editData={selectedUser} 
                onSuccess={() => { setOpen(false); fetchData(); }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* SEARCH BOX */}
      <div className="relative max-w-md shadow-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
        <input 
          type="text"
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-600 transition-all" 
          placeholder="Search users..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)} 
        />
      </div>

      {/* DATA TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#1e3a8a] dark:bg-slate-800 text-white dark:text-slate-100 text-xs uppercase tracking-widest font-bold">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedData.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">{u.fullName}</td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{u.role}</td>
                  <td className="p-4 text-sm">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs border ${
                      u.isActive 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800" 
                        : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800"
                    }`}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => { setSelectedUser(u); setOpen(true); }} 
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                      >
                        <Edit2 size={16}/>
                      </button>
                      <button 
                        onClick={() => setUserToDelete(u)} 
                        className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* ALERT DIALOG */}
        <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the user account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* PAGINATION */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <Pagination>
            <PaginationContent className="cursor-pointer">
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={`bg-white dark:bg-slate-800 ${currentPage === 1 ? "opacity-30 pointer-events-none" : ""}`}
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink 
                    isActive={currentPage === i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={`bg-white dark:bg-slate-800 ${currentPage === totalPages ? "opacity-30 pointer-events-none" : ""}`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}