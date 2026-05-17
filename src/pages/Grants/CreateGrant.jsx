import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserCircle, Layers } from "lucide-react";

export default function CreateGrant({ isOpen, onClose, refreshGrants, grantToEdit, donors, programs, createGrant, updateGrant }) {
  const [form, setForm] = useState({
    grantName: "",
    donorId: "",
    programId: "", // Ku dar barnaamijka id-giisa
    amount: "",
    currency: "USD",
    startDate: "",
    endDate: "",
    notes: "",
  });

  useEffect(() => {
    if (grantToEdit) {
      setForm(grantToEdit);
    } else {
      setForm({
        grantName: "",
        donorId: donors[0]?.id || "",
        programId: programs[0]?.id || "", // Default ka dhig barnaamijka koobaad
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
    
    // Hubi in lacagtu tahay Number
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
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-[#1e3a8a] dark:text-blue-400 text-lg font-bold uppercase tracking-wider">
            {grantToEdit ? "Edit Grant Funding" : "Allocate New Grant"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 pt-4">
          
          {/* Select Donor Link */}
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Select Funding Donor</label>
            <div className="relative">
              <select
                className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none appearance-none text-slate-900 dark:text-slate-100"
                value={form.donorId}
                onChange={(e) => setForm({ ...form, donorId: e.target.value })}
                required
              >
                <option value="" disabled>-- Select Donor --</option>
                {donors.map((d) => (
                  <option key={d.id} value={d.id}>
                     {d.donorName} ({d.country})
                  </option>
                ))}
              </select>
              <UserCircle className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
            </div>
          </div>

          {/* 🌟 SELECT PROGRAM DROPDOWN (KAN WAA KAN CUSUB) */}
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Select Program</label>
            <div className="relative">
              <select
                className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none appearance-none text-slate-900 dark:text-slate-100"
                value={form.programId}
                onChange={(e) => setForm({ ...form, programId: e.target.value })}
                required
              >
                <option value="" disabled>-- Select Program --</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                     {p.programName} ({p.programCode})
                  </option>
                ))}
              </select>
              <Layers className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
            </div>
          </div>

          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Grant Name</label>
            <Input
              placeholder="E.g., Water Support 2026"
              className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
              value={form.grantName}
              onChange={(e) => setForm({ ...form, grantName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Total Amount</label>
            <Input
              type="number"
              placeholder="Amount"
              className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Currency</label>
            <select
              className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-slate-900 dark:text-slate-100"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="SOS">SOS (Sh.So.)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Start Date</label>
            <Input
              type="date"
              className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">End Date</label>
            <Input
              type="date"
              className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              required
            />
          </div>

          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Notes / Budget Description</label>
            <Input
              placeholder="Internal notes or project constraints..."
              className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="col-span-2 flex justify-end gap-3 mt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="border-slate-200 dark:border-slate-700">Cancel</Button>
            <Button type="submit" className="bg-[#1e3a8a] dark:bg-blue-600 hover:bg-[#172554] dark:hover:bg-blue-700 text-white shadow-md border-none transition-all">
              {grantToEdit ? "Update Grant" : "Save Grant"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}