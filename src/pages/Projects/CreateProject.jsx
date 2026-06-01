import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { Plus, Trash2, Package, Info, AlertCircle } from "lucide-react";

const REGIONS_DATA = {
  "Banadir": ["Abdiaziz", "Bondhere", "Daynile", "Dharkenley", "Hamar-Jajab", "Hamar-Weyne", "Hodan", "Howl-Wadag", "Huriwaa", "Karaan", "Shangani", "Shibis", "Waberi", "Warta-Nabada", "Yaqshid", "Kaxda", "Garasbaley", "Kahda"],
  "Gedo": ["Bardhere", "Belet-Xaawo", "Dolow", "Elwak", "Garbaharey", "Luuq"],
  "Hiraan": ["Beletweyne", "Bulo Burde", "Jalalaqsi", "Mataban"],
  "Bay": ["Baidoa", "Burhakaba", "Dinsoor", "Qansaxdheere"],
  "Bakool": ["Hudur", "Rabdhure", "Elbarde", "Tiyeglow"],
  "Lower Shabelle": ["Marka", "Afgooye", "Qoryoley", "Baraawe", "Kurtunwarey"],
  "Middle Shabelle": ["Jowhar", "Baladweyne", "Mahaday", "Adale"],
  "Lower Juba": ["Kismayo", "Afmadow", "Badhaadhe", "Jamame"],
  "Middle Juba": ["Bu'aale", "Sakow", "Jilib"]
};

