import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, getDoc, addDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { Plus, Trash2, Save, Package } from "lucide-react";

const REGIONS_DATA = {
  "Banadir": ["Abdiaziz", "Bondhere", "Daynile", "Dharkenley", "Hamar-Jajab", "Hamar-Weyne", "Hodan", "Howl-Wadag", "Huriwaa", "Karaan", "Shangani", "Shibis", "Waberi", "Warta-Nabada", "Yaqshid", "Kaxda", "Garasbaley", "Kahda", "Seybiyano", "Boondheere"],
  "Gedo": ["Bardhere", "Belet-Xaawo", "Dolow", "Elwak", "Garbaharey", "Luuq"],
  "Hiraan": ["Beletweyne", "Bulo Burde", "Jalalaqsi", "Mataban"],
  "Bay": ["Baidoa", "Burhakaba", "Dinsoor", "Qansaxdheere"],
  "Bakool": ["Hudur", "Rabdhure", "Elbarde", "Tiyeglow"],
  "Lower Shabelle": ["Marka", "Afgooye", "Qoryoley", "Baraawe", "Kurtunwarey"],
  "Middle Shabelle": ["Jowhar", "Baladweyne", "Mahaday", "Adale"],
  "Lower Juba": ["Kismayo", "Afmadow", "Badhaadhe", "Jamame"],
  "Middle Juba": ["Bu'aale", "Sakow", "Jilib"]
};

