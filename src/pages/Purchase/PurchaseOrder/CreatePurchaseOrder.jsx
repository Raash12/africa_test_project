import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"; 
import { Plus, Trash2, ShoppingCart, Layers, UserCircle, Package, Landmark } from "lucide-react";
import useSuppliers from "@/hooks/useSuppliers";
import usePrograms from "@/hooks/usePrograms"; 
import useItems from "@/hooks/useItems"; 

// Tusaale ahaan Account Categories-ka u raran dhanka Accounting-ka
const ACCOUNT_CATEGORIES = [
  { id: "exp_project_direct", name: "Direct Project Expense" },
  { id: "exp_office_supplies", name: "Office & Administrative Supplies" },
  { id: "exp_equipment", name: "Equipment Purchase" },
  { id: "exp_logistics", name: "Logistics & Transport" }
];

export default function CreatePurchaseOrder({ isOpen, onClose, refreshPOs, poToEdit, createPurchaseOrder, updatePurchaseOrder }) {
  const { suppliers = [], loading: loadingSuppliers } = useSuppliers();
  const { programs = [], loading: loadingPrograms } = usePrograms(); 
  const { items: availableItems = [], loading: loadingItems } = useItems(); 

  const [form, setForm] = useState({
    supplierId: "",
    programId: "", 
    accountCategory: "", // Kani waa field-ka cusub ee accounting-ka raran
    items: [{ itemId: "", quantity: 0, unitPrice: 0, subTotal: 0 }], 
    totalAmount: 0,
    status: "PENDING"
  });

  useEffect(() => {
    if (poToEdit) {
      setForm({ ...poToEdit });
    } else {
      setForm({
        supplierId: "",
        programId: "",
        accountCategory: "",
        items: [{ itemId: "", quantity: 0, unitPrice: 0, subTotal: 0 }],
        totalAmount: 0,
        status: "PENDING"
      });
    }
  }, [poToEdit, isOpen]);

  useEffect(() => {
    const total = form.items.reduce((acc, curr) => acc + (curr.subTotal || 0), 0);
    setForm(prev => ({ ...prev, totalAmount: total }));
  }, [form.items]);

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...form.items];
    
    let parsedValue = value;
    if (field === "quantity") {
      parsedValue = value === "" ? 0 : parseInt(value) || 0;
    } else if (field === "unitPrice") {
      parsedValue = value === "" ? 0 : parseFloat(value) || 0;
    }

    updatedItems[index][field] = parsedValue;
    updatedItems[index].subTotal = updatedItems[index].quantity * updatedItems[index].unitPrice;

    setForm({ ...form, items: updatedItems });
  };

  const addItemRow = () => {
    setForm({
      ...form,
      items: [...form.items, { itemId: "", quantity: 0, unitPrice: 0, subTotal: 0 }] 
    });
  };

  const removeItemRow = (index) => {
    if (form.items.length === 1) return;
    const updatedItems = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items: updatedItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (poToEdit?.id) {
      await updatePurchaseOrder(poToEdit.id, form);
    } else {
      await createPurchaseOrder(form);
    }
    onClose();
    refreshPOs();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[500px] w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto transition-all">
        <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="text-[#1e3a8a] dark:text-blue-400 text-base font-bold uppercase tracking-wider flex items-center gap-2">
            <ShoppingCart size={18} /> {poToEdit ? "Edit Purchase Order" : "New Purchase Order (PO)"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 pt-4">
          
          {/* SUPPLIER SELECT */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase dark:text-slate-400">Select Supplier</label>
            <div className="relative">
              <Select
                value={form.supplierId}
                onValueChange={(value) => setForm({ ...form, supplierId: value })}
                required
              >
                <SelectTrigger className="w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none pl-10 text-sm">
                  <SelectValue placeholder="-- Choose Vendor --" />
                </SelectTrigger>
                
                <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 max-h-[220px]">
                  {loadingSuppliers ? (
                    <SelectItem value="loading" disabled>Loading vendors...</SelectItem>
                  ) : suppliers.length === 0 ? (
                    <SelectItem value="none" disabled>No vendors diwaangashan</SelectItem>
                  ) : (
                    suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="cursor-pointer">
                        <span className="font-medium text-xs">{s.company} ({s.supplierName})</span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <UserCircle className="absolute left-3 top-3 text-slate-400 pointer-events-none" size={15} />
            </div>
          </div>

          {/* PROJECT / PROGRAM SELECT */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase dark:text-slate-400">Select Project / Program</label>
            <div className="relative">
              <Select
                value={form.programId}
                onValueChange={(value) => setForm({ ...form, programId: value })}
                required
              >
                <SelectTrigger className="w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none pl-10 text-sm">
                  <SelectValue placeholder="-- Choose Program --" />
                </SelectTrigger>
                
                <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 max-h-[220px]">
                  {loadingPrograms ? (
                    <SelectItem value="loading" disabled>Loading programs...</SelectItem>
                  ) : programs.length === 0 ? (
                    <SelectItem value="none" disabled>No programs diwaangashan</SelectItem>
                  ) : (
                    programs.map((prog) => (
                      <SelectItem key={prog.id} value={prog.id} className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-xs">{prog.programName}</span>
                          <span className="text-[10px] font-mono font-bold text-[#1e3a8a] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded uppercase border border-blue-100/50 dark:border-blue-900/50">
                            {prog.programCode}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Layers className="absolute left-3 top-3 text-slate-400 pointer-events-none" size={15} />
            </div>
          </div>

          {/* ACCOUNT CATEGORY (ACCOUNTING INTEGRATION) */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase dark:text-slate-400">Account Category (Accounting)</label>
            <div className="relative">
              <Select
                value={form.accountCategory}
                onValueChange={(value) => setForm({ ...form, accountCategory: value })}
                required
              >
                <SelectTrigger className="w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none pl-10 text-sm">
                  <SelectValue placeholder="-- Select Expense Account --" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                  {ACCOUNT_CATEGORIES.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id} className="cursor-pointer text-xs">
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Landmark className="absolute left-3 top-3 text-slate-400 pointer-events-none" size={15} />
            </div>
          </div>

          {/* DYNAMIC ITEMS MANAGEMENT */}
          <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-xs font-bold text-[#1e3a8a] dark:text-blue-400 uppercase tracking-wider">Requested Items List</h3>
              <Button type="button" onClick={addItemRow} size="sm" className="bg-[#1e3a8a] hover:bg-[#172554] text-white text-xs gap-1 h-7 px-2">
                <Plus size={12} /> Add Item
              </Button>
            </div>

            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
              {form.items.map((item, index) => (
                <div key={index} className="space-y-2 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800 relative">
                  
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <Select
                        value={item.itemId}
                        onValueChange={(value) => handleItemChange(index, "itemId", value)}
                        required
                      >
                        <SelectTrigger className="w-full h-8 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-600 outline-none pl-8 text-xs">
                          <SelectValue placeholder={loadingItems ? "Loading Items..." : "-- Choose Item --"} />
                        </SelectTrigger>
                        
                        <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 max-h-[200px]">
                          {availableItems.length === 0 ? (
                            <SelectItem value="none" disabled>No items diwaangashan</SelectItem>
                          ) : (
                            availableItems.map((i) => (
                              <SelectItem key={i.id} value={i.id} className="cursor-pointer text-xs">
                                {i.itemName} {i.description ? `(${i.description})` : ""}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <Package className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" size={13} />
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => removeItemRow(index)}
                      disabled={form.items.length === 1}
                      className={`p-1 rounded-md transition-all ${form.items.length === 1 ? "text-slate-300 dark:text-slate-700 cursor-not-allowed" : "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-center pt-1 border-t border-dashed border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Qty</span>
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        className="h-8 text-xs font-mono"
                        value={item.quantity === 0 ? "" : item.quantity} 
                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                        onBlur={(e) => e.target.value === "" && handleItemChange(index, "quantity", 0)}
                        required
                      />
                    </div>

                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Price</span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        min="0"
                        className="h-8 text-xs font-mono"
                        value={item.unitPrice === 0 ? "" : item.unitPrice} 
                        onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                        onBlur={(e) => e.target.value === "" && handleItemChange(index, "unitPrice", 0)}
                        required
                      />
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Sub Total</span>
                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 block pt-1.5 pr-1">
                        ${(item.subTotal || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* GRAND TOTAL ROW */}
          <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 mt-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Grand Total:</span>
            <span className="text-lg font-mono font-black text-[#1e3a8a] dark:text-blue-400">${form.totalAmount.toLocaleString()}</span>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={onClose} className="h-9 text-xs border-slate-200 dark:border-slate-700">Cancel</Button>
            <Button type="submit" className="h-9 text-xs bg-[#1e3a8a] dark:bg-blue-600 hover:bg-[#172554] dark:hover:bg-blue-700 text-white shadow-md border-none">
              {poToEdit ? "Update Order" : "Save Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}