import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Globe } from "lucide-react";

const getCountryList = () => {
  const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
  const isoCodes = ["TR", "SO", "AF", "AX", "AL", "DZ", "AS", "AD", "AO", "AI", "AQ", "AG", "AR", "AM", "AW", "AU", "AT", "AZ", "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BM", "BT", "BO", "BQ", "BA", "BW", "BV", "BR", "IO", "BN", "BG", "BF", "BI", "CV", "KH", "CM", "CA", "KY", "CF", "TD", "CL", "CN", "CX", "CC", "CO", "KM", "CD", "CG", "CK", "CR", "CI", "HR", "CU", "CW", "CY", "CZ", "DK", "DJ", "DM", "DO", "EC", "EG", "SV", "GQ", "ER", "EE", "SZ", "ET", "FK", "FO", "FJ", "FI", "FR", "GF", "PF", "TF", "GA", "GM", "GE", "DE", "GH", "GI", "GR", "GL", "GD", "GP", "GU", "GT", "GG", "GN", "GW", "GY", "HT", "HM", "VA", "HN", "HK", "HU", "IS", "IN", "ID", "IR", "IQ", "IE", "IM", "IL", "IT", "JM", "JP", "JE", "JO", "KZ", "KE", "KI", "KP", "KR", "KW", "KG", "LA", "LV", "LB", "LS", "LR", "LY", "LI", "LT", "LU", "MO", "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MQ", "MR", "MU", "YT", "MX", "FM", "MD", "MC", "MN", "ME", "MS", "MA", "MZ", "MM", "NA", "NR", "NP", "NL", "NC", "NZ", "NI", "NE", "NG", "NU", "NF", "MP", "NO", "OM", "PK", "PW", "PS", "PA", "PG", "PY", "PE", "PH", "PN", "PL", "PT", "PR", "QA", "RE", "RO", "RU", "RW", "BL", "SH", "KN", "LC", "MF", "PM", "VC", "WS", "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SG", "SX", "SK", "SI", "SB", "SS", "ES", "LK", "SD", "SR", "SJ", "SE", "CH", "SY", "TW", "TJ", "TZ", "TH", "TL", "TG", "TK", "TO", "TT", "TN", "UA", "AE", "GB", "US", "UM", "UY", "UZ", "VU", "VE", "VN", "VG", "VI", "WF", "EH", "YE", "ZM", "ZW"];

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
    donorName: "",
    contactPerson: "",
    phone: "",
    email: "",
    country: "Turkey",
    notes: "",
  });

  useEffect(() => {
    if (donorToEdit) {
      setForm(donorToEdit);
    } else {
      setForm({ donorName: "", contactPerson: "", phone: "", email: "", country: "Turkey", notes: "" });
    }
  }, [donorToEdit, isOpen]);

  const filteredCountries = useMemo(() => {
    return ALL_COUNTRIES.filter(c => 
      c.name.toLowerCase().includes(countrySearch.toLowerCase())
    );
  }, [countrySearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (donorToEdit?.id) {
      await updateDonor(donorToEdit.id, form);
    } else {
      await createDonor(form);
    }
    handleClose();
    refreshDonors();
  };

  const handleClose = () => {
    setCountrySearch("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-[#1e3a8a] dark:text-blue-400 text-lg font-bold uppercase tracking-wider">
            {donorToEdit ? "Edit Partner Profile" : "Register New Donor"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 pt-4">
          <Input
            placeholder="Organization Name"
            className="col-span-2 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
            value={form.donorName}
            onChange={(e) => setForm({ ...form, donorName: e.target.value })}
            required
          />
          <Input
            placeholder="Contact Person"
            className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
            value={form.contactPerson}
            onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
          />
          <div className="space-y-1">
            <div className="relative">
              <select
                className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none appearance-none text-slate-900 dark:text-slate-100"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              >
                {filteredCountries.map((c) => (
                  <option key={c.code} value={c.name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
              <Globe className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 text-slate-400" size={12} />
              <input
                type="text"
                placeholder="Search country..."
                className="w-full text-[10px] pl-6 pr-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-900"
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
              />
            </div>
          </div>
          <Input
            placeholder="Phone Number"
            className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            placeholder="Email Address"
            className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            placeholder="Notes / Reference"
            className="col-span-2 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div className="col-span-2 flex justify-end gap-3 mt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="border-slate-200 dark:border-slate-700">Cancel</Button>
            <Button type="submit" className="bg-[#1e3a8a] dark:bg-blue-600 hover:bg-[#172554] dark:hover:bg-blue-700 text-white shadow-md border-none transition-all">
              {donorToEdit ? "Update Profile" : "Save Partner"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}