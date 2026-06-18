import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileText, Package } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { createPurchaseOrder, updatePurchaseOrder } from "@/services/purchase/purchaseOrderService";

/**
 * COMPONENT: CreatePurchaseOrder
 * PURPOSE: Generating purchase orders, managing grant budgets, and tracking items.
 */
export default function CreatePurchaseOrder({ isOpen, onClose, refreshPOs, poToEdit }) {
  
  // ==========================================================================
  // 1. STATE DEFINITIONS
  // ==========================================================================
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data Collections from Firebase
  const [suppliers, setSuppliers] = useState([]);
  const [grants, setGrants] = useState([]);
  const [itemsMaster, setItemsMaster] = useState([]);
  
  // Form Input States
  const [supplierId, setSupplierId] = useState("");
  const [grantId, setGrantId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [poItems, setPoItems] = useState([]);
  
  // Financial Constraints
  const [selectedGrantObj, setSelectedGrantObj] = useState(null);
  const [budgetExceeded, setBudgetExceeded] = useState(false);
  const [remainingBudget, setRemainingBudget] = useState(0);

  // ==========================================================================
  // 2. DATA FETCHING (Firebase)
  // ==========================================================================
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [supSnap, grantSnap, itemsSnap] = await Promise.all([
          getDocs(collection(db, "suppliers")),
          getDocs(collection(db, "grants")),
          getDocs(collection(db, "items"))
        ]);
        
        setSuppliers(supSnap.docs.map(doc => ({ id: doc.id, name: doc.data().company || doc.data().supplierName || "N/A" })));
        setGrants(grantSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setItemsMaster(itemsSnap.docs.map(doc => ({ id: doc.id, itemName: doc.data().itemName || "N/A" })));
      } catch (err) {
        console.error("Critical Error fetching database dropdowns:", err);
        toast.error("Failed to load initial data.");
      }
    };

    if (isOpen) {
      fetchDropdownData();
    }
  }, [isOpen]);

  // ==========================================================================
  // 3. EDIT/LOAD LOGIC
  // ==========================================================================
  useEffect(() => {
    if (poToEdit) {
      setSupplierId(poToEdit.supplierId || "");
      setGrantId(poToEdit.grantId || "");
      setDueDate(poToEdit.dueDate ? poToEdit.dueDate.split("T")[0] : "");
      setTotalAmount(poToEdit.totalAmount || 0);
      setPoItems(poToEdit.items || []);
    } else {
      setSupplierId("");
      setGrantId("");
      setDueDate("");
      setTotalAmount(0);
      setPoItems([]);
    }
  }, [poToEdit, isOpen]);

  // ==========================================================================
  // 4. FINANCIAL & GRANT CALCULATIONS
  // ==========================================================================
  useEffect(() => {
    if (grantId) {
      const matchedGrant = grants.find(g => g.id === grantId);
      if (matchedGrant) {
        setSelectedGrantObj(matchedGrant);
        const currentGrantAmount = matchedGrant.amount || 0;
        const remainder = currentGrantAmount - totalAmount;
        setRemainingBudget(remainder);
        setBudgetExceeded(remainder < 0);

        if (!poToEdit) {
          const rawItems = matchedGrant.items || [];
          const formattedItems = rawItems.map(item => ({
            itemId: item.itemId,
            qty: parseInt(item.qty, 10) || 0,
            price: 0,
            total: 0
          }));
          setPoItems(formattedItems);
          setTotalAmount(0);
        }
      }
    } else {
      setSelectedGrantObj(null);
      setRemainingBudget(0);
      setBudgetExceeded(false);
    }
  }, [grantId, grants]);

  // ==========================================================================
  // 5. EVENT HANDLERS
  // ==========================================================================
  const handlePriceChange = (index, newPrice) => {
    const updated = [...poItems];
    const priceNum = parseFloat(newPrice) || 0;
    
    updated[index].price = priceNum;
    updated[index].total = updated[index].qty * priceNum;
    setPoItems(updated);

    const newGrandTotal = updated.reduce((sum, item) => sum + item.total, 0);
    setTotalAmount(newGrandTotal);

    if (selectedGrantObj) {
      const remainder = selectedGrantObj.amount - newGrandTotal;
      setRemainingBudget(remainder);
      setBudgetExceeded(remainder < 0);
    }
  };

  const getItemName = (id) => {
    const match = itemsMaster.find(i => i.id === id);
    return match ? match.itemName : "Unknown Item";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId || !grantId || !dueDate) {
      toast.error("Please fill all required fields!");
      return;
    }
    if (budgetExceeded) {
      toast.error("Budget limit exceeded!");
      return;
    }

    setIsSubmitting(true);
    const matchedSupplier = suppliers.find(s => s.id === supplierId);
    const matchedGrant = grants.find(g => g.id === grantId);
    
    const orderData = {
      supplierId,
      supplierName: matchedSupplier ? matchedSupplier.name : "N/A",
      grantId,
      grantName: matchedGrant ? matchedGrant.grantName : "N/A",
      dueDate,
      totalAmount,
      status: poToEdit ? poToEdit.status : "PENDING",
      items: poItems
    };

    try {
      if (poToEdit) {
        await updatePurchaseOrder(poToEdit.id, orderData);
        toast.success("PO updated successfully!");
      } else {
        await createPurchaseOrder(orderData);
        toast.success("PO created successfully!");
      }
      if (refreshPOs) await refreshPOs();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Error during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================================================
  // 6. RENDER UI
  // ==========================================================================
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-xl bg-white p-6 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center gap-3 text-lg font-bold text-slate-800">
            <FileText className="text-blue-600" />
            {poToEdit ? "Edit Purchase Order" : "New Purchase Order"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Fill in the details to generate a new procurement request.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-4">
          {/* Grant & Vendor */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] font-bold uppercase text-slate-600">Funding Grant</Label>
              <Select value={grantId} onValueChange={setGrantId}>
                <SelectTrigger className="h-10 border-slate-200"><SelectValue placeholder="Grant..." /></SelectTrigger>
                <SelectContent className="bg-white">
                  {grants.map(g => <SelectItem key={g.id} value={g.id}>{g.grantName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] font-bold uppercase text-slate-600">Vendor</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger className="h-10 border-slate-200"><SelectValue placeholder="Select Vendor" /></SelectTrigger>
                <SelectContent className="bg-white">
                  {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] font-bold uppercase text-slate-600">Due Date</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-10 border-slate-200" />
          </div>

          {/* Items & Budget */}
          <div className="border rounded-lg p-4 bg-slate-50">
            <h4 className="text-[11px] font-bold uppercase text-slate-600 mb-3">Items & Pricing</h4>
            {poItems.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">Please select a grant to load items.</div>
            ) : (
              poItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 py-2 border-b last:border-0">
                  <Package size={16} className="text-slate-400" />
                  <span className="flex-1 text-xs font-medium">{getItemName(item.itemId)}</span>
                  <Input type="number" className="w-20 h-8 text-xs" value={item.price} onChange={(e) => handlePriceChange(idx, e.target.value)} />
                  <span className="w-16 text-right text-xs font-bold">${item.total.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>

          {selectedGrantObj && (
            <div className="bg-slate-800 text-white p-3 rounded-lg flex justify-between text-xs font-mono">
              <span>Remaining Budget:</span>
              <span className={remainingBudget < 0 ? "text-red-400" : "text-green-400"}>${remainingBudget.toLocaleString()}</span>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || budgetExceeded}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : "Confirm Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}