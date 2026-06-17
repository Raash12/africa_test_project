import React, { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGeneralExpense } from "@/hooks/useGeneralExpense"; 
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowUpRight, Building2, Landmark, AlertTriangle, Wallet } from "lucide-react";
import { toast } from "sonner";

export default function GeneralExpenseForm({ accounts: propsAccounts = [], onSuccess, expenseToEdit, onClose }) {
  const { accounts: hookAccounts, addPaymentEntry } = useGeneralExpense();
  const accounts = propsAccounts.length > 0 ? propsAccounts : hookAccounts;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paidFromAccountId, setPaidFromAccountId] = useState(""); 
  const [chargedToAccountId, setChargedToAccountId] = useState(""); 
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState("June 2026");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});
  
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertDescription, setAlertDescription] = useState("");

  const assetAccounts = useMemo(() => {
    return (accounts || []).filter(a => 
      a?.accountType?.toLowerCase().includes("asset") || 
      a?.accountType?.toLowerCase().includes("bank") || 
      a?.category?.toLowerCase().includes("asset")
    );
  }, [accounts]);

  // Halkan waxaa lagu saxay xogta "Expenses" ee database-kaaga
  const expenseAccounts = useMemo(() => {
    return (accounts || []).filter(a => 
      (a?.accountType?.includes("Expense") || 
       a?.accountType?.includes("Expenses") || 
       a?.category?.toLowerCase().includes("expense"))
    );
  }, [accounts]);

  useEffect(() => {
    if (expenseToEdit) {
      setPaidFromAccountId(expenseToEdit.paidFromAccountId || ""); 
      setChargedToAccountId(expenseToEdit.chargedToAccountId || "");    
      setAmount(expenseToEdit.amount || "");
      setMonth(expenseToEdit.month || "June 2026");
      setDescription(expenseToEdit.description || "");
    } else {
      if (assetAccounts.length > 0) {
        const defaultSalaam = assetAccounts.find(a => a?.accountName?.toLowerCase().includes("salaam") || a?.accountName?.toLowerCase().includes("business"));
        setPaidFromAccountId(defaultSalaam ? defaultSalaam.id : assetAccounts[0].id);
      }
      setChargedToAccountId("");
      setAmount("");
      setDescription("");
    }
  }, [expenseToEdit, assetAccounts]);

  const selectedPaidAccount = accounts.find(a => a.id === paidFromAccountId);
  const selectedChargedAccount = accounts.find(a => a.id === chargedToAccountId);

  useEffect(() => {
    if (selectedChargedAccount && !expenseToEdit) {
      setDescription(`${selectedChargedAccount.accountName} payment for ${month}`);
    }
  }, [chargedToAccountId, month, expenseToEdit, selectedChargedAccount]);

  const validateForm = () => {
    const localErrors = {};
    if (!paidFromAccountId) localErrors.paidFromAccount = true;
    if (!chargedToAccountId) localErrors.chargedToAccount = true;
    if (!amount || parseFloat(amount) <= 0) localErrors.amount = true;
    if (!description.trim()) localErrors.description = true;

    setErrors(localErrors);
    return Object.keys(localErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return toast.error("Fadlan buuxi meelaha muhiimka ah.");
    }
    
    const parsedAmount = parseFloat(amount);

    if (!expenseToEdit && selectedPaidAccount && parseFloat(selectedPaidAccount.balance || 0) < parsedAmount) {
      setAlertTitle("Haraaga Bankiga Ma Ku Filna");
      setAlertDescription(`Account-ka ${selectedPaidAccount.accountName} haraaga dhex yaal waa $${parseFloat(selectedPaidAccount.balance).toLocaleString()}. Kuma filna in laga bixiyo kharashkan oo dhan $${parsedAmount.toLocaleString()}.`);
      setAlertOpen(true);
      return;
    }

    try {
      setIsSubmitting(true);
      await addPaymentEntry({
        id: expenseToEdit?.id || null, 
        amount: parsedAmount,
        paidFromAccountId, 
        chargedToAccountId, 
        description,
        month,
        category: "Expense" 
      });

      toast.success(expenseToEdit ? "Kharashka waa la cusbooneysiiyay." : "Kharashka si guul leh ayaa loo kaydiyay.");
      onSuccess?.();
      if (onClose) onClose();

    } catch (err) {
      console.error("Payment Entry Error:", err);
      const cleanMessage = err.message?.includes("|") ? err.message.split("|")[1] : err.message;
      toast.error(cleanMessage || "Wuu guuldareystay kaydinta kharashka.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 pt-1 text-slate-900 dark:text-slate-100">
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent className="max-w-md rounded-xl p-5 shadow-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <AlertDialogHeader className="flex flex-row items-start gap-3 space-y-0">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600 shrink-0 mt-0.5">
              <AlertTriangle size={20} />
            </div>
            <div className="space-y-1 text-left">
              <AlertDialogTitle className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight">{alertTitle}</AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{alertDescription}</AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 pt-2">
            <AlertDialogAction onClick={() => setAlertOpen(false)} className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 text-white font-semibold text-xs py-2 px-4 rounded-lg shadow-sm">
              Dismiss
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
          <Wallet size={12} /> Expected Double-Entry Impact
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className={`p-2 border rounded-lg text-xs font-semibold ${selectedPaidAccount ? "bg-red-50 dark:bg-red-950/20 border-red-100 text-red-700 dark:text-red-400" : "bg-slate-100 text-slate-400"}`}>
            <span className="font-bold bg-red-500 text-white px-1 rounded mr-1 text-[9px]">CR</span>
            <strong>{selectedPaidAccount?.accountName || "-- No Asset Selected --"}</strong> 
            {selectedPaidAccount && <span className="block text-[10px] text-slate-500 mt-0.5">Balance: ${parseFloat(selectedPaidAccount?.balance || 0).toLocaleString()}</span>}
          </div>
          <div className={`p-2 border rounded-lg text-xs font-semibold ${selectedChargedAccount ? "bg-green-50 dark:bg-green-950/20 border-green-100 text-green-700 dark:text-green-400" : "bg-slate-100 text-slate-400"}`}>
            <span className="font-bold bg-green-600 text-white px-1 rounded mr-1 text-[9px]">DR</span>
            <strong>{selectedChargedAccount?.accountName || "-- No Expense Selected --"}</strong>
            {selectedChargedAccount && <span className="block text-[10px] text-slate-500 mt-0.5">Spent Counter: ${parseFloat(selectedChargedAccount?.balance || 0).toLocaleString()}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-1">
            <Landmark size={12} /> Paid From (Asset Account)
          </label>
          <select
            className={`w-full p-2 border rounded-lg bg-white dark:bg-slate-900 text-xs font-medium outline-none shadow-sm focus:ring-1 focus:ring-[#1e3a8a] ${errors.paidFromAccount ? "border-red-500" : "border-slate-200 dark:border-slate-800"}`}
            value={paidFromAccountId}
            onChange={(e) => { setPaidFromAccountId(e.target.value); setErrors(prev => ({ ...prev, paidFromAccount: false })); }}
          >
            <option value="" disabled>Select Asset Account</option>
            {assetAccounts.map(a => (
              <option key={a.id} value={a.id}>{a.accountCode || "1000"} - {a.accountName} (${parseFloat(a.balance || 0).toLocaleString()})</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-1">
            <Building2 size={12} /> Expense Account (DR)
          </label>
          <select
            className={`w-full p-2 border rounded-lg bg-white dark:bg-slate-900 text-xs font-medium outline-none shadow-sm focus:ring-1 focus:ring-[#1e3a8a] ${errors.chargedToAccount ? "border-red-500" : "border-slate-200 dark:border-slate-800"}`}
            value={chargedToAccountId}
            onChange={(e) => { setChargedToAccountId(e.target.value); setErrors(prev => ({ ...prev, chargedToAccount: false })); }}
          >
            <option value="">-- Choose Expense Account --</option>
            {expenseAccounts.map(a => (
              <option key={a.id} value={a.id}>{a.accountCode || "5000"} - {a.accountName}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase text-slate-500">Expense Month</label>
          <select
            className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-xs font-medium outline-none text-slate-800 dark:text-slate-200"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            <option value="May 2026">May 2026</option>
            <option value="June 2026">June 2026</option>
            <option value="July 2026">July 2026</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase text-slate-500">Amount ($)</label>
          <Input 
            type="number" 
            className={`text-xs font-semibold h-[38px] dark:bg-slate-900 ${errors.amount ? "border-red-500" : "border-slate-200 dark:border-slate-800"}`} 
            placeholder="0.00"
            value={amount} 
            onChange={(e) => { setAmount(e.target.value); setErrors(prev => ({ ...prev, amount: false })); }} 
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase text-slate-500">Description / Faahfaahin</label>
        <Input 
          className={`text-xs h-[38px] dark:bg-slate-900 ${errors.description ? "border-red-500" : "border-slate-200 dark:border-slate-800"}`} 
          placeholder="e.g. Office Rent, Electricity Bill, Internet Service" 
          value={description} 
          onChange={(e) => { setDescription(e.target.value); setErrors(prev => ({ ...prev, description: false })); }} 
        />
      </div>

      <div className="pt-2 flex gap-2 justify-end border-t border-slate-100 dark:border-slate-800">
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose} className="text-xs h-[38px]">
            Cancel
          </Button>
        )}
        <Button 
          type="button"
          className="bg-[#1e3a8a] hover:bg-[#172554] font-bold text-white text-xs h-[38px] px-6 flex items-center gap-2 rounded-lg transition-all" 
          onClick={handleSubmit} 
          disabled={isSubmitting}
        >
          <ArrowUpRight size={14} />
          {isSubmitting ? "Saving..." : expenseToEdit ? "Update Entry" : "Save Expense Entry"}
        </Button>
      </div>
    </div>
  );
}