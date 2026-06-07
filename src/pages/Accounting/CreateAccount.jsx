import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FolderTree, Hash, FileText, DollarSign, AlertCircle } from "lucide-react";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

const DETAIL_TYPES_MAP = {
  Assets: ["Bank", "Cash on Hand", "Inventory", "Accounts Receivable", "Fixed Assets", "Prepayments"],
  "Accounts Receivable": ["Customer Accounts", "Donor Pledges", "Employee Advances"],
  Liabilities: ["Accounts Payable", "Accrued Expenses", "Payroll Liabilities", "Tax Payable", "Loan Payable", "Deferred Revenue", "Grants Payable"],
  Equity: ["Retained Earnings", "Accumulated Fund / Capital", "Restricted Net Assets", "Unrestricted Net Assets"],
  Revenue: ["Grant Revenue", "Donations / Contributions", "Program Service Fees", "Other Income"],
  Expenses: ["Salary & Wages", "Program / Project Costs", "Rent & Utilities", "Transport & Travel", "Administrative Expense", "Operational Cost"]
};

const PLACEHOLDERS_MAP = {
  Assets: "E.g., Salaam Bank, Petty Cash, Office Equipment",
  "Accounts Receivable": "E.g., Core Customer Balance, UNHCR Pledge Account",
  Liabilities: "E.g., Supplier Payable, HQ Rent Accrued, Ministry Tax Payable",
  Equity: "E.g., Core Capital Fund, Donor Restricted Reserves",
  Revenue: "E.g., Core Grant Income, Public Donation Revenue",
  Expenses: "E.g., Project Officer Salary, Office Internet, Vehicle Fuel"
};

const ACCOUNT_CATEGORIES = [
  { value: "Assets", label: "Assets (Hanti)", baseCode: 1000, defaultBalance: "Debit" },
  { value: "Accounts Receivable", label: "Accounts Receivable (Macaamiisha)", baseCode: 1200, defaultBalance: "Debit" },
  { value: "Liabilities", label: "Liabilities (Qaamo)", baseCode: 2000, defaultBalance: "Credit" },
  { value: "Equity", label: "Equity (Mala'g / Fund)", baseCode: 3000, defaultBalance: "Credit" },
  { value: "Revenue", label: "Revenue (Dakhli / Grant)", baseCode: 4000, defaultBalance: "Credit" },
  { value: "Expenses", label: "Expenses (Kharash)", baseCode: 5000, defaultBalance: "Debit" },
];

const CURRENCIES = [{ value: "USD", label: "USD ($)" }];
const STATUS_OPTIONS = [{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }];