export default function CreateProject({ isOpen, onClose, grants = [], projectToEdit, refreshProjects }) {
  const [form, setForm] = useState({ name: "", grantId: "" });
  const [grantDetails, setGrantDetails] = useState(null);
  const [approvedPOs, setApprovedPOs] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [itemsMaster, setItemsMaster] = useState([]);
  const [allocations, setAllocations] = useState([{ id: Date.now(), region: "", district: "", qty: "" }]);
  const [loading, setLoading] = useState(false);

  const totalMaxQty = selectedPO?.items?.reduce((sum, item) => sum + (Number(item.qty) || 0), 0) || 0;
  const totalAllocated = allocations.reduce((sum, a) => sum + (Number(a.qty) || 0), 0);

  // 🌟 WARNING MESSAGE LOGIC - Digniin marka xadka la dhaafo
  useEffect(() => {
    if (selectedPO && totalAllocated > totalMaxQty && totalAllocated > 0) {
      toast.warning("Warning: Allocation exceeds PO limit!", {
        description: `You have allocated ${totalAllocated} units, but only ${totalMaxQty} are available.`,
        duration: 3000,
      });
    }
  }, [totalAllocated, totalMaxQty, selectedPO]);

  useEffect(() => {
    if (projectToEdit) {
      setForm({ name: projectToEdit.name, grantId: projectToEdit.grantId });
      setAllocations(projectToEdit.allocations || []);
      if (projectToEdit.poId) {
        const fetchExistingPO = async () => {
          const poDoc = await getDoc(doc(db, "purchase_orders", projectToEdit.poId));
          if (poDoc.exists()) setSelectedPO({ id: poDoc.id, ...poDoc.data() });
        };
        fetchExistingPO();
      }
    } else {
      resetForm();
    }
  }, [projectToEdit, isOpen]);

  const resetForm = () => {
    setForm({ name: "", grantId: "" });
    setGrantDetails(null);
    setApprovedPOs([]);
    setSelectedPO(null);
    setAllocations([{ id: Date.now(), region: "", district: "", qty: "" }]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    const fetchItems = async () => {
      const snap = await getDocs(collection(db, "items"));
      setItemsMaster(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchItems();
  }, []);

  useEffect(() => {
    if (form.grantId) {
      const fetchGrantInfo = async () => {
        const grantDoc = await getDoc(doc(db, "grants", form.grantId));
        if (grantDoc.exists()) setGrantDetails(grantDoc.data());
        
        const q = query(collection(db, "purchase_orders"), where("grantId", "==", form.grantId), where("status", "==", "APPROVED"));
        const snap = await getDocs(q);
        setApprovedPOs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      };
      fetchGrantInfo();
    }
  }, [form.grantId]);

  const handleSubmit = async () => {
    if (!form.name) return toast.error("Please enter a project name");
    if (totalAllocated === 0) return toast.error("Please add allocation quantities!");
    if (totalAllocated > totalMaxQty) {
      return toast.error("Cannot save: Total allocation exceeds the available items in the PO!");
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        grantId: form.grantId,
        poId: selectedPO?.id,
        allocations,
        updatedAt: serverTimestamp(),
      };

      if (projectToEdit) {
        await updateDoc(doc(db, "projects", projectToEdit.id), payload);
        toast.success("Project updated successfully!");
      } else {
        await addDoc(collection(db, "projects"), { ...payload, createdAt: serverTimestamp() });
        toast.success("Project created successfully!");
      }
      if (refreshProjects) refreshProjects();
      handleClose();
    } catch (e) {
      toast.error("Failed to save project.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 p-6 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <DialogTitle className="text-[#1e3a8a] text-base font-bold uppercase flex items-center gap-2">
            <Package size={18} /> {projectToEdit ? "Edit Project" : "Project Distribution"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-4">
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Project Name</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-10 text-sm" />
          </div>

          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Select Funding Grant</label>
            <Select value={form.grantId} onValueChange={(v) => { setForm({ ...form, grantId: v }); setSelectedPO(null); }}>
              <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="-- Select Grant --" /></SelectTrigger>
              <SelectContent>
                {grants.map(g => <SelectItem key={g.id} value={g.id}>{g.grantName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {form.grantId && (
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Approved Purchase Order</label>
              <Select value={selectedPO?.id || ""} onValueChange={(v) => setSelectedPO(approvedPOs.find(p => p.id === v))}>
                <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="-- Select PO --" /></SelectTrigger>
                <SelectContent>
                  {approvedPOs.map(po => <SelectItem key={po.id} value={po.id}>{po.poNumber}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedPO && (
            <div className="col-span-2 bg-slate-900 text-white p-3 rounded-lg text-xs space-y-1">
              <div className="font-bold uppercase opacity-70 mb-2">Order Items (Total: {totalMaxQty})</div>
              {selectedPO.items.map((item, i) => (
                <div key={i} className="flex justify-between border-b border-slate-700 py-1">
                  <span className="text-blue-300">{itemsMaster.find(m => m.id === item.itemId)?.itemName || "Item"}</span>
                  <span>{item.qty} units</span>
                </div>
              ))}
            </div>
          )}

          <div className="col-span-2 space-y-2 pt-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-500 uppercase">Distribution Location</label>
              <Button type="button" onClick={() => setAllocations([...allocations, { id: Date.now(), region: "", district: "", qty: "" }])} variant="ghost" size="sm" className="h-7 text-xs"><Plus size={14} className="mr-1" /> Add</Button>
            </div>
            {allocations.map((a) => (
              <div key={a.id} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border">
                <Select value={a.region} onValueChange={(v) => setAllocations(prev => prev.map(al => al.id === a.id ? { ...al, region: v } : al))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Region"/></SelectTrigger>
                  <SelectContent>{Object.keys(REGIONS_DATA).map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={a.district} onValueChange={(v) => setAllocations(prev => prev.map(al => al.id === a.id ? { ...al, district: v } : al))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Dist."/></SelectTrigger>
                  <SelectContent>{(REGIONS_DATA[a.region] || []).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="number" placeholder="Qty" className="h-9 w-20 text-xs" value={a.qty} onChange={(e) => setAllocations(prev => prev.map(al => al.id === a.id ? { ...al, qty: e.target.value } : al))} />
                <Button variant="ghost" size="sm" onClick={() => setAllocations(allocations.filter(x => x.id !== a.id))}><Trash2 size={14} className="text-red-500" /></Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <div className="font-bold text-sm text-slate-700">Total: {totalAllocated} / {totalMaxQty}</div>
          <Button onClick={handleSubmit} disabled={loading || totalAllocated > totalMaxQty || totalAllocated === 0} className="bg-[#1e3a8a] text-white h-9 text-xs px-6">
            <Save size={14} className="mr-2"/> {loading ? "Saving..." : projectToEdit ? "Update Project" : "Save Setup"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}