import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Trash2, X, Check } from "lucide-react"; // Icons for actions
import useItems from "@/hooks/useItems";
import { createItem, updateItem, deleteItem } from "@/services/items/itemService";

export default function Items() {
  const { items, refreshItems } = useItems();
  const [itemName, setItemName] = useState("");
  
  // States for Editing
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  // Handle Create
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    await createItem({ itemName });
    setItemName("");
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

  return (
    <div className="space-y-6 p-4">
      {/* ADD ITEM CARD */}
      <Card className="border-t-4 border-t-[#0088D1] shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#0088D1]">Add New Item</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-4">
            <Input
              placeholder="Enter Item Name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="flex-1"
            />
            <Button className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white px-8">
              Save Item
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ITEMS LIST CARD */}
      <Card className="shadow-sm">
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="text-[#0088D1] text-lg">Inventory List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-slate-500 uppercase text-xs bg-slate-50/50">
                  <th className="text-left p-4">Item ID</th>
                  <th className="text-left p-4">Item Name</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono text-xs text-slate-400 w-32">
                      {item.id.substring(0, 8)}...
                    </td>
                    
                    <td className="p-4">
                      {editingId === item.id ? (
                        <Input 
                          value={editValue} 
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-8 max-w-[250px]"
                          autoFocus
                        />
                      ) : (
                        <span className="font-medium text-slate-700">{item.itemName}</span>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {editingId === item.id ? (
                          <>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleUpdate(item.id)}
                            >
                              <Check size={16} />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-slate-400 hover:text-slate-600"
                              onClick={() => setEditingId(null)}
                            >
                              <X size={16} />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-[#0088D1] hover:bg-blue-50"
                              onClick={() => startEdit(item)}
                            >
                              <Edit2 size={16} />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-red-500 hover:bg-red-50"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                
                {items.length === 0 && (
                  <tr>
                    <td colSpan="3" className="p-12 text-center text-slate-400 italic">
                      No items found. Add your first item above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}