export default function CreateProject({ isOpen, onClose, grants = [], refreshProjects }) {
  const [form, setForm] = useState({ name: "", grantId: "" });
  const [grantDetails, setGrantDetails] = useState(null);
  const [approvedPOs, setApprovedPOs] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [itemsMaster, setItemsMaster] = useState([]);
  const [stockInInventory, setStockInInventory] = useState({});
  const [allocations, setAllocations] = useState([{ id: Date.now(), itemId: "", region: "", district: "", qty: "" }]);
  const [loading, setLoading] = useState(false);

  // 1. Fetch Master Items List
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const snap = await getDocs(collection(db, "items"));
        setItemsMaster(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching items:", err);
      }
    };
    if (isOpen) fetchItems();
  }, [isOpen]);

  // 2. Fetch Grant Details and Approved POs
  useEffect(() => {
    if (form.grantId) {
      const fetchData = async () => {
        const grantsSnap = await getDocs(collection(db, "grants"));
        const currentGrant = grantsSnap.docs.find(d => d.id === form.grantId);
        if (currentGrant) setGrantDetails(currentGrant.data());

        const q = query(collection(db, "purchase_orders"), where("grantId", "==", form.grantId), where("status", "==", "APPROVED"));
        const snap = await getDocs(q);
        setApprovedPOs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      };
      fetchData();
    } else {
      setGrantDetails(null);
      setApprovedPOs([]);
    }
  }, [form.grantId]);

  // 3. Fetch Stock In Items map
  useEffect(() => {
    const fetchStockInItems = async () => {
      if (!selectedPO) {
        setStockInInventory({});
        return;
      }

      try {
        const stockInSnap = await getDocs(collection(db, "stock_in"));
        const stockMap = {};

        stockInSnap.docs.forEach(docSnap => {
          const data = docSnap.data();
          const docItems = data.items || [];

          docItems.forEach(item => {
            const itemId = item.itemId;
            if (itemId) {
              const qty = Number(item.quantity || item.qty || 0);

              if (stockMap[itemId]) {
                stockMap[itemId].quantity += qty;
                stockMap[itemId].docIds.push({ id: docSnap.id, currentQty: qty });
              } else {
                stockMap[itemId] = {
                  quantity: qty,
                  docIds: [{ id: docSnap.id, currentQty: qty }]
                };
              }
            }
          });
        });

        setStockInInventory(stockMap);
      } catch (err) {
        console.error("Error fetching stock_in data:", err);
        toast.error("Waa la waayay xogta keydka Stock-In.");
      }
    };

    fetchStockInItems();
  }, [selectedPO]);

  const totalAllocated = allocations.reduce((sum, a) => sum + (Number(a.qty) || 0), 0);

  const checkStockLimits = () => {
    const itemAllocatedTotals = {};
    allocations.forEach(a => {
      if (a.itemId) {
        itemAllocatedTotals[a.itemId] = (itemAllocatedTotals[a.itemId] || 0) + Number(a.qty || 0);
      }
    });

    for (const itemId in itemAllocatedTotals) {
      const availableStock = stockInInventory[itemId]?.quantity || 0;
      if (itemAllocatedTotals[itemId] > availableStock) {
        const itemName = itemsMaster.find(i => i.id === itemId)?.itemName || "Item";
        return { valid: false, message: `Agabka ku jira Stock-In ee (${itemName}) waa ${availableStock}. Kama badnaan karo!` };
      }
    }
    return { valid: true };
  };

  // 4. Handle Form Submission (FIXED TRANSACTION: READS FIRST, WRITES LASTER)
  const handleSubmit = async () => {
    if (!form.name || !selectedPO) return toast.error("Fadlan qor magaca mashruuca iyo PO-ga.");
    if (allocations.some(a => !a.itemId || !a.qty || !a.region || !a.district)) return toast.error("Fadlan soo buuxi safafka qaybinta oo dhan.");
    
    const stockCheck = checkStockLimits();
    if (!stockCheck.valid) return toast.error(stockCheck.message);

    setLoading(true);
    try {
      await runTransaction(db, async (transaction) => {
        
        // --- SECTION 1: READS ONLY ---
        const readsMap = {};
        
        for (const a of allocations) {
          const stockInData = stockInInventory[a.itemId];
          if (!stockInData || !stockInData.docIds) continue;

          for (const docInfo of stockInData.docIds) {
            if (!readsMap[docInfo.id]) {
              const stockInRef = doc(db, "stock_in", docInfo.id);
              const stockInDoc = await transaction.get(stockInRef);
              if (stockInDoc.exists()) {
                readsMap[docInfo.id] = {
                  ref: stockInRef,
                  data: stockInDoc.data()
                };
              }
            }
          }
        }

        // --- SECTION 2: WRITES ONLY ---
        const remainingDeductions = {};
        allocations.forEach(a => {
          remainingDeductions[a.itemId] = (remainingDeductions[a.itemId] || 0) + Number(a.qty);
        });

        for (const docId in readsMap) {
          const cachedDoc = readsMap[docId];
          let currentItems = cachedDoc.data.items || [];
          let hasChanged = false;

          const updatedItems = currentItems.map(item => {
            const neededDeduction = remainingDeductions[item.itemId] || 0;
            if (neededDeduction > 0) {
              const currentQty = Number(item.quantity || item.qty || 0);
              const deduction = Math.min(currentQty, neededDeduction);
              
              remainingDeductions[item.itemId] -= deduction;
              hasChanged = true;
              
              return {
                ...item,
                quantity: currentQty - deduction
              };
            }
            return item;
          });

          if (hasChanged) {
            transaction.update(cachedDoc.ref, {
              items: updatedItems,
              lastUpdated: serverTimestamp()
            });
          }
        }

        for (const itemId in remainingDeductions) {
          if (remainingDeductions[itemId] > 0) {
            throw new Error("Agabka ku jira Stock-In kuma filna qaybintan darteed.");
          }
        }

        // Save Project Distribution Entry
        const projectRef = doc(collection(db, "projects"));
        transaction.set(projectRef, {
          name: form.name,
          grantId: form.grantId,
          grantName: grantDetails?.grantName || "N/A",
          poId: selectedPO.id,
          allocations: allocations.map(a => ({ 
            itemId: a.itemId, 
            region: a.region, 
            district: a.district, 
            qty: Number(a.qty)
          })),
          createdAt: serverTimestamp()
        });
      });

      toast.success("Mashruuca qaybinta gobollada si sax ah ayaa loo kaydiyey, stock-inkiina waa laga jaray!");
      if (refreshProjects) refreshProjects();
      onClose();
    } catch (e) {
      console.error("Transaction failed: ", e);
      toast.error(e.message || "Waa uu fashilmay kaydinta mashruuca.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#1e3a8a]">
            <Package size={20} /> Create New Distribution Project
          </DialogTitle>
          <DialogDescription className="text-xs">
            U qaybi agabka bakhaarka soo galay (Stock In) gobollada iyo degmooyinka dalka.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Project Name</label>
              <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="e.g. Benadir Relief Program" />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Funding Grant</label>
              <Select value={form.grantId} onValueChange={(v) => { setForm({...form, grantId: v}); setSelectedPO(null); }}>
                <SelectTrigger><SelectValue placeholder="Select Grant" /></SelectTrigger>
                <SelectContent className="bg-white">
                  {grants.map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.grantName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {grantDetails && (
              <div className="col-span-2 flex items-center gap-2 p-2 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                <Info size={14} /> <span>Program: {grantDetails.programName || "General Fund"}</span>
              </div>
            )}

            {form.grantId && (
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Approved Purchase Order</label>
                <Select value={selectedPO?.id || ""} onValueChange={(v) => setSelectedPO(approvedPOs.find(p => p.id === v))}>
                  <SelectTrigger><SelectValue placeholder="Select an approved PO" /></SelectTrigger>
                  <SelectContent className="bg-white">
                    {approvedPOs.map(po => (
                      <SelectItem key={po.id} value={po.id}>{po.poNumber}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {selectedPO && (
            <div className="border rounded-lg p-4 bg-slate-50">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold uppercase text-slate-700 flex items-center gap-1">
                  Distribution Lines 
                </h4>
                <Button variant="outline" size="sm" onClick={() => setAllocations([...allocations, { id: Date.now(), itemId: "", region: "", district: "", qty: "" }])}>
                  <Plus size={14} className="mr-1" /> Add Line
                </Button>
              </div>

              <div className="space-y-3">
                {allocations.map((a) => {
                  const availableQty = stockInInventory[a.itemId]?.quantity || 0;
                  const districts = REGIONS_DATA[a.region] || [];
                  
                  return (
                    <div key={a.id} className="grid grid-cols-5 gap-2 items-start border-b pb-2 sm:border-none sm:pb-0">
                      
                      {/* Item Dropdown */}
                      <div className="col-span-2 sm:col-span-1">
                        <Select value={a.itemId} onValueChange={(v) => setAllocations(prev => prev.map(al => al.id === a.id ? {...al, itemId: v} : al))}>
                          <SelectTrigger><SelectValue placeholder="Item" /></SelectTrigger>
                          <SelectContent className="bg-white">
                            {selectedPO.items?.map(it => (
                              <SelectItem key={it.itemId} value={it.itemId}>
                                {itemsMaster.find(m => m.id === it.itemId)?.itemName || "Unknown Item"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {a.itemId && (
                          <span className="text-[10px] text-blue-600 block mt-0.5 px-1 font-semibold">
                            Stock yaal: {availableQty}
                          </span>
                        )}
                      </div>
                      
                      {/* Region Dropdown */}
                      <Select value={a.region} onValueChange={(v) => setAllocations(prev => prev.map(al => al.id === a.id ? {...al, region: v, district: ""} : al))}>
                        <SelectTrigger><SelectValue placeholder="Region" /></SelectTrigger>
                        <SelectContent className="bg-white">
                          {Object.keys(REGIONS_DATA).map(r => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* District Dropdown */}
                      <Select value={a.district} disabled={!a.region} onValueChange={(v) => setAllocations(prev => prev.map(al => al.id === a.id ? {...al, district: v} : al))}>
                        <SelectTrigger><SelectValue placeholder="District" /></SelectTrigger>
                        <SelectContent className="bg-white">
                          {districts.map(d => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Quantity Input */}
                      <div className="flex flex-col">
                        <Input type="number" min="1" placeholder="Qty" value={a.qty} onChange={(e) => setAllocations(prev => prev.map(al => al.id === a.id ? {...al, qty: e.target.value} : al))} />
                        {Number(a.qty) > availableQty && (
                          <span className="text-[9px] text-red-500 font-bold mt-0.5 flex items-center gap-0.5">
                            <AlertCircle size={10} /> Max {availableQty}
                          </span>
                        )}
                      </div>

                      {/* Delete Action Button */}
                      <div className="flex items-center justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setAllocations(allocations.filter(x => x.id !== a.id))} disabled={allocations.length === 1}>
                          <Trash2 size={14} className="text-red-400" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center border-t pt-4">
          <div className="text-xs text-slate-500 font-medium">
            Wadarta guud ee alaabta la kala qoondeeyey: <span className="font-bold text-slate-800">{totalAllocated}</span>
          </div>
          <Button onClick={handleSubmit} disabled={loading || totalAllocated === 0} className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white">
            {loading ? "Processing..." : "Commit Distribution"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}