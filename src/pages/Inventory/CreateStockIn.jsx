import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; 
import { Loader2, ArrowDownCircle } from "lucide-react";
import { toast } from "sonner";
import { createStockIn } from "@/services/inventory/stockInService";
import useWarehouse from "@/hooks/useWarehouse";
import usePurchaseInvoices from "@/hooks/usePurchaseInvoices"; 
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

export default function CreateStockIn({ isOpen, onClose, refreshStockIn }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [usedPIIds, setUsedPIIds] = useState([]);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [purchaseInvoiceId, setPurchaseInvoiceId] = useState("");
  const [globalItems, setGlobalItems] = useState([]); 

  const { warehouses = [] } = useWarehouse();
  const { purchaseInvoices = [] } = usePurchaseInvoices(); 

  // Load used PIs - Kaliya marka modal-ka la furo hal mar run garee
  useEffect(() => {
    const fetchUsedPIs = async () => {
      try {
        const snap = await getDocs(collection(db, "stock_in"));
        setUsedPIIds(snap.docs.map(d => d.data().purchaseInvoiceId));
      } catch (e) { console.error(e); }
    };
    if (isOpen) fetchUsedPIs();
  }, [isOpen]);

  // Load global items - Kaliya marka modal-ka la furo hal mar run garee
  useEffect(() => {
    const fetchGlobalItems = async () => {
      try {
        const snap = await getDocs(collection(db, "items"));
        setGlobalItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error(e); }
    };
    if (isOpen) fetchGlobalItems();
  }, [isOpen]);

  const availableInvoices = useMemo(() => 
    purchaseInvoices.filter(pi => !usedPIIds.includes(pi.id)), 
    [purchaseInvoices, usedPIIds]
  );

  // Load PI Items
  useEffect(() => {
    const fetchInvoiceItems = async () => {
      if (!purchaseInvoiceId) { setInvoiceItems([]); return; }
      setIsLoadingItems(true);
      try {
        const docSnap = await getDoc(doc(db, "purchase_invoices", purchaseInvoiceId));
        if (docSnap.exists()) {
          const data = docSnap.data();
          let items = data.items || data.invoiceItems || [];
          if (items.length === 0 && data.poId) {
            const poSnap = await getDoc(doc(db, "purchase_orders", data.poId));
            if (poSnap.exists()) items = poSnap.data().items || poSnap.data().invoiceItems || [];
          }
          setInvoiceItems(items);
        }
      } catch (e) { console.error(e); }
      setIsLoadingItems(false);
    };
    fetchInvoiceItems();
  }, [purchaseInvoiceId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!warehouseId || !purchaseInvoiceId) return toast.error("Fadlan dooro bakhaarka iyo PI-ga.");

    setIsSubmitting(true);
    try {
      const matchedPI = purchaseInvoices.find(pi => pi.id === purchaseInvoiceId);
      
      const preparedItems = invoiceItems.map(item => {
        const itemId = item.itemId || item.id || (item.item && item.item.id);
        const globalMatch = globalItems.find(g => g.id === itemId);
        
        return {
          itemId: itemId || "N/A",
          itemName: globalMatch?.itemName || globalMatch?.name || item.itemName || item.name || item.title || "Unknown Item",
          quantity: Number(item.quantity || item.qty || 0),
          costPrice: Number(item.costPrice || item.price || item.unitPrice || item.rate || 0),
        };
      });

      // Toos u dir si uusan koodku u xayirmin
      await createStockIn({
        warehouseId,
        purchaseInvoiceId,
        invoiceNumber: matchedPI?.invoiceNumber || matchedPI?.invoiceNo || "N/A",
        items: preparedItems,
        receivedAt: new Date().toISOString(),
      });

      toast.success("Si guul leh ayaa loo keydiyay sxb!");
      
      // Reset state-yada si degdeg ah kahor inta uusan modal-ku xirmin
      setUsedPIIds(prev => [...prev, purchaseInvoiceId]);
      setPurchaseInvoiceId("");
      setWarehouseId("");
      setInvoiceItems([]);
      
      if (refreshStockIn) await refreshStockIn();
      onClose();
    } catch (err) { 
      toast.error("Khalad ayaa dhacay xilliga keydinta sxb."); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg flex flex-col overflow-hidden">
        
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="text-xs md:text-sm font-black uppercase tracking-tight flex items-center gap-1.5">
            <ArrowDownCircle className="text-[#1e3a8a] dark:text-blue-500" size={16} />
            Stock In From Purchase Invoice
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
          
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-0.5">
              <Label className="text-[10px] font-bold uppercase text-slate-500">Select Warehouse / Bakhaar</Label>
              <Select value={warehouseId} onValueChange={setWarehouseId} disabled={isSubmitting}>
                <SelectTrigger className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs h-8">
                  <SelectValue placeholder="Dooro Bakhaar" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => (
                    <SelectItem key={w.id} value={w.id} className="text-xs">{w.warehouseName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-0.5">
              <Label className="text-[10px] font-bold uppercase text-slate-500">Select Purchase Invoice (PI)</Label>
              <Select value={purchaseInvoiceId} onValueChange={setPurchaseInvoiceId} disabled={isSubmitting}>
                <SelectTrigger className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs h-8">
                  <SelectValue placeholder="Dooro PI" />
                </SelectTrigger>
                <SelectContent>
                  {availableInvoices.map(pi => (
                    <SelectItem key={pi.id} value={pi.id} className="text-xs">{pi.invoiceNumber || pi.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <Label className="text-[10px] font-bold uppercase text-slate-500">Invoice Items / Agabka Shixnadda</Label>
            <div className="border border-slate-200 dark:border-slate-800 rounded-md h-48 overflow-y-auto bg-slate-50 dark:bg-slate-950/50">
              {isLoadingItems ? (
                <div className="flex items-center justify-center h-full gap-1 text-slate-500 text-xs">
                  <Loader2 size={14} className="animate-spin" /> Soo raraya agabka...
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-100 dark:bg-slate-900 sticky top-0 z-10">
                    <TableRow className="border-b border-slate-200 dark:border-slate-800 hover:bg-transparent">
                      <TableHead className="text-[10px] font-bold uppercase h-7 text-slate-600 dark:text-slate-400">Item Name</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase h-7 text-slate-600 dark:text-slate-400">Qty</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase h-7 text-slate-600 dark:text-slate-400">Price</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase h-7 text-right text-slate-600 dark:text-slate-400">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-slate-400 text-xs py-8">
                          Fadlan horta dooro PI si aad u aragto agabka.
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoiceItems.map((item, i) => {
                        const itemId = item.itemId || item.id || (item.item?.id);
                        const gItem = globalItems.find(g => g.id === itemId);
                        const name = gItem?.itemName || gItem?.name || item.itemName || item.name || "Unknown";
                        const qty = Number(item.quantity || item.qty || 0);
                        const price = Number(item.costPrice || item.price || item.unitPrice || 0);
                        
                        return (
                          <TableRow key={i} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/30">
                            <TableCell className="text-xs py-1.5 font-medium">{name}</TableCell>
                            <TableCell className="text-xs py-1.5">{qty}</TableCell>
                            <TableCell className="text-xs py-1.5">${price.toFixed(2)}</TableCell>
                            <TableCell className="text-xs py-1.5 text-right font-bold text-blue-600 dark:text-blue-400">${(qty * price).toFixed(2)}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          <DialogFooter className="gap-1.5 border-t pt-2 mt-1 flex flex-row justify-end w-full">
            <Button type="button" onClick={onClose} disabled={isSubmitting} className="text-xs h-8 px-3 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-none">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !invoiceItems.length} className="text-xs h-8 px-3 bg-[#1e3a8a] dark:bg-blue-600 text-white border-none cursor-pointer">
              {isSubmitting && <Loader2 size={11} className="animate-spin mr-1" />} Receive Inventory
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}