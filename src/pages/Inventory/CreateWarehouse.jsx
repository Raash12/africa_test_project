// pages/Inventory/CreateWarehouse.jsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Home } from "lucide-react";
import { toast } from "sonner";
import { createWarehouse, updateWarehouse } from "@/services/inventory/warehouseService";

export default function CreateWarehouse({ isOpen, onClose, refreshWarehouses, warehouseToEdit }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [warehouseName, setWarehouseName] = useState("");
  const [location, setLocation] = useState("");
  const [manager, setManager] = useState("");

  // Edit Mode Mise New Mode Setup
  useEffect(() => {
    if (warehouseToEdit) {
      setWarehouseName(warehouseToEdit.warehouseName || "");
      setLocation(warehouseToEdit.location || "");
      setManager(warehouseToEdit.manager || "");
    } else {
      setWarehouseName("");
      setLocation("");
      setManager("");
    }
  }, [warehouseToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!warehouseName || !location) {
      toast.error("Fadlan buuxi dhammaan xogta muhiimka ah.");
      return;
    }

    setIsSubmitting(true);
    const warehouseData = {
      warehouseName: warehouseName.toUpperCase(),
      location,
      manager: manager || "N/A"
    };

    try {
      if (warehouseToEdit) {
        await updateWarehouse(warehouseToEdit.id, warehouseData);
        toast.success("Bakhaarka waa la cusboonaysiiyey!");
      } else {
        await createWarehouse(warehouseData);
        toast.success("Bakhaar cusub waa la keydiyey!");
      }
      await refreshWarehouses();
      onClose();
    } catch (error) {
      toast.error("Khalad ayaa dhacay xilliga keydinta sxb.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg flex flex-col overflow-hidden">
        
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="text-xs md:text-sm font-black uppercase tracking-tight flex items-center gap-1.5">
            <Home className="text-[#1e3a8a] dark:text-blue-500" size={16} />
            {warehouseToEdit ? "Edit Warehouse Detail" : "Register New Warehouse"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
          
          <div className="flex flex-col gap-0.5">
            <Label className="text-[10px] font-bold uppercase text-slate-500">Warehouse Name / Title</Label>
            <Input type="text" placeholder="E.g. Hodan Main Warehouse" value={warehouseName} onChange={(e) => setWarehouseName(e.target.value)} className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs h-8" required />
          </div>

          <div className="flex flex-col gap-0.5">
            <Label className="text-[10px] font-bold uppercase text-slate-500">Location / Physical Address</Label>
            <Input type="text" placeholder="E.g. KM4, Mogadishu, Somalia" value={location} onChange={(e) => setLocation(e.target.value)} className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs h-8" required />
          </div>

          <div className="flex flex-col gap-0.5">
            <Label className="text-[10px] font-bold uppercase text-slate-500">Warehouse Manager / Storekeeper</Label>
            <Input type="text" placeholder="E.g. Ahmed Mohamed" value={manager} onChange={(e) => setManager(e.target.value)} className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs h-8" />
          </div>

          <DialogFooter className="gap-1.5 border-t pt-2 mt-1 flex flex-row justify-end w-full">
            <Button type="button" onClick={onClose} disabled={isSubmitting} className="text-xs h-8 px-3 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-none">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="text-xs h-8 px-3 bg-[#1e3a8a] dark:bg-blue-600 text-white border-none cursor-pointer">
              {isSubmitting && <Loader2 size={11} className="animate-spin mr-1" />} Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}