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
} from "@/components/ui/select"; // 🌟 Lagu daray shadcn/ui select
import { FolderKanban } from "lucide-react";

export default function CreateProject({ 
  isOpen, 
  onClose, 
  refreshProjects, 
  projectToEdit, 
  grants, 
  createProject, 
  updateProject 
}) {
  const [form, setForm] = useState({
    name: "",
    grantId: "",
    grantTotalAmount: 0,      
    quantity: "",              
    unitPrice: "",             
    totalBudget: 0,            
    advancePayment: "",        
    netImplementationBudget: 0, 
    location: "",
    startDate: "",
    endDate: "",
    status: "Active",
    description: "",
  });

  // 1. 🔄 Marka Grant la doorto, kaydi inta ay deeqda guud tahay
  useEffect(() => {
    if (form.grantId && grants && grants.length > 0) {
      const selectedGrant = grants.find((g) => String(g.id) === String(form.grantId));
      if (selectedGrant) {
        const grantBudget = parseFloat(selectedGrant.amount) || 0;
        setForm((prev) => ({ 
          ...prev, 
          grantTotalAmount: grantBudget,
        }));
      }
    }
  }, [form.grantId, grants]);

  // 2. 🧮 Dynamic Budget Calculation
  useEffect(() => {
    const qty = parseFloat(form.quantity) || 0;
    const uPrice = parseFloat(form.unitPrice) || 0;
    const advance = parseFloat(form.advancePayment) || 0;

    // Total Budget = Qty * Unit Price
    const calculatedTotalBudget = qty * uPrice;

    // Net Budget = Total Budget - Advance Payment
    const calculatedNetBudget = calculatedTotalBudget - advance;

    setForm((prev) => ({
      ...prev,
      totalBudget: calculatedTotalBudget,
      netImplementationBudget: calculatedNetBudget,
    }));
  }, [form.quantity, form.unitPrice, form.advancePayment]);

  // LABADA DIGNIIN (VALIDATIONS)
  const isBudgetExceeded = form.totalBudget > form.grantTotalAmount;
  
  const advanceValue = parseFloat(form.advancePayment) || 0;
  const isAdvanceExceeded = advanceValue > 0 && advanceValue >= form.totalBudget;

  const isAdvanceDisabled = form.totalBudget === 0 || (form.totalBudget > 0 && (form.grantTotalAmount - form.totalBudget <= 0));

  // 3. Load ama Reset Form
  useEffect(() => {
    if (isOpen) {
      if (projectToEdit) {
        setForm(projectToEdit);
      } else {
        const defaultGrantId = grants && grants.length > 0 ? String(grants[0].id) : "";
        const defaultGrant = grants && grants.length > 0 ? grants[0] : null;
        const defaultAmount = defaultGrant ? parseFloat(defaultGrant.amount) || 0 : 0;

        setForm({
          name: "",
          grantId: defaultGrantId,
          grantTotalAmount: defaultAmount,
          quantity: "",
          unitPrice: "",
          totalBudget: 0,
          advancePayment: "",
          netImplementationBudget: 0,
          location: "",
          startDate: "",
          endDate: "",
          status: "Active",
          description: "",
        });
      }
    }
  }, [projectToEdit, isOpen, grants]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isBudgetExceeded) {
      alert(`Error: Miisaaniyadda mashruucu ($${form.totalBudget}) waxay ka badantahay lacagta guud ee deeqda aad haysato ($${form.grantTotalAmount})!`);
      return;
    }

    if (isAdvanceExceeded) {
      alert(`Error: Advance payment-ku lama mid noqon karo miisaaniyadda guud (Net budget-ku eber ma noqon karo)!`);
      return;
    }

    const dataToSave = {
      ...form,
      quantity: parseFloat(form.quantity) || 0,
      unitPrice: parseFloat(form.unitPrice) || 0,
      totalBudget: parseFloat(form.totalBudget) || 0,
      advancePayment: isAdvanceDisabled ? 0 : (parseFloat(form.advancePayment) || 0),
      netImplementationBudget: parseFloat(form.netImplementationBudget) || 0,
    };

    if (projectToEdit?.id) {
      await updateProject(projectToEdit.id, dataToSave);
    } else {
      await createProject(dataToSave);
    }
    onClose();
    refreshProjects();
  };

  const isSubmitDisabled = isBudgetExceeded || isAdvanceExceeded || !form.name || !form.quantity || !form.unitPrice || !form.grantId;

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[480px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg overflow-hidden max-h-auto shadow-xl">
        <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="text-[#1e3a8a] dark:text-blue-400 text-base font-bold uppercase tracking-wider">
            {projectToEdit ? "Edit Project Details" : "Launch New Project"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-3 gap-y-2 pt-2">
          
          {/* 🌟 Professional Select Qeybta Grant-iga */}
          <div className="col-span-2 space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase">Select Funding Grant</label>
            <Select 
              value={form.grantId ? String(form.grantId) : undefined} 
              onValueChange={(value) => setForm({ ...form, grantId: value })}
            >
              <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 font-medium">
                <div className="flex items-center gap-2">
                  <FolderKanban size={14} className="text-slate-400" />
                  <SelectValue placeholder="-- Select Connected Grant --" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs">
                {grants && grants.map((g) => (
                  <SelectItem key={g.id} value={String(g.id)} className="text-xs text-slate-900 dark:text-slate-100 cursor-pointer">
                    {g.grantName || g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Display Amount Ceiling */}
          <div className="col-span-2 bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 p-2 rounded-md flex justify-between items-center text-[11px]">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Available Grant Ceiling:</span>
            <span className="font-mono font-bold text-[#1e3a8a] dark:text-blue-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-900/50 shadow-sm">
              ${Number(form.grantTotalAmount).toLocaleString()}
            </span>
          </div>

          {/* Project Name */}
          <div className="col-span-2 space-y-0.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase">Project Name</label>
            <Input
              placeholder="E.g., Borehole Drilling in Gedo"
              className="h-9 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          {/* Quantity */}
          <div className="space-y-0.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase">Quantity</label>
            <Input
              type="number"
              placeholder="E.g., 5"
              className="h-9 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              required
            />
          </div>

          {/* Unit Price */}
          <div className="space-y-0.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase">Unit Price ($)</label>
            <Input
              type="number"
              placeholder="E.g., 30"
              className={`h-9 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 ${isBudgetExceeded ? "border-red-500 dark:border-red-500 focus:ring-red-500 text-red-600" : "focus:ring-blue-600"}`}
              value={form.unitPrice}
              onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
              required
            />
          </div>

          {/* Error Message Box (Miisaaniyada Guud haday ka badato) */}
          {isBudgetExceeded && (
            <div className="col-span-2 text-center py-1 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded text-[11px] font-semibold text-red-600 dark:text-red-400">
              Lacagta guud (${form.totalBudget}) waxay ka badantahay inta aad haysato (${form.grantTotalAmount})!
            </div>
          )}

          {/* Advance Payment */}
          <div className="col-span-2 space-y-0.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase">
              Advance Payment ($) {isAdvanceDisabled && <span className="text-red-500 font-normal lowercase">(locked)</span>}
            </label>
            <Input
              type="number"
              placeholder={isAdvanceDisabled ? "Disabled - Enter price first" : "Enter advance payment amount..."}
              className={`h-9 text-xs font-mono ${isAdvanceDisabled ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed select-none" : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"} ${isAdvanceExceeded ? "border-red-500 text-red-600 focus:ring-red-500 bg-red-50/30" : ""}`}
              value={isAdvanceDisabled ? "" : form.advancePayment}
              onChange={(e) => setForm({ ...form, advancePayment: e.target.value })}
              disabled={isAdvanceDisabled || isBudgetExceeded}
            />
          </div>

          {/* Error Message Box */}
          {isAdvanceExceeded && (
            <div className="col-span-2 text-center py-1 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded text-[11px] font-semibold text-red-600 dark:text-red-400">
              Cisabtu ma qadeyso! Hormarisku (${form.advancePayment}) lama mid noqon karo miisaaniyadda mashruuca (${form.totalBudget}). Net-ku eber ma noqon karo!
            </div>
          )}

          {/* 🧮 FINANCIAL SUMMARY BOX */}
          <div className="col-span-2 grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800/60 my-0.5">
            <div className="text-center p-1 bg-white dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Total Budget</span>
              <span className={`text-xs font-mono font-bold block ${isBudgetExceeded ? "text-red-600" : "text-slate-800 dark:text-slate-100"}`}>
                ${Number(form.totalBudget).toLocaleString()}
              </span>
            </div>
            <div className="text-center p-1 bg-white dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Advance</span>
              <span className={`text-xs font-mono font-bold block ${isAdvanceExceeded ? "text-red-600 font-extrabold" : "text-red-500"}`}>
                -${(parseFloat(form.advancePayment) || 0).toLocaleString()}
              </span>
            </div>
            <div className="text-center p-1 bg-white dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Net Impl. Budget</span>
              <span className={`text-xs font-mono font-bold block ${isSubmitDisabled ? "text-red-600 font-extrabold" : form.netImplementationBudget > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700"}`}>
                ${Number(form.netImplementationBudget).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Location */}
          <div className="col-span-2 space-y-0.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase">Location</label>
            <Input
              placeholder="E.g., Mogadishu, Kismayo"
              className="h-9 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              required
            />
          </div>

          {/* Start Date */}
          <div className="space-y-0.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase">Start Date</label>
            <Input
              type="date"
              className="h-9 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              required
            />
          </div>

          {/* End Date */}
          <div className="space-y-0.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase">End Date</label>
            <Input
              type="date"
              className="h-9 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              required
            />
          </div>

          {/* 🌟 Professional Select Qeybta Project Status */}
          <div className="col-span-2 space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase">Project Status</label>
            <Select 
              value={form.status} 
              onValueChange={(value) => setForm({ ...form, status: value })}
            >
              <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs">
                <SelectItem value="Active" className="cursor-pointer">Active</SelectItem>
                <SelectItem value="Completed" className="cursor-pointer">Completed</SelectItem>
                <SelectItem value="Pending" className="cursor-pointer">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="col-span-2 flex justify-end gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={onClose} className="h-8 text-xs border-slate-200 dark:border-slate-700">Cancel</Button>
            <Button 
              type="submit" 
              className={`h-8 text-xs text-white shadow-sm border-none transition-all ${isSubmitDisabled ? "bg-red-400 cursor-not-allowed hover:bg-red-400" : "bg-[#1e3a8a] dark:bg-blue-600 hover:bg-[#172554] dark:hover:bg-blue-700"}`}
              disabled={isSubmitDisabled}
            >
              {projectToEdit ? "Update Project" : "Save Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}