import React, { useState, useEffect } from "react";
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
import usePurchaseInvoices from "@/hooks/usePurchaseInvoices"; 
import useAccounts from "@/hooks/useAccounts";
import { createPurchaseInvoice, updatePurchaseInvoice } from "@/services/purchase/purchaseInvoiceService";

export default function CreatePurchaseInvoice({ isOpen, onClose, refreshPIs, piToEdit }) {
  const { purchaseOrders = [] } = usePurchaseOrders();
  const { purchaseInvoices = [] } = usePurchaseInvoices(); 
  const { accounts = [] } = useAccounts();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // DB Collections Local States
  const [suppliers, setSuppliers] = useState([]);

  // Form States
  const [selectedPoId, setSelectedPoId] = useState("");
  const [supplierId, setSupplierId] = useState(""); 
  const [liabilityAccountId, setLiabilityAccountId] = useState(""); 
  const [inventoryAccountId, setInventoryAccountId] = useState(""); 
  const [dueDate, setDueDate] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [poItems, setPoItems] = useState([]); 

  // Soo dhuuq Suppliers
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const supSnap = await getDocs(collection(db, "suppliers"));
        setSuppliers(supSnap.docs.map(doc => ({ 
          id: doc.id, 
          name: doc.data().company || doc.data().supplierName || "N/A" 
        })));
      } catch (err) {
        console.error("Error fetching suppliers:", err);
      }
    };
    if (isOpen) fetchDropdownData();
  }, [isOpen]);

  // Marka PO la doorto
  useEffect(() => {
    if (selectedPoId && !piToEdit) {
      const matchedPo = purchaseOrders.find(po => po.id === selectedPoId);
      if (matchedPo) {
        setSupplierId(matchedPo.supplierId || "");
        setTotalAmount(matchedPo.totalAmount || 0);
        setPoItems(matchedPo.items || []); 
        toast.success(`Xogtii PO ${matchedPo.poNumber} waa la soo raray.`);
      }
    }
  }, [selectedPoId, purchaseOrders, piToEdit]);

  // Edit Mode mise New Mode
  useEffect(() => {
    if (isOpen) {
      if (piToEdit) {
        setSelectedPoId(piToEdit.poId || "");
        setSupplierId(piToEdit.supplierId || "");
        setLiabilityAccountId(piToEdit.liabilityAccountId || ""); 
        setInventoryAccountId(piToEdit.inventoryAccountId || ""); 
        setDueDate(piToEdit.dueDate ? piToEdit.dueDate.split("T")[0] : "");
        setTotalAmount(piToEdit.totalAmount || 0);
        setPoItems(piToEdit.items || []); 
      } else {
        setSelectedPoId("");
        setSupplierId("");
        setLiabilityAccountId(""); 
        setInventoryAccountId(""); 
        setDueDate("");
        setTotalAmount(0);
        setPoItems([]);
      }
    }
  }, [piToEdit, isOpen]);

  // 🔍 Shaandhee: Koontooyinka Liabilities (Accounts Payable)
  const liabilityAccounts = accounts.filter(acc => {
    const typeUpper = (acc.accountType || acc.type || "").toUpperCase();
    return typeUpper === "LIABILITY" || typeUpper === "LIABILITIES" || typeUpper === "ACCOUNTS_PAYABLE";
  });

  // 🔍 Shaandhee: Koontooyinka Assets (Inventory / Stock Assets)
  const assetAccounts = accounts.filter(acc => {
    const typeUpper = (acc.accountType || acc.type || "").toUpperCase();
    const nameLower = (acc.accountName || "").toLowerCase();
    return typeUpper === "ASSET" || typeUpper === "ASSETS" || typeUpper === "INVENTORY" || nameLower.includes("inventory") || nameLower.includes("stock");
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPoId || !supplierId || !liabilityAccountId || !inventoryAccountId || !dueDate) {
      toast.error("Fadlan buuxi dhammaan xogta (PO, Liability Account, Asset Account & Due Date).");
      return;
    }

    setIsSubmitting(true);
    const matchedPoObj = purchaseOrders.find(po => po.id === selectedPoId);
    const matchedSupplier = suppliers.find(s => s.id === supplierId);
    const matchedLiabilityAcc = accounts.find(a => a.id === liabilityAccountId);
    const matchedInventoryAcc = accounts.find(a => a.id === inventoryAccountId);
    
    const invoiceData = {
      poId: selectedPoId,
      poNumber: matchedPoObj ? matchedPoObj.poNumber : (piToEdit ? piToEdit.poNumber : "N/A"),
      supplierId,
      supplierName: matchedSupplier ? matchedSupplier.name : (piToEdit ? piToEdit.supplierName : "N/A"),
      liabilityAccountId, 
      liabilityAccountName: matchedLiabilityAcc ? matchedLiabilityAcc.accountName : "N/A", 
      inventoryAccountId, 
      inventoryAccountName: matchedInventoryAcc ? matchedInventoryAcc.accountName : "N/A", 
      dueDate,
      totalAmount: Number(totalAmount),
      status: piToEdit ? piToEdit.status : "UNPAID",
      items: poItems,
      fiscalYearId: "FY-2026",      
      financeBookId: "default_book" 
    };

    try {
      if (piToEdit) {
        await updatePurchaseInvoice(piToEdit.id, invoiceData);
        toast.success("Invoice-ka waa la beddelay, Journal-kiina waa la saxay!");
      } else {
        await createPurchaseInvoice(invoiceData);
        toast.success("Invoice-ka waa la keydiyey, Journal Entry-giina waa dhashay!");
      }

      if (refreshPIs) await refreshPIs(); 
      onClose(); 
    } catch (error) {
      console.error("Transaction Error:", error);
      toast.error(error.message || "Khalad ayaa dhacay.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSupplierName = suppliers.find(s => s.id === supplierId)?.name;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-md bg-white p-4 rounded-lg flex flex-col overflow-hidden dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="text-xs md:text-sm font-black uppercase tracking-tight flex items-center gap-1.5">
            <FileText className="text-[#1e3a8a] dark:text-blue-500" size={16} />
            {piToEdit ? "Edit Purchase Invoice" : "Create Purchase Invoice"}
          </DialogTitle>
          <DialogDescription className="text-[11px] text-slate-500">
            Link purchase orders and handle double-entry matching for both inventory and payables.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
          
          {/* LINK PO */}
          <div className="flex flex-col gap-0.5">
            <Label className="text-[10px] font-bold uppercase text-slate-500">Link Purchase Order (PO)</Label>
            <Select value={selectedPoId} onValueChange={setSelectedPoId} disabled={!!piToEdit}>
              <SelectTrigger className="w-full bg-slate-50 border-slate-200 text-xs h-8 dark:bg-slate-950 dark:border-slate-800">
                <SelectValue placeholder="Select PO" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900">
                {piToEdit && (
                  <SelectItem value={piToEdit.poId} className="text-xs">
                    {piToEdit.poNumber || "Current PO"} - ${piToEdit.totalAmount?.toLocaleString()}
                  </SelectItem>
                )}
                {purchaseOrders
                  .filter(po => {
                    if (piToEdit && po.id === piToEdit.poId) return false; 
                    return po.status === "APPROVED" && !purchaseInvoices.some(inv => inv.poId === po.id);
                  })
                  .map(po => (
                    <SelectItem key={po.id} value={po.id} className="text-xs">
                      {po.poNumber} - ${po.totalAmount?.toLocaleString()}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* 🌟 INVENTORY / ASSET ACCOUNT DROP DOWN (WITH DYNAMIC BALANCE) */}
          <div className="flex flex-col gap-0.5">
            <Label className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
              Inventory / Stock Account (Debit)
            </Label>
            <Select value={inventoryAccountId} onValueChange={setInventoryAccountId}>
              <SelectTrigger className="w-full bg-emerald-50/30 border-emerald-200 text-xs h-8 dark:bg-slate-950 dark:border-slate-800">
                <SelectValue placeholder="Select Asset/Inventory Account" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900">
                {assetAccounts.length === 0 ? (
                  <div className="text-center py-2 text-xs text-slate-400">No Asset/Inventory accounts found</div>
                ) : (
                  assetAccounts.map(acc => {
                    const balance = Number(acc.balance || 0);
                    return (
                      <SelectItem key={acc.id} value={acc.id} className="text-xs">
                        {acc.accountName} {acc.accountCode ? `(${acc.accountCode})` : ""} — <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          {/* 🌟 LIABILITY ACCOUNT DROP DOWN (WITH DYNAMIC BALANCE) */}
          <div className="flex flex-col gap-0.5">
            <Label className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">
              Liability Account (Credit / Accounts Payable)
            </Label>
            <Select value={liabilityAccountId} onValueChange={setLiabilityAccountId}>
              <SelectTrigger className="w-full bg-blue-50/30 border-blue-200 text-xs h-8 dark:bg-slate-950 dark:border-slate-800">
                <SelectValue placeholder="Select Liability Account" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900">
                {liabilityAccounts.length === 0 ? (
                  <div className="text-center py-2 text-xs text-slate-400">No liability accounts found</div>
                ) : (
                  liabilityAccounts.map(acc => {
                    const balance = Number(acc.balance || 0);
                    return (
                      <SelectItem key={acc.id} value={acc.id} className="text-xs">
                        {acc.accountName} {acc.accountCode ? `(${acc.accountCode})` : ""} — <span className="font-mono font-bold text-blue-600 dark:text-blue-400">${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          {/* READ-ONLY SUPPLIER INFO */}
          {supplierId && (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded p-2 flex flex-col gap-0.5 dark:bg-slate-950/40 dark:border-slate-800">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Linked Vendor</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{currentSupplierName}</span>
            </div>
          )}

          {/* DUE DATE */}
          <div className="flex flex-col gap-0.5">
            <Label className="text-[10px] font-bold uppercase text-slate-500">Due Date</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="bg-slate-50 border-slate-200 text-xs h-8 dark:bg-slate-950 dark:border-slate-800" required />
          </div>

          {/* TOTAL AMOUNT BOX */}
          <div className="mt-1 bg-slate-50 border border-slate-200 rounded p-2 flex justify-between items-center dark:bg-slate-950 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Grand Total:</span>
            <span className="text-sm font-mono font-black text-blue-600 dark:text-blue-400">${totalAmount.toLocaleString()}</span>
          </div>

          {/* FOOTER ACTIONS */}
          <DialogFooter className="gap-1.5 border-t pt-2 mt-1 flex flex-row justify-end w-full">
            <Button type="button" onClick={onClose} disabled={isSubmitting} className="text-xs h-8 px-3 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="text-xs h-8 px-3 bg-[#1e3a8a] text-white dark:bg-blue-600">
              {isSubmitting && <Loader2 size={11} className="animate-spin" />} Save Invoice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}