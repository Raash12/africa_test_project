import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Plus, Search, FolderTree, Hash } from "lucide-react";
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

import useAccounts from "@/hooks/useAccounts";
import { createAccount, updateAccount, deleteAccount } from "@/services/accounting/accountService";
import CreateAccount from "./CreateAccount";

export default function ListAccounts() {
  const { accounts = [], refreshAccounts } = useAccounts();
  const [isOpen, setIsOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState(null);
  const [search, setSearch] = useState("");
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const handleEdit = (account) => {
    setAccountToEdit(account);
    setIsOpen(true);
  };

  const confirmDelete = (id) => {
    setAccountToDelete(id);
    setIsAlertOpen(true);
  };

  const executeDelete = async () => {
    try {
      await deleteAccount(accountToDelete);
      await refreshAccounts();
      toast.success("Account deleted successfully.");
    } catch (error) {
      toast.error("Failed to delete account.");
    } finally {
      setIsAlertOpen(false);
      setAccountToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setAccountToEdit(null);
  };

  const filteredAccounts = useMemo(() => {
    const valid = (accounts || []).filter(a => a && a.id && a.accountName);
    const searchLower = search.toLowerCase();
    return valid.filter((a) => (
      a.accountName.toLowerCase().includes(searchLower) ||
      a.accountCode.toLowerCase().includes(searchLower) ||
      a.accountType.toLowerCase().includes(searchLower)
    ));
  }, [accounts, search]);

  const totalPages = Math.max(Math.ceil(filteredAccounts.length / itemsPerPage), 1);
  const paginatedAccounts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAccounts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAccounts, currentPage]);

  const getTypeBadge = (type) => {
    const styles = {
      Assets: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      "Accounts Receivable": "bg-cyan-50 text-cyan-700 border border-cyan-200",
      Liabilities: "bg-amber-50 text-amber-700 border border-amber-200",
      Equity: "bg-purple-50 text-purple-700 border border-purple-200",
      Revenue: "bg-blue-50 text-blue-700 border border-blue-200",
      Expenses: "bg-rose-50 text-rose-700 border border-rose-200",
    };
    return styles[type] || "bg-slate-100 text-slate-700";
  };
  

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border-l-8 border-[#1e3a8a] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Chart of Accounts</h1>
          <p className="text-sm text-slate-500">Manage GL Codes & Financial Structures</p>
        </div>
        <Button onClick={() => { setAccountToEdit(null); setIsOpen(true); }} className="bg-[#1e3a8a] text-white">
          <Plus size={18} className="mr-2" /> Create New Account
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search by code, name..."
          className="w-full pl-10 pr-4 py-2.5 border rounded-lg outline-none"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
        />
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#1e3a8a] text-white uppercase text-xs font-bold">
              <tr>
                <th className="p-4">GL Code</th>
                <th className="p-4">Account Name</th>
                <th className="p-4">Category</th>
                <th className="p-4 text-right">Opening Bal</th>
                <th className="p-4 text-right">Current Bal</th>
                <th className="p-4 text-center">Currency</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-mono font-bold text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <Hash size={14} className="text-slate-400" />
                      {account.accountCode}
                    </div>
                  </td>
                  <td className="p-4 font-semibold text-[#1e3a8a]">
                    <div className="flex items-center gap-2">
                      <FolderTree size={16} />
                      {account.accountName}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase ${getTypeBadge(account.accountType)}`}>
                      {account.accountType}
                    </span>
                  </td>
                  
                  {/* DIRECT READ: No math here */}
                  <td className="p-4 text-right font-mono font-bold text-slate-500">
                    {(account.openingBalance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  
                  {/* DIRECT READ: Shows exactly what is in the DB field */}
                  <td className="p-4 text-right font-mono font-bold text-slate-900">
                    {(account.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>

                  <td className="p-4 text-center font-semibold text-xs text-slate-600">
                    {account.currency || "USD"}
                  </td>
                  
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleEdit(account)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={() => confirmDelete(account.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAccounts.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">No accounts found.</td>
                </tr>
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
            <AlertDialogAction onClick={executeDelete} className="bg-red-600">Yes, Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateAccount 
        isOpen={isOpen} 
        onClose={handleCloseModal} 
        refreshAccounts={refreshAccounts} 
        accountToEdit={accountToEdit}
        createAccount={createAccount}
        updateAccount={updateAccount}
      />
    </div>
  );
  
}