export default function CreateAccount({ isOpen, onClose, refreshAccounts, accountToEdit, createAccount, updateAccount }) {
  const [detailOptions, setDetailOptions] = useState(DETAIL_TYPES_MAP["Assets"]);
  const [namePlaceholder, setNamePlaceholder] = useState(PLACEHOLDERS_MAP["Assets"]);
  const [validationError, setValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    accountCode: "",
    accountName: "",
    accountType: "Assets",
    detailType: "Bank",
    normalBalance: "Debit",
    openingBalance: "",
    currency: "USD",
    isGroupAccount: false,
    description: "",
    status: "Active",
  });

  useEffect(() => {
    if (isOpen) setValidationError("");
  }, [isOpen]);

  const autoGenerateCode = async (typeValue) => {
    const selectedCategory = ACCOUNT_CATEGORIES.find(t => t.value === typeValue);
    if (!selectedCategory) return;

    try {
      const q = query(
        collection(db, "chart_of_accounts"),
        where("accountType", "==", typeValue),
        orderBy("accountCode", "desc"),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const lastAccount = querySnapshot.docs[0].data();
        const lastCode = parseInt(lastAccount.accountCode, 10);
        
        if (!isNaN(lastCode)) {
          setForm(prev => ({ ...prev, accountCode: (lastCode + 1).toString() }));
          return;
        }
      }
      setForm(prev => ({ ...prev, accountCode: selectedCategory.baseCode.toString() }));
    } catch (error) {
      setForm(prev => ({ ...prev, accountCode: selectedCategory.baseCode.toString() }));
    }
  };

  useEffect(() => {
    if (accountToEdit) {
      setForm({ 
        ...accountToEdit,
        openingBalance: accountToEdit.openingBalance !== undefined && accountToEdit.openingBalance !== null ? accountToEdit.openingBalance.toString() : ""
      });
      setDetailOptions(DETAIL_TYPES_MAP[accountToEdit.accountType] || []);
      setNamePlaceholder(PLACEHOLDERS_MAP[accountToEdit.accountType] || "E.g., Account Name");
    } else {
      setForm({
        accountCode: "",
        accountName: "",
        accountType: "Assets",
        detailType: "Bank",
        normalBalance: "Debit",
        openingBalance: "",
        currency: "USD",
        isGroupAccount: false,
        description: "",
        status: "Active",
      });
      setDetailOptions(DETAIL_TYPES_MAP["Assets"]);
      setNamePlaceholder(PLACEHOLDERS_MAP["Assets"]);
      if (isOpen) {
        autoGenerateCode("Assets");
      }
    }
  }, [accountToEdit, isOpen]);

  const handleCategoryChange = async (e) => {
    const newType = e.target.value;
    const selectedCategory = ACCOUNT_CATEGORIES.find(t => t.value === newType);
    const options = DETAIL_TYPES_MAP[newType] || [];
    const placeholder = PLACEHOLDERS_MAP[newType] || "E.g., Account Name";
    
    setDetailOptions(options);
    setNamePlaceholder(placeholder);
    setForm(prev => ({ 
      ...prev, 
      accountType: newType,
      detailType: options[0] || "",
      normalBalance: selectedCategory ? selectedCategory.defaultBalance : "Debit"
    }));
    
    if (!accountToEdit) {
      await autoGenerateCode(newType);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");
    setIsSubmitting(true);

    if (!form.accountName.trim()) {
      setValidationError("Account Name is required.");
      setIsSubmitting(false);
      return;
    }

    if (!accountToEdit) {
      try {
        const q = query(collection(db, "chart_of_accounts"), where("accountCode", "==", form.accountCode));
        const codeCheck = await getDocs(q);
        if (!codeCheck.empty) {
          setValidationError(`GL Code "${form.accountCode}" is already assigned to another account.`);
          setIsSubmitting(false);
          return;
        }
      } catch (err) {
        console.error("Unique validation check failed:", err);
      }
    }

    const dataToSubmit = {
      ...form,
      openingBalance: form.openingBalance ? parseFloat(form.openingBalance) : 0,
    };

    try {
      if (accountToEdit?.id) {
        await updateAccount(accountToEdit.id, dataToSubmit);
      } else {
        await createAccount(dataToSubmit);
      }
      handleClose();
      refreshAccounts();
    } catch (error) {
      setValidationError("Failed to save transaction: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setValidationError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg shadow-xl overflow-y-auto">
        <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="text-[#1e3a8a] dark:text-blue-400 text-base font-bold uppercase tracking-wider">
            {accountToEdit ? "Edit ERP GL Account" : "Create Enterprise GL Account"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Nidaam xisaabeed hufan oo heerkiisu sareeyo.
          </DialogDescription>
        </DialogHeader>

        {validationError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-900/50 p-3 rounded-md mt-2 text-red-700 dark:text-red-400 text-xs font-medium">
            <AlertCircle size={16} className="shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-4 gap-y-3 pt-3 pb-4">
          <div className="col-span-2 space-y-1 relative z-50">
            <label className="text-xs font-semibold text-slate-500 uppercase">Account Category</label>
            <select
              className="w-full h-10 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-blue-600 outline-none cursor-pointer appearance-none relative"
              value={form.accountType}
              onChange={handleCategoryChange}
            >
              {ACCOUNT_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="col-span-2 sm:col-span-1 space-y-1 relative z-40">
            <label className="text-xs font-semibold text-slate-500 uppercase">Account Code (GL)</label>
            <div className="relative">
              <Hash size={14} className="absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="E.g., 1000"
                className="h-10 pl-9 text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none font-mono"
                value={form.accountCode}
                onChange={(e) => setForm({ ...form, accountCode: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 space-y-1 relative z-40">
            <label className="text-xs font-semibold text-slate-500 uppercase">Account Name</label>
            <div className="relative">
              <FolderTree size={14} className="absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder={namePlaceholder}
                className="h-10 pl-9 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
                value={form.accountName}
                onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 space-y-1 relative z-30">
            <label className="text-xs font-semibold text-slate-500 uppercase">Detail Type</label>
            <select
              className="w-full h-10 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-blue-600 outline-none cursor-pointer appearance-none relative"
              value={form.detailType}
              onChange={(e) => setForm({ ...form, detailType: e.target.value })}
            >
              {detailOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="col-span-2 sm:col-span-1 space-y-1 relative z-30">
            <label className="text-xs font-semibold text-slate-500 uppercase">Normal Balance</label>
            <div className={`h-10 px-3 rounded-md flex items-center text-sm font-semibold border ${
              form.normalBalance === "Debit" 
                ? "bg-blue-50/70 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900" 
                : "bg-emerald-50/70 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900"
            }`}>
              {form.normalBalance === "Debit" ? "Debit Balance (Dr) — Auto" : "Credit Balance (Cr) — Auto"}
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 space-y-1 relative z-20">
            <label className="text-xs font-semibold text-slate-500 uppercase">Opening Balance (Optional)</label>
            <div className="relative">
              <DollarSign size={14} className="absolute left-3 top-3 text-slate-400" />
              <Input
                type="number"
                step="any"
                placeholder="0.00"
                className="h-10 pl-9 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
                value={form.openingBalance}
                onChange={(e) => setForm({ ...form, openingBalance: e.target.value })}
              />
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 space-y-1 relative z-20">
            <label className="text-xs font-semibold text-slate-500 uppercase">Currency</label>
            <select
              className="w-full h-10 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-blue-600 outline-none cursor-pointer appearance-none relative"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            >
              {CURRENCIES.map((cur) => (
                <option key={cur.value} value={cur.value}>{cur.label}</option>
              ))}
            </select>
          </div>

          <div className="col-span-2 sm:col-span-1 space-y-1 relative z-10">
            <label className="text-xs font-semibold text-slate-500 uppercase">Status</label>
            <select
              className="w-full h-10 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-blue-600 outline-none cursor-pointer appearance-none relative"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st.value} value={st.value}>{st.label}</option>
              ))}
            </select>
          </div>

          <div className="col-span-2 flex items-center space-x-2 py-1 relative z-10">
            <Checkbox
              id="isGroupAccount"
              checked={form.isGroupAccount}
              onCheckedChange={(checked) => setForm({ ...form, isGroupAccount: !!checked })}
              className="border-slate-300 dark:border-slate-700"
            />
            <label htmlFor="isGroupAccount" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase cursor-pointer select-none">
              Is Parent / Group Account
            </label>
          </div>

          <div className="col-span-2 space-y-1 relative z-10">
            <label className="text-xs font-semibold text-slate-500 uppercase">Description / Purpose</label>
            <div className="relative">
              <FileText size={16} className="absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="E.g., Designated account for long-term operational liabilities"
                className="h-10 pl-10 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>

          <div className="col-span-2 flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 relative z-10">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting} className="h-9 text-xs border-slate-200 dark:border-slate-700 cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="h-9 text-xs bg-[#1e3a8a] dark:bg-blue-600 hover:bg-[#172554] dark:hover:bg-blue-700 text-white shadow-md border-none transition-all cursor-pointer flex items-center justify-center">
              {isSubmitting ? "Processing..." : accountToEdit ? "Update Account" : "Save Account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}