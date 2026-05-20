import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; 
import { SlidersHorizontal, Package, FileText } from "lucide-react";
import { adjustStock } from "@/services/inventory/stockAdjustmentService";
import { toast } from "sonner";

export default function CreateAdjustment({ isOpen, onClose, stockItems = [], refreshData }) {
  const [form, setForm] = useState({
    stockInDocId: "", 
    itemId: "",      
    adjustmentType: "Addition",
    quantity: "",
    notes: "",
    availableQty: 0,
    selectedItemName: "",
    warehouseName: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const selectedInvoice = useMemo(() => {
    return stockItems.find(si => si.id === form.stockInDocId);
  }, [form.stockInDocId, stockItems]);

  const handleInvoiceChange = (value) => {
    const inv = stockItems.find(si => si.id === value);
    setForm(prev => ({
      ...prev,
      stockInDocId: value,
      itemId: "",
      availableQty: 0,
      selectedItemName: "",
      warehouseName: inv?.warehouseName || inv?.warehouse || "Main Warehouse"
    }));
  };

  const handleItemChange = (value) => {
    if (!selectedInvoice) return;
    const items = selectedInvoice.items || [];
    const matchedItem = items.find(item => (item.itemId || item.id) === value);
    
    setForm(prev => ({
      ...prev,
      itemId: value,
      availableQty: Number(matchedItem?.quantity || matchedItem?.qty || 0),
      selectedItemName: matchedItem?.itemName || matchedItem?.name || "Unknown Item",
      quantity: "",
      warehouseName: prev.warehouseName // 🌟 CUSUB: Waxaa la xajiyay magaca bakhaarka si aanu u tirtirmin sxb
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.stockInDocId || !form.itemId) {
      return toast.error("Fadlan buuxi dhamaan meelaha banaan sxb.");
    }

    const inputQty = Number(form.quantity) || 0;
    if (inputQty <= 0) return toast.error("Geli tira ka weyn eber.");

    if (form.adjustmentType === "Deduction" && inputQty > form.availableQty) {
      return toast.error(`Ma dhimi kartid ${inputQty}! Kaydka yaal waa ${form.availableQty}.`);
    }

    setSubmitting(true);
    try {
      await adjustStock({
        stockItemId: form.stockInDocId, 
        subItemId: form.itemId, 
        adjustmentType: form.adjustmentType,
        quantity: inputQty,
        notes: form.notes,
        warehouseName: form.warehouseName 
      });

      toast.success("Adjustment-ga si guul leh ayaa loo kaydiyay sxb!");
      if (refreshData) await refreshData();
      
      setForm({
        stockInDocId: "",
        itemId: "",
        adjustmentType: "Addition",
        quantity: "",
        notes: "",
        availableQty: 0,
        selectedItemName: "",
        warehouseName: ""
      });
      onClose();
    } catch (error) {
      console.error("Adjustment Submit Error sxb:", error);
      toast.error(error.message || "Khalad ayaa dhacay.");
    } finally {
      setSubmitting(false);
    }
  };

  const isDeductionExceeded = form.adjustmentType === "Deduction" && (Number(form.quantity) || 0) > form.availableQty;

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-[92vw] sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-2xl flex flex-col">
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="text-xs md:text-sm font-bold uppercase tracking-tight flex items-center gap-1.5 text-slate-900 dark:text-white">
            <SlidersHorizontal className="text-[#1e3a8a] dark:text-blue-500" size={16} />
            Record Stock Adjustment
          </DialogTitle>
          <DialogDescription className="sr-only">
            Muuqaalkaan wuxuu kuu ogolaanayaa inaad ku sameyso kordhin ama dhimis gacanta ah alaabta kaydka ku jirta sxb.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-2">
          <div className="flex flex-col gap-1">
            <Label className="text-[10px] font-bold uppercase text-slate-500">Select Purchase Invoice (Stock In)</Label>
            <Select value={form.stockInDocId} onValueChange={handleInvoiceChange} disabled={submitting}>
              <SelectTrigger className="bg-slate-50 dark:bg-slate-950 text-xs h-8.5">
                <div className="flex items-center gap-1.5">
                  <FileText size={14} className="text-slate-400" />
                  <SelectValue placeholder="Dooro Invoice-ka Kaydka Keenay" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 text-xs">
                {stockItems.map((si, index) => (
                  <SelectItem key={si.id} value={si.id} className="text-xs">
                    Inv: {si.invoiceNumber || `Batch-${index+1}`} ({si.warehouseName || si.warehouse || "N/A"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[10px] font-bold uppercase text-slate-500">Select Item</Label>
            <Select value={form.itemId} onValueChange={handleItemChange} disabled={!form.stockInDocId || submitting}>
              <SelectTrigger className="bg-slate-50 dark:bg-slate-950 text-xs h-8.5">
                <div className="flex items-center gap-1.5">
                  <Package size={14} className="text-slate-400" />
                  <SelectValue placeholder={form.stockInDocId ? "Dooro Shayga foomka ku jira" : "-- Dooro Invoice Horta --"} />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 text-xs">
                {selectedInvoice?.items?.map((item, index) => {
                  const id = item.itemId || item.id;
                  return (
                    <SelectItem key={id || index} value={id} className="text-xs">
                      {item.itemName || item.name} (Hadda yaal: {item.quantity ?? item.qty ?? 0})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {form.itemId && (
            <div className="bg-slate-50 dark:bg-slate-800/40 border p-2 rounded flex justify-between items-center text-[11px]">
              <span className="font-semibold text-slate-500">Current In-Stock Balance:</span>
              <span className="font-mono font-bold bg-white dark:bg-slate-900 border px-2 py-0.5 rounded shadow-sm">
                {form.availableQty} Units
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] font-bold uppercase text-slate-500">Adjustment Type</Label>
              <Select 
                value={form.adjustmentType} 
                onValueChange={(val) => setForm(prev => ({ ...prev, adjustmentType: val, quantity: "" }))}
                disabled={submitting}
              >
                <SelectTrigger className="bg-slate-50 dark:bg-slate-950 text-xs h-8.5">
                  <SelectValue placeholder="Nooca saxsidda" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 text-xs">
                  <SelectItem value="Addition" className="text-emerald-600 font-semibold">Addition (+) Kordhin</SelectItem>
                  <SelectItem value="Deduction" className="text-red-600 font-semibold">Deduction (-) Dhimis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[10px] font-bold uppercase text-slate-500">Quantity</Label>
              <Input
                type="number"
                placeholder="Tirada"
                className="h-8.5 text-xs"
                value={form.quantity}
                onChange={(e) => setForm(prev => ({ ...prev, quantity: e.target.value }))}
                disabled={!form.itemId || submitting}
                required
              />
            </div>
          </div>

          {isDeductionExceeded && (
            <div className="text-center py-2 bg-red-50 text-red-600 font-semibold text-[11px] rounded border border-red-100">
              Cariiri! Ma dhimi kartid wax ka badan inta kuu keysan ({form.availableQty})!
            </div>
          )}

          <div className="flex flex-col gap-1">
            <Label className="text-[10px] font-bold uppercase text-slate-500">Notes / Reason</Label>
            <Input
              placeholder="Sababta wax looga beddelay kaydka..."
              className="h-8.5 text-xs"
              value={form.notes}
              onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
              disabled={submitting}
            />
          </div>

          <DialogFooter className="gap-2 border-t pt-2 mt-1 flex flex-row justify-end w-full">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting} className="text-xs h-8 px-3">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitting || !form.itemId || !form.quantity || isDeductionExceeded} 
              className="text-xs h-8 px-3 bg-[#1e3a8a] text-white hover:bg-[#172554]"
            >
              {submitting ? "Processing..." : "Apply Adjustment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}