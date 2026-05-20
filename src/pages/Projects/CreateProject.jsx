import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"; 
import { FolderKanban, Package } from "lucide-react";

export default function CreateProject({ 
  isOpen, 
  onClose, 
  refreshProjects, 
  refreshStock, // 🔥 Waxaan ku darnay props-kaan si stock-ka dropdown-ka ku jira loo dynamic gareeyo
  projectToEdit, 
  grants = [], 
  stockItems = [], 
  createProject, 
  updateProject 
}) {
  const [form, setForm] = useState({
    name: "",
    grantId: "",
    grantTotalAmount: 0,      
    stockItemId: "",        
    stockItemName: "",      
    stockAvailableQty: Infinity, 
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

  // 1. Marka Grant la doorto
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

  // 2. Dynamic Budget Calculation
  useEffect(() => {
    const grantCeiling = parseFloat(form.grantTotalAmount) || 0;
    const qty = parseFloat(form.quantity) || 0;
    const uPrice = parseFloat(form.unitPrice) || 0;
    const advance = parseFloat(form.advancePayment) || 0;

    const calculatedTotalBudget = qty * uPrice;
    const calculatedNetBudget = grantCeiling - calculatedTotalBudget - advance;

    setForm((prev) => ({
      ...prev,
      totalBudget: calculatedTotalBudget,
      netImplementationBudget: calculatedNetBudget,
    }));
  }, [form.quantity, form.unitPrice, form.advancePayment, form.grantTotalAmount]);

  // 🛠️ VALIDATIONS
  const inputQty = Number(form.quantity) || 0;
  const availableQty = Number(form.stockAvailableQty) || 0;

  const isStockExceeded = form.stockItemId !== "" && inputQty > availableQty;
  const isBudgetExceeded = form.totalBudget > form.grantTotalAmount;
  const advanceValue = parseFloat(form.advancePayment) || 0;
  
  const remainingBeforeAdvance = form.grantTotalAmount - form.totalBudget;
  
  // 🔥 Shardi: Advance payment ma noqon karto mid la siman ama ka badan miisaaniyadda harsan, si Net Impl mar walba u sarreeyo uuna u noqon eber ama minus.
  const isAdvanceExceeded = advanceValue > 0 && advanceValue >= remainingBeforeAdvance;
  const isAdvanceDisabled = form.totalBudget === 0 || remainingBeforeAdvance <= 0;

  // 3. Load ama Reset Form
  useEffect(() => {
    if (isOpen) {
      if (projectToEdit) {
        const selectedItem = stockItems.find((item) => String(item.id) === String(projectToEdit.stockItemId));
        let available = Infinity;
        if (selectedItem) {
          const rawQty = selectedItem.items && selectedItem.items.length > 0 
            ? (selectedItem.items[0].quantity || selectedItem.items[0].qty || 0)
            : (selectedItem.quantity || selectedItem.qty || 0);
          available = Number(rawQty) || 0;
        }

        setForm({
          ...projectToEdit,
          grantId: projectToEdit.grantId ? String(projectToEdit.grantId) : "",
          stockItemId: projectToEdit.stockItemId ? String(projectToEdit.stockItemId) : "",
          stockItemName: projectToEdit.stockItemName || "",
          stockAvailableQty: available,
          quantity: projectToEdit.quantity || "",
          unitPrice: projectToEdit.unitPrice || "",
          advancePayment: projectToEdit.advancePayment || "",
        });
      } else {
        const defaultGrantId = grants && grants.length > 0 ? String(grants[0].id) : "";
        const defaultGrant = grants && grants.length > 0 ? grants[0] : null;
        const defaultAmount = defaultGrant ? parseFloat(defaultGrant.amount) || 0 : 0;

        setForm({
          name: "",
          grantId: defaultGrantId,
          grantTotalAmount: defaultAmount,
          stockItemId: "",
          stockItemName: "",
          stockAvailableQty: Infinity,
          quantity: "",
          unitPrice: "",
          totalBudget: 0,
          advancePayment: "",
          netImplementationBudget: defaultAmount,
          location: "",
          startDate: "",
          endDate: "",
          status: "Active",
          description: "",
        });
      }
    }
  }, [projectToEdit, isOpen, grants, stockItems]);

  const handleStockItemChange = (value) => {
    const selectedItem = stockItems.find((item) => String(item.id) === String(value));
    let name = "";
    let available = Infinity;

    if (selectedItem) {
      const rawQty = selectedItem.items && selectedItem.items.length > 0
        ? (selectedItem.items[0].quantity || selectedItem.items[0].qty || 0)
        : (selectedItem.quantity || selectedItem.qty || 0);
      
      name = selectedItem.items && selectedItem.items.length > 0
        ? (selectedItem.items[0].itemName || selectedItem.items[0].name || "")
        : (selectedItem.itemName || selectedItem.name || "");
        
      available = Number(rawQty) || 0;
    }

    setForm((prev) => {
      const currentInputQty = Number(prev.quantity) || 0;
      return {
        ...prev,
        stockItemId: value,
        stockItemName: name,
        stockAvailableQty: available,
        quantity: currentInputQty > available ? "" : prev.quantity
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isStockExceeded) {
      alert(`Error: Quantity-ga aad gelisay (${form.quantity}) wuxuu ka badan yahay inta alaabta ka taal stock-ka (${form.stockAvailableQty})!`);
      return;
    }

    if (isBudgetExceeded) {
      alert(`Error: Miisaaniyadda mashruucu ($${form.totalBudget}) waxay ka badantahay lacagta guud ee deeqda aad haysato ($${form.grantTotalAmount})!`);
      return;
    }

    if (isAdvanceExceeded) {
      alert(`Error: Advance Payment-ku ma ka badnaan karo mana la sinnaan karo lacagta harsan si Net Implementation Budget u noqdo mid mar walba ka sarreeya eber!`);
      return;
    }

    const dataToSave = {
      ...form,
      quantity: Number(form.quantity) || 0,
      unitPrice: Number(form.unitPrice) || 0,
      totalBudget: Number(form.totalBudget) || 0,
      advancePayment: isAdvanceDisabled ? 0 : (Number(form.advancePayment) || 0),
      netImplementationBudget: Number(form.netImplementationBudget) || 0,
      stockAvailableQty: Number(form.stockAvailableQty) || 0
    };

    try {
      if (projectToEdit?.id) {
        await updateProject(projectToEdit.id, dataToSave);
      } else {
        await createProject(dataToSave);
      }
      
      // 🔥 REFRESH DYNAMIC: Halkan waxaan ku wacaynaa labada nidaam si xogtu u update-garowdo
      if (refreshProjects) refreshProjects();
      if (refreshStock) refreshStock(); // Kani wuxuu dropdown-ka ka dhigayaa mid la jaanqaada Firestore
      
      onClose();
    } catch (error) {
      console.error("Cillad ayaa dhacday sxb:", error);
      alert(error.message || "Waxaa dhacay khalad inta la kaydinayay mashruuca.");
    }
  };

  const isSubmitDisabled = isBudgetExceeded || isAdvanceExceeded || isStockExceeded || !form.name || !form.quantity || !form.unitPrice || !form.grantId || form.netImplementationBudget <= 0;

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[750px] w-[95%] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="text-[#1e3a8a] dark:text-blue-400 text-base font-bold uppercase tracking-wider">
            {projectToEdit ? "Edit Project Details" : "Launch New Project"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Fill in the details below to configure your project financial structure.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 pt-3">
          
          {/* Select Funding Grant */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase">Select Funding Grant</label>
            <Select 
              value={form.grantId ? String(form.grantId) : ""} 
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
                    {g.grantName || g.name} (${Number(g.amount).toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Select Item from Stock */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase">Select Item from Stock</label>
            <Select 
              value={form.stockItemId ? String(form.stockItemId) : "none"} 
              onValueChange={(value) => handleStockItemChange(value === "none" ? "" : value)}
            >
              <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 font-medium">
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-slate-400" />
                  <SelectValue placeholder="-- Select Item from Stock (Optional) --" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs">
                <SelectItem value="none" className="text-xs text-slate-400 dark:text-slate-500 cursor-pointer">-- No Stock Item (Optional) --</SelectItem>
                {stockItems && stockItems.map((item) => {
                  let displayFormName = "Unknown Item";
                  let itemQty = 0;
                  if (item.items && item.items.length > 0) {
                    displayFormName = item.items[0].itemName || item.items[0].name || displayFormName;
                    itemQty = item.items[0].quantity || item.items[0].qty || 0;
                  } else {
                    displayFormName = item.itemName || item.name || displayFormName;
                    itemQty = item.quantity || item.qty || 0;
                  }
                  return (
                    <SelectItem key={item.id} value={String(item.id)} className="text-xs text-slate-900 dark:text-slate-100 cursor-pointer">
                      {displayFormName} (Available: {itemQty} - Wh: {item.warehouseName || "N/A"})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Display Amount Ceiling */}
          <div className="md:col-span-2 bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 p-2.5 rounded-md flex justify-between items-center text-[11px]">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Available Grant Ceiling:</span>
            <span className="font-mono font-bold text-[#1e3a8a] dark:text-blue-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/50 shadow-sm text-xs">
              ${Number(form.grantTotalAmount).toLocaleString()}
            </span>
          </div>

          {/* Project Name */}
          <div className="md:col-span-2 space-y-0.5">
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
            <label className="text-[11px] font-semibold text-slate-500 uppercase">
              Quantity {form.stockItemId && <span className="text-blue-600 font-bold dark:text-blue-400">(Max: {form.stockAvailableQty})</span>}
            </label>
            <Input
              type="number"
              placeholder="E.g., 5"
              className={`h-9 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 ${isStockExceeded ? "border-red-500 dark:border-red-500 focus:ring-red-500 text-red-600" : "focus:ring-blue-600"}`}
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

          {/* Errors */}
          {isStockExceeded && (
            <div className="md:col-span-2 text-center py-1.5 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded text-[11px] font-semibold text-red-600 dark:text-red-400">
              Cariiri! Tirada aad rabto ({form.quantity}) waxay ka badan tahay inta alaabta ah ee stock-ka taal ({form.stockAvailableQty})!
            </div>
          )}

          {isBudgetExceeded && (
            <div className="md:col-span-2 text-center py-1.5 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded text-[11px] font-semibold text-red-600 dark:text-red-400">
              Lacagta guud (${form.totalBudget}) waxay ka badantahay inta aad haysato (${form.grantTotalAmount})!
            </div>
          )}

          {isAdvanceExceeded && (
            <div className="md:col-span-2 text-center py-1.5 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded text-[11px] font-semibold text-red-600 dark:text-red-400">
              Cariiri! Advance Payment-ku ma noqon karo mid la siman ama ka badan lacagta harsan, waa in Net Impl mar walba ka sarreeyo eber!
            </div>
          )}

          {/* Advance Payment */}
          <div className="md:col-span-2 space-y-0.5">
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

          {/* Summary Box */}
          <div className="md:col-span-2 grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/60 my-1">
            <div className="text-center p-1.5 bg-white dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Total Budget</span>
              <span className={`text-xs font-mono font-bold block ${isBudgetExceeded ? "text-red-600" : "text-slate-800 dark:text-slate-100"}`}>
                ${Number(form.totalBudget).toLocaleString()}
              </span>
            </div>
            <div className="text-center p-1.5 bg-white dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Advance</span>
              <span className={`text-xs font-mono font-bold block ${isAdvanceExceeded ? "text-red-600 font-extrabold" : "text-red-500"}`}>
                -${(parseFloat(form.advancePayment) || 0).toLocaleString()}
              </span>
            </div>
            <div className="text-center p-1.5 bg-white dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Net Impl. Budget</span>
              <span className={`text-xs font-mono font-bold block ${isSubmitDisabled ? "text-red-600 font-extrabold" : form.netImplementationBudget > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700"}`}>
                ${Number(form.netImplementationBudget).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Location */}
          <div className="md:col-span-2 space-y-0.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase">Location</label>
            <Input
              placeholder="E.g., Mogadishu, Kismayo"
              className="h-9 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              required
            />
          </div>

          {/* Dates */}
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

          {/* Status */}
          <div className="md:col-span-2 space-y-1">
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

          {/* Buttons */}
          <div className="md:col-span-2 flex justify-end gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
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