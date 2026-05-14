import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Trash2, Plus, UserCircle, Search, Globe } from "lucide-react";

import useDonors from "@/hooks/useDonors";
import { createDonor, updateDonor, deleteDonor } from "@/services/donors/donorService";

const getCountryList = () => {
  const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
  const isoCodes = ["TR", "SO", "AF", "AX", "AL", "DZ", "AS", "AD", "AO", "AI", "AQ", "AG", "AR", "AM", "AW", "AU", "AT", "AZ", "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BM", "BT", "BO", "BQ", "BA", "BW", "BV", "BR", "IO", "BN", "BG", "BF", "BI", "CV", "KH", "CM", "CA", "KY", "CF", "TD", "CL", "CN", "CX", "CC", "CO", "KM", "CD", "CG", "CK", "CR", "CI", "HR", "CU", "CW", "CY", "CZ", "DK", "DJ", "DM", "DO", "EC", "EG", "SV", "GQ", "ER", "EE", "SZ", "ET", "FK", "FO", "FJ", "FI", "FR", "GF", "PF", "TF", "GA", "GM", "GE", "DE", "GH", "GI", "GR", "GL", "GD", "GP", "GU", "GT", "GG", "GN", "GW", "GY", "HT", "HM", "VA", "HN", "HK", "HU", "IS", "IN", "ID", "IR", "IQ", "IE", "IM", "IL", "IT", "JM", "JP", "JE", "JO", "KZ", "KE", "KI", "KP", "KR", "KW", "KG", "LA", "LV", "LB", "LS", "LR", "LY", "LI", "LT", "LU", "MO", "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MQ", "MR", "MU", "YT", "MX", "FM", "MD", "MC", "MN", "ME", "MS", "MA", "MZ", "MM", "NA", "NR", "NP", "NL", "NC", "NZ", "NI", "NE", "NG", "NU", "NF", "MP", "NO", "OM", "PK", "PW", "PS", "PA", "PG", "PY", "PE", "PH", "PN", "PL", "PT", "PR", "QA", "RE", "RO", "RU", "RW", "BL", "SH", "KN", "LC", "MF", "PM", "VC", "WS", "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SG", "SX", "SK", "SI", "SB", "SS", "ES", "LK", "SD", "SR", "SJ", "SE", "CH", "SY", "TW", "TJ", "TZ", "TH", "TL", "TG", "TK", "TO", "TT", "TN", "UA", "AE", "GB", "US", "UM", "UY", "UZ", "VU", "VE", "VN", "VG", "VI", "WF", "EH", "YE", "ZM", "ZW"];

  return isoCodes.map(code => ({
    code,
    name: regionNames.of(code),
    flag: code.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397))
  })).sort((a, b) => a.name.localeCompare(b.name));
};

const ALL_COUNTRIES = getCountryList();

export default function Donors() {
  const { donors, refreshDonors } = useDonors();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [countrySearch, setCountrySearch] = useState("");

  const [form, setForm] = useState({
    donorName: "",
    contactPerson: "",
    phone: "",
    email: "",
    country: "Turkey",
    notes: "",
  });

  const filteredCountries = useMemo(() => {
    return ALL_COUNTRIES.filter(c => 
      c.name.toLowerCase().includes(countrySearch.toLowerCase())
    );
  }, [countrySearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await updateDonor(editingId, form);
    } else {
      await createDonor(form);
    }
    closeModal();
    refreshDonors();
  };

  const handleAddNew = () => {
    setEditingId(null);
    setForm({ donorName: "", contactPerson: "", phone: "", email: "", country: "Turkey", notes: "" });
    setIsOpen(true);
  };

  const handleEdit = (donor) => {
    setForm(donor);
    setEditingId(donor.id);
    setIsOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this partner?")) {
      await deleteDonor(id);
      refreshDonors();
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditingId(null);
    setCountrySearch("");
    setForm({ donorName: "", contactPerson: "", phone: "", email: "", country: "Turkey", notes: "" });
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Donors Directory</h2>
        
        <Dialog open={isOpen} onOpenChange={(val) => !val && closeModal()}>
          <DialogTrigger asChild>
            <Button className="bg-[#0088D1] hover:bg-[#0077b6] text-white gap-2" onClick={handleAddNew}>
              <Plus size={18} /> Add New Donor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Partner Profile" : "Register New Donor"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 pt-4">
              <Input
                placeholder="Organization Name"
                className="col-span-2 border-slate-200"
                value={form.donorName}
                onChange={(e) => setForm({ ...form, donorName: e.target.value })}
                required
              />
              <Input
                placeholder="Contact Person"
                className="border-slate-200"
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
              />
              <div className="space-y-1">
                <div className="relative">
                  <select
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-[#0088D1] outline-none appearance-none"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                  >
                    {filteredCountries.map((c) => (
                      <option key={c.code} value={c.name}>
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
                    className="w-full text-[10px] pl-6 pr-2 py-1.5 border rounded bg-slate-50 focus:outline-none focus:bg-white"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                  />
                </div>
              </div>
              <Input
                placeholder="Phone Number"
                className="border-slate-200"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <Input
                placeholder="Email Address"
                className="border-slate-200"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <Input
                placeholder="Notes / Reference"
                className="col-span-2 border-slate-200"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
              <div className="col-span-2 flex justify-end gap-3 mt-4">
                <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                <Button type="submit" className="bg-[#0088D1] hover:bg-[#0077b6]">
                  {editingId ? "Update Profile" : "Save Partner"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-[#0088D1] text-lg flex items-center gap-2">
            <UserCircle size={20} className="text-slate-400" /> Registered Partners
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="text-left p-4 font-semibold">Partner</th>
                <th className="text-left p-4 font-semibold">Location</th>
                <th className="text-left p-4 font-semibold">Contact Info</th>
                <th className="text-right p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {donors.map((donor) => (
                <tr key={donor.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{donor.donorName}</div>
                    <div className="text-xs text-slate-500">{donor.contactPerson || 'No contact person'}</div>
                  </td>
                  <td className="p-4">
                    <span className="flex items-center gap-2 bg-white border border-slate-100 px-2 py-1 rounded-full w-fit shadow-xs">
                      {ALL_COUNTRIES.find(c => c.name === donor.country)?.flag} {donor.country}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-xs font-medium text-slate-700">{donor.phone}</div>
                    <div className="text-xs text-[#0088D1]">{donor.email}</div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => handleEdit(donor)}>
                        <Edit2 size={14} />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDelete(donor.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
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