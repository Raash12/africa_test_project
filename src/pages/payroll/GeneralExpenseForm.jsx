import React, { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import usePaymentEntry from "@/hooks/usePaymentEntry";
import useAccounts from "@/hooks/useAccounts";
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
  const { addPayment } = usePaymentEntry();
  const { accounts: fetchedAccounts } = useAccounts();
  
  const accounts = propsAccounts.length > 0 ? propsAccounts : fetchedAccounts;

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
      (a?.accountType || "").toLowerCase().includes("asset") || 
      (a?.accountType || "").toLowerCase().includes("bank") || 
      (a?.category || "").toLowerCase().includes("asset")
    );
  }, [accounts]);

  // Halkan ayaan ka dhigay mid loo dhan yahay: Wax kasta oo aan ahayn Asset/Bank waa Expense
  const expenseAccounts = useMemo(() => {
    return (accounts || []).filter(a => {
      const type = (a?.accountType || "").toLowerCase();
      const cat = (a?.category || "").toLowerCase();
      const isAssetOrBank = type.includes("asset") || type.includes("bank") || cat.includes("asset");
      return !isAssetOrBank;
    });
  }, [accounts]);

  useEffect(() => {
    if (expenseToEdit) {
      setPaidFromAccountId(expenseToEdit.paidFromAccountId || ""); 
      setChargedToAccountId(expenseToEdit.chargedToAccountId || "");    
      setAmount(expenseToEdit.amount || "");
      setMonth(expenseToEdit.month || "June 2026");
      setDescription(expenseToEdit.description || "");
    }
  }, [expenseToEdit]);

  const selectedPaidAccount = accounts.find(a => a.id === paidFromAccountId);
  const selectedChargedAccount = accounts.find(a => a.id === chargedToAccountId);

  const handleSubmit = async () => {
    const localErrors = {
      paid: !paidFromAccountId,
      charged: !chargedToAccountId,
      amount: !amount || parseFloat(amount) <= 0,
      desc: !description.trim()
    };
    setErrors(localErrors);
    if (Object.values(localErrors).some(Boolean)) return toast.error("Fadlan buuxi meelaha muhiimka ah.");

    try {
      setIsSubmitting(true);
      await addPayment({
        id: expenseToEdit?.id || null, 
        type: "GENERAL_EXPENSE",
        amount: parseFloat(amount),
        paidFromAccountId, 
        chargedToAccountId, 
        description,
        month,
        category: "General Expense" 
      });
      toast.success("Si guul leh ayaa loo kaydiyay.");
      onSuccess?.();
      if (onClose) onClose();
    } catch (err) {
      toast.error("Wuu guuldareystay kaydinta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 pt-1 text-slate-900 dark:text-slate-100">
      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
          <Wallet size={12} /> Expected Double-Entry Impact
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className={`p-2 border rounded-lg ${selectedPaidAccount ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-400"}`}>
            <span className="font-bold mr-1">CR</span> {selectedPaidAccount?.accountName || "-- No Asset Selected --"}
          </div>
          <div className={`p-2 border rounded-lg ${selectedChargedAccount ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-400"}`}>
            <span className="font-bold mr-1">DR</span> {selectedChargedAccount?.accountName || "-- No Expense Selected --"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-1"><Landmark size={12} /> Paid From</label>
          <select value={paidFromAccountId} onChange={(e) => setPaidFromAccountId(e.target.value)} className={`w-full p-2 border rounded-lg text-xs ${errors.paid ? "border-red-500" : ""}`}>
            <option value="">Select Asset Account</option>
            {assetAccounts.map(a => <option key={a.id} value={a.id}>{a.accountCode} - {a.accountName}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-1"><Building2 size={12} /> Expense Account</label>
          <select value={chargedToAccountId} onChange={(e) => setChargedToAccountId(e.target.value)} className={`w-full p-2 border rounded-lg text-xs ${errors.charged ? "border-red-500" : ""}`}>
            <option value="">-- Choose Account --</option>
            {expenseAccounts.map(a => <option key={a.id} value={a.id}>{a.accountCode} - {a.accountName}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase text-slate-500">Month</label>
          <select value={month} onChange={(e) => setMonth(e.target.value)} className="w-full p-2 border rounded-lg text-xs">
            <option value="May 2026">May 2026</option>
            <option value="June 2026">June 2026</option>
            <option value="July 2026">July 2026</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase text-slate-500">Amount ($)</label>
          <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className={errors.amount ? "border-red-500" : ""} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase text-slate-500">Description</label>
        <Input placeholder="e.g. Office Rent" value={description} onChange={(e) => setDescription(e.target.value)} className={errors.desc ? "border-red-500" : ""} />
      </div>

      <div className="pt-2 border-t flex justify-end gap-2">
        {onClose && <Button variant="outline" onClick={onClose} className="text-xs">Cancel</Button>}
        <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-[#1e3a8a] text-xs">
          <ArrowUpRight size={14} className="mr-2" /> {isSubmitting ? "Saving..." : "Save Expense Entry"}
        </Button>
      </div>
    </div>
  );
}