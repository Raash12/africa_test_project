import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { createProject } from "@/services/projects/projectService"; // Soo jiid adeegii aan kor ku samaynay
import useAccounts from "@/hooks/useAccounts"; // Hook-gaaga Accounts-ka
import { toast } from "sonner";
import { Plus, Trash2, Package, Info, AlertCircle, Landmark, ArrowUpRight } from "lucide-react";

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
  const [form, setForm] = useState({ name: "", grantId: "", assetAccountId: "", expenseAccountId: "" });
  const [grantDetails, setGrantDetails] = useState(null);
  const [approvedPOs, setApprovedPOs] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [itemsMaster, setItemsMaster] = useState([]);
  const [stockInInventory, setStockInInventory] = useState({});
  const [allocations, setAllocations] = useState([{ id: Date.now(), itemId: "", region: "", district: "", qty: "", stockInDocId: "" }]);
  const [loading, setLoading] = useState(false);

  const { accounts = [] } = useAccounts(); // Ka soo jiid dhamaan xisaabaadka COA

  // Shaandhee Asset iyo Expense Accounts
  const assetAccounts = useMemo(() => {
    return accounts.filter(a => 
      a?.accountType?.toLowerCase().includes("asset") || 
      a?.accountType?.toLowerCase().includes("bank") || 
      a?.category?.toLowerCase().includes("asset")
    );
  }, [accounts]);

  const expenseAccounts = useMemo(() => {
    return accounts.filter(a => 
      a?.accountType?.toLowerCase().includes("expense") || 
      a?.category?.toLowerCase().includes("expense")
    );
  }, [accounts]);

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
      }
    };

    fetchStockInItems();
  }, [selectedPO]);

  const totalAllocated = allocations.reduce((sum, a) => sum + (Number(a.qty) || 0), 0);

  // Xisaabi wadarta lacagta (Total Value) ee mashruucan ku baxaysa (Tirada * Price-ka Item-ka ku dhex jira PO)
  const totalProjectValue = useMemo(() => {
    if (!selectedPO) return 0;
    return allocations.reduce((sum, alloc) => {
      const poItem = selectedPO.items?.find(it => it.itemId === alloc.itemId);
      const itemPrice = Number(poItem?.price || poItem?.unitPrice || 0);
      return sum + (Number(alloc.qty || 0) * itemPrice);
    }, 0);
  }, [allocations, selectedPO]);

  const handleItemChange = (lineId, itemId) => {
    const stockInfo = stockInInventory[itemId];
    const defaultDocId = stockInfo && stockInfo.docIds.length > 0 ? stockInfo.docIds[0].id : "";
    
    setAllocations(prev => prev.map(al => 
      al.id === lineId ? { ...al, itemId: itemId, stockInDocId: defaultDocId } : al
    ));
  };

  const handleSubmit = async () => {
    if (!form.name || !selectedPO || !form.assetAccountId || !form.expenseAccountId) {
      return toast.error("Fadlan qor magaca mashruuca, PO-ga, iyo labada Account (Asset & Expense).");
    }
    if (allocations.some(a => !a.itemId || !a.qty || !a.region || !a.district)) {
      return toast.error("Fadlan soo buuxi safafka qaybinta oo dhan.");
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        grantId: form.grantId,
        grantName: grantDetails?.grantName || "N/A",
        poId: selectedPO.id,
        assetAccountId: form.assetAccountId,
        expenseAccountId: form.expenseAccountId,
        totalValue: totalProjectValue,
        month: "June 2026",
        allocations: allocations.map(a => ({
          itemId: a.itemId,
          region: a.region,
          district: a.district,
          qty: Number(a.qty),
          stockInDocId: a.stockInDocId
        }))
      };

      await createProject(payload);

      toast.success("Mashruuca wuu kaydsumay, xisaabtiina GL entry iyo balances waa la hagaajiyey!");
      if (refreshProjects) refreshProjects();
      onClose();
    } catch (e) {
      console.error(e);
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
            U qaybi agabka bakhaarka soo galay gobollada dalka iyo accounts-ka maaliyadda.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Section-ka Koowaad: Magaca iyo Grant */}
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
          </div>

          {/* 🛠️ CUSBOONEYSIIN: Labada Select Dropdown ee Xisaabaadka Financial-ka */}
          <div className="grid grid-cols-2 gap-4 border-t pt-4 bg-slate-50 p-3 rounded-lg">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <Landmark size={14} className="text-amber-600" /> Paid From (Asset Account)
              </label>
              <Select value={form.assetAccountId} onValueChange={(v) => setForm({...form, assetAccountId: v})}>
                <SelectTrigger><SelectValue placeholder="Select Asset/Bank Account" /></SelectTrigger>
                <SelectContent className="bg-white">
                  {assetAccounts.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.accountName} (${a.balance || 0})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <ArrowUpRight size={14} className="text-red-600" /> Charged To (Expense Account)
              </label>
              <Select value={form.expenseAccountId} onValueChange={(v) => setForm({...form, expenseAccountId: v})}>
                <SelectTrigger><SelectValue placeholder="Select Expense Account" /></SelectTrigger>
                <SelectContent className="bg-white">
                  {expenseAccounts.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.accountName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* PO Choice */}
          {form.grantId && (
            <div className="space-y-1">
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

          {/* Lines-ka Qaybinta Gobolada */}
          {selectedPO && (
            <div className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold uppercase text-slate-700">Distribution Lines</h4>
                <Button variant="outline" size="sm" onClick={() => setAllocations([...allocations, { id: Date.now(), itemId: "", region: "", district: "", qty: "", stockInDocId: "" }])}>
                  <Plus size={14} className="mr-1" /> Add Line
                </Button>
              </div>

              <div className="space-y-3">
                {allocations.map((a) => {
                  const availableQty = stockInInventory[a.itemId]?.quantity || 0;
                  const districts = REGIONS_DATA[a.region] || [];
                  
                  return (
                    <div key={a.id} className="grid grid-cols-5 gap-2 items-start border-b pb-2 sm:border-none sm:pb-0">
                      
                      {/* Item dropdown */}
                      <div>
                        <Select value={a.itemId} onValueChange={(v) => handleItemChange(a.id, v)}>
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
                            Stock: {availableQty}
                          </span>
                        )}
                      </div>
                      
                      {/* Region */}
                      <Select value={a.region} onValueChange={(v) => setAllocations(prev => prev.map(al => al.id === a.id ? {...al, region: v, district: ""} : al))}>
                        <SelectTrigger><SelectValue placeholder="Region" /></SelectTrigger>
                        <SelectContent className="bg-white">
                          {Object.keys(REGIONS_DATA).map(r => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* District */}
                      <Select value={a.district} disabled={!a.region} onValueChange={(v) => setAllocations(prev => prev.map(al => al.id === a.id ? {...al, district: v} : al))}>
                        <SelectTrigger><SelectValue placeholder="District" /></SelectTrigger>
                        <SelectContent className="bg-white">
                          {districts.map(d => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Qty Input */}
                      <div className="flex flex-col">
                        <Input type="number" min="1" placeholder="Qty" value={a.qty} onChange={(e) => setAllocations(prev => prev.map(al => al.id === a.id ? {...al, qty: e.target.value} : al))} />
                        {Number(a.qty) > availableQty && (
                          <span className="text-[9px] text-red-500 font-bold mt-0.5 flex items-center gap-0.5">
                            <AlertCircle size={10} /> Max {availableQty}
                          </span>
                        )}
                      </div>

                      {/* Delete */}
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

        {/* Footer info & action buttons */}
        <div className="flex justify-between items-center border-t pt-4">
          <div className="text-xs text-slate-500 font-medium flex flex-col">
            <span>Items Allocated: <span className="font-bold text-slate-800">{totalAllocated}</span></span>
            <span>Total Value: <span className="font-bold text-emerald-600">${totalProjectValue.toLocaleString()}</span></span>
          </div>
          <Button onClick={handleSubmit} disabled={loading || totalAllocated === 0} className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white">
            {loading ? "Processing..." : "Commit Distribution"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}