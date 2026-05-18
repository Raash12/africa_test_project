import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receipt, FileCheck, Layers, UserCircle } from "lucide-react";
import { toast } from "sonner";

import useSuppliers from "@/hooks/useSuppliers";
import usePrograms from "@/hooks/usePrograms";
import useItems from "@/hooks/useItems";
import usePurchaseOrders from "@/hooks/usePurchaseOrders";
import { createPurchaseInvoice } from "@/services/purchase/purchaseInvoiceService";

export default function CreatePurchaseInvoice({ isOpen, onClose, refreshInvoices }) {
  const { suppliers = [] } = useSuppliers();
  const { programs = [] } = usePrograms();
  const { items: availableItems = [] } = useItems();
  const { purchaseOrders = [] } = usePurchaseOrders();

  // Kaliya PO-yada la ansixiyey ayaa Invoice laga dhigi karaa
  const approvedPOs = purchaseOrders.filter(po => po.status === "APPROVED");

  const [selectedPOId, setSelectedPOId] = useState("");
  const [form, setForm] = useState({
    refPoNumber: "",
    refPoId: "",
    supplierId: "",
    programId: "",
    items: [],
    totalAmount: 0,
  });

  const handlePOSelect = (poId) => {
    const selectedPO = approvedPOs.find(po => po.id === poId);
    if (!selectedPO) return;

    setSelectedPOId(poId);
    setForm({
      refPoNumber: selectedPO.poNumber,
      refPoId: selectedPO.id,
      supplierId: selectedPO.supplierId,
      programId: selectedPO.programId,
      items: selectedPO.items || [],
      totalAmount: selectedPO.totalAmount || 0,
    });
    toast.success(`Xogtii ${selectedPO.poNumber} si guul ah ayaa loo soo minguuriyey sxb!`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.refPoId) {
      toast.error("Fadlan horta dooro PO-ga aad rabto sxb!");
      return;
    }

    try {
      await createPurchaseInvoice(form);
      toast.success("Purchase Invoice waa la kaydiyey!");
      
      setForm({
        refPoNumber: "", refPoId: "", supplierId: "", programId: "",
        items: [], totalAmount: 0,
      });
      setSelectedPOId("");
      onClose();
      refreshInvoices();
    } catch (error) {
      toast.error("Wuu guuldarraystay kaydintu.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[500px] w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="text-[#1e3a8a] dark:text-blue-400 text-base font-bold uppercase tracking-wider flex items-center gap-2">
            <Receipt size={18} /> New Purchase Invoice (PI)
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 pt-4">
          
          {/* PULL FROM PO */}
          <div className="space-y-1 bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/40">
            <label className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase flex items-center gap-1">
              <FileCheck size={14} /> Pull From Approved PO
            </label>
            <Select value={selectedPOId} onValueChange={handlePOSelect}>
              <SelectTrigger className="w-full h-10 bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-800 text-sm">
                <SelectValue placeholder="-- Select Approved PO --" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                {approvedPOs.length === 0 ? (
                  <SelectItem value="none" disabled>No approved POs found</SelectItem>
                ) : (
                  approvedPOs.map((po) => (
                    <SelectItem key={po.id} value={po.id} className="font-mono text-xs font-bold">
                      {po.poNumber} - (${po.totalAmount.toLocaleString()})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* SUPPLIER PREVIEW */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Supplier</label>
            <div className="relative">
              <input type="text" disabled className="w-full h-10 px-3 pl-10 text-xs bg-slate-100 dark:bg-slate-800 rounded-md"
                value={suppliers.find(s => s.id === form.supplierId)?.company || "No Supplier Selected"} />
              <UserCircle className="absolute left-3 top-3 text-slate-400" size={15} />
            </div>
          </div>

          {/* PROGRAM PREVIEW */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Project / Program</label>
            <div className="relative">
              <input type="text" disabled className="w-full h-10 px-3 pl-10 text-xs bg-slate-100 dark:bg-slate-800 rounded-md"
                value={programs.find(p => p.id === form.programId)?.programName || "No Program Selected"} />
              <Layers className="absolute left-3 top-3 text-slate-400" size={15} />
            </div>
          </div>

          {/* ITEMS PREVIEW */}
          {form.items.length > 0 && (
            <div className="space-y-2 border-t pt-3">
              <h3 className="text-xs font-bold text-[#1e3a8a] dark:text-blue-400 uppercase">Invoiced Items</h3>
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                {form.items.map((item, index) => {
                  const matchItem = availableItems.find(i => i.id === item.itemId);
                  return (
                    <div key={index} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-2 rounded text-xs">
                      <span>{matchItem ? matchItem.itemName : "Item"} x <b>{item.quantity}</b></span>
                      <span className="font-mono">${item.subTotal?.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* GRAND TOTAL */}
          <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border mt-1">
            <span className="text-xs font-bold uppercase">Grand Total:</span>
            <span className="text-lg font-mono font-black text-[#1e3a8a] dark:text-blue-400">${form.totalAmount.toLocaleString()}</span>
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="h-9 text-xs">Cancel</Button>
            <Button type="submit" disabled={!form.refPoId} className="h-9 text-xs bg-[#1e3a8a] dark:bg-blue-600 text-white shadow-md">
              Save Invoice (PI)
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}