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
import { UserCircle, Layers, DollarSign, Plus, Trash2, Box } from "lucide-react";

export default function CreateGrant({ 
  isOpen, 
  onClose, 
  refreshGrants, 
  grantToEdit, 
  donors = [], 
  programs = [], 
  items = [], // Liiska alaabta ka imaanaya inventory-gaaga
  createGrant, 
  updateGrant 
}) {

  const [form, setForm] = useState({
    grantName: "",
    donorId: "",
    programId: "", 
    amount: "",
    currency: "USD",
    startDate: "",
    endDate: "",
    notes: "",
    items: [{ itemId: "", qty: "" }] 
  });

  // U diyaari xogta items-ka fallback haddii Firestore ID-ga aan la soo map-garayn
  const sanitizedAvailableItems = items.map((availItem, index) => {
    // Haddii id ama _id uu jiro qaado, haddii kale u bixi ID ku salaysan magaca ama index-ka
    const itemId = availItem.id || availItem._id || `item-fallback-${index}-${availItem.itemName?.replace(/\s+/g, '-').toLowerCase()}`;
    return {
      ...availItem,
      computedId: String(itemId)
    };
  });

  useEffect(() => {
    if (grantToEdit) {
      setForm({
        ...grantToEdit,
        donorId: grantToEdit.donorId ? String(grantToEdit.donorId) : "",
        programId: grantToEdit.programId ? String(grantToEdit.programId) : "",
        items: grantToEdit.items && grantToEdit.items.length > 0 
          ? grantToEdit.items.map(it => ({ itemId: String(it.itemId || it.id || ""), qty: String(it.qty || "") }))
          : [{ itemId: "", qty: "" }]
      });
    } else {
      setForm({
        grantName: "",
        donorId: donors.length > 0 ? String(donors[0].id || donors[0]._id || "") : "", 
        programId: programs.length > 0 ? String(programs[0].id || programs[0]._id || "") : "", 
        amount: "",
        currency: "USD",
        startDate: "",
        endDate: "",
        notes: "",
        items: [{ itemId: "", qty: "" }] 
      });
    }
  }, [grantToEdit, isOpen, donors, programs]);

  const handleAddItem = () => {
    setForm({ ...form, items: [...form.items, { itemId: "", qty: "" }] });
  };

  const handleRemoveItem = (index) => {
    const updatedItems = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items: updatedItems });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...form.items];
    updatedItems[index][field] = value;
    setForm({ ...form, items: updatedItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSave = {
      ...form,
      amount: parseFloat(form.amount) || 0,
      items: form.items
        .filter(item => item.itemId !== "") 
        .map(item => ({
          itemId: item.itemId,
          qty: parseInt(item.qty, 10) || 0
        }))
    };

    if (grantToEdit?.id) {
      await updateGrant(grantToEdit.id, dataToSave);
    } else {
      await createGrant(dataToSave);
    }
    handleClose();
    refreshGrants();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        
        <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="text-[#1e3a8a] dark:text-blue-400 text-base font-bold uppercase tracking-wider">
            {grantToEdit ? "Edit Grant Funding" : "Allocate New Grant"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Grant allocation setup for donors, programs, and inventory items.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-4 gap-y-3 pt-4">
          
          {/* Donor Select */}
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Select Funding Donor</label>
            <Select 
              modal={false}
              value={form.donorId || undefined} 
              onValueChange={(value) => setForm({ ...form, donorId: value })}
            >
              <SelectTrigger className="h-10 text-sm bg-white dark:bg-slate-800 border-slate-200 text-slate-900 dark:text-slate-100 font-medium">
                <div className="flex items-center gap-2">
                  <UserCircle size={16} className="text-slate-400" />
                  <SelectValue placeholder="-- Select Donor --" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm">
                {donors?.map((d) => (
                  <SelectItem key={d.id || d._id} value={String(d.id || d._id)} className="cursor-pointer">
                    {d.donorName || d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Program Select */}
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Select Program</label>
            <Select 
              modal={false}
              value={form.programId || undefined} 
              onValueChange={(value) => setForm({ ...form, programId: value })}
            >
              <SelectTrigger className="h-10 text-sm bg-white dark:bg-slate-800 border-slate-200 text-slate-900 dark:text-slate-100 font-medium">
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-slate-400" />
                  <SelectValue placeholder="-- Select Program --" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm">
                {programs?.map((p) => (
                  <SelectItem key={p.id || p._id} value={String(p.id || p._id)} className="cursor-pointer">
                    {p.programName || p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Grant Name */}
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Grant Name</label>
            <Input
              placeholder="E.g., Water Support 2026"
              className="h-10 text-sm bg-white dark:bg-slate-800 border-slate-200 text-slate-900 dark:text-slate-100"
              value={form.grantName}
              onChange={(e) => setForm({ ...form, grantName: e.target.value })}
              required
            />
          </div>

          {/* Amount & Currency */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Total Amount</label>
            <Input
              type="number"
              placeholder="Amount"
              className="h-10 text-sm bg-white dark:bg-slate-800 border-slate-200 text-slate-900 dark:text-slate-100 font-mono"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Currency</label>
            <Select 
              modal={false}
              value={form.currency} 
              onValueChange={(value) => setForm({ ...form, currency: value })}
            >
              <SelectTrigger className="h-10 text-sm bg-white dark:bg-slate-800 border-slate-200">
                <div className="flex items-center gap-2">
                  <DollarSign size={14} className="text-slate-400" />
                  <SelectValue placeholder="USD" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm">
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="SOS">SOS (Sh.So.)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Start Date</label>
            <Input
              type="date"
              className="h-10 text-sm bg-white dark:bg-slate-800 border-slate-200"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">End Date</label>
            <Input
              type="date"
              className="h-10 text-sm bg-white dark:bg-slate-800 border-slate-200"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              required
            />
          </div>

          {/* Dynamic Items Dropdown Section */}
          <div className="col-span-2 border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-500 uppercase">Items & Allocations</label>
              <Button 
                type="button" 
                onClick={handleAddItem} 
                className="h-7 px-2.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-[#1e3a8a] text-slate-700 dark:text-slate-300 hover:text-white rounded flex items-center gap-1 border border-slate-200"
              >
                <Plus size={14} /> Add Item
              </Button>
            </div>

            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {form.items.map((item, index) => (
                <div key={index} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800/60">
                  
                  {/* Select Dropdown */}
                  <div className="flex-1">
                    <Select 
                      modal={false}
                      value={item.itemId || ""} 
                      onValueChange={(value) => handleItemChange(index, "itemId", value)}
                    >
                      <SelectTrigger className="h-9 text-sm bg-white dark:bg-slate-800 border-slate-200 text-slate-900 dark:text-slate-100 font-medium">
                        <div className="flex items-center gap-2">
                          <Box size={14} className="text-slate-400 flex-shrink-0" />
                          <SelectValue placeholder="-- Select Item --" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm max-h-[200px]">
                        {sanitizedAvailableItems && sanitizedAvailableItems.length > 0 ? (
                          sanitizedAvailableItems.map((availItem) => (
                            <SelectItem 
                              key={availItem.computedId} 
                              value={availItem.computedId} 
                              className="cursor-pointer"
                            >
                              {availItem.itemName || "Unnamed Item"}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-xs text-slate-400 text-center">No items available</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quantity */}
                  <Input 
                    type="number" 
                    placeholder="Qty" 
                    className="h-9 w-24 text-sm bg-white dark:bg-slate-800 border-slate-200 text-center font-mono"
                    value={item.qty}
                    onChange={(e) => handleItemChange(index, "qty", e.target.value)}
                    required
                  />

                  {/* Remove row button */}
                  {form.items.length > 1 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => handleRemoveItem(index)} 
                      className="h-9 w-9 p-0 text-red-500"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Notes / Budget Description</label>
            <Input
              placeholder="Internal notes or project constraints..."
              className="h-10 text-sm bg-white dark:bg-slate-800 border-slate-200"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {/* Action Buttons */}
          <div className="col-span-2 flex justify-end gap-2 mt-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={handleClose} className="h-9 text-xs">Cancel</Button>
            <Button type="submit" className="h-9 text-xs bg-[#1e3a8a] dark:bg-blue-600 text-white shadow-md">
              {grantToEdit ? "Update Grant" : "Save Grant"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}