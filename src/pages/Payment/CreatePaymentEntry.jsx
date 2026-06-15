// components/CreatePaymentEntry.jsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, DollarSign, Landmark, FileText, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, runTransaction } from "firebase/firestore";

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

  // Alert Dialog States
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  // 1. Data Fetching
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

  // 2. Auto-fill logic
  useEffect(() => {
    if (selectedInvoiceId) {
      const matchedInvoice = unpaidInvoices.find(inv => inv.id === selectedInvoiceId);
      if (matchedInvoice) {
        setAmountPaid(matchedInvoice.totalAmount || "");
        if (matchedInvoice.expenseAccountId) {
          setExpenseAccountId(matchedInvoice.expenseAccountId);
        }
      }
    } else {
      setAmountPaid("");
      setExpenseAccountId("");
    }
  }, [selectedInvoiceId, unpaidInvoices]);

  // 3. TRANSACTION ENGINE
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

        // Total Balance = Opening Balance + New Arrivals
        const currentFromBalance = parseFloat(fromAccSnap.data().balance || 0);
        const currentExpenseBalance = parseFloat(expenseAccSnap.data().balance || 0);

        // Validation Check
        if (currentFromBalance < parseAmount) {
          throw new Error(`INSUFFICIENT_FUNDS|Waan ka xumahay, lacagta koontada ${fromAccSnap.data().accountName} kuma filna bixintan. Waxaad haysataa wadarta: $${currentFromBalance.toLocaleString()}. Fadlan hubi opening balance-ka iyo dhaqdhaqaaqa kale.`);
        }

        // Account Updates
        transaction.update(fromAccountRef, { balance: Number((currentFromBalance - parseAmount).toFixed(2)) });
        transaction.update(expenseAccountRef, { balance: Number((currentExpenseBalance + parseAmount).toFixed(2)) });

        // Journal Entry
        const journalRef = doc(collection(db, "journal_entries"));
        transaction.set(journalRef, {
          date: paymentDate,
          fiscalYear: new Date(paymentDate).getFullYear().toString(),
          description: `Payment for Invoice: ${matchedInvoice.invoiceNumber} to ${matchedInvoice.supplierName}`,
          entries: [
            { accountId: expenseAccountId, accountName: expenseAccSnap.data().accountName, debit: parseAmount, credit: 0 },
            { accountId: fromAccountId, accountName: fromAccSnap.data().accountName, debit: 0, credit: parseAmount }
          ],
          createdAt: new Date().toISOString()
        });

        // Update Invoice
        transaction.update(doc(db, "purchase_invoices", selectedInvoiceId), { status: "PAID" });

        // Payment Entry
        transaction.set(doc(collection(db, "payment_entries")), {
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

      toast.success("Payment recorded successfully!");
      if (refreshPayments) await refreshPayments();
      
      // Reset
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
      if (error.message && error.message.startsWith("INSUFFICIENT_FUNDS|")) {
        setAlertMessage(error.message.split("|")[1]);
        setIsAlertOpen(true);
      } else {
        toast.error("Guuldarro ayaa dhacday, fadlan isku day markale!");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg flex flex-col overflow-hidden">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="text-xs md:text-sm font-black uppercase tracking-tight flex items-center gap-1.5">
              <DollarSign className="text-[#1e3a8a] dark:text-blue-500" size={16} /> Record Payment Entry
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
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

            <div className="flex flex-col gap-0.5">
              <Label className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                <Landmark size={10} /> Paid From (Total Balance: Available)
              </Label>
              <Select modal={false} value={fromAccountId} onValueChange={setFromAccountId}>
                <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs h-8">
                  <SelectValue placeholder="Select Account" />
                </SelectTrigger>
                <SelectContent>
                  {assetAccounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.accountName} (Total: ${acc.balance?.toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                      {acc.accountName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-0.5">
              <Label className="text-[10px] font-bold uppercase text-slate-500">Payment Date</Label>
              <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs h-8" required />
            </div>

            <div className="flex flex-col gap-0.5">
              <Label className="text-[10px] font-bold uppercase text-slate-500">Amount Paid ($)</Label>
              <Input type="number" step="any" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs h-8" required />
            </div>

            <div className="flex flex-col gap-0.5">
              <Label className="text-[10px] font-bold uppercase text-slate-500">Payment Method</Label>
              <Select modal={false} value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs h-8">
                  <SelectValue placeholder="Select Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="E_SHILLING">E-Shilling</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-0.5">
              <Label className="text-[10px] font-bold uppercase text-slate-500">Reference No</Label>
              <Input type="text" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs h-8" />
            </div>

            <DialogFooter className="gap-1.5 border-t pt-2 mt-1">
              <Button type="button" onClick={onClose} disabled={isSubmitting} className="text-xs h-8 px-3 bg-slate-100 text-slate-800">Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="text-xs h-8 px-3 bg-[#1e3a8a] text-white">
                {isSubmitting ? <Loader2 size={11} className="animate-spin" /> : "Save Payment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="w-[90vw] sm:max-w-sm rounded-lg border border-red-200 bg-white p-5">
          <AlertDialogHeader className="flex flex-col items-center justify-center text-center gap-2">
            <div className="p-2.5 bg-red-50 rounded-full text-red-600">
              <AlertTriangle size={24} />
            </div>
            <AlertDialogTitle className="text-sm font-black text-red-600 uppercase">Balance Alert!</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-600 leading-relaxed font-medium">
              {alertMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex w-full justify-center">
            <AlertDialogAction asChild>
              <Button onClick={() => setIsAlertOpen(false)} className="w-full text-xs h-8 bg-red-600 hover:bg-red-700 text-white font-bold rounded">
                Gartay Sxb
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}