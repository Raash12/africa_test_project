import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Layers } from "lucide-react"; // Icon ku habboon barnaamijyada

export default function CreateProgram({ isOpen, onClose, refreshPrograms, programToEdit, createProgram, updateProgram }) {
  const [form, setForm] = useState({
    programName: "",
    programCode: "",
    description: "",
  });

  useEffect(() => {
    if (programToEdit) {
      setForm(programToEdit);
    } else {
      setForm({
        programName: "",
        programCode: "",
        description: "",
      });
    }
  }, [programToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const dataToSave = {
      ...form,
      programCode: form.programCode.toUpperCase().trim(), // Had iyo jeer Code-ka ka dhig xarfo waaweyn
    };

    if (programToEdit?.id) {
      await updateProgram(programToEdit.id, dataToSave);
    } else {
      await createProgram(dataToSave);
    }
    handleClose();
    refreshPrograms();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-[#1e3a8a] dark:text-blue-400 text-lg font-bold uppercase tracking-wider">
            {programToEdit ? "Edit Program Category" : "Add New Program"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 pt-4">
          
          {/* Program Name */}
          <div className="col-span-2 md:col-span-1 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Program Name</label>
            <Input
              placeholder="E.g., Water Well, Cataract"
              className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
              value={form.programName}
              onChange={(e) => setForm({ ...form, programName: e.target.value })}
              required
            />
          </div>

          {/* Program Code */}
          <div className="col-span-2 md:col-span-1 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Program Code (Slug)</label>
            <div className="relative">
              <Input
                placeholder="E.g., WW, CAT, KRB"
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none pl-3 pr-8 font-mono font-bold"
                value={form.programCode}
                onChange={(e) => setForm({ ...form, programCode: e.target.value })}
                required
              />
              <Layers className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
            </div>
          </div>

          {/* Description */}
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Description / Scope of Work</label>
            <textarea
              placeholder="Describe the main focus and sector of this program..."
              className="flex min-h-[80px] w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Action Buttons */}
          <div className="col-span-2 flex justify-end gap-3 mt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="border-slate-200 dark:border-slate-700">Cancel</Button>
            <Button type="submit" className="bg-[#1e3a8a] dark:bg-blue-600 hover:bg-[#172554] dark:hover:bg-blue-700 text-white shadow-md border-none transition-all">
              {programToEdit ? "Update Program" : "Save Program"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}