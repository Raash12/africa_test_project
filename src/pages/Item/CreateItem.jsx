import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Hubi inaad shadcn ka soo dhoofsatay textarea
import { Plus } from "lucide-react";
import { createItem } from "@/services/items/itemService";

export default function CreateItem({ refreshItems }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    itemName: "",
    description: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.itemName.trim()) return;

    await createItem({
      itemName: formData.itemName,
      description: formData.description || "No description provided"
    });

    // Reset Form & Close Modal
    setFormData({ itemName: "", description: "" });
    setOpen(false);
    refreshItems();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#1e3a8a] dark:bg-blue-600 hover:bg-[#172554] dark:hover:bg-blue-700 text-white px-6 shadow-md border-none transition-all text-xs uppercase tracking-wider font-semibold">
          <Plus size={16} className="mr-2" /> Add Item
        </Button>
      </DialogTrigger>
      
      {/* Foomka oo dherer-dherer u dhisan sxb */}
      <DialogContent className="sm:max-w-[450px] w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg shadow-xl">
        <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="text-[#1e3a8a] dark:text-blue-400 text-base font-bold uppercase tracking-wider">
            Add New Inventory Item
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 grid grid-cols-1">
          {/* Item Name Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase dark:text-slate-400">Item Name</label>
            <Input
              placeholder="e.g. Laptop, Desk, Kuraas"
              value={formData.itemName}
              onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
              className="w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none text-sm"
              required
            />
          </div>

          {/* Description Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase dark:text-slate-400">Description / Faahfaahin</label>
            <Textarea
              placeholder="Geli faahfaahinta alaabta guud..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full min-h-[100px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none text-sm p-3 rounded-md resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full h-10 text-xs border-slate-200 dark:border-slate-700">
              Cancel
            </Button>
            <Button type="submit" className="w-full h-10 bg-[#1e3a8a] dark:bg-blue-600 hover:bg-[#172554] dark:hover:bg-blue-700 text-white shadow-md border-none text-xs">
              Save Item
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}