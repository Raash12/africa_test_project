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
} from "@/components/ui/select"; 
import { FolderOpen, User, Layers } from "lucide-react"; 

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
        setForm({
          ...beneficiaryToEdit,
          projectId: beneficiaryToEdit.projectId ? String(beneficiaryToEdit.projectId) : "",
        });
      } else {
        const defaultProjectId = projects && projects.length > 0 ? String(projects[0].id) : "";
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
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg shadow-xl overflow-hidden max-h-auto">
        <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="text-[#1e3a8a] dark:text-blue-400 text-base font-bold uppercase tracking-wider">
            {beneficiaryToEdit ? "Edit Beneficiary Info" : "Register Beneficiary"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-4 gap-y-3 pt-4">
          
          {/* 🌟 Connected Project: Waxaa loo sameeyay sax ahaan qaabka Gender iyo Unit Type */}
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Connected Project</label>
            <Select 
              value={form.projectId ? String(form.projectId) : undefined} 
              onValueChange={(value) => setForm({ ...form, projectId: value })}
            >
              <SelectTrigger className="h-10 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 font-medium">
                <div className="flex items-center gap-2">
                  <FolderOpen size={16} className="text-slate-400" />
                  <SelectValue placeholder="Select Connected Project" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm">
                {projects && projects.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)} className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span>{p.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Full Name */}
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Beneficiary Full Name</label>
            <Input
              placeholder="E.g., Axmed Maxamed Cali"
              className="h-10 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Phone Number</label>
            <Input
              placeholder="E.g., 61xxxxxxx"
              className="h-10 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>

          {/* ID / Card Number */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">ID / Card Number</label>
            <Input
              placeholder="BEN-0094"
              className="h-10 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
              value={form.idNumber}
              onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
            />
          </div>

          {/* Gender Select */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Gender</label>
            <Select 
              value={form.gender} 
              onValueChange={(value) => setForm({ ...form, gender: value })}
            >
              <SelectTrigger className="h-10 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 font-medium">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-slate-400" />
                  <SelectValue placeholder="Select Gender" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm">
                <SelectItem value="Male" className="cursor-pointer">Male</SelectItem>
                <SelectItem value="Female" className="cursor-pointer">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Family Size */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Family Size</label>
            <Input
              type="number"
              placeholder="E.g., 6"
              className="h-10 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
              value={form.familySize}
              onChange={(e) => setForm({ ...form, familySize: e.target.value })}
              required
            />
          </div>

          {/* Assistance Type */}
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Assistance Type</label>
            <Input
              placeholder="E.g., Cash Distribution, Food Basket..."
              className="h-10 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
              value={form.assistanceType}
              onChange={(e) => setForm({ ...form, assistanceType: e.target.value })}
              required
            />
          </div>

          {/* Quantity Received */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Distributed Qty</label>
            <Input
              type="number"
              placeholder="E.g., 100"
              className="h-10 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none font-mono"
              value={form.quantityReceived}
              onChange={(e) => setForm({ ...form, quantityReceived: e.target.value })}
              required
            />
          </div>

          {/* Unit Type Select */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Unit Type</label>
            <Select 
              value={form.unitType} 
              onValueChange={(value) => setForm({ ...form, unitType: value })}
            >
              <SelectTrigger className="h-10 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 font-medium">
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-slate-400" />
                  <SelectValue placeholder="Select Unit" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm">
                <SelectItem value="USD" className="cursor-pointer">USD ($)</SelectItem>
                <SelectItem value="Bags" className="cursor-pointer">Bags (Kiishash)</SelectItem>
                <SelectItem value="Kits" className="cursor-pointer">Kits (Xirmooyin)</SelectItem>
                <SelectItem value="Items" className="cursor-pointer">Items (Xabbo)</SelectItem>
                <SelectItem value="Liters" className="cursor-pointer">Liters (Litir)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Village / Camp Location</label>
            <Input
              placeholder="E.g., Ceelwaaq"
              className="h-10 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              required
            />
          </div>

          {/* Registration Date */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Registration Date</label>
            <Input
              type="date"
              className="h-10 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
              value={form.registrationDate}
              onChange={(e) => setForm({ ...form, registrationDate: e.target.value })}
              required
            />
          </div>

          {/* Notes */}
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Notes / Vulnerability Status</label>
            <Input
              placeholder="E.g., Orphan caretakers..."
              className="h-10 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {/* Action Buttons */}
          <div className="col-span-2 flex justify-end gap-2 mt-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={onClose} className="h-9 text-xs border-slate-200 dark:border-slate-700">Cancel</Button>
            <Button 
              type="submit" 
              className={`h-9 text-xs text-white shadow-md border-none transition-all ${isSubmitDisabled ? "bg-blue-400 cursor-not-allowed hover:bg-blue-400" : "bg-[#1e3a8a] dark:bg-blue-600 hover:bg-[#172554] dark:hover:bg-blue-700"}`}
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