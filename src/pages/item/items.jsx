import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Edit2, Trash2, X, Check, Plus, Search } from "lucide-react"; 
import useItems from "@/hooks/useItems";
import { createItem, updateItem, deleteItem } from "@/services/items/itemService";

// SHADCN DIALOG & PAGINATION IMPORTS
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function Items() {
  const { items, refreshItems } = useItems();
  const [itemName, setItemName] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  
  // States for Editing Inline
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Handle Create
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    await createItem({ itemName });
    setItemName("");
    setOpen(false); // Xir pop-up-ka marka la save-gareeyo kadib
    refreshItems();
  };

  // Handle Delete
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      await deleteItem(id);
      refreshItems();
    }
  };

  // Start Edit Mode
  const startEdit = (item) => {
    setEditingId(item.id);
    setEditValue(item.itemName);
  };

  // Save Update
  const handleUpdate = async (id) => {
    if (!editValue.trim()) return;
    await updateItem(id, { itemName: editValue });
    setEditingId(null);
    refreshItems();
  };

  // Filter & Search Logic
  const filteredData = useMemo(() => {
    setCurrentPage(1);
    return items.filter((item) =>
      item.itemName?.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  // Xisaabinta Pagination-ka
  const totalPages = Math.max(Math.ceil(filteredData.length / itemsPerPage), 1);
  
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* HEADER BANNER - Africa Ihsan Aid Navy Style */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border-l-8 border-[#1e3a8a] dark:border-blue-500 shadow-sm border-t border-r border-b border-slate-100 dark:border-slate-800 transition-all">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 uppercase tracking-tight">Inventory Items</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manage Africa Ihsan Aid Items & Inventory</p>
        </div>

        {/* POP-UP MODAL DIALOG */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1e3a8a] dark:bg-blue-600 hover:bg-[#172554] dark:hover:bg-blue-700 text-white px-6 shadow-md border-none transition-all">
              <Plus size={18} className="mr-2" /> Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-[#1e3a8a] dark:text-blue-400 text-lg font-bold uppercase tracking-wider">
                Add New Item
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Item Name</label>
                <Input
                  placeholder="Enter Item Name (e.g. Laptop, Desk)"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-[#1e3a8a] dark:bg-blue-600 hover:bg-[#172554] dark:hover:bg-blue-700 text-white shadow-md border-none transition-all">
                Save Item
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* SEARCH BOX */}
      <div className="relative max-w-md shadow-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
        <input
          type="text"
          placeholder="Search items..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition-all bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* DATA TABLE CARD */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#1e3a8a] dark:bg-slate-800 text-white dark:text-slate-100 text-xs uppercase tracking-widest font-bold">
              <tr>
                {/* Halkan waa laga saaray Item ID */}
                <th className="p-4">Item Name</th>
                <th className="p-4 text-center w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  {/* Halkan waxaa laga saaray <td> ee ID-ga muujinayay */}
                  <td className="p-4">
                    {editingId === item.id ? (
                      <Input 
                        value={editValue} 
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-9 max-w-[300px] bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                        autoFocus
                      />
                    ) : (
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{item.itemName}</span>
                    )}
                  </td>

                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      {editingId === item.id ? (
                        <>
                          <button 
                            onClick={() => handleUpdate(item.id)}
                            className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-all"
                          >
                            <Check size={16} />
                          </button>
                          <button 
                            onClick={() => setEditingId(null)}
                            className="p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => startEdit(item)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {paginatedData.length === 0 && (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 italic">
            No items found. Add your first item above.
          </div>
        )}

        {/* SHADCN PAGINATION SECTION */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <Pagination>
            <PaginationContent className="cursor-pointer">
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={`bg-white dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 ${currentPage === 1 ? "opacity-30 pointer-events-none" : ""}`}
                />
              </PaginationItem>
              
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink 
                    isActive={currentPage === i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={currentPage === i + 1 
                      ? "bg-[#1e3a8a] dark:bg-blue-600 text-white border-[#1e3a8a] dark:border-blue-600" 
                      : "bg-white dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700"}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={`bg-white dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 ${currentPage === totalPages ? "opacity-30 pointer-events-none" : ""}`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </Card>
    </div>
  );
}