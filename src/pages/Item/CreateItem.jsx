import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { createItem } from "@/services/items/itemService";

export default function CreateItem({ refreshItems }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ itemName: "", description: "" });
  const [loading, setLoading] = useState(false); // Waxaan ku daray loading state

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.itemName.trim()) return;
    
    setLoading(true);
    try {
      await createItem({ 
        itemName: formData.itemName, 
        description: formData.description || "No description provided" 
      });
      setFormData({ itemName: "", description: "" });
      setOpen(false);
      refreshItems();
    } catch (error) {
      console.error("Error saving item:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto bg-[#1e3a8a] hover:bg-[#172554] text-white px-6 shadow-md uppercase tracking-wider font-semibold">
          <Plus size={16} className="mr-2" /> Add Item
        </Button>
      </DialogTrigger>
      
      <DialogContent className="w-[95%] sm:max-w-[450px] rounded-xl bg-white dark:bg-slate-900 p-6">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-[#1e3a8a] dark:text-blue-400 font-bold uppercase tracking-wider text-lg">
            Add New Inventory Item
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase dark:text-slate-400">Item Name</label>
            <Input 
              placeholder="e.g. Laptop, Desk, Kuraas" 
              value={formData.itemName} 
              onChange={(e) => setFormData({ ...formData, itemName: e.target.value })} 
              required 
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase dark:text-slate-400">Description</label>
            <Textarea 
              placeholder="Geli faahfaahinta alaabta guud..." 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              className="min-h-[100px]" 
            />
          </div>

          {/* DialogFooter waxay si toos ah u habaysaa badhamada */}
          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)} 
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full sm:w-auto bg-[#1e3a8a] hover:bg-[#172554] text-white"
            >
              {loading ? "Saving..." : "Save Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}