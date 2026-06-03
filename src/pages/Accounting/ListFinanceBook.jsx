import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Plus, Search, BookOpen, CalendarDays, CheckCircle2, XCircle } from "lucide-react";
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

// Soo dhoofinta adeegyada Firebase iyo Hook-ga
import { createFinanceBook, updateFinanceBook, deleteFinanceBook, getFinanceBooks } from "@/services/accounting/FinanceBookService";
import CreateFinanceBook from "./CreateFinanceBook";    

export default function ListFinanceBook() {
  const [financeBooks, setFinanceBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [bookToEdit, setBookToEdit] = useState(null);
  const [search, setSearch] = useState("");
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Wax yar baa laga dhigay si ay UI-du u ekaato mid habaysan

  // Function-ka xogta ka soo aqrinaya Firebase
  const refreshFinanceBooks = async () => {
    setLoading(true);
    try {
      const data = await getFinanceBooks();
      setFinanceBooks(data);
    } catch (error) {
      console.error("Error fetching finance books:", error);
      toast.error("Failed to load finance books.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshFinanceBooks();
  }, []);

  const handleEdit = (book) => {
    setBookToEdit(book);
    setIsOpen(true);
  };

  const confirmDelete = (id) => {
    setBookToDelete(id);
    setIsAlertOpen(true);
  };

  const executeDelete = async () => {
    try {
      await deleteFinanceBook(bookToDelete);
      await refreshFinanceBooks();
      toast.success("Finance book deleted successfully.");
    } catch (error) {
      toast.error("Failed to delete finance book. Please try again.");
    } finally {
      setIsAlertOpen(false);
      setBookToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setBookToEdit(null);
  };

  // Sifaynta xogta marka wax la raadinayo
  const filteredBooks = useMemo(() => {
    const valid = (financeBooks || []).filter(b => b && b.id && b.bookName);
    return valid.filter((b) => 
      b.bookName.toLowerCase().includes(search.toLowerCase()) ||
      b.financialYear?.toLowerCase().includes(search.toLowerCase())
    );
  }, [financeBooks, search]);

  const totalPages = Math.max(Math.ceil(filteredBooks.length / itemsPerPage), 1);
  const paginatedBooks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBooks.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBooks, currentPage]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border-l-8 border-[#1e3a8a] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Finance Books Setup</h1>
          <p className="text-sm text-slate-500 font-medium">Manage your accounting books, periods, and financial cycles</p>
        </div>
        <Button onClick={() => { setBookToEdit(null); setIsOpen(true); }} className="bg-[#1e3a8a] hover:bg-[#172554] text-white cursor-pointer">
          <Plus size={18} className="mr-2" /> Setup New Finance Book
        </Button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-md shadow-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search book name or year (e.g. 2026)..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white dark:bg-slate-900 text-sm"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
        />
      </div>

      {/* DATA TABLE */}
      <Card className="shadow-sm border border-slate-100 dark:border-slate-800">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#1e3a8a] text-white uppercase text-xs font-bold">
              <tr>
                <th className="p-4">Finance Book Name</th>
                <th className="p-4">Financial Year</th>
                <th className="p-4">Start Date</th>
                <th className="p-4">End Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-medium animate-pulse">Loading finance books...</td>
                </tr>
              ) : paginatedBooks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">No finance books found.</td>
                </tr>
              ) : (
                paginatedBooks.map((book) => (
                  <tr key={book.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <BookOpen size={16} className="text-[#1e3a8a] dark:text-blue-400" />
                        <div>
                          <span className="font-bold block text-slate-900 dark:text-slate-100">{book.bookName}</span>
                          {book.description && <span className="text-xs text-slate-400 font-normal line-clamp-1">{book.description}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-600 dark:text-slate-300">{book.financialYear}</td>
                    <td className="p-4 font-medium font-mono text-xs text-slate-600 dark:text-slate-400">{book.startDate || "N/A"}</td>
                    <td className="p-4 font-medium font-mono text-xs text-slate-600 dark:text-slate-400">{book.endDate || "N/A"}</td>
                    <td className="p-4">
                      {book.status === "Active" ? (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-bold bg-green-50 dark:bg-green-950/30 px-2.5 py-1 rounded-md w-fit border border-green-100 dark:border-green-900/50">
                          <CheckCircle2 size={13} /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md w-fit border border-slate-200 dark:border-slate-700">
                          <XCircle size={13} /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => handleEdit(book)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer" title="Edit Book">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => confirmDelete(book.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer" title="Delete Book">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* PAGINATION */}
      {filteredBooks.length > itemsPerPage && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
            </PaginationItem>
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink onClick={() => setCurrentPage(i + 1)} isActive={currentPage === i + 1} className="cursor-pointer">
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* DELETE CONFIRMATION ALERT DIALOG */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-slate-100">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
              This action will permanently remove this financial book and closing cycle from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700 text-white border-none cursor-pointer">
              Yes, Delete Book
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MODAL FORM CONTAINER */}
      <CreateFinanceBook 
        isOpen={isOpen} 
        onClose={handleCloseModal} 
        refreshFinanceBooks={refreshFinanceBooks} 
        bookToEdit={bookToEdit}
        createFinanceBook={createFinanceBook}
        updateFinanceBook={updateFinanceBook}
      />
    </div>
  );
}