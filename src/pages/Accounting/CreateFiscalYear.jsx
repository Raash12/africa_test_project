import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Calendar, FileText } from "lucide-react";

export default function CreateFiscalYear({ 
  isOpen, 
  onClose, 
  refreshFiscalYears, 
  fiscalYearToEdit, 
  createFiscalYear, 
  updateFiscalYear 
}) {
  const [form, setForm] = useState({
    yearName: "",
    startDate: "",
    endDate: "",
    status: "Active",
    description: "",
  });

  useEffect(() => {
    if (fiscalYearToEdit) {
      setForm({
        yearName: fiscalYearToEdit.yearName || "",
        startDate: fiscalYearToEdit.startDate || "",
        endDate: fiscalYearToEdit.endDate || "",
        status: fiscalYearToEdit.status || "Active",
        description: fiscalYearToEdit.description || "",
      });
    } else {
      setForm({
        yearName: "",
        startDate: "",
        endDate: "",
        status: "Active",
        description: "",
      });
    }
  }, [fiscalYearToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (fiscalYearToEdit?.id) {
        await updateFiscalYear(fiscalYearToEdit.id, form);
      } else {
        await createFiscalYear(form);
      }
      handleClose();
      await refreshFiscalYears();
    } catch (error) {
      console.error("Error saving fiscal year:", error);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg shadow-xl overflow-hidden">
        <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="text-[#1e3a8a] dark:text-blue-400 text-base font-bold uppercase tracking-wider">
            {fiscalYearToEdit ? "Edit Fiscal Year" : "Register New Fiscal Year"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-4 gap-y-3 pt-4">
          
          {/* Fiscal Year Title */}
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Fiscal Year Title / Name</label>
            <div className="relative">
              <BookOpen size={16} className="absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="E.g., FY-2026 or Core Finance Book 2026"
                className="h-10 pl-10 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
                value={form.yearName}
                onChange={(e) => setForm({ ...form, yearName: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Start Date */}
          <div className="space-y-1 col-span-2 sm:col-span-1">
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
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">End Date</label>
            <Input
              type="date"
              className="h-10 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              required
            />
          </div>

          {/* Status Dropdown */}
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full h-10 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none appearance-none cursor-pointer"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Description */}
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Description / Notes</label>
            <div className="relative">
              <FileText size={16} className="absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="Enter reference notes here..."
                className="h-10 pl-10 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="col-span-2 flex justify-end gap-2 mt-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={handleClose} className="h-9 text-xs border-slate-200 dark:border-slate-700 cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" className="h-9 text-xs bg-[#1e3a8a] dark:bg-blue-600 hover:bg-[#172554] dark:hover:bg-blue-700 text-white shadow-md border-none transition-all cursor-pointer">
              {fiscalYearToEdit ? "Update Year" : "Save Year"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}