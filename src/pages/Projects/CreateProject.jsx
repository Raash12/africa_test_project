// src/pages/projects/CreateProject.jsx
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import useDonors from "@/hooks/useDonors";
import useItems from "@/hooks/useItems";
import { createProject, updateProject } from "@/services/projects/projectService";

const getEmptyForm = () => ({
  donorId: "",
  donorName: "",
  projectName: "",
  itemId: "",
  itemName: "",
  quantity: "",
  unitPrice: "",
  startDate: "",
  endDate: "",
});

const SHOW_ITEM_DROPDOWN = ["Xoolo", "Xoolo Irmaan", "Iftar Program"];
const SHOW_NUMERIC_FIELDS = ["Xoolo", "Xoolo Irmaan", "Iftar Program", "Ceel Biyood", "Kurbaan/Carafo"];

export default function CreateProject({ isOpen, onClose, refreshProjects, projectToEdit }) {
  const { donors = [] } = useDonors();
  const { items = [] } = useItems();
  const [form, setForm] = useState(getEmptyForm());

  useEffect(() => {
    if (projectToEdit) {
      setForm({ ...getEmptyForm(), ...projectToEdit });
    } else {
      setForm(getEmptyForm());
    }
  }, [projectToEdit, isOpen]);

  const hasItemDropdown = SHOW_ITEM_DROPDOWN.includes(form.projectName);
  const hasNumericFields = SHOW_NUMERIC_FIELDS.includes(form.projectName);

  const qty = Number(form.quantity) || 0;
  const price = Number(form.unitPrice) || 0;
  const totalBudget = qty * price;
  const advancePayment = totalBudget / 2;
  const remainingBalance = totalBudget / 2;

  const cleanForFirestore = (data) =>
    Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== "" && v !== undefined)
    );

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!form.donorId || !form.projectName) {
        alert("Fadlan dooro Donor iyo Project Type");
        return;
      }

      const finalPayload = cleanForFirestore({
        ...form,
        totalBudget,
        advancePayment,
        remainingBalance,
      });

      if (projectToEdit?.id) {
        await updateProject(projectToEdit.id, finalPayload);
      } else {
        await createProject(finalPayload);
      }

      await refreshProjects();
      onClose();
    } catch (error) {
      console.error("SAVE ERROR:", error);
      alert("Wuu ku guuldareystay keydinta mashruuca");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[550px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-2xl transition-all duration-200">
        
        <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <DialogTitle className="text-[#1e3a8a] dark:text-blue-400 text-xl font-extrabold uppercase tracking-tight">
            {projectToEdit ? "✍️ Edit Project Setup" : "🚀 Add New Project"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Fill in the details below to configure the humanitarian project parameters.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          
          {/* DONOR SELECT */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Donor / Partner</label>
            <Select
              value={form.donorId}
              onValueChange={(value) => {
                const donor = donors?.find((d) => d.id === value);
                if (donor) {
                  setForm((prev) => ({
                    ...prev,
                    donorId: donor.id,
                    donorName: donor.donorName,
                  }));
                }
              }}
            >
              <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all">
                <SelectValue placeholder="Select Donor" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl">
                {donors?.map((d) => (
                  <SelectItem key={d.id} value={d.id} className="cursor-pointer rounded-lg">
                    {d.donorName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* PROJECT TYPE SELECT */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Project Category</label>
            <Select
              value={form.projectName}
              onValueChange={(val) =>
                setForm((prev) => ({
                  ...prev,
                  projectName: val,
                  itemId: "",
                  itemName: "",
                  quantity: "",
                  unitPrice: "",
                }))
              }
            >
              <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all">
                <SelectValue placeholder="Choose Project" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl">
                <SelectItem value="Xoolo" className="cursor-pointer rounded-lg">Xoolo</SelectItem>
                <SelectItem value="Kurbaan/Carafo" className="cursor-pointer rounded-lg">Kurbaan/Carafo</SelectItem>
                <SelectItem value="Xoolo Irmaan" className="cursor-pointer rounded-lg">Xoolo Irmaan</SelectItem>
                <SelectItem value="Ceel Biyood" className="cursor-pointer rounded-lg">Ceel Biyood</SelectItem>
                <SelectItem value="Iftar Program" className="cursor-pointer rounded-lg">Iftar Program</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* DYNAMIC INPUT SECTION */}
          {hasNumericFields && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 shadow-inner">
              
              {/* ITEM DROPDOWN */}
              {hasItemDropdown && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Select Inventory Item</label>
                  <Select
                    value={form.itemId}
                    onValueChange={(value) => {
                      const item = items?.find((i) => i.id === value);
                      if (item) {
                        setForm((prev) => ({
                          ...prev,
                          itemId: item.id,
                          itemName: item.itemName,
                        }));
                      }
                    }}
                  >
                    <SelectTrigger className="h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl">
                      <SelectValue placeholder="Select Item" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl">
                      {items?.map((item) => (
                        <SelectItem key={item.id} value={item.id} className="cursor-pointer rounded-lg">
                          {item.itemName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* QUANTITY IYO UNIT PRICE */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Quantity</label>
                  <Input
                    type="number"
                    value={form.quantity}
                    onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                    className="h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Unit Price ($)</label>
                  <Input
                    type="number"
                    value={form.unitPrice}
                    onChange={(e) => setForm((prev) => ({ ...prev, unitPrice: e.target.value }))}
                    className="h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TOTALS PANEL */}
          <div className="bg-slate-950 dark:bg-slate-950 text-slate-100 p-4 rounded-2xl border border-slate-800/80 space-y-2.5 shadow-xl font-mono text-xs">
            <div className="flex justify-between border-b border-slate-800/60 pb-2 items-center">
              <span className="text-slate-400 font-sans tracking-wide uppercase font-bold text-[10px]">Total Budget</span>
              <span className="text-green-400 font-bold text-base">${totalBudget.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/60 py-1.5 items-center">
              <span className="text-slate-400 font-sans tracking-wide uppercase font-bold text-[10px]">Advance Payment (50%)</span>
              <span className="text-blue-400 font-semibold text-sm">${advancePayment.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-1 items-center">
              <span className="text-slate-400 font-sans tracking-wide uppercase font-bold text-[10px]">Remaining Balance</span>
              <span className="text-amber-400 font-semibold text-sm">${remainingBalance.toLocaleString()}</span>
            </div>
          </div>

          {/* ACTIONS BUTTONS */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="h-11 px-5 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-semibold transition-all cursor-pointer"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="h-11 px-6 bg-[#1e3a8a] dark:bg-blue-600 hover:bg-[#172554] dark:hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-900/20 transition-all cursor-pointer"
            >
              {projectToEdit ? "Update Project" : "Save Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}