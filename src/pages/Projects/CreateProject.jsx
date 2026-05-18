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
} from "@/components/ui/select"; 
import { FolderKanban, Plus, Trash2, MapPin, AlertCircle } from "lucide-react";

const somaliRegionalData = {
  "Banaadir": ["Waaberi", "Xamar Jajab", "Hodan", "Heliwaa", "Kaxda", "Warta Nabadda", "Darkiinley", "Boondheere", "Cabdiaziz", "Shangaani", "Yaaqshiid", "Dayniile", "Dharkenley", "Wadajir", "Karan", "Shibis"],
  "Gedo": ["Garbaharey", "Bardera", "Luug", "Beled Xaawo", "Doolow", "El Waak", "Ceel Cadde"],
  "Lower Juba": ["Kismayo", "Afmadow", "Badhadhe", "Jamaame", "Xagar"],
  "Middle Juba": ["Bu'aale", "Jilib", "Sakow"],
  "Hiiraan": ["Beledweyne", "Buloburde", "Jalalaqsi", "Matabaan", "Maxaas"],
  "Middle Shabelle": ["Jowhar", "Balcad", "Adale", "Adan Yabal"],
  "Lower Shabelle": ["Afgooye", "Merca", "Wanlaweyn", "Qoryooley", "Barawe", "Sablaale", "Kurtunwaarey"],
  "Bari": ["Bosaso", "Gardo", "Caluula", "Bandarbeyla", "Iskushuban", "Qandala"],
  "Nugaal": ["Garowe", "Eyl", "Burtinle"],
  "Mudug": ["Galkacyo", "Hobyo", "Jariban", "Galdogob", "Harardhere"],
  "Galgaduud": ["Dhusamareb", "Guri El", "Adado", "Abudwak", "El Dher", "El Buur"],
  "Bay": ["Baidoa", "Burhakaba", "Dinsoor", "Qansax Dheere"],
  "Bakool": ["Xudur", "El Barde", "Wajid", "Rabdhure"],
  "Sool": ["Las Anod", "Aynaba", "Taleex", "Xudun"],
  "Sanaag": ["Erigavo", "El Afweyn", "Badhan", "Las Qoray"],
  "Togdheer": ["Burao", "Odwene", "Sheikh", "Buhoodle"],
  "Woqooyi Galbeed": ["Hargeisa", "Berbera", "Gabiley", "Baligubadle"],
  "Awdal": ["Borama", "Zeila", "Lughaya", "Baki"]
};

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
    intendFamily: "", // Kaliya keydin, ma jirto wax xisaab ah oo ku xiran uff!
    startDate: "",
    endDate: "",
    status: "Active",
    description: "",
  });

  const [locations, setLocations] = useState([
    { region: "Banaadir", city: "Waaberi", share: "" }
  ]);

  const targetQuantity = Math.max(0, parseInt(form.quantity) || 0);
  const totalDistributedShares = locations.reduce((sum, loc) => sum + (Math.max(0, parseInt(loc.share) || 0)), 0);
  const isDistributionMatching = targetQuantity > 0 && totalDistributedShares === targetQuantity;

  const addLocationRow = () => {
    if (totalDistributedShares >= targetQuantity) return; 
    setLocations([...locations, { region: "Banaadir", city: "Waaberi", share: "" }]);
  };

  const removeLocationRow = (index) => {
    const updated = locations.filter((_, i) => i !== index);
    setLocations(updated);
  };

  const handleLocationChange = (index, field, value) => {
    const updated = [...locations];
    if (field === "region") {
      updated[index].region = value;
      updated[index].city = somaliRegionalData[value]?.[0] || ""; 
    } else if (field === "share") {
      // Iska ilaali laga-goynta (-1) halkan
      updated[index].share = Math.max(0, parseInt(value) || 0).toString();
    } else {
      updated[index][field] = value;
    }
    setLocations(updated);
  };

  useEffect(() => {
    if (form.grantId && grants && grants.length > 0) {
      const selectedGrant = grants.find((g) => String(g.id) === String(form.grantId));
      if (selectedGrant) {
        setForm((prev) => ({ 
          ...prev, 
          grantTotalAmount: parseFloat(selectedGrant.amount) || 0,
        }));
      }
    }
  }, [form.grantId, grants]);

  useEffect(() => {
    const qty = Math.max(0, parseFloat(form.quantity) || 0);
    const uPrice = Math.max(0, parseFloat(form.unitPrice) || 0);
    const advance = Math.max(0, parseFloat(form.advancePayment) || 0);

    const calculatedTotalBudget = qty * uPrice;
    const calculatedNetBudget = calculatedTotalBudget - advance;

    setForm((prev) => ({
      ...prev,
      totalBudget: calculatedTotalBudget,
      netImplementationBudget: calculatedNetBudget,
    }));
  }, [form.quantity, form.unitPrice, form.advancePayment]);

  const isBudgetExceeded = form.totalBudget > form.grantTotalAmount;
  const advanceValue = Math.max(0, parseFloat(form.advancePayment) || 0);
  const isAdvanceExceeded = advanceValue > 0 && advanceValue > form.totalBudget;
  const isAdvanceDisabled = form.totalBudget === 0;

  const isLocationStructureValid = locations.every(loc => loc.city !== "" && (parseInt(loc.share) || 0) > 0);

  useEffect(() => {
    if (isOpen) {
      if (projectToEdit) {
        setForm({
          ...projectToEdit,
          intendFamily: projectToEdit.intendFamily || "",
        });
        if (projectToEdit.locationTargets && projectToEdit.locationTargets.length > 0) {
          setLocations(projectToEdit.locationTargets);
        } else {
          setLocations([{ region: "Banaadir", city: projectToEdit.location || "", share: projectToEdit.targetBeneficiaries || "" }]);
        }
      } else {
        const defaultGrantId = grants && grants.length > 0 ? String(grants[0].id) : "";
        const defaultAmount = grants && grants.length > 0 ? parseFloat(grants[0].amount) || 0 : 0;

        setForm({
          name: "",
          grantId: defaultGrantId,
          grantTotalAmount: defaultAmount,
          quantity: "",
          unitPrice: "",
          totalBudget: 0,
          advancePayment: "",
          netImplementationBudget: 0,
          intendFamily: "",
          startDate: "",
          endDate: "",
          status: "Active",
          description: "",
        });
        setLocations([{ region: "Banaadir", city: "Waaberi", share: "" }]);
      }
    }
  }, [projectToEdit, isOpen, grants]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isBudgetExceeded || isAdvanceExceeded || !isDistributionMatching) return;

    const dataToSave = {
      ...form,
      quantity: Math.max(0, parseFloat(form.quantity) || 0),
      unitPrice: Math.max(0, parseFloat(form.unitPrice) || 0),
      totalBudget: parseFloat(form.totalBudget) || 0,
      advancePayment: isAdvanceDisabled ? 0 : (Math.max(0, parseFloat(form.advancePayment) || 0)),
      netImplementationBudget: parseFloat(form.netImplementationBudget) || 0,
      intendFamily: Math.max(0, parseInt(form.intendFamily) || 0),
      targetBeneficiaries: totalDistributedShares, 
      locationTargets: locations.map(loc => ({
        region: loc.region,
        city: loc.city,
        share: Math.max(0, parseInt(loc.share) || 0)
      })),
      location: locations.map(l => `${l.city} (${l.region})`).join(", ")
    };

    if (projectToEdit?.id) {
      await updateProject(projectToEdit.id, dataToSave);
    } else {
      await createProject(dataToSave);
    }
    onClose();
    refreshProjects();
  };

  const isSubmitDisabled = 
    isBudgetExceeded || 
    isAdvanceExceeded || 
    !isDistributionMatching ||
    !form.name || 
    (parseInt(form.quantity) || 0) <= 0 || 
    (parseFloat(form.unitPrice) || 0) <= 0 || 
    !form.grantId || 
    !isLocationStructureValid ||
    !form.startDate ||
    !form.endDate;

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      {/* sm:max-w-[1020px] oo ah mid aad u ballaran si uusan marnaba u dhicin scroll */}
      <DialogContent className="sm:max-w-[1020px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-2xl overflow-hidden">
        <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="text-[#1e3a8a] dark:text-blue-400 text-lg font-extrabold uppercase tracking-wider">
            {projectToEdit ? "Modify Project Record" : "Launch Corporate New Project"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          
          {/* STEP 1: CHOOSE PROJECT GRANT & NAME */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Select Funding Grant</label>
              <Select 
                value={form.grantId ? String(form.grantId) : undefined} 
                onValueChange={(value) => setForm({ ...form, grantId: value })}
              >
                <SelectTrigger className="h-10 text-sm bg-white dark:bg-slate-800 font-medium border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2">
                    <FolderKanban size={16} className="text-slate-400" />
                    <SelectValue placeholder="-- Select Grant --" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-white text-sm">
                  {grants && grants.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)} className="text-sm cursor-pointer">
                      {g.grantName || g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Project Operational Name</label>
              <Input
                placeholder="E.g., Shallow Well Drilling or Food Basket Relief"
                className="h-10 text-sm border-slate-200"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
          </div>

          {/* STEP 2: QUANTITY & DYNAMIC REGIONAL DISTRIBUTION */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-100 h-full justify-between flex flex-col">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Quantity (Xabbo)</label>
                <Input
                  type="number"
                  placeholder="E.g., 10"
                  className="h-10 text-sm font-bold bg-white border-slate-200"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Math.max(0, parseInt(e.target.value) || "").toString() })}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Unit Price ($)</label>
                <Input
                  type="number"
                  placeholder="E.g., 2500"
                  className="h-10 text-sm font-mono font-bold bg-white border-slate-200"
                  value={form.unitPrice}
                  onChange={(e) => setForm({ ...form, unitPrice: Math.max(0, parseFloat(e.target.value) || "").toString() })}
                  required
                />
              </div>
              <div className="bg-blue-50/50 p-2 text-center rounded border border-blue-100 text-xs font-semibold text-slate-600">
                Ceiling Amount: ${Number(form.grantTotalAmount).toLocaleString()}
              </div>
            </div>

            <div className="md:col-span-2 p-3 bg-blue-50/10 border border-slate-200 rounded-lg flex flex-col justify-between min-h-[160px]">
              <div>
                <div className="flex justify-between items-center pb-1">
                  <div className="text-xs font-bold text-[#1e3a8a] uppercase flex items-center gap-1">
                    <MapPin size={14} /> Deegaamaynta Gobolada iyo Degmooyinka
                  </div>
                  <Button 
                    type="button" 
                    onClick={addLocationRow}
                    disabled={totalDistributedShares >= targetQuantity || targetQuantity === 0}
                    className="h-7 text-xs font-bold gap-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded"
                  >
                    <Plus size={12} /> ku dar Gobol
                  </Button>
                </div>

                <div className="space-y-2 max-h-[110px] overflow-y-auto pr-0.5 mt-1.5">
                  {locations.map((loc, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Select value={loc.region} onValueChange={(val) => handleLocationChange(index, "region", val)}>
                        <SelectTrigger className="h-9 text-sm w-[130px] bg-white border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white text-sm max-h-[160px]">
                          {Object.keys(somaliRegionalData).map((g) => <SelectItem key={g} value={g} className="text-sm cursor-pointer">{g}</SelectItem>)}
                        </SelectContent>
                      </Select>

                      <Select value={loc.city} onValueChange={(val) => handleLocationChange(index, "city", val)}>
                        <SelectTrigger className="h-9 text-sm flex-1 bg-white border-slate-200">
                          <SelectValue placeholder="Dooro Degmada" />
                        </SelectTrigger>
                        <SelectContent className="bg-white text-sm max-h-[160px]">
                          {(somaliRegionalData[loc.region] || []).map((d) => <SelectItem key={d} value={d} className="text-sm cursor-pointer">{d}</SelectItem>)}
                        </SelectContent>
                      </Select>

                      <Input
                        type="number"
                        placeholder="Xabbo"
                        className="h-9 text-sm w-20 bg-white font-mono text-center font-bold border-slate-200"
                        value={loc.share}
                        onChange={(e) => handleLocationChange(index, "share", e.target.value)}
                        required
                      />

                      {locations.length > 1 && (
                        <Button type="button" variant="ghost" onClick={() => removeLocationRow(index)} className="h-9 w-8 text-rose-500 hover:bg-rose-50 p-0">
                          <Trash2 size={15} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1"><AlertCircle size={13} className="text-amber-500"/> Allocation Status:</span>
                <span className={`font-mono text-xs px-2 py-0.5 rounded border ${isDistributionMatching ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-red-50 text-red-600 border-red-200"}`}>
                  {totalDistributedShares} / {targetQuantity} Allocated
                </span>
              </div>
            </div>
          </div>

          {/* STEP 3: ADVANCE PAYMENT & LIVE FINANCIAL BADGES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Advance Payment ($)</label>
              <Input
                type="number"
                placeholder="Enter advance allocation amount..."
                className={`h-10 text-sm font-mono ${isAdvanceDisabled ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "border-slate-200"}`}
                value={isAdvanceDisabled ? "" : form.advancePayment}
                onChange={(e) => setForm({ ...form, advancePayment: Math.max(0, parseFloat(e.target.value) || "").toString() })}
                disabled={isAdvanceDisabled || isBudgetExceeded}
              />
            </div>

            <div className="md:col-span-2 grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 shadow-sm h-full items-center">
              <div className="text-center bg-white p-2 rounded border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Budget</span>
                <span className="text-sm font-mono font-bold text-slate-800">${Number(form.totalBudget).toLocaleString()}</span>
              </div>
              <div className="text-center bg-white p-2 rounded border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Advance</span>
                <span className="text-sm font-mono font-bold text-rose-500">-${(parseFloat(form.advancePayment) || 0).toLocaleString()}</span>
              </div>
              <div className="text-center bg-white p-2 rounded border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Net Budget</span>
                <span className={`text-sm font-mono font-bold ${form.netImplementationBudget < 0 ? "text-red-500" : "text-emerald-600"}`}>
                  ${Number(form.netImplementationBudget).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* STEP 4: INTEND FAMILY & PROJECT STATUS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Intend Family</label>
              <Input
                type="number"
                placeholder="E.g., 10"
                className="h-10 text-sm border-slate-200"
                value={form.intendFamily}
                onChange={(e) => setForm({ ...form, intendFamily: Math.max(0, parseInt(e.target.value) || "").toString() })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Project Status</label>
              <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
                <SelectTrigger className="h-10 text-sm bg-white text-slate-900 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white text-sm">
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* STEP 5: DATES HORIZONTAL ALIGNMENT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Start Date</label>
              <Input
                type="date"
                className="h-10 text-sm border-slate-200"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">End Date</label>
              <Input
                type="date"
                className="h-10 text-sm border-slate-200"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          {/* SYSTEM DYNAMIC VALIDATION WARNINGS */}
          {(!isDistributionMatching && targetQuantity > 0) && (
            <div className="text-center py-1 bg-amber-50 border border-amber-200 rounded text-xs font-semibold text-amber-700">
              Wadarta xabbadaha la qaybiyey waa inay noqoto ({targetQuantity}). Hadda waa ({totalDistributedShares}).
            </div>
          )}

          {/* ACTIONS BUTTONS */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} className="h-9 text-sm px-4">Cancel</Button>
            <Button 
              type="submit" 
              className={`h-9 text-sm text-white px-5 rounded font-bold transition-all shadow-sm ${isSubmitDisabled ? "bg-red-300 cursor-not-allowed" : "bg-[#1e3a8a] hover:bg-[#172554]"}`}
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