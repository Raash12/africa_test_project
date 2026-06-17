import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, Plus, Loader2 } from "lucide-react";
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
import usePaymentEntry from "@/hooks/usePaymentEntry"; // Halkan waxaa lagu saxay Hook-ga rasmiga ah
import GeneralExpenseForm from "./GeneralExpenseForm"; 

export default function ListGeneralExpense({ accounts = [] }) {
  // Waxaan halkan toos uga soo baxsanay 'expenses' iyo 'removePayment'
  const { expenses: filteredExpenses, loading, removePayment, refreshPayments } = usePaymentEntry();
  
  const [isOpen, setIsOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [search, setSearch] = useState("");
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const parseTransactionDate = (dateField) => {
    if (!dateField) return new Date();
    if (typeof dateField.toDate === "function") return dateField.toDate();
    if (dateField.seconds) return new Date(dateField.seconds * 1000);
    return new Date(dateField);
  };

  const accountMap = useMemo(() => {
    return accounts.reduce((acc, curr) => {
      const id = curr.id || curr.docId;
      if (id) acc[id] = curr.accountName || "Unnamed Account";
      return acc;
    }, {});
  }, [accounts]);

  const executeDelete = async () => {
    try {
      await removePayment(expenseToDelete);
      toast.success("Transaction deleted successfully.");
    } catch (error) {
      toast.error("Failed to delete transaction.");
    } finally {
      setIsAlertOpen(false);
      setExpenseToDelete(null);
    }
  };

  const searchedExpenses = useMemo(() => {
    const searchLower = search.trim().toLowerCase();
    return filteredExpenses
      .map((t) => {
        const paidFrom = t.paidFromAccount || accountMap[t.paidFromAccountId] || "Unknown Cash/Bank";
        const chargedTo = t.chargedToAccount || accountMap[t.chargedToAccountId] || "Unknown Expense Account";
        return { ...t, resolvedPaidFrom: paidFrom, resolvedChargedTo: chargedTo };
      })
      .filter((t) => 
        (t.description || "").toLowerCase().includes(searchLower) ||
        (t.resolvedChargedTo || "").toLowerCase().includes(searchLower) ||
        (t.resolvedPaidFrom || "").toLowerCase().includes(searchLower)
      )
      .sort((a, b) => parseTransactionDate(b.date) - parseTransactionDate(a.date));
  }, [filteredExpenses, search, accountMap]);

  const totalPages = Math.max(Math.ceil(searchedExpenses.length / itemsPerPage), 1);
  const paginatedExpenses = searchedExpenses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1e3a8a]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border-l-8 border-l-[#1e3a8a] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold uppercase">General Expenses</h1>
          <p className="text-sm text-slate-500">Track and Manage Operational Expenses</p>
        </div>
        <Button onClick={() => { setExpenseToEdit(null); setIsOpen(true); }} className="bg-[#1e3a8a] text-white">
          <Plus size={16} className="mr-2" /> Add Expense
        </Button>
      </div>

      <input
        type="text"
        placeholder="Search description, accounts..."
        className="w-full p-2 border rounded-lg text-xs mb-2"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
      />

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#1e3a8a] text-white uppercase">
              <tr>
                <th className="p-3">Expense</th>
                <th className="p-3">Account Flow</th>
                <th className="p-3">Month</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedExpenses.length > 0 ? (
                paginatedExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold">{exp.description}</td>
                    <td className="p-3">
                      <div className="text-amber-700 font-medium">CR: {exp.resolvedPaidFrom}</div>
                      <div className="text-emerald-700 font-medium">DR: {exp.resolvedChargedTo}</div>
                    </td>
                    <td className="p-3"><Badge variant="secondary">{exp.month || "N/A"}</Badge></td>
                    <td className="p-3 text-right font-bold text-red-600">${Number(exp.amount || 0).toLocaleString()}</td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => { setExpenseToEdit(exp); setIsOpen(true); }} className="text-blue-600"><Edit2 size={14} /></button>
                        <button onClick={() => { setExpenseToDelete(exp.id); setIsOpen(false); setIsAlertOpen(true); }} className="text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="p-10 text-center text-slate-500">No expenses found.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-end gap-2 text-xs font-medium">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Prev</Button>
          <span className="p-2">Page {currentPage} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next</Button>
        </div>
      )}

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-red-600 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <GeneralExpenseForm 
              accounts={accounts} 
              onSuccess={() => { setIsOpen(false); refreshPayments(); }}
              expenseToEdit={expenseToEdit}
              onClose={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}