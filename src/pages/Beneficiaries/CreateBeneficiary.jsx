import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderOpen } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CreateBeneficiary({ 
  isOpen, 
  onClose, 
  refreshBeneficiaries, 
  beneficiaryToEdit, 
  projects, 
  createBeneficiary, 
  updateBeneficiary 
}) {
  const [form, setForm] = useState({
    fullName: "",
    projectId: "",
    phone: "",
    idNumber: "",          
    gender: "Male",
    assistanceType: "",    
    quantityReceived: "",  
    unitType: "Items",     
    familySize: "",        
    location: "",          
    registrationDate: "",
    notes: "",
  });

  useEffect(() => {
    if (isOpen) {
      if (beneficiaryToEdit) {
        setForm(beneficiaryToEdit);
      } else {
        const defaultProjectId = projects && projects.length > 0 ? projects[0].id : "";
        setForm({
          fullName: "",
          projectId: defaultProjectId,
          phone: "",
          idNumber: "",
          gender: "Male",
          assistanceType: "",
          quantityReceived: "",
          unitType: "Items",
          familySize: "",
          location: "",
          registrationDate: new Date().toISOString().split("T")[0],
          notes: "",
        });
      }
    }
  }, [beneficiaryToEdit, isOpen, projects]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSave = {
      ...form,
      familySize: parseInt(form.familySize) || 0,
      quantityReceived: parseFloat(form.quantityReceived) || 0,
    };

    if (beneficiaryToEdit?.id) {
      await updateBeneficiary(beneficiaryToEdit.id, dataToSave);
    } else {
      await createBeneficiary(dataToSave);
    }
    onClose();
    refreshBeneficiaries();
  };

  const isSubmitDisabled = !form.fullName || !form.projectId || !form.phone || !form.assistanceType || !form.quantityReceived;

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[480px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl overflow-hidden max-h-auto shadow-xl">
        <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="text-[#1e3a8a] dark:text-blue-400 text-base font-bold uppercase tracking-wider">
            {beneficiaryToEdit ? "Edit Beneficiary Info" : "Register Beneficiary"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-3 gap-y-2 pt-2">
          
          {/* Connected Project (Shadcn Popover Select) */}
          <div className="col-span-2 space-y-0.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase">Connected Project</label>
            <Select 
              value={form.projectId} 
              onValueChange={(value) => setForm({ ...form, projectId: value })}
            >
              <SelectTrigger className="h-9 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 text-xs focus:ring-2 focus:ring-blue-600 outline-none text-slate-900 dark:text-slate-100 font-medium border-l-4 border-l-blue-600 relative text-left">
                <FolderOpen className="absolute left-3 top-2.5 text-blue-600 dark:text-blue-400 pointer-events-none" size={14} />
                <SelectValue placeholder="-- Select Connected Project --" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-md">
                {projects && projects.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs cursor-pointer">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Full Name */}
          <div className="col-span-2 space-y-0.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase">Beneficiary Full Name</label>
            <Input
              placeholder="E.g., Axmed Maxamed Cali"
              className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-0.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase">Phone Number</label>
            <Input
              placeholder="E.g., 61xxxxxxx"
              className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>

          {/* ID / Card Number */}
          <div className="space-y-0.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase">ID / Card Number</label>
            <Input
              placeholder="BEN-0094"
              className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-mono"
              value={form.idNumber}
              onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
            />
          </div>

          {/* 🌟 SOO CELIN: Gender (Shadcn Dropdown Style) */}
          <div className="space-y-0.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase">Gender</label>
            <Select 
              value={form.gender} 
              onValueChange={(value) => setForm({ ...form, gender: value })}
            >
              <SelectTrigger className="h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs focus:ring-2 focus:ring-blue-600 outline-none text-slate-900 dark:text-slate-100 text-left">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-md">
                <SelectItem value="Male" className="text-xs cursor-pointer">Male</SelectItem>
                <SelectItem value="Female" className="text-xs cursor-pointer">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Family Size */}
          <div className="space-y-0.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase">Family Size</label>
            <Input
              type="number"
              placeholder="E.g., 6"
              className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
              value={form.familySize}
              onChange={(e) => setForm({ ...form, familySize: e.target.value })}
              required
            />
          </div>

          {/* Type of Assistance */}
          <div className="col-span-2 space-y-0.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase">Assistance Type</label>
            <Input
              placeholder="E.g., Cash Distribution, Food Basket..."
              className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
              value={form.assistanceType}
              onChange={(e) => setForm({ ...form, assistanceType: e.target.value })}
              required
            />
          </div>

          {/* Quantity Distributed */}
          <div className="space-y-0.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase">Distributed Qty</label>
            <Input
              type="number"
              placeholder="E.g., 100"
              className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-mono text-slate-900 dark:text-slate-100"
              value={form.quantityReceived}
              onChange={(e) => setForm({ ...form, quantityReceived: e.target.value })}
              required
            />
          </div>

          {/* 🌟 SOO CELIN: Unit Type (Shadcn Dropdown Style) */}
          <div className="space-y-0.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase">Unit Type</label>
            <Select 
              value={form.unitType} 
              onValueChange={(value) => setForm({ ...form, unitType: value })}
            >
              <SelectTrigger className="h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs focus:ring-2 focus:ring-blue-600 outline-none text-slate-900 dark:text-slate-100 text-left">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-md">
                <SelectItem value="USD" className="text-xs cursor-pointer">USD ($)</SelectItem>
                <SelectItem value="Bags" className="text-xs cursor-pointer">Bags (Kiishash)</SelectItem>
                <SelectItem value="Kits" className="text-xs cursor-pointer">Kits (Xirmooyin)</SelectItem>
                <SelectItem value="Items" className="text-xs cursor-pointer">Items (Xabbo)</SelectItem>
                <SelectItem value="Liters" className="text-xs cursor-pointer">Liters (Litir)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location / Camp */}
          <div className="space-y-0.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase">Village / Camp Location</label>
            <Input
              placeholder="E.g., Ceelwaaq"
              className="h-9 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              required
            />
          </div>

          {/* Registration Date */}
          <div className="space-y-0.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase">Registration Date</label>
            <Input
              type="date"
              className="h-9 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              value={form.registrationDate}
              onChange={(e) => setForm({ ...form, registrationDate: e.target.value })}
              required
            />
          </div>

          {/* Vulnerability Notes */}
          <div className="col-span-2 space-y-0.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase">Notes / Vulnerability Status</label>
            <Input
              placeholder="E.g., Orphan caretakers..."
              className="h-9 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {/* Action Buttons */}
          <div className="col-span-2 flex justify-end gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={onClose} className="h-8 text-xs">Cancel</Button>
            <Button 
              type="submit" 
              className={`h-8 text-xs text-white shadow-sm border-none transition-all ${isSubmitDisabled ? "bg-blue-400 cursor-not-allowed" : "bg-[#1e3a8a] dark:bg-blue-600 hover:bg-[#172554]"}`}
              disabled={isSubmitDisabled}
            >
              {beneficiaryToEdit ? "Update Info" : "Register Beneficiary"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}