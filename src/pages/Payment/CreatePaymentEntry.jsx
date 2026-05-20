// components/purchase/CreatePaymentEntry.jsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, updateDoc, addDoc } from "firebase/firestore";

export default function CreatePaymentEntry({ isOpen, onClose, refreshPayments }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);

  // Form States
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [referenceNo, setReferenceNo] = useState("");

  // 1. Soo dhuuq kaliya Purchase Invoices-ka UNPAID/OVERDUE ah
  useEffect(() => {
    const fetchUnpaidInvoices = async () => {
      try {
        const q = query(
          collection(db, "purchase_invoices"), 
          where("status", "in", ["UNPAID", "OVERDUE"])
        );
        const snap = await getDocs(q);
        
        setUnpaidInvoices(snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })));
      } catch (err) {
        console.error("Error fetching unpaid invoices:", err);
      }
    };
    if (isOpen) fetchUnpaidInvoices();
  }, [isOpen]);

  // 2. MARKA INVOICE LA DOORTO -> SI AUTO AH U FILL GAREE LACAGTA (totalAmount)
  useEffect(() => {
    if (selectedInvoiceId) {
      const matchedInvoice = unpaidInvoices.find(inv => inv.id === selectedInvoiceId);
      if (matchedInvoice) {
        // Waxay toos u soo dhuuqaysaa Grand Total-kii (Subtotal - Discount)
        setAmountPaid(matchedInvoice.totalAmount || "");
        toast.info(`Lacagta Invoice-ka ($${matchedInvoice.totalAmount?.toLocaleString()}) waa la soo buuxiyey.`);
      }
    } else {
      setAmountPaid(""); // Haddi laga reebo doorashada, meeshu ha murnaato
    }
  }, [selectedInvoiceId, unpaidInvoices]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoiceId || !paymentDate || !amountPaid || !paymentMethod) {
      toast.error("Fadlan buuxi dhammaan meelaha muhiimka ah.");
      return;
    }

    const matchedInvoice = unpaidInvoices.find(inv => inv.id === selectedInvoiceId);
    if (!matchedInvoice) return;

    const parseAmount = parseFloat(amountPaid);
    
    // Hubinta lacagta
    if (parseAmount <= 0 || parseAmount > matchedInvoice.totalAmount) {
      toast.error(`Lacagtu kama badnaan karto wadarta Invoice-ka ($${matchedInvoice.totalAmount})`);
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Keydi xogta Payment-ka gudaha "payment_entries"
      await addDoc(collection(db, "payment_entries"), {
        invoiceId: selectedInvoiceId,
        invoiceNumber: matchedInvoice.invoiceNumber,
        supplierName: matchedInvoice.supplierName || "N/A",
        paymentDate,
        amountPaid: parseAmount,
        paymentMethod,
        referenceNo: referenceNo || "N/A",
        createdAt: new Date().toISOString()
      });

      // 2. Invoice-kii la bixiyey status-kiisa ka dhig "PAID"
      const invoiceRef = doc(db, "purchase_invoices", selectedInvoiceId);
      await updateDoc(invoiceRef, {
        status: "PAID"
      });

      toast.success(`Lacagta Invoice ${matchedInvoice.invoiceNumber} waa la diiwangeliyey!`);
      
      if (refreshPayments) await refreshPayments();
      
      // Clear States
      setSelectedInvoiceId("");
      setPaymentDate("");
      setAmountPaid("");
      setPaymentMethod("");
      setReferenceNo("");
      onClose();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Wuu guuldarraystay keydinta lacag bixintu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg flex flex-col overflow-hidden">
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="text-xs md:text-sm font-black uppercase tracking-tight flex items-center gap-1.5">
            <DollarSign className="text-[#1e3a8a] dark:text-blue-500" size={16} /> Record Payment Entry
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
          
          {/* SELECT INVOICE */}
          <div className="flex flex-col gap-0.5">
            <Label className="text-[10px] font-bold uppercase text-slate-500">Select Invoice</Label>
            <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
              <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs h-8">
                <SelectValue placeholder="Choose Pending Invoice" />
              </SelectTrigger>
              <SelectContent>
                {unpaidInvoices.length === 0 ? (
                  <div className="p-2 text-xs text-slate-400 italic text-center">Ma jiraan Invoice-yo pending ah sxb</div>
                ) : (
                  unpaidInvoices.map(inv => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} - {inv.supplierName} (${inv.totalAmount?.toLocaleString()})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* PAYMENT DATE */}
          <div className="flex flex-col gap-0.5">
            <Label className="text-[10px] font-bold uppercase text-slate-500">Payment Date</Label>
            <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs h-8" required />
          </div>

          {/* AMOUNT PAID (AUTO-FILLED) */}
          <div className="flex flex-col gap-0.5">
            <Label className="text-[10px] font-bold uppercase text-slate-500">Amount Paid ($)</Label>
            <Input 
              type="number" 
              step="any" 
              placeholder="0.00" 
              value={amountPaid} 
              onChange={(e) => setAmountPaid(e.target.value)} 
              className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs h-8 font-mono font-bold text-blue-600 dark:text-blue-400" 
              required 
            />
          </div>

          {/* PAYMENT METHOD */}
          <div className="flex flex-col gap-0.5">
            <Label className="text-[10px] font-bold uppercase text-slate-500">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs h-8">
                <SelectValue placeholder="Select Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="E_SHILLING">E-Shilling (Zaad / Sahal)</SelectItem>
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