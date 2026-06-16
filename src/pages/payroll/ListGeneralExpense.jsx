import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, Plus, Search, Calendar, Loader2, Wallet, ArrowUpRight } from "lucide-react";
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

import { useGeneralExpense } from "@/hooks/useGeneralExpense";
import GeneralExpenseForm from "./GeneralExpenseForm"; 

export default function ListGeneralExpense() {
  const { transactions = [], accounts = [], loading, addTransaction, deleteTransaction } = useGeneralExpense();
  
  const [isOpen, setIsOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [search, setSearch] = useState("");
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // 🌟 Helper function oo Firestore Timestamp u beddeleysa JS Date si ammaan ah
  const parseTransactionDate = (dateField) => {
    if (!dateField) return new Date(0); // Haddii aysan taariikh jirin hoos u ridi
    if (typeof dateField.toDate === "function") return dateField.toDate();
    if (dateField.seconds) return new Date(dateField.seconds * 1000);
    return new Date(dateField);
  };

  const handleEdit = (expense) => {
    setExpenseToEdit(expense);
    setIsOpen(true);
  };

  const confirmDelete = (id) => {
    setExpenseToDelete(id);
    setIsAlertOpen(true);
  };

  const executeDelete = async () => {
    try {
      await deleteTransaction(expenseToDelete);
      toast.success("Transaction deleted successfully.");
    } catch (error) {
      toast.error("Failed to delete transaction sxb.");
    } finally {
      setIsAlertOpen(false);
      setExpenseToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setExpenseToEdit(null);
  };

  const filteredExpenses = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) return [];

    // 1. Sifee oo kaliya kuwa category-goodu yahay expense
    const validExpenses = transactions.filter((t) => t?.category?.toLowerCase() === "expense");

    // 2. Filter-ka raadinta (Search)
    const searchLower = search.trim().toLowerCase();
    const searchedList = !searchLower
      ? validExpenses
      : validExpenses.filter((t) => {
          return (
            (t.description || "").toLowerCase().includes(searchLower) ||
            (t.chargedToAccount || "").toLowerCase().includes(searchLower) ||
            (t.paidFromAccount || "").toLowerCase().includes(searchLower) ||
            (t.month || "").toLowerCase().includes(searchLower)
          );
        });

    // 🌟 3. KALA HORREYN (SORT): Midka ugu dambeeyay/ugu cusub ha ugu dhex baxo kor (Newest First)
    return searchedList.sort((a, b) => {
      return parseTransactionDate(b.date) - parseTransactionDate(a.date);
    });

  }, [transactions, search]);

  const totalPages = Math.max(Math.ceil(filteredExpenses.length / itemsPerPage), 1);
  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredExpenses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredExpenses, currentPage]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#1e3a8a]" />
        <p className="text-sm text-slate-500 animate-pulse">Loading general expenses...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border-l-8 border-l-[#1e3a8a] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">General Expenses</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Track and Manage Operational & Office Payroll Expenses</p>
        </div>
        <Button onClick={() => { setExpenseToEdit(null); setIsOpen(true); }} className="bg-[#1e3a8a] hover:bg-[#172554] text-white font-bold text-xs shadow-sm">
          <Plus size={16} className="mr-2" /> Add New Expense
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search expenses, accounts or months..."
          className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-1 focus:ring-blue-600 outline-none bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
        />
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#1e3a8a] text-white uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="p-3.5">Expense Details</th>
                <th className="p-3.5">Account Flow (DR/CR)</th>
                <th className="p-3.5 text-center">Month</th>
                <th className="p-3.5 text-right">Amount</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {paginatedExpenses.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                    <div className="flex flex-col items-center justify-center">
                      <Wallet className="h-6 w-6 text-slate-400 mb-2" />
                      <span className="font-semibold text-xs">No general expenses found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedExpenses.map((expense) => {
                  // 🌟 Taariikhda halkan ugu beddel String si ammaan ah oo uu u shaqeeyo toLocaleDateString()
                  const displayDate = expense.date 
                    ? parseTransactionDate(expense.date).toLocaleDateString() 
                    : "—";

                  return (
                    <tr key={expense.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3.5 max-w-[220px]">
                        <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{expense.description}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                          <Calendar size={11} /> Date: {displayDate}
                        </div>
                      </td>
                      <td className="p-3.5 text-[11px] space-y-0.5">
                        <div className="text-amber-600 dark:text-amber-500 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          CR: {expense.paidFromAccount || "Bank Account"} (-${expense.amount})
                        </div>
                        <div className="text-emerald-600 dark:text-emerald-500 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          DR: {expense.chargedToAccount || "Expense Account"} (+${expense.amount})
                        </div>
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 dark:border-slate-800">
                          {expense.month}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right font-bold whitespace-nowrap">
                        <div className="flex items-center justify-end text-red-500 dark:text-red-400 font-bold text-xs">
                          <ArrowUpRight size={13} className="mr-0.5 opacity-80" /> 
                          ${Number(expense.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex justify-center gap-1.5">
                          <button onClick={() => handleEdit(expense)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-md transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => confirmDelete(expense.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="max-w-sm rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This action cannot be undone. This expense ledger entry will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="text-xs">
            <AlertDialogCancel className="text-xs py-1.5">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700 text-white text-xs py-1.5">
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {filteredExpenses.length > 0 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} 
                className={currentPage === 1 ? "pointer-events-none opacity-50 text-xs" : "cursor-pointer text-xs"} 
              />
            </PaginationItem>
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink 
                  onClick={() => setCurrentPage(i + 1)} 
                  isActive={currentPage === i + 1} 
                  className="cursor-pointer text-xs h-8 w-8"
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} 
                className={currentPage === totalPages ? "pointer-events-none opacity-50 text-xs" : "cursor-pointer text-xs"} 
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Modal View */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {expenseToEdit ? "Edit General Expense" : "Add New General Expense"}
              </h3>
              <button onClick={handleCloseModal} className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                ✕
              </button>
            </div>
            <div className="p-5">
              <GeneralExpenseForm 
                accounts={accounts} 
                onExecute={addTransaction}
                onSuccess={handleCloseModal}
                expenseToEdit={expenseToEdit}
                onClose={handleCloseModal}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}