import { useState, useEffect } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, Trash2, Book, AlertCircle, CheckCircle2, Save, Paperclip 
} from "lucide-react";
import { toast } from "sonner";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Project Integration Hub
import useProjects from "@/hooks/useProjects";
import { getFiscalYears } from "@/services/accounting/fiscalYearService";
import { getFinanceBooks } from "@/services/accounting/financeBookService";
import { getAccounts as getChartOfAccounts } from "@/services/accounting/accountService";
import { createJournalEntry } from "@/services/accounting/journalService";

const ENTRY_TYPES = [
  { value: "General Journal", label: "General Journal (JV)" },
  { value: "Payment Entry", label: "Payment Entry (PV)" },
  { value: "Receipt Entry", label: "Receipt Entry (RV)" },
  { value: "Adjustment Entry", label: "Adjustment Entry (AJ)" },
  { value: "Opening Balance", label: "Opening Balance (OB)" },
  { value: "Contra Entry", label: "Contra Entry (CE)" }
];

const REF_TYPES = ["None", "Purchase Invoice", "Sales Invoice", "Expense Claim"];

export default function CreateJournalEntry({ isOpen, onClose, refreshEntries, currentUser }) {
  // Soo dhex bixi mashaariicda rasmiga ah ee nidaamkaaga yaalla
  const { projects = [] } = useProjects();
  
  const [fiscalYears, setFiscalYears] = useState([]);
  const [financeBooks, setFinanceBooks] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [validationError, setValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Header Matrix States
  const [header, setHeader] = useState({
    journalNo: "AUTO-GENERATING...",
    date: new Date().toISOString().split("T")[0],
    entryType: "General Journal",
    fiscalYearId: "",
    financeBookId: "",
    description: "",
    status: "Draft", 
    autoReverse: false,
  });

  // Journal Entry Lines Matrix
  const [items, setItems] = useState([
    { accountId: "", accountCode: "", accountName: "", currentBalance: 0, debit: 0, credit: 0, projectId: "none", refType: "None", refId: "", memo: "" },
    { accountId: "", accountCode: "", accountName: "", currentBalance: 0, debit: 0, credit: 0, projectId: "none", refType: "None", refId: "", memo: "" },
  ]);

  // Auto Sequence Generator
  const autoGenerateJournalNo = async (entryType) => {
    const prefix = entryType.split(" ").map(w => w[0]).join("");
    const currentYear = new Date(header.date).getFullYear();
    try {
      const q = query(
        collection(db, "journal_entries"),
        where("entryType", "==", entryType),
        orderBy("journalNo", "desc"),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const lastNo = snapshot.docs[0].data().journalNo;
        const lastSeq = parseInt(lastNo.split("-").pop(), 10);
        if (!isNaN(lastSeq)) {
          const nextSeq = String(lastSeq + 1).padStart(4, "0");
          setHeader(prev => ({ ...prev, journalNo: `${prefix}-${currentYear}-${nextSeq}` }));
          return;
        }
      }
      setHeader(prev => ({ ...prev, journalNo: `${prefix}-${currentYear}-0001` }));
    } catch {
      setHeader(prev => ({ ...prev, journalNo: `${prefix}-${currentYear}-0001` }));
    }
  };

  useEffect(() => {
    if (isOpen) {
      setValidationError("");
      const loadSetupData = async () => {
        try {
          const [fYears, fBooks, coa] = await Promise.all([
            getFiscalYears(), getFinanceBooks(), getChartOfAccounts()
          ]);
          const activeYears = fYears.filter(y => y.status === "Active");
          const activeBooks = fBooks.filter(b => b.status === "Active");
          
          setFiscalYears(activeYears);
          setFinanceBooks(activeBooks);
          setAccounts(coa || []);
          
          if(activeYears.length > 0) setHeader(prev => ({...prev, fiscalYearId: activeYears[0].id}));
          if(activeBooks.length > 0) setHeader(prev => ({...prev, financeBookId: activeBooks[0].id}));
          
          await autoGenerateJournalNo(header.entryType);
        } catch {
          toast.error("Failed to load ERP master setup data.");
        }
      };
      loadSetupData();
    }
  }, [isOpen, header.entryType, header.date]);

  const totalDebit = items.reduce((sum, item) => sum + Number(item.debit || 0), 0);
  const totalCredit = items.reduce((sum, item) => sum + Number(item.credit || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);

  const handleAddItemRow = () => {
    setItems([...items, { accountId: "", accountCode: "", accountName: "", currentBalance: 0, debit: 0, credit: 0, projectId: "none", refType: "None", refId: "", memo: "" }]);
  };

  const handleRemoveItemRow = (index) => {
    if (items.length <= 2) {
      setValidationError("Double-entry standard requires at least 2 account lines.");
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    if (field === "accountId") {
      const selectedAcc = accounts.find(a => a.id === value);
      updatedItems[index].accountId = value;
      updatedItems[index].accountName = selectedAcc ? selectedAcc.accountName : "";
      updatedItems[index].accountCode = selectedAcc ? selectedAcc.accountCode : "";
      updatedItems[index].currentBalance = selectedAcc ? (selectedAcc.openingBalance || 0) : 0; 
    } else {
      updatedItems[index][field] = value;
    }
    setItems(updatedItems);
  };

  const handleKeyDown = (e, index, field) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (index === items.length - 1 && (field === "debit" || field === "credit" || field === "memo")) {
        handleAddItemRow();
      }
    }
  };

  const executeSubmit = async (targetStatus) => {
    setValidationError("");
    if (targetStatus === "Posted" && difference !== 0) {
      setValidationError(`Cannot Post! Debit & Credit must balance. Difference: $${difference.toFixed(2)}`);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const finalPayload = {
        ...header,
        status: targetStatus,
        items: items.map(item => ({
          ...item,
          projectName: item.projectId !== "none" ? (projects.find(p => p.id === item.projectId)?.name || "") : "Direct/No Project"
        })),
        auditTrail: {
          createdBy: currentUser?.name || "System Admin",
          createdAt: new Date().toISOString(),
          postedBy: targetStatus === "Posted" ? (currentUser?.name || "Finance Manager") : null
        }
      };
      await createJournalEntry(finalPayload);
      toast.success(`Journal Entry saved as ${targetStatus}.`);
      handleClose();
      refreshEntries();
    } catch (err) {
      setValidationError(err.message || "Ledger Posting Failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setHeader(prev => ({ ...prev, status: "Draft" }));
    setItems([
      { accountId: "", accountCode: "", accountName: "", currentBalance: 0, debit: 0, credit: 0, projectId: "none", refType: "None", refId: "", memo: "" },
      { accountId: "", accountCode: "", accountName: "", currentBalance: 0, debit: 0, credit: 0, projectId: "none", refType: "None", refId: "", memo: "" },
    ]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="sm:max-w-[1150px] max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg shadow-2xl overflow-y-auto">
        
        {/* HEADER PANEL */}
        <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-[#1e3a8a] dark:text-blue-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Book className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Journal Entry Posting Panel
            </DialogTitle>
            <DialogDescription className="text-[11px] text-slate-400">Enterprise Double-Entry General Ledger Sheet linked with Active Projects.</DialogDescription>
          </div>
          
          <div className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border tracking-widest ${
            header.status === "Posted" ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30" : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30"
          }`}>
            ● {header.status}
          </div>
        </DialogHeader>

        {validationError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900/50 p-2 rounded text-red-700 dark:text-red-400 text-[11px] font-medium mt-1">
            <AlertCircle size={14} className="shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={(e) => e.preventDefault()} className="space-y-3 pt-2">
          
          {/* MASTER CONTROLS MATRIX */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-800/30 p-3 rounded border border-slate-100 dark:border-slate-800/50 text-[11px]">
            <div>
              <label className="font-bold text-slate-500 uppercase block mb-0.5">Journal Number</label>
              <Input value={header.journalNo} readOnly className="h-8 text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-none select-all" />
            </div>
            <div>
              <label className="font-bold text-slate-500 uppercase block mb-0.5">Posting Date</label>
              <Input type="date" value={header.date} onChange={(e) => setHeader({...header, date: e.target.value})} className="h-8 text-xs bg-white dark:bg-slate-900" />
            </div>
            <div>
              <label className="font-bold text-slate-500 uppercase block mb-0.5">Entry Type</label>
              <select value={header.entryType} onChange={(e) => setHeader({...header, entryType: e.target.value})} className="w-full h-8 px-2 bg-white dark:bg-slate-900 border border-input rounded focus:ring-1 focus:ring-blue-500 outline-none appearance-none">
                {ENTRY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-500 uppercase block mb-0.5">Fiscal Year</label>
              <select value={header.fiscalYearId} onChange={(e) => setHeader({...header, fiscalYearId: e.target.value})} className="w-full h-8 px-2 bg-white dark:bg-slate-900 border border-input rounded focus:ring-1 focus:ring-blue-500 outline-none appearance-none">
                {fiscalYears.map(y => <option key={y.id} value={y.id}>{y.yearName}</option>)}
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="font-bold text-slate-500 uppercase block mb-0.5">Narration / Description</label>
              <Input placeholder="E.g., Project allocation expenses and financial adjustment..." value={header.description} onChange={(e) => setHeader({...header, description: e.target.value})} className="h-8 text-xs bg-white dark:bg-slate-900" required />
            </div>
            <div className="flex items-center space-x-2 pt-3 pl-1">
              <Checkbox id="autoReverse" checked={header.autoReverse} onCheckedChange={(checked) => setHeader({...header, autoReverse: !!checked})} />
              <label htmlFor="autoReverse" className="font-bold text-slate-600 dark:text-slate-400 cursor-pointer uppercase text-[10px]">Auto Reverse Entry</label>
            </div>
          </div>

          {/* LEDGER MATRIX TABLE */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden bg-white dark:bg-slate-900 shadow-inner">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[1050px]">
                <thead className="bg-[#1e3a8a] text-white uppercase text-[10px] tracking-wider font-semibold sticky top-0 z-10">
                  <tr>
                    <th className="p-2 w-3/12">Account G/L Chart</th>
                    <th className="p-2 w-1.5/12 text-right">Debit ($)</th>
                    <th className="p-2 w-1.5/12 text-right">Credit ($)</th>
                    <th className="p-2 w-2/12">Connected Project</th>
                    <th className="p-2 w-1.2/12">Ref Type</th>
                    <th className="p-2 w-1.3/12">Reference ID</th>
                    <th className="p-2 w-2/12">Line Memo</th>
                    <th className="p-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {items.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 odd:bg-slate-50/20 dark:odd:bg-slate-900/10 transition-colors">
                      
                      {/* Account Selector */}
                      <td className="p-1.5">
                        <select value={item.accountId} onChange={(e) => handleItemChange(index, "accountId", e.target.value)} required className="w-full h-8 px-1.5 text-xs bg-white dark:bg-slate-800 border border-input rounded focus:ring-1 focus:ring-blue-500 outline-none appearance-none">
                          <option value="">Select Account...</option>
                          {accounts.map(acc => <option key={acc.id} value={acc.id}>[{acc.accountCode}] — {acc.accountName}</option>)}
                        </select>
                        {item.accountId && (
                          <div className="text-[9px] text-blue-600 dark:text-blue-400 font-mono mt-0.5 px-1 flex justify-between">
                            <span>Balance Preview:</span>
                            <span className="font-bold">${Number(item.currentBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                          </div>
                        )}
                      </td>

                      {/* Debit Field */}
                      <td className="p-1.5">
                        <Input type="number" step="0.01" placeholder="0.00" value={item.debit || ""} disabled={Number(item.credit) > 0} onChange={(e) => handleItemChange(index, "debit", e.target.value)} onKeyDown={(e) => handleKeyDown(e, index, "debit")} className="h-8 text-xs font-mono text-right bg-white dark:bg-slate-800 disabled:bg-slate-100 dark:disabled:bg-slate-800/40" />
                      </td>

                      {/* Credit Field */}
                      <td className="p-1.5">
                        <Input type="number" step="0.01" placeholder="0.00" value={item.credit || ""} disabled={Number(item.debit) > 0} onChange={(e) => handleItemChange(index, "credit", e.target.value)} onKeyDown={(e) => handleKeyDown(e, index, "credit")} className="h-8 text-xs font-mono text-right bg-white dark:bg-slate-800 disabled:bg-slate-100 dark:disabled:bg-slate-800/40" />
                      </td>

                      {/* Connected Project Selector - Nadiif No Arrow */}
                      <td className="p-1.5">
                        <select value={item.projectId} onChange={(e) => handleItemChange(index, "projectId", e.target.value)} className="w-full h-8 px-1.5 text-xs bg-white dark:bg-slate-800 border border-input rounded focus:ring-1 focus:ring-blue-500 outline-none appearance-none font-medium text-slate-700 dark:text-slate-300">
                          <option value="none">Direct / No Project Link</option>
                          {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </td>

                      {/* Ref Type */}
                      <td className="p-1.5">
                        <select value={item.refType} onChange={(e) => handleItemChange(index, "refType", e.target.value)} className="w-full h-8 px-1.5 text-xs bg-white dark:bg-slate-800 border border-input rounded focus:ring-1 focus:ring-blue-500 outline-none appearance-none">
                          {REF_TYPES.map(rt => <option key={rt} value={rt}>{rt}</option>)}
                        </select>
                      </td>

                      {/* Ref ID */}
                      <td className="p-1.5">
                        <Input placeholder="e.g. INV-99" value={item.refId} disabled={item.refType === "None"} onChange={(e) => handleItemChange(index, "refId", e.target.value)} className="h-8 text-xs font-mono bg-white dark:bg-slate-800 disabled:bg-slate-50 dark:disabled:bg-slate-800/30" />
                      </td>

                      {/* Memo */}
                      <td className="p-1.5">
                        <Input placeholder="Line memo..." value={item.memo} onChange={(e) => handleItemChange(index, "memo", e.target.value)} onKeyDown={(e) => handleKeyDown(e, index, "memo")} className="h-8 text-xs bg-white dark:bg-slate-800" />
                      </td>

                      {/* Delete Action */}
                      <td className="p-1.5 text-center">
                        <button type="button" onClick={() => handleRemoveItemRow(index)} className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* TOTALS FOOTER */}
            <div className="p-2 bg-slate-50 dark:bg-slate-800/30 flex flex-col sm:flex-row justify-between items-center text-[11px] font-semibold gap-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={handleAddItemRow} className="h-7 text-[10px] border-dashed border-[#1e3a8a] text-[#1e3a8a] dark:text-blue-400 dark:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 font-bold uppercase">
                <Plus size={12} className="mr-1" /> Add Row
              </Button>
              
              <div className="flex flex-wrap items-center justify-end gap-2 font-mono text-[11px]">
                <div className="bg-white dark:bg-slate-900 border px-2.5 py-1 rounded shadow-sm text-slate-700 dark:text-slate-300">
                  Total Debit: <span className="text-blue-600 dark:text-blue-400 font-bold">${totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="bg-white dark:bg-slate-900 border px-2.5 py-1 rounded shadow-sm text-slate-700 dark:text-slate-300">
                  Total Credit: <span className="text-emerald-600 dark:text-emerald-400 font-bold">${totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className={`px-2.5 py-1 rounded shadow-sm border font-bold flex items-center gap-1 ${
                  difference === 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20" : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20"
                }`}>
                  Difference: ${difference.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  {difference === 0 ? " ✅" : " ❌"}
                </div>
              </div>
            </div>
          </div>

          {/* ACTION BAR */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-[10px] text-slate-500 font-bold border-t border-slate-100 dark:border-slate-800">
            
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded cursor-pointer transition-all border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 uppercase">
                <Paperclip size={12} /> Attach Voucher Document
                <input type="file" className="hidden" onChange={() => toast.success("Document attached successfully.")} />
              </label>
            </div>

            <div className="flex items-center gap-4 text-slate-400 font-mono text-[9px]">
              <div>PREPARED BY: <span className="text-slate-600 dark:text-slate-300 font-sans font-bold">{currentUser?.name || "Accountant"}</span></div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClose} className="h-8 text-xs px-3 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800">
                Cancel
              </Button>
              <Button type="button" disabled={isSubmitting} onClick={() => executeSubmit("Draft")} className="h-8 text-xs bg-slate-600 hover:bg-slate-700 text-white font-semibold flex items-center gap-1.5">
                <Save size={13} /> Save Draft
              </Button>
              <Button type="button" disabled={difference !== 0 || isSubmitting} onClick={() => executeSubmit("Posted")} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 flex items-center gap-1.5 shadow-md disabled:opacity-40">
                <CheckCircle2 size={13} /> Post Ledger
              </Button>
            </div>

          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}