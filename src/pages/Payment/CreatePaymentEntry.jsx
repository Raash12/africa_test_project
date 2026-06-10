import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, DollarSign, Landmark, FileText } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, updateDoc, addDoc, runTransaction } from "firebase/firestore";

export default function CreatePaymentEntry({ isOpen, onClose, refreshPayments }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [assetAccounts, setAssetAccounts] = useState([]); 
  const [expenseAccounts, setExpenseAccounts] = useState([]); 

  // Form States
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [fromAccountId, setFromAccountId] = useState(""); 
  const [expenseAccountId, setExpenseAccountId] = useState(""); 
  const [paymentDate, setPaymentDate] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [referenceNo, setReferenceNo] = useState("");

  // 1. Soo dhuuq Invoices, Asset Accounts, iyo Expense Accounts marka foomku furmo
  useEffect(() => {
    const fetchUnpaidInvoices = async () => {
      try {
        const q = query(collection(db, "purchase_invoices"), where("status", "in", ["UNPAID", "OVERDUE"]));
        const snap = await getDocs(q);
        setUnpaidInvoices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching invoices:", err);
      }
    };

    const fetchChartOfAccounts = async () => {
      try {
        const snap = await getDocs(collection(db, "chart_of_accounts"));
        const allAccounts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Sxb, halkan waxaan si taxadar leh ugu kala saaraynaa Assets iyo Expenses haba ahaadeen xarfo waaweyn ama yar-yar
        const assets = allAccounts.filter(acc => 
          acc.category?.toUpperCase() === "ASSETS" || acc.accountType?.toUpperCase() === "ASSETS"
        );
        const expenses = allAccounts.filter(acc => 
          acc.category?.toUpperCase() === "EXPENSES" || acc.accountType?.toUpperCase() === "EXPENSES"
        );

        setAssetAccounts(assets);
        setExpenseAccounts(expenses);
      } catch (err) {
        console.error("Error fetching accounts:", err);
      }
    };

    if (isOpen) {
      fetchUnpaidInvoices();
      fetchChartOfAccounts();
    }
  }, [isOpen]);

  // 2. Marka Invoice la doorto -> Auto-fill Amount iyo Expense Account
  useEffect(() => {
    if (selectedInvoiceId) {
      const matchedInvoice = unpaidInvoices.find(inv => inv.id === selectedInvoiceId);
      if (matchedInvoice) {
        setAmountPaid(matchedInvoice.totalAmount || "");
        // Haddii invoice-ku uu wato expenseAccountId, si toos ah u dooro Rent Account field-ka
        if (matchedInvoice.expenseAccountId) {
          setExpenseAccountId(matchedInvoice.expenseAccountId);
        }
      }
    } else {
      setAmountPaid("");
      setExpenseAccountId("");
    }
  }, [selectedInvoiceId, unpaidInvoices]);

  // 3. FULINTA DOUBLE-ENTRY TRANSACTION (MARKA BADHANKA LA GUJISO)
const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoiceId || !fromAccountId || !expenseAccountId || !paymentDate || !amountPaid || !paymentMethod) {
      toast.error("Fadlan buuxi dhammaan meelaha muhiimka ah sxb.");
      return;
    }

    const matchedInvoice = unpaidInvoices.find(inv => inv.id === selectedInvoiceId);
    if (!matchedInvoice) return;

    const parseAmount = parseFloat(String(amountPaid).replace(/[^0-9.-]/g, ""));
    setIsSubmitting(true);

    try {
      await runTransaction(db, async (transaction) => {
        const fromAccountRef = doc(db, "chart_of_accounts", fromAccountId);
        const expenseAccountRef = doc(db, "chart_of_accounts", expenseAccountId);

        const fromAccSnap = await transaction.get(fromAccountRef);
        const expenseAccSnap = await transaction.get(expenseAccountRef);

        if (!fromAccSnap.exists()) throw new Error("Asset account-ka lama helin!");
        if (!expenseAccSnap.exists()) throw new Error("Expense account-ka lama helin!");

        const currentFromBalance = parseFloat(fromAccSnap.data().balance || 0);
        const currentExpenseBalance = parseFloat(expenseAccSnap.data().balance || 0);

        // Perform Account Updates
        transaction.update(fromAccountRef, { balance: Number((currentFromBalance - parseAmount).toFixed(2)) });
        transaction.update(expenseAccountRef, { balance: Number((currentExpenseBalance + parseAmount).toFixed(2)) });

        // Add Journal Entry
        const journalRef = doc(collection(db, "journal_entries"));
        transaction.set(journalRef, {
          date: paymentDate,
          fiscalYear: new Date(paymentDate).getFullYear().toString(),
          description: `Payment for Invoice: ${matchedInvoice.invoiceNumber} to ${matchedInvoice.supplierName}`,
          entries: [
            { 
              accountId: expenseAccountId, 
              accountName: expenseAccSnap.data().accountName, // Fixed variable name here
              debit: parseAmount, 
              credit: 0 
            },
            { 
              accountId: fromAccountId, 
              accountName: fromAccSnap.data().accountName, // Fixed variable name here
              debit: 0, 
              credit: parseAmount 
            }
          ],
          createdAt: new Date().toISOString()
        });

        // Update Invoice
        const invoiceRef = doc(db, "purchase_invoices", selectedInvoiceId);
        transaction.update(invoiceRef, { status: "PAID" });

        // Keydi rasiidka rasmiga ah
        const paymentRef = doc(collection(db, "payment_entries"));
        transaction.set(paymentRef, {
          invoiceId: selectedInvoiceId,
          journalEntryId: journalRef.id,
          invoiceNumber: matchedInvoice.invoiceNumber,
          supplierName: matchedInvoice.supplierName || "N/A",
          fromAccountId,
          expenseAccountId, 
          paymentDate,
          amountPaid: parseAmount,
          paymentMethod,
          referenceNo: referenceNo || "N/A",
          createdAt: new Date().toISOString()
        });
      });

      toast.success("Double-Entry-gii waa uu guulaystay sxb!");
      if (refreshPayments) await refreshPayments();
      
      // Clear States
      setSelectedInvoiceId("");
      setFromAccountId("");
      setExpenseAccountId("");
      setPaymentDate("");
      setAmountPaid("");
      setPaymentMethod("");
      setReferenceNo("");
      onClose();
    } catch (error) {
      console.error("Transaction error:", error);
      toast.error("Guuldarro: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* onInteractOutside waxay joojinaysaa freeze-ka Radix UI */}
      <DialogContent onInteractOutside={(e) => e.preventDefault()} className="w-[95vw] sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg flex flex-col overflow-hidden">
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="text-xs md:text-sm font-black uppercase tracking-tight flex items-center gap-1.5">
            <DollarSign className="text-[#1e3a8a] dark:text-blue-500" size={16} /> Record Payment Entry
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
          
          {/* SELECT INVOICE */}
          <div className="flex flex-col gap-0.5">
            <Label className="text-[10px] font-bold uppercase text-slate-500">Select Invoice</Label>
            <Select modal={false} value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
              <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs h-8">
                <SelectValue placeholder="Choose Pending Invoice" />
              </SelectTrigger>
              <SelectContent>
                {unpaidInvoices.map(inv => (
                  <SelectItem key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} - {inv.supplierName} (${inv.totalAmount?.toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* PAID FROM (BANK/CASH) */}
          <div className="flex flex-col gap-0.5">
            <Label className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
              <Landmark size={10} /> Paid From (Bank/Cash)
            </Label>
            <Select modal={false} value={fromAccountId} onValueChange={setFromAccountId}>
              <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs h-8">
                <SelectValue placeholder="Select Asset Account" />
              </SelectTrigger>
              <SelectContent>
                {assetAccounts.map(acc => (
                  <SelectItem key={acc.id} value={acc.id}>
                    [{acc.accountCode || "Asset"}] {acc.accountName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* EXPENSE ACCOUNT FIELD (RENT & UTILITIES) - FIELD-KII REER GALKA AHAA! */}
          <div className="flex flex-col gap-0.5">
            <Label className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
              <FileText size={10} /> Expense Account (To Account)
            </Label>
            <Select modal={false} value={expenseAccountId} onValueChange={setExpenseAccountId}>
              <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs h-8">
                <SelectValue placeholder="Select Expense Account" />
              </SelectTrigger>
              <SelectContent>
                {expenseAccounts.map(acc => (
                  <SelectItem key={acc.id} value={acc.id}>
                    [{acc.accountCode || "Expense"}] {acc.accountName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* PAYMENT DATE */}
          <div className="flex flex-col gap-0.5">
            <Label className="text-[10px] font-bold uppercase text-slate-500">Payment Date</Label>
            <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs h-8" required />
          </div>

          {/* AMOUNT PAID */}
          <div className="flex flex-col gap-0.5">
            <Label className="text-[10px] font-bold uppercase text-slate-500">Amount Paid ($)</Label>
            <Input type="number" step="any" placeholder="0.00" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs h-8 font-mono font-bold text-blue-600 dark:text-blue-400" required />
          </div>

          {/* PAYMENT METHOD */}
          <div className="flex flex-col gap-0.5">
            <Label className="text-[10px] font-bold uppercase text-slate-500">Payment Method</Label>
            <Select modal={false} value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs h-8">
                <SelectValue placeholder="Select Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="E_SHILLING">E-Shilling (Zaad/Sahal)</SelectItem>
                <SelectItem value="CHEQUE">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* REFERENCE NO */}
          <div className="flex flex-col gap-0.5">
            <Label className="text-[10px] font-bold uppercase text-slate-500">Reference / Txn No</Label>
            <Input type="text" placeholder="E.g. Ref-99018" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs h-8" />
          </div>

          <DialogFooter className="gap-1.5 border-t pt-2 mt-1 flex flex-row justify-end w-full">
            <Button type="button" onClick={onClose} disabled={isSubmitting} className="text-xs h-8 px-3 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-none">Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="text-xs h-8 px-3 bg-[#1e3a8a] dark:bg-blue-600 text-white border-none cursor-pointer">
              {isSubmitting && <Loader2 size={11} className="animate-spin mr-1" />} Save Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}