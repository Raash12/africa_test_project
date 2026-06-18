import React, { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input"; 
import { Button } from "@/components/ui/button";
import { DollarSign, Wallet, ArrowUpRight, Building2, Landmark, AlertTriangle } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import usePaymentEntry from "@/hooks/usePaymentEntry"; 
import useAccounts from "@/hooks/useAccounts";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function SalaryForm({ accounts: propsAccounts = [], onSuccess, salaryToEdit, onClose }) {
  const { employees = [] } = useEmployees();
  const { addPayment } = usePaymentEntry();
  
  const { accounts: fetchedAccounts } = useAccounts();
  const accounts = propsAccounts.length > 0 ? propsAccounts : fetchedAccounts;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [employeeName, setEmployeeName] = useState(""); 
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
      setEmployeeName(salaryToEdit.employeeName || "");
      setPaidFromAccountId(salaryToEdit.paidFromAccountId || "");
      setChargedToAccountId(salaryToEdit.chargedToAccountId || "");
      setAmount(salaryToEdit.amount || "");
      setMonth(salaryToEdit.month || "June 2026");
      setDescription(salaryToEdit.description || "");
    } else {
      setEmployeeId("");
      setEmployeeName("");
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

  const selectedPaidAccount = accounts.find(a => a.id === paidFromAccountId);
  const selectedChargedAccount = accounts.find(a => a.id === chargedToAccountId);

  // Kani wuxuu cusboonaysiinayaa Narration-ka marka bisha la beddelo iyadoo qof la doortay
  useEffect(() => {
    if (employeeId && employeeName && !salaryToEdit) {
      setDescription(`Salary payment for ${employeeName} - ${month}`);
    }
  }, [month, employeeId, employeeName, salaryToEdit]);

  const handleEmployeeChange = (id) => {
    setEmployeeId(id);
    setErrors((prev) => ({ ...prev, employee: false }));
    
    // Halkan si toos ah ayaan magaca iyo lacagta uga dhex helaynaa liiska shaqaalaha sxb
    const emp = employees.find(e => e.id === id);
    if (emp && !salaryToEdit) {
      const name = emp.fullName || emp.name || "Staff";
      setEmployeeName(name);
      setAmount(emp.salary || "");
      setDescription(`Salary payment for ${name} - ${month}`);
    }
  };

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
        employeeName: employeeName || "Unknown Staff",
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
      
      {/* Shadcn Alert Dialog */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xl">
          <AlertDialogHeader className="flex flex-row items-start gap-3 space-y-0">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-lg text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
              <AlertTriangle size={20} />
            </div>
            <div className="space-y-1 text-left">
              <AlertDialogTitle className="text-base font-bold uppercase text-slate-900 dark:text-slate-100">{alertTitle}</AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{alertDescription}</AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogAction onClick={() => setAlertOpen(false)} className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs py-2 px-4 rounded-lg shadow-sm">
              Dismiss
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Double-Entry Preview Box */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border dark:border-slate-700 rounded-xl space-y-2">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
          <Wallet size={12} /> Expected Double-Entry Impact
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className={`p-2 border rounded-lg text-xs font-semibold ${selectedPaidAccount ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900" : "bg-slate-100 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800"}`}>
            <span className="font-bold bg-red-500 text-white px-1 rounded mr-1 text-[9px]">CR</span>
            <strong>{selectedPaidAccount?.accountName || "-- No Asset Account --"}</strong>
          </div>
          <div className={`p-2 border rounded-lg text-xs font-semibold ${selectedChargedAccount ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900" : "bg-slate-100 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800"}`}>
            <span className="font-bold bg-green-600 text-white px-1 rounded mr-1 text-[9px]">DR</span>
            <strong>{selectedChargedAccount?.accountName || "-- No Expense Account --"}</strong>
          </div>
        </div>
      </div>

      {/* Employee Select */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <DollarSign size={12} /> Select Employee / Shaqaalaha
        </label>
        <Select
          value={employeeId}
          onValueChange={handleEmployeeChange}
        >
          <SelectTrigger className={`w-full text-xs font-medium h-[38px] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 ${errors.employee ? "border-red-500 ring-1 ring-red-500 focus:ring-red-500" : "border-slate-200 dark:border-slate-700 focus:ring-blue-500"}`}>
            <SelectValue placeholder="Choose Employee" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 max-h-[200px] overflow-y-auto">
            {employees.map((e) => (
              <SelectItem key={e.id} value={e.id} className="text-xs text-slate-900 dark:text-slate-100 focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">
                {e.fullName || e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.employee && (
          <p className="text-red-500 text-[10px] font-medium">Fadlan dooro shaqaalaha</p>
        )}
      </div>

      {/* Account Selects */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Landmark size={12} /> Paid From (Asset)
          </label>
          <Select
            value={paidFromAccountId}
            onValueChange={(value) => {
              setPaidFromAccountId(value);
              setErrors((prev) => ({ ...prev, paidFromAccount: false }));
            }}
          >
            <SelectTrigger className={`w-full text-xs font-medium h-[38px] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 ${errors.paidFromAccount ? "border-red-500 ring-1 ring-red-500 focus:ring-red-500" : "border-slate-200 dark:border-slate-700 focus:ring-blue-500"}`}>
              <SelectValue placeholder="Select Bank/Cash" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 max-h-[200px] overflow-y-auto">
              {assetAccounts.map((a) => (
                <SelectItem key={a.id} value={a.id} className="text-xs text-slate-900 dark:text-slate-100">
                  {a.accountName} (${parseFloat(a.balance || 0).toLocaleString()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.paidFromAccount && (
            <p className="text-red-500 text-[10px] font-medium">Fadlan dooro sanduuqa lacagta laga bixiyay</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Building2 size={12} /> Charge Expense To
          </label>
          <Select
            value={chargedToAccountId}
            onValueChange={(value) => {
              setChargedToAccountId(value);
              setErrors((prev) => ({ ...prev, chargedToAccount: false }));
            }}
          >
            <SelectTrigger className={`w-full text-xs font-medium h-[38px] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 ${errors.chargedToAccount ? "border-red-500 ring-1 ring-red-500 focus:ring-red-500" : "border-slate-200 dark:border-slate-700 focus:ring-blue-500"}`}>
              <SelectValue placeholder="Select Expense Account" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 max-h-[200px] overflow-y-auto">
              {expenseAccounts.map((a) => (
                <SelectItem key={a.id} value={a.id} className="text-xs text-slate-900 dark:text-slate-100">
                  {a.accountName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.chargedToAccount && (
            <p className="text-red-500 text-[10px] font-medium">Fadlan dooro expense account-ka saxda ah</p>
          )}
        </div>
      </div>

      {/* Month & Amount */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">Salary Month</label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-full text-xs font-medium h-[38px] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <SelectItem value="May 2026" className="text-xs">May 2026</SelectItem>
              <SelectItem value="June 2026" className="text-xs">June 2026</SelectItem>
              <SelectItem value="July 2026" className="text-xs">July 2026</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">Amount ($)</label>
          <Input 
            type="number" 
            placeholder="0.00"
            value={amount} 
            onChange={(e) => { setAmount(e.target.value); setErrors(prev => ({ ...prev, amount: false })); }} 
            className={`text-xs font-semibold h-[38px] bg-white dark:bg-slate-900 border text-slate-900 dark:text-slate-100 ${errors.amount ? "border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500" : "border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500"}`} 
          />
          {errors.amount && (
            <p className="text-red-500 text-[10px] font-medium">Fadlan geli lacag sax ah</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">Narration / Details</label>
        <Input 
          placeholder="Salary description" 
          value={description} 
          onChange={(e) => { setDescription(e.target.value); setErrors(prev => ({ ...prev, description: false })); }} 
          className={`text-xs h-[38px] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border ${errors.description ? "border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500" : "border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500"}`} 
        />
        {errors.description && (
          <p className="text-red-500 text-[10px] font-medium">Fadlan qor faahfaahinta mushaarka</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-3 flex gap-2 justify-end border-t border-slate-100 dark:border-slate-800">
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose} className="text-xs h-[38px] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
            Cancel
          </Button>
        )}
        <Button 
          type="button"
          disabled={isSubmitting}
          onClick={handleSubmit} 
          className="bg-[#1e3a8a] hover:bg-[#172554] font-bold text-white text-xs h-[38px] px-6 flex items-center gap-2 rounded-lg transition-all shadow-sm" 
        >
          <ArrowUpRight size={14} />
          {isSubmitting ? "Processing..." : salaryToEdit ? "Update Salary" : "Disburse Salary"}
        </Button>
      </div>
    </div>
  );
}