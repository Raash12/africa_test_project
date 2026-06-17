import { useEffect, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  X, 
  DollarSign, 
  Wallet, 
  ArrowUpRight, 
  Building2, 
  Landmark,
  AlertTriangle 
} from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { useSalary } from "@/hooks/useSalary"; 
import { toast } from "sonner";

export default function SalaryForm({ isOpen, onClose, refresh, salaryToEdit }) {
  if (!isOpen) return null;

  const { employees = [] } = useEmployees();
  // Hubi in hook-gaaga useSalary uu u soo dirayo addPaymentEntry koodka 'payment_entries'
  const { accounts = [], addPaymentEntry } = useSalary();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
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
      a?.accountType?.toLowerCase().includes("receivable") ||
      a?.category?.toLowerCase().includes("asset")
    );
  }, [accounts]);

  const expenseAccounts = useMemo(() => {
    return (accounts || []).filter(a => 
      a?.accountType?.toLowerCase().includes("expense") || 
      a?.accountType?.toLowerCase().includes("cost") ||
      a?.category?.toLowerCase().includes("expense")
    );
  }, [accounts]);

  useEffect(() => {
    if (salaryToEdit) {
      setSelectedEmployeeId(salaryToEdit.employeeId || "");
      setPaidFromAccountId(salaryToEdit.paidFromAccountId || "");
      setChargedToAccountId(salaryToEdit.chargedToAccountId || "");
      setAmount(salaryToEdit.amount || "");
      setMonth(salaryToEdit.month || "June 2026");
      setDescription(salaryToEdit.description || "");
    } else {
      if (assetAccounts.length > 0 && !paidFromAccountId) {
        const defaultSalaam = assetAccounts.find(a => a?.accountName?.toLowerCase().includes("salaam"));
        setPaidFromAccountId(defaultSalaam ? defaultSalaam.id : assetAccounts[0].id);
      }
      if (expenseAccounts.length > 0 && !chargedToAccountId) {
        const defaultSalary = expenseAccounts.find(a => a?.accountName?.toLowerCase().includes("salary"));
        setChargedToAccountId(defaultSalary ? defaultSalary.id : expenseAccounts[0].id);
      }
    }
  }, [salaryToEdit, assetAccounts, expenseAccounts, isOpen]);

  useEffect(() => {
    if (selectedEmployeeId && !salaryToEdit) {
      const emp = employees.find(e => e.id === selectedEmployeeId);
      if (emp) {
        setAmount(emp.salary || "");
        setDescription(`Salary payment for ${month} - ${emp.fullName}`);
      }
    }
  }, [selectedEmployeeId, month, employees, salaryToEdit]);

  const selectedPaidAccount = accounts.find(a => a.id === paidFromAccountId);
  const selectedChargedAccount = accounts.find(a => a.id === chargedToAccountId);

  const handleSubmit = async () => {
    // Validate
    if (!paidFromAccountId || !chargedToAccountId || !selectedEmployeeId || !amount) {
      return toast.error("Please fill in all the required fields.");
    }
    
    const parsedAmount = parseFloat(amount);

    if (!salaryToEdit && selectedPaidAccount && parseFloat(selectedPaidAccount.balance || 0) < parsedAmount) {
      setAlertTitle("Insufficient Funds");
      setAlertDescription(`The account ${selectedPaidAccount.accountName} has insufficient balance.`);
      setAlertOpen(true);
      return;
    }

    try {
      setIsSubmitting(true);
      const emp = employees.find(e => e.id === selectedEmployeeId);

      // Halkan magaca collection-ka waa 'payment_entries'
      await addPaymentEntry({
        id: salaryToEdit?.id || null, 
        amount: parsedAmount,
        paidFromAccountId,
        chargedToAccountId,
        description,
        month,
        category: "Salary",
        employeeId: selectedEmployeeId,
        employeeName: emp?.fullName || salaryToEdit?.employeeName || ""
      });

      toast.success("Salary transaction processed successfully.");
      if (refresh) await refresh();
      onClose();
    } catch (err) {
      toast.error("Failed to process transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent className="max-w-md rounded-xl p-5 shadow-2xl border border-slate-100">
          <AlertDialogHeader className="flex flex-row items-start gap-3 space-y-0">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600 shrink-0 mt-0.5">
              <AlertTriangle size={20} />
            </div>
            <div className="space-y-1 text-left">
              <AlertDialogTitle className="text-base font-bold text-slate-900 uppercase tracking-tight">{alertTitle}</AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-slate-600 font-medium leading-relaxed">{alertDescription}</AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 pt-2">
            <AlertDialogAction onClick={() => setAlertOpen(false)} className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 px-4 rounded-lg shadow-sm">
              Dismiss
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div>
            <h1 className="text-lg font-bold uppercase tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
              <DollarSign className="text-[#1e3a8a]" size={20} /> {salaryToEdit ? "Edit Salary Entry" : "Process Payroll"}
            </h1>
            <p className="text-xs text-slate-500">Double-Entry Salary Expenses (JE & GL)</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* EXPECTED LEDGER IMPACT */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Wallet size={12} /> Expected Double-Entry Impact
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-lg text-red-700 dark:text-red-400">
                <span className="font-bold bg-red-500 text-white px-1 rounded mr-1 text-[9px]">CR</span>
                <strong>{selectedPaidAccount?.accountName || "-- No Asset Selected --"}</strong> 
                {selectedPaidAccount && <span className="block text-[10px] text-slate-500 mt-0.5">Balance: ${parseFloat(selectedPaidAccount?.balance || 0).toLocaleString()}</span>}
              </div>
              <div className="p-2 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 rounded-lg text-green-700 dark:text-green-400">
                <span className="font-bold bg-green-600 text-white px-1 rounded mr-1 text-[9px]">DR</span>
                <strong>{selectedChargedAccount?.accountName || "-- No Expense Selected --"}</strong>
                {selectedChargedAccount && <span className="block text-[10px] text-slate-500 mt-0.5">Type: {selectedChargedAccount?.accountType || selectedChargedAccount?.category}</span>}
              </div>
            </div>
          </div>

          {/* ACCOUNTS SELECTION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-1">
                <Landmark size={12} /> Paid From (Asset)
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
                <Building2 size={12} /> Charged To (Expense)
              </label>
              <select
                className={`w-full p-2 border rounded-lg bg-white dark:bg-slate-900 text-xs font-medium outline-none shadow-sm focus:ring-1 focus:ring-[#1e3a8a] ${errors.chargedToAccount ? "border-red-500" : "border-slate-200 dark:border-slate-800"}`}
                value={chargedToAccountId}
                onChange={(e) => { setChargedToAccountId(e.target.value); setErrors(prev => ({ ...prev, chargedToAccount: false })); }}
              >
                <option value="" disabled>Select Expense Account</option>
                {expenseAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.accountCode || "5000"} - {a.accountName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* SELECT EMPLOYEE */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase text-slate-500">Select Employee</label>
            <select
              className={`w-full p-2 border rounded-lg bg-white dark:bg-slate-900 text-xs font-medium outline-none shadow-sm focus:ring-1 focus:ring-[#1e3a8a] ${errors.employee ? "border-red-500" : "border-slate-200 dark:border-slate-800"}`}
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              disabled={!!salaryToEdit} 
            >
              <option value="">-- Choose Employee --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.fullName} (Salary: ${parseFloat(emp.salary || 0).toLocaleString()})</option>
              ))}
            </select>
          </div>

          {/* MONTH & AMOUNT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-slate-500">Salary Month</label>
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
                className={`text-xs font-semibold h-[38px] ${errors.amount ? "border-red-500" : "border-slate-200 dark:border-slate-800"}`} 
                value={amount} 
                onChange={(e) => { setAmount(e.target.value); setErrors(prev => ({ ...prev, amount: false })); }} 
              />
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase text-slate-500">Description / Remarks</label>
            <Input 
              className={`text-xs h-[38px] ${errors.description ? "border-red-500" : "border-slate-200 dark:border-slate-800"}`} 
              value={description} 
              onChange={(e) => { setDescription(e.target.value); setErrors(prev => ({ ...prev, description: false })); }} 
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-2 flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose} className="text-xs h-[38px]">Cancel</Button>
            <Button 
              type="button"
              className="bg-[#1e3a8a] hover:bg-[#172554] font-bold text-white text-xs h-[38px] px-6 flex items-center gap-2 rounded-lg" 
              onClick={handleSubmit} 
              disabled={isSubmitting}
            >
              <ArrowUpRight size={14} />
              {isSubmitting ? "Processing..." : salaryToEdit ? "Update Entry" : "Execute Payment"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}