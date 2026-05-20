import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Edit2, Trash2, X, Check, Search } from "lucide-react"; 
import { toast } from "sonner";

// SHADCN COMPONENTS
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import useItems from "@/hooks/useItems";
import { updateItem, deleteItem } from "@/services/items/itemService";
import CreateItem from "./CreateItem";

export default function ListItem() {
  const { items, refreshItems, loading } = useItems();
  const [search, setSearch] = useState("");
  
  // Inline Edit states
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ itemName: "", description: "" });

  // DELETE STATES
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Start Edit Mode
  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      itemName: item.itemName,
      description: item.description || ""
    });
  };

  // DELETE LOGIC
  const confirmDelete = (id) => {
    setItemToDelete(id);
    setIsAlertOpen(true);
  };

  const executeDelete = async () => {
    try {
      await deleteItem(itemToDelete);
      await refreshItems();
      toast.success("Item deleted successfully.");
    } catch (error) {
      toast.error("Failed to delete item.");
    } finally {
      setIsAlertOpen(false);
      setItemToDelete(null);
    }
  };

  // Save Update
  const handleUpdate = async (id) => {
    if (!editForm.itemName.trim()) return;
    try {
      await updateItem(id, { 
        itemName: editForm.itemName, 
        description: editForm.description 
      });
      setEditingId(null);
      await refreshItems();
      toast.success("Item updated successfully.");
    } catch (error) {
      toast.error("Failed to update item.");
    }
  };

  // Filter & Search Logic
  const filteredData = useMemo(() => {
    return (items || []).filter((item) =>
      item.itemName?.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase())
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
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border-l-8 border-[#1e3a8a] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Inventory Items</h1>
          <p className="text-sm text-slate-500 font-medium">Manage Africa Ihsan Aid Items & Description List</p>
        </div>
        <CreateItem refreshItems={refreshItems} />
      </div>

      {/* SEARCH BOX */}
      <div className="relative max-w-md shadow-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search by name or description..."
          className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white dark:bg-slate-900"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
        />
      </div>

      {/* DATA TABLE */}
      <Card className="shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#1e3a8a] text-white uppercase text-xs font-bold">
              <tr>
                <th className="p-4">Item Name</th>
                <th className="p-4">Description</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan="3" className="p-8 text-center">Loading...</td></tr>
              ) : paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-4">
                    {editingId === item.id ? (
                      <Input value={editForm.itemName} onChange={(e) => setEditForm({...editForm, itemName: e.target.value})} />
                    ) : <span className="font-semibold">{item.itemName}</span>}
                  </td>
                  <td className="p-4">
                    {editingId === item.id ? (
                      <Input value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} />
                    ) : <span className="text-slate-500">{item.description || "—"}</span>}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      {editingId === item.id ? (
                        <>
                          <button onClick={() => handleUpdate(item.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><Check size={16} /></button>
                          <button onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                          <button onClick={() => confirmDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* DELETE ALERT DIALOG */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this item from the inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700">Yes, Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PAGINATION */}
      {filteredData.length > 0 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
            </PaginationItem>
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink onClick={() => setCurrentPage(i + 1)} isActive={currentPage === i + 1}>{i + 1}</PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}