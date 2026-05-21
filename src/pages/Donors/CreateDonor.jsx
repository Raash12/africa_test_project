import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Globe, Building2, Landmark, Phone, Mail } from "lucide-react";

// Country List logic
const getCountryList = () => {
  const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
  // Liis balaaran oo wadamada aduunka ah
  const isoCodes = [
    "SO", "TR", "DJ", "ET", "KE", "AE", "SA", "QA", "KW", "OM", "YE", 
    "GB", "US", "CA", "DE", "FR", "IT", "ES", "NL", "BE", "SE", "CH",
    "CN", "IN", "PK", "MY", "ID", "SG", "JP", "KR", "AU", "NZ",
    "EG", "DZ", "MA", "TN", "LY", "SD", "NG", "GH", "UG", "TZ", "RW",
    "AF", "AL", "AO", "AR", "AT", "AZ", "BA", "BD", "BG", "BH", "BR"
  ];
  
  return isoCodes.map(code => ({
    code,
    name: regionNames.of(code),
    flag: code.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397))
  })).sort((a, b) => a.name.localeCompare(b.name));
};

export const ALL_COUNTRIES = getCountryList();

export default function CreateDonor({ isOpen, onClose, refreshDonors, donorToEdit, createDonor, updateDonor }) {
  const [countrySearch, setCountrySearch] = useState("");
  const [form, setForm] = useState({
    donorName: "", contactPerson: "", phone: "", email: "", 
    country: "Somalia", taxId: "", preferredCurrency: "USD", notes: ""
  });

  useEffect(() => {
    if (donorToEdit) {
      setForm(donorToEdit);
    } else {
      setForm({ donorName: "", contactPerson: "", phone: "", email: "", country: "Somalia", taxId: "", preferredCurrency: "USD", notes: "" });
    }
  }, [donorToEdit, isOpen]);

  const filteredCountries = useMemo(() => {
    return ALL_COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()));
  }, [countrySearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    donorToEdit?.id ? await updateDonor(donorToEdit.id, form) : await createDonor(form);
    handleClose();
    refreshDonors();
  };

  const handleClose = () => {
    setCountrySearch("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="sm:max-w-[550px] bg-white dark:bg-slate-900 border-slate-200 p-6">
        <DialogHeader>
          <DialogTitle className="text-[#1e3a8a] text-lg font-bold uppercase tracking-wider flex items-center gap-2">
            <Building2 size={20} /> {donorToEdit ? "Edit Partner Profile" : "Register New Donor"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <Input placeholder="Organization Name (Required)" value={form.donorName} onChange={(e) => setForm({ ...form, donorName: e.target.value })} required />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <Landmark className="absolute left-3 top-3 text-slate-400" size={16} />
              <Input placeholder="Tax ID / Reg No." className="pl-9" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
            </div>
            <select className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm bg-white" value={form.preferredCurrency} onChange={(e) => setForm({ ...form, preferredCurrency: e.target.value })}>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input placeholder="Contact Person" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
            
            {/* SEARCHABLE COUNTRY DROPDOWN */}
            <div className="space-y-1">
              <div className="relative">
                <select className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm bg-white" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
                  {filteredCountries.map(c => <option key={c.code} value={c.name}>{c.flag} {c.name}</option>)}
                </select>
                <Globe className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-2 text-slate-400" size={12} />
                <input type="text" placeholder="Search country..." className="w-full h-8 pl-7 pr-2 border border-slate-200 rounded-md text-[11px] bg-slate-50 focus:outline-none" value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <Phone className="absolute left-3 top-3 text-slate-400" size={16} />
              <Input placeholder="Phone" className="pl-9" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400" size={16} />
              <Input placeholder="Email" className="pl-9" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>

          <Input placeholder="Notes / Reference" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" className="bg-[#1e3a8a] text-white hover:bg-[#172554]">
              {donorToEdit ? "Update Profile" : "Save Partner"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}