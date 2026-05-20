import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"; 
import { Loader2, ArrowDownCircle, FileText, Package } from "lucide-react";
import { toast } from "sonner";
import { createStockIn } from "@/services/inventory/stockInService";
import useWarehouse from "@/hooks/useWarehouse";
import usePurchaseInvoices from "@/hooks/usePurchaseInvoices"; 
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

export default function CreateStockIn({ isOpen, onClose, refreshStockIn }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  
  // Custom Hooks
  const { warehouses = [] } = useWarehouse();
  const { purchaseInvoices = [], loading: loadingPIs } = usePurchaseInvoices(); 
  
  // Local States
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [purchaseInvoiceId, setPurchaseInvoiceId] = useState("");
  const [globalItems, setGlobalItems] = useState([]); 

  // 1. Soo rar dhamaan Items-ka guud ee nidaamka si loogu xaqiijiyo magaca rasmiga ah
  useEffect(() => {
    const fetchGlobalItems = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "items"));
        const itemsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setGlobalItems(itemsData);
      } catch (err) {
        console.error("Error fetching global items:", err);
      }
    };
    if (isOpen) fetchGlobalItems();
  }, [isOpen]);

  // 2. Marka PI la doorto, kasoo dhuuq Items-ka ku dhex jira Firestore
  useEffect(() => {
    const fetchInvoiceItems = async () => {
      if (!purchaseInvoiceId) {
        setInvoiceItems([]);
        return;
      }

      setIsLoadingItems(true);
      try {
        const docRef = doc(db, "purchase_invoices", purchaseInvoiceId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          let itemsList = data.items || data.invoiceItems || [];
          
          // BACKUP LOGIC: Haddii PI laga waayo alaabta, ka raadi PO-da ku xiran
          if (itemsList.length === 0 && data.poId) {
            const poRef = doc(db, "purchase_orders", data.poId);
            const poSnap = await getDoc(poRef);
            if (poSnap.exists()) {
              const poData = poSnap.data();
              itemsList = poData.items || poData.invoiceItems || [];
            }
          }

          setInvoiceItems(itemsList);
          
          if (itemsList.length === 0) {
            toast.warning("Dukumiintigaan wax alaab ah laguma dhex arkin sxb.");
          }
        } else {
          toast.error("Xogta Invoice-kaan waa la waayey sxb.");
        }
      } catch (err) {
        console.error("Error fetching invoice items:", err);
        toast.error("Khalad ayaa dhacay xilliga soo dhuujinta alaabta.");
      } finally {
        setIsLoadingItems(false);
      }
    };

    fetchInvoiceItems();
  }, [purchaseInvoiceId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!warehouseId || !purchaseInvoiceId || invoiceItems.length === 0) {
      toast.error("Fadlan buuxi dhammaan meelaha banaan sxb.");
      return;
    }

    setIsSubmitting(true);
    const matchedPI = purchaseInvoices.find(pi => pi.id === purchaseInvoiceId);

    const stockInData = {
      warehouseId,
      purchaseInvoiceId,
      invoiceNumber: matchedPI ? (matchedPI.invoiceNumber || matchedPI.invoiceNo) : "N/A",
      supplierName: matchedPI ? matchedPI.supplierName : "N/A",
      program: matchedPI ? matchedPI.program : "N/A",
      items: invoiceItems.map(item => {
        const currentItemId = item.itemId || item.id || (item.item && item.item.id);
        const matchedGlobalItem = globalItems.find(g => g.id === currentItemId);

        // TRIPLE FALLBACK FOR NAME
        const nameFallback = 
          (matchedGlobalItem && (matchedGlobalItem.itemName || matchedGlobalItem.name || matchedGlobalItem.item_name)) ||
          item.name || 
          item.itemName || 
          item.title || 
          item.productName || 
          (item.item && typeof item.item === 'object' ? item.item.name || item.item.itemName : item.item) ||
          "Unknown Item";

        return {
          itemId: currentItemId || "N/A",
          itemName: nameFallback,
          quantity: Number(item.quantity || item.qty || 0),
          costPrice: Number(item.costPrice || item.price || item.unitPrice || item.rate || 0),
        };
      }),
      receivedAt: new Date().toISOString(),
    };

    try {
      await createStockIn(stockInData);
      toast.success("Agabkii nidaamka PI guul baa loogu shubay bakhaarka!");
      if (refreshStockIn) await refreshStockIn();
      onClose();
      setWarehouseId("");
      setPurchaseInvoiceId("");
      setInvoiceItems([]);
    } catch (error) {
      toast.error("Khalad ayaa dhacay xilliga keydinta sxb.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col overflow-hidden shadow-lg">
        
        <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="text-xs md:text-sm font-black uppercase tracking-wider flex items-center gap-2 text-slate-900 dark:text-slate-50">
            <ArrowDownCircle className="text-[#1e3a8a] dark:text-blue-500" size={18} />
            Stock In from Purchase Invoice (PI)
          </DialogTitle>
          <DialogDescription className="text-[11px] text-slate-500">
            Receive approved inventory items directly into selected warehouse.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-3">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* WAREHOUSE */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Select Warehouse</Label>
              <Select value={warehouseId} onValueChange={(value) => setWarehouseId(value)}>
                <SelectTrigger className="w-full h-9 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 shadow-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-700 rounded-md">
                  <SelectValue placeholder="-- Choose Warehouse --" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id} className="text-xs focus:bg-slate-50 dark:focus:bg-slate-800 cursor-pointer">
                      {w.warehouseName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* PURCHASE INVOICE */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Select Purchase Invoice (PI)</Label>
              <Select value={purchaseInvoiceId} onValueChange={(value) => setPurchaseInvoiceId(value)}>
                <SelectTrigger className="w-full h-9 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 shadow-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-700 rounded-md">
                  <SelectValue placeholder={loadingPIs ? "Soo raraya liiska..." : "-- Choose Purchase Invoice --"} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  {purchaseInvoices.length === 0 ? (
                    <div className="text-xs p-2 text-slate-400 text-center">Ma jiraan wax PI ah sxb</div>
                  ) : (
                    purchaseInvoices.map((pi) => (
                      <SelectItem key={pi.id} value={pi.id} className="text-xs focus:bg-slate-50 dark:focus:bg-slate-800 cursor-pointer">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{pi.invoiceNumber || pi.invoiceNo || pi.id}</span> 
                        {pi.supplierName ? ` • ${pi.supplierName}` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* TABLE */}
          <div className="flex flex-col gap-1.5 mt-1">
            <Label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Package size={14} className="text-slate-400" /> Invoice Items (Agabka ku jira)
            </Label>
            
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-950 shadow-sm max-h-[240px] overflow-y-auto">
              {isLoadingItems ? (
                <div className="flex items-center justify-center py-8 text-xs text-slate-500 dark:text-slate-400 gap-2">
                  <Loader2 size={14} className="animate-spin text-[#1e3a8a] dark:text-blue-500" /> 
                  <span>Soo dhuujinta xogta alaabta...</span>
                </div>
              ) : invoiceItems.length > 0 ? (
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900 sticky top-0 shadow-sm z-10">
                    <TableRow className="border-b border-slate-200 dark:border-slate-800 hover:bg-transparent">
                      <TableHead className="h-9 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 pl-4">Item Name</TableHead>
                      <TableHead className="h-9 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 text-center w-[80px]">Qty</TableHead>
                      <TableHead className="h-9 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 text-right w-[110px]">Unit Price</TableHead>
                      <TableHead className="h-9 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 text-right pr-4 w-[120px]">Total Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceItems.map((item, index) => {
                      const currentItemId = item.itemId || item.id || (item.item && item.item.id);
                      const matchedGlobalItem = globalItems.find(g => g.id === currentItemId);

                      const itemName = 
                        (matchedGlobalItem && (matchedGlobalItem.itemName || matchedGlobalItem.name || matchedGlobalItem.item_name)) ||
                        item.name || 
                        item.itemName || 
                        item.title || 
                        item.productName || 
                        (item.item && typeof item.item === 'object' ? item.item.name || item.item.itemName : item.item) ||
                        "Unknown Item";

                      const qty = Number(item.quantity || item.qty || 0);
                      const price = Number(item.costPrice || item.price || item.unitPrice || item.rate || 0);
                      const total = qty * price;

                      return (
                        <TableRow key={index} className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors">
                          <TableCell className="py-2.5 pl-4 font-medium text-slate-800 dark:text-slate-200">
                            {itemName}
                          </TableCell>
                          <TableCell className="py-2.5 text-center font-bold text-slate-900 dark:text-slate-100">
                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                              {qty}
                            </span>
                          </TableCell>
                          <TableCell className="py-2.5 text-right font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                            ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="py-2.5 text-right pr-4 font-mono font-bold text-[#1e3a8a] dark:text-blue-400 text-[11px]">
                            ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500 flex flex-col items-center gap-1.5">
                  <FileText size={20} className="text-slate-300 dark:text-slate-700" />
                  <span>Fadlan horta dooro PI si aad alaabta u aragto sxb.</span>
                </div>
              )}
            </div>
          </div>

          {/* FOOTER */}
          <DialogFooter className="gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 mt-1 flex flex-row justify-end w-full">
            <Button type="button" onClick={onClose} disabled={isSubmitting} className="text-xs h-9 px-4 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-none hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || invoiceItems.length === 0} className="text-xs h-9 px-4 bg-[#1e3a8a] hover:bg-[#152a66] dark:bg-blue-600 dark:hover:bg-blue-700 text-white border-none cursor-pointer disabled:opacity-50 shadow-sm rounded-md">
              {isSubmitting && <Loader2 size={12} className="animate-spin mr-1.5" />} Receive Entire Invoice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}