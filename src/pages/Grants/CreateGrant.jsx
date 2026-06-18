import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"; 
import { Plus, Trash2, BookOpen, DollarSign } from "lucide-react";
import { getAccounts as getChartOfAccounts } from "@/services/accounting/accountService";
import { toast } from "sonner";

export default function CreateGrant({ 
  isOpen, 
  onClose, 
  refreshGrants, 
  grantToEdit, 
  donors = [], 
  programs = [], 
  items = [], 
  createGrant, 
  updateGrant 
}) {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({
    grantName: "",
    donorId: "",
    programId: "", 
    amount: "",
    currency: "USD",
    startDate: "",
    endDate: "",
    notes: "",
    receivingAccountId: "", 
    revenueAccountId: "", 
    items: [{ itemId: "", qty: "" }] 
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Accounts
  useEffect(() => {
    if (isOpen) {
      const loadAccounts = async () => {
        try {
          const coa = await getChartOfAccounts();
          setAccounts(coa || []);
        } catch (err) {
          console.error("Failed to load accounts:", err);
          toast.error("Failed to load accounts.");
        }
      };
      loadAccounts();
    }
  }, [isOpen]);

  // Sanitize available items
  const sanitizedAvailableItems = items.map((availItem, index) => {
    const itemId = availItem.id || availItem._id || `item-fallback-${index}-${availItem.itemName?.replace(/\s+/g, '-').toLowerCase()}`;
    return { ...availItem, computedId: String(itemId) };
  });

  // Sync form when editing or opening
  useEffect(() => {
    if (grantToEdit) {
      setForm({
        ...grantToEdit,
        donorId: grantToEdit.donorId ? String(grantToEdit.donorId) : "",
        programId: grantToEdit.programId ? String(grantToEdit.programId) : "",
        receivingAccountId: grantToEdit.receivingAccountId ? String(grantToEdit.receivingAccountId) : "",
        revenueAccountId: grantToEdit.revenueAccountId ? String(grantToEdit.revenueAccountId) : "", 
        items: grantToEdit.items && grantToEdit.items.length > 0 
          ? grantToEdit.items.map(it => ({ itemId: String(it.itemId || it.id || ""), qty: String(it.qty || "") }))
          : [{ itemId: "", qty: "" }]
      });
    } else {
      setForm({
        grantName: "",
        donorId: "",
        programId: "", 
        amount: "",
        currency: "USD",
        startDate: "",
        endDate: "",
        notes: "",
        receivingAccountId: "", 
        revenueAccountId: "", 
        items: [{ itemId: "", qty: "" }] 
      });
    }
  }, [grantToEdit, isOpen]);

  const handleAddItem = () => setForm({ ...form, items: [...form.items, { itemId: "", qty: "" }] });
  const handleRemoveItem = (index) => setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...form.items];
    updatedItems[index][field] = value;
    setForm({ ...form, items: updatedItems });
  };

  // 🌟 FILTERING FIXED: Waxaan ku kala saarnay lambarka akoonka (Account Code) si ay boqolkiiba boqol u kala baxaan
  const assetAccounts = accounts.filter(acc => {
    const code = String(acc.accountCode || "");
    const type = String(acc.accountType || "").toLowerCase();
    // Haddii uu koodku ka bilaamo 1 AMA nooca uu yahay assets
    return code.startsWith("1") || type === "assets" || type === "asset";
  });
  
  const revenueAccounts = accounts.filter(acc => {
    const code = String(acc.accountCode || "");
    const type = String(acc.accountType || "").toLowerCase();
    // Haddii uu koodku ka bilaamo 4 AMA nooca uu yahay revenue/income
    return code.startsWith("4") || type === "revenue" || type === "income";
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!form.receivingAccountId || !form.revenueAccountId) {
      toast.error("Fadlan dooro labada akoonba (Receiving iyo Revenue Account)");
      return;
    }

    setIsSubmitting(true);

    try {
      const dataToSave = {
        ...form,
        amount: parseFloat(form.amount) || 0,
        items: form.items.filter(i => i.itemId !== "").map(i => ({ itemId: i.itemId, qty: parseInt(i.qty, 10) || 0 }))
      };
      
      await (grantToEdit?.id ? updateGrant(grantToEdit.id, dataToSave) : createGrant(dataToSave));
      
      toast.success("Grant saved successfully!");
      onClose();
      refreshGrants();
    } catch (error) {
      console.error("Error saving grant:", error);
      toast.error("Failed to save grant.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 p-6 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2 border-b border-slate-100">
          <DialogTitle className="text-[#1e3a8a] text-base font-bold uppercase tracking-wider">
            {grantToEdit ? "Edit Grant" : "Allocate New Grant"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Form for creating or editing grant details and account allocations.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-4 gap-y-3 pt-4">
          {/* Donor */}
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Donor</label>
            <Select value={form.donorId} onValueChange={(v) => setForm({...form, donorId: v})}>
              <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="-- Select Donor --" /></SelectTrigger>
              <SelectContent>
                {donors.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.donorName || d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Program */}
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Program</label>
            <Select value={form.programId} onValueChange={(v) => setForm({...form, programId: v})}>
              <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="-- Select Program --" /></SelectTrigger>
              <SelectContent>
                {programs.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.programName || p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Receiving Account (Assets Only - e.g., 1000, 1010) */}
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Receiving Account (Wixii Asset Ah Bas)</label>
            <Select value={form.receivingAccountId} onValueChange={(v) => setForm({...form, receivingAccountId: v})}>
              <SelectTrigger className="h-10 text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen size={14} className="text-slate-400"/>
                  <SelectValue placeholder="Select Bank/Asset Account..." />
                </div>
              </SelectTrigger>
              <SelectContent>
                {assetAccounts.map(acc => (
                  <SelectItem key={acc.id} value={String(acc.id)}>[{acc.accountCode}] {acc.accountName}</SelectItem>
                ))}
                {assetAccounts.length === 0 && (
                  <div className="p-2 text-xs text-center text-slate-400">No Asset accounts found (Codes starting with 1)</div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Revenue Account (Revenue Only - e.g., 4000) */}
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Revenue Account (Wixii Revenue/Income Ah Bas)</label>
            <Select value={form.revenueAccountId} onValueChange={(v) => setForm({...form, revenueAccountId: v})}>
              <SelectTrigger className="h-10 text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign size={14} className="text-slate-400"/>
                  <SelectValue placeholder="Select Revenue Account..." />
                </div>
              </SelectTrigger>
              <SelectContent>
                {revenueAccounts.map(acc => (
                  <SelectItem key={acc.id} value={String(acc.id)}>[{acc.accountCode}] {acc.accountName}</SelectItem>
                ))}
                {revenueAccounts.length === 0 && (
                  <div className="p-2 text-xs text-center text-slate-400">No Revenue accounts found (Codes starting with 4)</div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Name & Amount */}
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Grant Name</label>
            <Input value={form.grantName} onChange={(e) => setForm({...form, grantName: e.target.value})} required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Amount</label>
            <Input type="number" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Currency</label>
            <Select value={form.currency} onValueChange={(v) => setForm({...form, currency: v})}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem><SelectItem value="SOS">SOS</SelectItem></SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="space-y-1"><label className="text-xs font-semibold text-slate-500 uppercase">Start Date</label><Input type="date" value={form.startDate} onChange={(e) => setForm({...form, startDate: e.target.value})} required /></div>
          <div className="space-y-1"><label className="text-xs font-semibold text-slate-500 uppercase">End Date</label><Input type="date" value={form.endDate} onChange={(e) => setForm({...form, endDate: e.target.value})} required /></div>

          {/* Items */}
          <div className="col-span-2 border-t pt-3 space-y-2">
            <div className="flex justify-between items-center"><label className="text-xs font-semibold text-slate-500 uppercase">Items & Allocations</label><Button type="button" onClick={handleAddItem} className="h-7 text-xs"><Plus size={14}/> Add Item</Button></div>
            {form.items.map((item, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Select value={item.itemId} onValueChange={(v) => handleItemChange(index, "itemId", v)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Item" /></SelectTrigger>
                  <SelectContent>{sanitizedAvailableItems.map(i => <SelectItem key={i.computedId} value={i.computedId}>{i.itemName}</SelectItem>)}</SelectContent>
                </Select>
                <Input className="w-20" type="number" placeholder="Qty" value={item.qty} onChange={(e) => handleItemChange(index, "qty", e.target.value)} />
                <Button variant="ghost" className="text-red-500" onClick={() => handleRemoveItem(index)}><Trash2 size={16}/></Button>
              </div>
            ))}
          </div>

          <div className="col-span-2 pt-4 border-t flex justify-end gap-2">
            <Button type="submit" className="bg-[#1e3a8a]" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Grant"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}