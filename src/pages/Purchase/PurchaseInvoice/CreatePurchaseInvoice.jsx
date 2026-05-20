import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Loader2, FileText, Package } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import usePurchaseOrders from "@/hooks/usePurchaseOrders"; 
import { createPurchaseInvoice, updatePurchaseInvoice } from "@/services/purchase/purchaseInvoiceService";

export default function CreatePurchaseInvoice({ isOpen, onClose, refreshPIs, piToEdit }) {
  const { purchaseOrders = [] } = usePurchaseOrders();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // DB Collections Local States
  const [suppliers, setSuppliers] = useState([]);
  const [programs, setPrograms] = useState([]);

  // Form States
  const [selectedPoId, setSelectedPoId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [programId, setProgramId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [poItems, setPoItems] = useState([]); 

  // Soo dhuuq Suppliers iyo Programs
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const supSnap = await getDocs(collection(db, "suppliers"));
        const progSnap = await getDocs(collection(db, "programs"));
        
        setSuppliers(supSnap.docs.map(doc => ({ id: doc.id, name: doc.data().company || doc.data().supplierName || "N/A" })));
        setPrograms(progSnap.docs.map(doc => ({ id: doc.id, name: doc.data().programName || "N/A" })));
      } catch (err) {
        console.error("Error fetching dropdowns:", err);
      }
    };
    if (isOpen) fetchDropdownData();
  }, [isOpen]);

  // Marka PO la doorto (Auto-fill)
  useEffect(() => {
    if (selectedPoId && !piToEdit) {
      const matchedPo = purchaseOrders.find(po => po.id === selectedPoId);
      if (matchedPo) {
        setSupplierId(matchedPo.supplierId || "");
        setProgramId(matchedPo.programId || "");
        setTotalAmount(matchedPo.totalAmount || 0);
        setPoItems(matchedPo.items || []); 
        toast.info(`Xogtii PO ${matchedPo.poNumber} iyo ${matchedPo.items?.length || 0} alaab ah waa la soo raray!`);
      }
    }
  }, [selectedPoId, purchaseOrders, piToEdit]);

  // Edit Mode mise New Mode
  useEffect(() => {
    if (piToEdit) {
      setSelectedPoId(piToEdit.poId || "");
      setSupplierId(piToEdit.supplierId || "");
      setProgramId(piToEdit.programId || "");
      setDueDate(piToEdit.dueDate ? piToEdit.dueDate.split("T")[0] : "");
      setTotalAmount(piToEdit.totalAmount || 0);
      setPoItems(piToEdit.items || []); 
    } else {
      setSelectedPoId("");
      setSupplierId("");
      setProgramId("");
      setDueDate("");
      setTotalAmount(0);
      setPoItems([]);
    }
  }, [piToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPoId || !supplierId || !programId || !dueDate) {
      toast.error("Fadlan buuxi dhammaan xogta muhiimka ah.");
      return;
    }

    setIsSubmitting(true);
    const matchedPoObj = purchaseOrders.find(po => po.id === selectedPoId);
    const matchedSupplier = suppliers.find(s => s.id === supplierId);
    const matchedProgram = programs.find(p => p.id === programId);
    
    const invoiceData = {
      poId: selectedPoId,
      poNumber: matchedPoObj ? matchedPoObj.poNumber : null,
      supplierId,
      supplierName: matchedSupplier ? matchedSupplier.name : "N/A",
      programId,
      program: matchedProgram ? matchedProgram.name : "N/A",
      dueDate,
      totalAmount,
      status: piToEdit ? piToEdit.status : "UNPAID",
      items: poItems // 🌟 Alaabta halkan ayay ku keydsantahay sxb
    };

    try {
      if (piToEdit) {
        await updatePurchaseInvoice(piToEdit.id, invoiceData);
        toast.success("Invoice-ka waa la cusboonaysiiyey!");
      } else {
        await createPurchaseInvoice(invoiceData);
        toast.success("Invoice cusub iyo agabkiisii waa la keydiyey!");
      }
      if (refreshPIs) await refreshPIs();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Khalad ayaa dhacay xilliga keydinta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg flex flex-col overflow-hidden">
        
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="text-xs md:text-sm font-black uppercase tracking-tight flex items-center gap-1.5">
            <FileText className="text-[#1e3a8a] dark:text-blue-500" size={16} />
            {piToEdit ? "Edit Purchase Invoice" : "Create Purchase Invoice"}
          </DialogTitle>
          <DialogDescription className="text-[11px] text-slate-500">
            Link purchase orders and handle vendor financial invoices.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
          
          {/* LINK PO */}
          <div className="flex flex-col gap-0.5">
            <Label className="text-[10px] font-bold uppercase text-slate-500">Link Purchase Order (PO)</Label>
            <Select value={selectedPoId} onValueChange={setSelectedPoId} disabled={!!piToEdit}>
              <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs h-8 shadow-none focus:ring-0">
                <SelectValue placeholder="Select PO" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900">
                {purchaseOrders.filter(po => po.status === "APPROVED").map(po => (
                  <SelectItem key={po.id} value={po.id} className="text-xs">
                    {po.poNumber} - ${po.totalAmount?.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SUPPLIER */}
          <div className="flex flex-col gap-0.5">
            <Label className="text-[10px] font-bold uppercase text-slate-500">Supplier / Vendor</Label>
            <Select value={supplierId} onValueChange={setSupplierId} disabled={!!selectedPoId}>
              <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs h-8 shadow-none focus:ring-0">
                <SelectValue placeholder="Select Supplier" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900">
                {suppliers.map(s => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* PROGRAM */}
          <div className="flex flex-col gap-0.5">
            <Label className="text-[10px] font-bold uppercase text-slate-500">Program / Project</Label>
            <Select value={programId} onValueChange={setProgramId} disabled={!!selectedPoId}>
              <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs h-8 shadow-none focus:ring-0">
                <SelectValue placeholder="Select Program" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900">
                {programs.map(p => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* DUE DATE */}
          <div className="flex flex-col gap-0.5">
            <Label className="text-[10px] font-bold uppercase text-slate-500">Due Date</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs h-8 shadow-none focus:ring-0" required />
          </div>

          {/* SUMMARY BOX */}
          {poItems.length > 0 && (
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 px-2 py-1.5 rounded border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-1">
              <Package size={12} /> {poItems.length} Agab (items) ah ayaa si toos ah looga soo guuriyey PO-da.
            </div>
          )}

          {/* TOTAL AMOUNT */}
          <div className="mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2 flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Grand Total Amount:</span>
            <span className="text-sm font-mono font-black text-blue-600">${totalAmount.toLocaleString()}</span>
          </div>

          <DialogFooter className="gap-1.5 border-t pt-2 mt-1 flex flex-row justify-end w-full">
            <Button type="button" onClick={onClose} disabled={isSubmitting} className="text-xs h-8 px-3 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-none">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="text-xs h-8 px-3 bg-[#1e3a8a] dark:bg-blue-600 text-white border-none cursor-pointer">
              {isSubmitting && <Loader2 size={11} className="animate-spin mr-1" />} Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}