import React, { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input"; 
import { Button } from "@/components/ui/button";
import { X, DollarSign, Wallet, ArrowUpRight, Building2, Landmark, AlertTriangle } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import usePaymentEntry from "@/hooks/usePaymentEntry"; 
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function SalaryForm({ accounts = [], onSuccess, salaryToEdit, onClose }) {
  const { employees = [] } = useEmployees();
  const { addPayment } = usePaymentEntry();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
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

  const expenseAccounts = useMemo(() => {
    return (accounts || []).filter(a => 
      a?.accountType?.toLowerCase().includes("expense") || 
      a?.category?.toLowerCase().includes("expense")
    );
  }, [accounts]);

  useEffect(() => {
    if (salaryToEdit) {
      setEmployeeId(salaryToEdit.employeeId || "");
      setPaidFromAccountId(salaryToEdit.paidFromAccountId || "");
      setChargedToAccountId(salaryToEdit.chargedToAccountId || "");
      setAmount(salaryToEdit.amount || "");
      setMonth(salaryToEdit.month || "June 2026");
      setDescription(salaryToEdit.description || "");
    } else {
      setEmployeeId("");
      if (assetAccounts.length > 0) {
        const defaultBank = assetAccounts.find(a => a?.accountName?.toLowerCase().includes("salaam") || a?.accountName?.toLowerCase().includes("business"));
        setPaidFromAccountId(defaultBank ? defaultBank.id : assetAccounts[0].id);
      }
      if (expenseAccounts.length > 0) {
        const defaultSalaryExp = expenseAccounts.find(a => a?.accountName?.toLowerCase().includes("salary") || a?.accountName?.toLowerCase().includes("staff"));
        setChargedToAccountId(defaultSalaryExp ? defaultSalaryExp.id : "");
      }
      setAmount("");
      setDescription("");
    }
  }, [salaryToEdit, assetAccounts, expenseAccounts]);

  const selectedEmployee = employees.find(e => e.id === employeeId);
  const selectedPaidAccount = accounts.find(a => a.id === paidFromAccountId);
  const selectedChargedAccount = accounts.find(a => a.id === chargedToAccountId);

  useEffect(() => {
    if (selectedEmployee && !salaryToEdit) {
      setAmount(selectedEmployee.salary || "");
      setDescription(`Salary payment for ${selectedEmployee.name} - ${month}`);
    }
  }, [employeeId, month, selectedEmployee, salaryToEdit]);

  const validateForm = () => {
    const localErrors = {};
    if (!employeeId) localErrors.employee = true;
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

    if (!salaryToEdit && selectedPaidAccount && parseFloat(selectedPaidAccount.balance || 0) < parsedAmount) {
      setAlertTitle("Haraaga Bankiga Ma Ku Filna");
      setAlertDescription(`Account-ka ${selectedPaidAccount.accountName} haraaga dhex yaal waa $${parseFloat(selectedPaidAccount.balance).toLocaleString()}. Kuma filna in laga bixiyo mushaarkan oo dhan $${parsedAmount.toLocaleString()}.`);
      setAlertOpen(true);
      return;
    }

    try {
      setIsSubmitting(true);
      
      await addPayment({
        id: salaryToEdit?.id || null,
        type: "SALARY",
        employeeId,
        employeeName: selectedEmployee?.name || "Unknown Staff",
        amount: parsedAmount,
        paidFromAccountId,
        chargedToAccountId,
        description,
        month,
        category: "Expense"
      });

      toast.success(salaryToEdit ? "Mushaarka waa la cusbooneysiiyay." : "Musharka si guul leh ayaa loo qeybiyay.");
      onSuccess?.();
      if (onClose) onClose();
    } catch (err) {
      console.error("Salary Save Error:", err);
      toast.error(err.message || "Wuu guuldareystay kaydinta mushaarka.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 pt-1 text-slate-900 dark:text-slate-100">
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent className="max-w-md bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-2xl">
          <AlertDialogHeader className="flex flex-row items-start gap-3 space-y-0">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600 shrink-0 mt-0.5">
              <AlertTriangle size={20} />
            </div>
            <div className="space-y-1 text-left">
              <AlertDialogTitle className="text-base font-bold uppercase">{alertTitle}</AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{alertDescription}</AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogAction onClick={() => setAlertOpen(false)} className="bg-slate-900 text-white text-xs py-2 px-4 rounded-lg shadow-sm">
              Dismiss
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border rounded-xl space-y-2">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
          <Wallet size={12} /> Double-Entry Impact
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className={`p-2 border rounded-lg text-xs font-semibold ${selectedPaidAccount ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-400"}`}>
            <span className="font-bold bg-red-500 text-white px-1 rounded mr-1 text-[9px]">CR</span>
            <strong>{selectedPaidAccount?.accountName || "-- No Asset Account --"}</strong>
          </div>
          <div className={`p-2 border rounded-lg text-xs font-semibold ${selectedChargedAccount ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-400"}`}>
            <span className="font-bold bg-green-600 text-white px-1 rounded mr-1 text-[9px]">DR</span>
            <strong>{selectedChargedAccount?.accountName || "-- No Expense Account --"}</strong>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-1">
          <DollarSign size={12} /> Select Employee / Shaqaalaha
        </label>
        <select
          className={`w-full p-2 border rounded-lg bg-white dark:bg-slate-900 text-xs font-medium outline-none ${errors.employee ? "border-red-500" : "border-slate-200"}`}
          value={employeeId}
          onChange={(e) => { setEmployeeId(e.target.value); setErrors(prev => ({ ...prev, employee: false })); }}
        >
          <option value="" disabled>Choose Employee</option>
          {employees.map(e => (
            <option key={e.id} value={e.id}>{e.name} ({e.title || "Staff"}) - ${parseFloat(e.salary || 0).toLocaleString()}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-1">
            <Landmark size={12} /> Paid From (Asset)
          </label>
          <select
            className={`w-full p-2 border rounded-lg bg-white dark:bg-slate-900 text-xs font-medium outline-none ${errors.paidFromAccount ? "border-red-500" : "border-slate-200"}`}
            value={paidFromAccountId}
            onChange={(e) => { setPaidFromAccountId(e.target.value); setErrors(prev => ({ ...prev, paidFromAccount: false })); }}
          >
            <option value="" disabled>Select Bank/Cash</option>
            {assetAccounts.map(a => (
              <option key={a.id} value={a.id}>{a.accountName} (${parseFloat(a.balance || 0).toLocaleString()})</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-1">
            <Building2 size={12} /> Charge Expense To
          </label>
          <select
            className={`w-full p-2 border rounded-lg bg-white dark:bg-slate-900 text-xs font-medium outline-none ${errors.chargedToAccount ? "border-red-500" : "border-slate-200"}`}
            value={chargedToAccountId}
            onChange={(e) => { setChargedToAccountId(e.target.value); setErrors(prev => ({ ...prev, chargedToAccount: false })); }}
          >
            <option value="" disabled>Select Expense Account</option>
            {expenseAccounts.map(a => (
              <option key={a.id} value={a.id}>{a.accountName}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase text-slate-500">Salary Month</label>
          <select
            className="w-full p-2 border border-slate-200 rounded-lg bg-white dark:bg-slate-900 text-xs font-medium outline-none"
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
            className={`text-xs font-semibold h-[38px] dark:bg-slate-900 ${errors.amount ? "border-red-500" : "border-slate-200"}`} 
            placeholder="0.00"
            value={amount} 
            onChange={(e) => { setAmount(e.target.value); setErrors(prev => ({ ...prev, amount: false })); }} 
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase text-slate-500">Narration / Details</label>
        <Input 
          className={`text-xs h-[38px] dark:bg-slate-900 ${errors.description ? "border-red-500" : "border-slate-200"}`} 
          placeholder="Salary description" 
          value={description} 
          onChange={(e) => { setDescription(e.target.value); setErrors(prev => ({ ...prev, description: false })); }} 
        />
      </div>

      <div className="pt-2 flex gap-2 justify-end border-t border-slate-100">
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
          {isSubmitting ? "Processing..." : salaryToEdit ? "Update Salary" : "Disburse Salary"}
        </Button>
      </div>
    </div>
  );
}