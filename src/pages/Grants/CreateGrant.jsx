import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"; // 🌟 Qaybaha shadcn/ui select
import { UserCircle, Layers, DollarSign } from "lucide-react";

export default function CreateGrant({ isOpen, onClose, refreshGrants, grantToEdit, donors, programs, createGrant, updateGrant }) {
  const [form, setForm] = useState({
    grantName: "",
    donorId: "",
    programId: "", 
    amount: "",
    currency: "USD",
    startDate: "",
    endDate: "",
    notes: "",
  });

  useEffect(() => {
    if (grantToEdit) {
      // Hubi in ID-yadu ay yihiin string si uu shadcn select u qabsado
      setForm({
        ...grantToEdit,
        donorId: grantToEdit.donorId ? String(grantToEdit.donorId) : "",
        programId: grantToEdit.programId ? String(grantToEdit.programId) : "",
      });
    } else {
      setForm({
        grantName: "",
        donorId: donors[0]?.id ? String(donors[0].id) : "",
        programId: programs[0]?.id ? String(programs[0].id) : "", 
        amount: "",
        currency: "USD",
        startDate: "",
        endDate: "",
        notes: "",
      });
    }
  }, [grantToEdit, isOpen, donors, programs]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const dataToSave = {
      ...form,
      amount: parseFloat(form.amount) || 0,
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
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg shadow-xl overflow-hidden">
        <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="text-[#1e3a8a] dark:text-blue-400 text-base font-bold uppercase tracking-wider">
            {grantToEdit ? "Edit Grant Funding" : "Allocate New Grant"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-4 gap-y-3 pt-4">
          
          {/* 🌟 Professional Select: Donor */}
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Select Funding Donor</label>
            <Select 
              value={form.donorId ? String(form.donorId) : undefined} 
              onValueChange={(value) => setForm({ ...form, donorId: value })}
            >
              <SelectTrigger className="h-10 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 font-medium">
                <div className="flex items-center gap-2">
                  <UserCircle size={16} className="text-slate-400" />
                  <SelectValue placeholder="-- Select Donor --" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm">
                {donors && donors.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)} className="cursor-pointer">
                    {d.donorName} ({d.country})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 🌟 Professional Select: Program */}
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Select Program</label>
            <Select 
              value={form.programId ? String(form.programId) : undefined} 
              onValueChange={(value) => setForm({ ...form, programId: value })}
            >
              <SelectTrigger className="h-10 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 font-medium">
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-slate-400" />
                  <SelectValue placeholder="-- Select Program --" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm">
                {programs && programs.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)} className="cursor-pointer">
                    {p.programName} ({p.programCode})
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
              className="h-10 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
              value={form.grantName}
              onChange={(e) => setForm({ ...form, grantName: e.target.value })}
              required
            />
          </div>

          {/* Total Amount */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Total Amount</label>
            <Input
              type="number"
              placeholder="Amount"
              className="h-10 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none font-mono"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
          </div>

          {/* 🌟 Professional Select: Currency */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Currency</label>
            <Select 
              value={form.currency} 
              onValueChange={(value) => setForm({ ...form, currency: value })}
            >
              <SelectTrigger className="h-10 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 font-medium">
                <div className="flex items-center gap-2">
                  <DollarSign size={14} className="text-slate-400" />
                  <SelectValue placeholder="Select Currency" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm">
                <SelectItem value="USD" className="cursor-pointer">USD ($)</SelectItem>
                <SelectItem value="EUR" className="cursor-pointer">EUR (€)</SelectItem>
                <SelectItem value="SOS" className="cursor-pointer">SOS (Sh.So.)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Start Date</label>
            <Input
              type="date"
              className="h-10 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              required
            />
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">End Date</label>
            <Input
              type="date"
              className="h-10 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              required
            />
          </div>

          {/* Notes */}
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Notes / Budget Description</label>
            <Input
              placeholder="Internal notes or project constraints..."
              className="h-10 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {/* Action Buttons */}
          <div className="col-span-2 flex justify-end gap-2 mt-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={handleClose} className="h-9 text-xs border-slate-200 dark:border-slate-700">Cancel</Button>
            <Button type="submit" className="h-9 text-xs bg-[#1e3a8a] dark:bg-blue-600 hover:bg-[#172554] dark:hover:bg-blue-700 text-white shadow-md border-none transition-all">
              {grantToEdit ? "Update Grant" : "Save Grant"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}