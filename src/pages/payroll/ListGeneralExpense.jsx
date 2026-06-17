import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, Plus, Search, Calendar, Loader2, ArrowUpRight } from "lucide-react";
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
import { useGeneralExpense } from "@/hooks/useGeneralExpense";
import GeneralExpenseForm from "./GeneralExpenseForm"; 

export default function ListGeneralExpense() {
  const { paymentEntries = [], accounts = [], loading, addPaymentEntry, deletePaymentEntry, refresh } = useGeneralExpense();
  
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

  const executeDelete = async () => {
    try {
      await deletePaymentEntry(expenseToDelete);
      toast.success("Transaction deleted successfully.");
      refresh();
    } catch (error) {
      toast.error("Failed to delete transaction.");
    } finally {
      setIsAlertOpen(false);
      setExpenseToDelete(null);
    }
  };

  const filteredExpenses = useMemo(() => {
    if (!paymentEntries || !Array.isArray(paymentEntries)) return [];

    // DEBUG: Halkan ka arag Console-ka waxa ku jira xogtaada
    // console.log("Dhammaan Payment Entries:", paymentEntries);

    // Waxaan u oggolaanay inuu soo saaro haddii uu yahay 'expense' ama 'general_expense'
    const validExpenses = paymentEntries.filter((t) => {
      const category = (t.category || "").toLowerCase();
      const type = (t.type || "").toLowerCase();
      return category === "expense" || type === "expense" || category === "general_expense";
    });

    const searchLower = search.trim().toLowerCase();
    
    return validExpenses
      .filter((t) => 
        (t.description || "").toLowerCase().includes(searchLower) ||
        (t.chargedToAccount || "").toLowerCase().includes(searchLower) ||
        (t.paidFromAccount || "").toLowerCase().includes(searchLower)
      )
      .sort((a, b) => parseTransactionDate(b.date) - parseTransactionDate(a.date));
  }, [paymentEntries, search]);

  const totalPages = Math.max(Math.ceil(filteredExpenses.length / itemsPerPage), 1);
  const paginatedExpenses = filteredExpenses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
        className="w-full p-2 border rounded-lg text-xs"
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
                      <div className="text-amber-700">CR: {exp.paidFromAccount}</div>
                      <div className="text-emerald-700">DR: {exp.chargedToAccount}</div>
                    </td>
                    <td className="p-3"><Badge variant="secondary">{exp.month}</Badge></td>
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

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <GeneralExpenseForm 
              accounts={accounts} 
              onExecute={addPaymentEntry} 
              onSuccess={() => { setIsOpen(false); refresh(); }}
              expenseToEdit={expenseToEdit}
              onClose={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}