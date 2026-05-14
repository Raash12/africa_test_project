import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Edit2, Trash2, Plus } from "lucide-react";

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
  totalBudget: 0,
  advancePayment: 0,
  remainingBalance: 0,
  startDate: "",
  endDate: "",
});

const ITEM_PROJECTS = ["Xoolo", "Xoolo Irmaan", "Iftar Program"];

export default function Projects() {
  const { donors } = useDonors();
  const { items } = useItems();
  const { projects, refreshProjects } = useProjects();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(getEmptyForm());

  const showItemSection = ITEM_PROJECTS.includes(form.projectName);

  // 🔥 Auto calculation
  useEffect(() => {
    const qty = Number(form.quantity) || 0;
    const price = Number(form.unitPrice) || 0;

    const total = qty * price;
    const half = total / 2;

    setForm((prev) => ({
      ...prev,
      totalBudget: total,
      advancePayment: half,
      remainingBalance: half,
    }));
  }, [form.quantity, form.unitPrice]);

  const cleanForFirestore = (data) =>
    Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== "" && v !== undefined)
    );

  // 🔥 SUBMIT FIXED
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!form.donorId || !form.projectName) {
        alert("Please select donor and project");
        return;
      }

      const payload = cleanForFirestore(form);

      if (editingId) {
        await updateProject(editingId, payload);
      } else {
        await createProject(payload);
      }

      await refreshProjects(); // ✅ FIXED HERE
      closeModal();
    } catch (error) {
      console.error("SAVE ERROR:", error);
      alert("Failed to save project");
    }
  };

  const handleEdit = (project) => {
    setEditingId(project.id);
    setForm({ ...getEmptyForm(), ...project });
    setIsOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this project?")) return;

    await deleteProject(id);
    await refreshProjects();
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditingId(null);
    setForm(getEmptyForm());
  };

  const validProjects = (projects || []).filter(
    (p) => p && p.id && p.projectName && p.donorName
  );

  return (
    <div className="p-4 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Project Management</h2>

        <Dialog open={isOpen} onOpenChange={(v) => !v && closeModal()}>
          <DialogTrigger asChild>
            <Button className="bg-[#0088D1] gap-2">
              <Plus size={18} /> New Project
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Project" : "New Project"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">

              {/* DONOR */}
              <div className="col-span-2">
                <label className="text-xs font-bold">Donor</label>
                <Select
                  value={form.donorId}
                  onValueChange={(value) => {
                    const donor = donors.find((d) => d.id === value);
                    if (donor) {
                      setForm((prev) => ({
                        ...prev,
                        donorId: donor.id,
                        donorName: donor.donorName,
                      }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Donor" />
                  </SelectTrigger>
                  <SelectContent>
                    {donors?.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.donorName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* PROJECT TYPE */}
              <div className="col-span-2">
                <label className="text-xs font-bold">Project Type</label>
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
                      totalBudget: 0,
                      advancePayment: 0,
                      remainingBalance: 0,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Xoolo">Xoolo</SelectItem>
                    <SelectItem value="Kurbaan/Carafo">Kurbaan/Carafo</SelectItem>
                    <SelectItem value="Xoolo Irmaan">Xoolo Irmaan</SelectItem>
                    <SelectItem value="Ceel Biyood">Ceel Biyood</SelectItem>
                    <SelectItem value="Iftar Program">Iftar Program</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ITEM SECTION */}
              {showItemSection && (
                <div className="col-span-2 grid grid-cols-2 gap-4">

                  {/* ITEM */}
                  <div className="col-span-2">
                    <label className="text-xs font-bold">Item</label>
                    <Select
                      value={form.itemId}
                      onValueChange={(value) => {
                        const item = items.find((i) => i.id === value);
                        if (item) {
                          setForm((prev) => ({
                            ...prev,
                            itemId: item.id,
                            itemName: item.name,
                          }));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Item" />
                      </SelectTrigger>
                      <SelectContent>
                        {items?.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* QTY */}
                  <Input
                    type="number"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        quantity: e.target.value,
                      }))
                    }
                    placeholder="Quantity"
                  />

                  {/* PRICE */}
                  <Input
                    type="number"
                    value={form.unitPrice}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        unitPrice: e.target.value,
                      }))
                    }
                    placeholder="Unit Price"
                  />
                </div>
              )}

              {/* TOTALS */}
              <div className="col-span-2 bg-black text-white p-4 rounded-lg">
                <p>Total: ${form.totalBudget}</p>
                <p>Advance: ${form.advancePayment}</p>
                <p>Balance: ${form.remainingBalance}</p>
              </div>

              <div className="col-span-2 flex justify-end gap-2">
                <Button type="button" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* TABLE */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3">Project</th>
                <th>Donor</th>
                <th>Budget</th>
                <th>Balance</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {validProjects.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3">
                    {p.projectName}
                    {p.itemName && (
                      <div className="text-xs text-gray-500">
                        {p.itemName} × {p.quantity}
                      </div>
                    )}
                  </td>
                  <td>{p.donorName}</td>
                  <td>${p.totalBudget}</td>
                  <td>${p.remainingBalance}</td>
                  <td className="text-right">
                    <Button size="icon" onClick={() => handleEdit(p)}>
                      <Edit2 size={14} />
                    </Button>
                    <Button
                      size="icon"
                      className="text-red-500"
                      onClick={() => handleDelete(p.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}