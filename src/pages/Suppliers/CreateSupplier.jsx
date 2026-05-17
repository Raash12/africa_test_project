import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Phone, Mail, MapPin } from "lucide-react";

export default function CreateSupplier({ isOpen, onClose, refreshSuppliers, supplierToEdit, createSupplier, updateSupplier }) {
  const [form, setForm] = useState({
    supplierName: "",
    company: "",
    phone: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    if (supplierToEdit) {
      setForm({ ...supplierToEdit });
    } else {
      setForm({
        supplierName: "",
        company: "",
        phone: "",
        email: "",
        address: "",
      });
    }
  }, [supplierToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (supplierToEdit?.id) {
      await updateSupplier(supplierToEdit.id, form);
    } else {
      await createSupplier(form);
    }
    handleClose();
    refreshSuppliers();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg shadow-xl overflow-hidden">
        <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="text-[#1e3a8a] dark:text-blue-400 text-base font-bold uppercase tracking-wider">
            {supplierToEdit ? "Edit Supplier Details" : "Register New Supplier"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-4 gap-y-3 pt-4">
          
          {/* Supplier Contact Name */}
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Contact Person Name</label>
            <div className="relative">
              <Input
                placeholder="E.g., Mohamed Ahmed"
                className="h-10 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
                value={form.supplierName}
                onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Company Name */}
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Company Name</label>
            <div className="relative">
              <Building2 size={16} className="absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="E.g., Somali Electronics Ltd"
                className="h-10 pl-10 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Phone Number</label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="E.g., +25261xxxxxxx"
                className="h-10 pl-9 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none font-mono"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Email Address</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-3 text-slate-400" />
              <Input
                type="email"
                placeholder="info@company.so"
                className="h-10 pl-9 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          {/* Business Address */}
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Business Office Address</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="E.g., Maka Al Mukarama Road, Hodan, Mogadishu"
                className="h-10 pl-10 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="col-span-2 flex justify-end gap-2 mt-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={handleClose} className="h-9 text-xs border-slate-200 dark:border-slate-700 cursor-pointer">Cancel</Button>
            <Button type="submit" className="h-9 text-xs bg-[#1e3a8a] dark:bg-blue-600 hover:bg-[#172554] dark:hover:bg-blue-700 text-white shadow-md border-none transition-all cursor-pointer">
              {supplierToEdit ? "Update Supplier" : "Save Supplier"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}