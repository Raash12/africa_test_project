import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Trash2, Plus, Search } from "lucide-react";

import useDonors from "@/hooks/useDonors";
import useProjects from "@/hooks/useProjects";
import useItems from "@/hooks/useItems";

import {
  createProject,
  updateProject,
  deleteProject,
} from "@/services/projects/projectService";

const getEmptyForm = () => ({
  donorId: "",
  donorName: "",
  projectName: "",
  itemId: "",
  itemName: "",
  quantity: "",
  unitPrice: "",
  startDate: "",
  endDate: "",
});

// 📦 Mashaariicda u baahan in la doorto Item Inventory ah
const SHOW_ITEM_DROPDOWN = ["Xoolo", "Xoolo Irmaan", "Iftar Program"];

// 🔢 Mashaariicda guud ahaan u furaaya Quantity iyo Unit Price (Dhammaan mashaariicda)
const SHOW_NUMERIC_FIELDS = ["Xoolo", "Xoolo Irmaan", "Iftar Program", "Ceel Biyood", "Kurbaan/Carafo"];

export default function Projects() {
  const { donors = [] } = useDonors();
  const { items = [] } = useItems();
  const { projects = [], refreshProjects } = useProjects();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(getEmptyForm());
  const [search, setSearch] = useState("");

  const hasItemDropdown = SHOW_ITEM_DROPDOWN.includes(form.projectName);
  const hasNumericFields = SHOW_NUMERIC_FIELDS.includes(form.projectName);

  // 🔥 XISAABINTA BUDGET-KA (Calculated on the fly)
  const qty = Number(form.quantity) || 0;
  const price = Number(form.unitPrice) || 0;
  const totalBudget = qty * price;
  const advancePayment = totalBudget / 2;
  const remainingBalance = totalBudget / 2;

  const cleanForFirestore = (data) =>
    Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== "" && v !== undefined)
    );

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!form.donorId || !form.projectName) {
        alert("Fadlan dooro Donor iyo Project Type");
        return;
      }

      const finalPayload = cleanForFirestore({
        ...form,
        totalBudget,
        advancePayment,
        remainingBalance,
      });

      if (editingId) {
        await updateProject(editingId, finalPayload);
      } else {
        await createProject(finalPayload);
      }

      await refreshProjects();
      closeModal();
    } catch (error) {
      console.error("SAVE ERROR:", error);
      alert("Wuu ku guuldareystay keydinta mashruuca");
    }
  };

  const handleEdit = (project) => {
    setEditingId(project.id);
    setForm({ ...getEmptyForm(), ...project });
    setIsOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Ma hubtaa inaad tirtirto mashruucan?")) return;
    await deleteProject(id);
    await refreshProjects();
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditingId(null);
    setForm(getEmptyForm());
  };

  const filteredProjects = useMemo(() => {
    const valid = (projects || []).filter(
      (p) => p && p.id && p.projectName && p.donorName
    );
    return valid.filter((p) =>
      p.projectName.toLowerCase().includes(search.toLowerCase()) ||
      p.donorName.toLowerCase().includes(search.toLowerCase())
    );
  }, [projects, search]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border-l-8 border-[#1e3a8a] dark:border-blue-500 shadow-sm border border-slate-100 dark:border-slate-800 transition-all">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 uppercase tracking-tight">Project Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manage and Track Africa Ihsan Aid Projects</p>
        </div>

        <Button 
          type="button"
          onClick={() => setIsOpen(true)}
          className="bg-[#1e3a8a] dark:bg-blue-600 hover:bg-[#172554] dark:hover:bg-blue-700 text-white px-6 shadow-md border-none transition-all gap-2 cursor-pointer"
        >
          <Plus size={18} /> New Project
        </Button>

        {/* DIALOG CONTROLLER */}
        <Dialog open={isOpen} onOpenChange={(v) => { if (!v) closeModal(); }}>
          <DialogContent className="sm:max-w-[550px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-[#1e3a8a] dark:text-blue-400 text-lg font-bold uppercase tracking-wider">
                {editingId ? "Edit Project" : "Add New Project"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              
              {/* DONOR SELECT */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Donor</label>
                <Select
                  value={form.donorId}
                  onValueChange={(value) => {
                    const donor = donors?.find((d) => d.id === value);
                    if (donor) {
                      setForm((prev) => ({
                        ...prev,
                        donorId: donor.id,
                        donorName: donor.donorName,
                      }));
                    }
                  }}
                >
                  <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                    <SelectValue placeholder="Select Donor" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    {donors?.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.donorName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* PROJECT TYPE SELECT */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Project Type</label>
                <Select
                  value={form.projectName}
                  onValueChange={(val) =>
                    setForm((prev) => ({
                      ...prev,
                      projectName: val,
                      itemId: "",
                      itemName: "",
                      quantity: "",
                      unitPrice: "",
                    }))
                  }
                >
                  <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                    <SelectValue placeholder="Choose Project" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    <SelectItem value="Xoolo">Xoolo</SelectItem>
                    <SelectItem value="Kurbaan/Carafo">Kurbaan/Carafo</SelectItem>
                    <SelectItem value="Xoolo Irmaan">Xoolo Irmaan</SelectItem>
                    <SelectItem value="Ceel Biyood">Ceel Biyood</SelectItem>
                    <SelectItem value="Iftar Program">Iftar Program</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* DYNAMIC INPUT SECTION */}
              {hasNumericFields && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                  
                  {/* ITEM DROPDOWN: Kaliya haddii uu yahay mashruuc inventory leh (Waa laga qariyay Ceel Biyood) */}
                  {hasItemDropdown && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Inventory Item</label>
                      <Select
                        value={form.itemId}
                        onValueChange={(value) => {
                          const item = items?.find((i) => i.id === value);
                          if (item) {
                            setForm((prev) => ({
                              ...prev,
                              itemId: item.id,
                              itemName: item.itemName,
                            }));
                          }
                        }}
                      >
                        <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                          <SelectValue placeholder="Select Item" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                          {items?.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.itemName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* NUMERIC FIELDS: Mar kasta way soo baxayaan marka foomku furmo */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500">Quantity</label>
                      <Input
                        type="number"
                        value={form.quantity}
                        onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                        className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500">Unit Price ($)</label>
                      <Input
                        type="number"
                        value={form.unitPrice}
                        onChange={(e) => setForm((prev) => ({ ...prev, unitPrice: e.target.value }))}
                        className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TOTALS PANEL */}
              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 space-y-1 shadow-inner font-mono text-sm">
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">Total Budget:</span>
                  <span className="text-green-400 font-bold">${totalBudget}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 py-1">
                  <span className="text-slate-400">Advance Payment (50%):</span>
                  <span className="text-blue-400">${advancePayment}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400">Remaining Balance:</span>
                  <span className="text-amber-400">${remainingBalance}</span>
                </div>
              </div>

              {/* ACTIONS BUTTONS */}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={closeModal} className="border-slate-200 dark:border-slate-700">
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#1e3a8a] dark:bg-blue-600 hover:bg-[#172554] dark:hover:bg-blue-700 text-white shadow-md">
                  Save Project
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-md shadow-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
        <input
          type="text"
          placeholder="Search projects or donors..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition-all bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* DATA TABLE */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#1e3a8a] dark:bg-slate-800 text-white dark:text-slate-100 text-xs uppercase tracking-widest font-bold">
                <tr>
                  <th className="p-4">Project</th>
                  <th className="p-4">Donor</th>
                  <th className="p-4">Budget</th>
                  <th className="p-4">Balance</th>
                  <th className="p-4 text-center w-32">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">{p.projectName}</span>
                      {p.itemName ? (
                        <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                          {p.itemName} × {p.quantity}
                        </span>
                      ) : (
                        p.quantity > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            Qty: {p.quantity}
                          </span>
                        )
                      )}
                    </td>
                    <td className="p-4 font-medium text-slate-600 dark:text-slate-400">{p.donorName}</td>
                    <td className="p-4 font-mono font-semibold text-green-600 dark:text-green-400">${p.totalBudget}</td>
                    <td className="p-4 font-mono font-semibold text-amber-600 dark:text-amber-500">${p.remainingBalance}</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(p)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProjects.length === 0 && (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500 italic">
              No projects found. Add a new project above.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}