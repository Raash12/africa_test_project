import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Plus, Search, Calendar, User, FileText, Loader2 } from "lucide-react";
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

import usePaymentEntry from "@/hooks/usePaymentEntry"; // Waxaan u baddelnay usePaymentEntry
import SalaryForm from "./SalaryForm"; 

export default function ListSalaryExpense({ accounts = [] }) {
  // Halkan waxaan uga soo baxsanay xogta guud ee usePaymentEntry
  const { expenses: paymentEntries = [], loading, refreshPayments: refresh, removePayment: deletePaymentEntry } = usePaymentEntry();
  
  const [isOpen, setIsOpen] = useState(false);
  const [salaryToEdit, setSalaryToEdit] = useState(null);
  const [search, setSearch] = useState("");
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [salaryToDelete, setSalaryToDelete] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleEdit = (salary) => {
    setSalaryToEdit(salary);
    setIsOpen(true);
  };

  const confirmDelete = (id) => {
    setSalaryToDelete(id);
    setIsAlertOpen(true);
  };

  const executeDelete = async () => {
    try {
      await deletePaymentEntry(salaryToDelete);
      toast.success("Salary transaction deleted successfully.");
      refresh(); 
    } catch (error) {
      toast.error("Failed to delete the transaction. Please try again.");
    } finally {
      setIsAlertOpen(false);
      setSalaryToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setSalaryToEdit(null);
  };

  const filteredSalaries = useMemo(() => {
    if (!paymentEntries || !Array.isArray(paymentEntries)) return [];

    // Waxaan miirnaa kaliya kuwa noocoodu yahay SALARY ama category-gu yahay Salary
    const validSalaries = paymentEntries.filter((t) => {
      if (!t) return false;
      return (t.type === "SALARY" || (t.category && t.category.trim().toLowerCase() === "salary"));
    });

    const searchLower = search.trim().toLowerCase();
    if (!searchLower) return validSalaries;

    return validSalaries.filter((t) => {
      const empName = (t.employeeName || "").toLowerCase();
      const empId = (t.employeeId || "").toLowerCase();
      const desc = (t.description || "").toLowerCase();
      return empName.includes(searchLower) || empId.includes(searchLower) || desc.includes(searchLower);
    });
  }, [paymentEntries, search]);

  const totalPages = Math.max(Math.ceil(filteredSalaries.length / itemsPerPage), 1);
  const paginatedSalaries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSalaries.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSalaries, currentPage]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#1e3a8a]" />
        <p className="text-sm text-slate-500 animate-pulse">Loading payroll entries...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border-l-8 border-l-[#1e3a8a] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Salary Expenses</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Track and Manage Staff Payroll</p>
        </div>
        <Button onClick={() => { setSalaryToEdit(null); setIsOpen(true); }} className="bg-[#1e3a8a] hover:bg-[#172554] text-white font-bold text-xs shadow-sm">
          <Plus size={16} className="mr-2" /> Add New Salary
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search employee name, ID or description..."
          className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-1 focus:ring-blue-600 outline-none bg-white dark:bg-slate-900 text-xs"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
        />
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#1e3a8a] text-white uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Employee</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5">Paid From</th>
                <th className="p-3.5 text-right">Amount</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {paginatedSalaries.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <User className="h-6 w-6 text-slate-400 mb-2" />
                      <span className="font-semibold text-xs">No salary records found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedSalaries.map((salary) => (
                  <tr key={salary.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3.5 whitespace-nowrap text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-400" />
                        {salary.date ? new Date(salary.date.seconds ? salary.date.seconds * 1000 : salary.date).toLocaleDateString() : "—"}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <User size={13} className="text-[#1e3a8a]" />
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{salary.employeeName || "Unknown"}</span>
                          {salary.employeeId && <div className="text-[10px] text-slate-400">ID: {salary.employeeId}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 max-w-[200px] truncate text-slate-500" title={salary.description}>
                      <div className="flex items-center gap-1.5">
                        <FileText size={13} className="text-slate-300" />
                        <span>{salary.description || `${salary.month || ''} Salary`}</span>
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                        {salary.paidFromAccount || "Cash/Bank Account"}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-bold text-emerald-600 whitespace-nowrap text-sm">
                      ${Number(salary.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex justify-center gap-1.5">
                        <button onClick={() => handleEdit(salary)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-md transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => confirmDelete(salary.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md transition-colors">
                          <Trash2 size={14} />
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

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="max-w-sm rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This action will remove the record and revert accounting balances.
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

      {filteredSalaries.length > 0 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} className={currentPage === 1 ? "pointer-events-none opacity-50 text-xs" : "cursor-pointer text-xs"} />
            </PaginationItem>
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink onClick={() => setCurrentPage(i + 1)} isActive={currentPage === i + 1} className="cursor-pointer text-xs h-8 w-8">{i + 1}</PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} className={currentPage === totalPages ? "pointer-events-none opacity-50 text-xs" : "cursor-pointer text-xs"} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg w-full max-w-md">
            <SalaryForm 
              accounts={accounts} 
              onSuccess={handleCloseModal} 
              salaryToEdit={salaryToEdit}
              onClose={handleCloseModal}
            />
          </div>
        </div>
      )}
    </div>
  );
}