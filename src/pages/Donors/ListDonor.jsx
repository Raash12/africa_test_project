import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Plus, Search, UserCircle } from "lucide-react";

import useDonors from "@/hooks/useDonors";
import { createDonor, updateDonor, deleteDonor } from "@/services/donors/donorService";
import CreateDonor, { ALL_COUNTRIES } from "./CreateDonor";

// 🔢 SHADCN PAGINATION IMPORTS
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function ListDonor() {
  const { donors = [], refreshDonors } = useDonors();
  const [isOpen, setIsOpen] = useState(false);
  const [donorToEdit, setDonorToEdit] = useState(null);
  const [search, setSearch] = useState("");

  // 🔢 PAGINATION STATES
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; 

  const handleEdit = (donor) => {
    setDonorToEdit(donor);
    setIsOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Ma hubtaa inaad tirtirto donor-kaan?")) return;
    await deleteDonor(id);
    await refreshDonors();
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setDonorToEdit(null);
  };

  // 🔍 FILTER & SEARCH LOGIC (FIXED FOR PHONE NUMBERS)
  const filteredDonors = useMemo(() => {
    const valid = (donors || []).filter(d => d && d.id && d.donorName);
    
    const searchLower = search.toLowerCase();

    return valid.filter((d) => {
      // U beddel nambarka string si loogu dhex raadiyo (Searchable)
      const donorPhone = d.phone ? String(d.phone).toLowerCase() : "";
      
      return (
        d.donorName.toLowerCase().includes(searchLower) ||
        (d.contactPerson && d.contactPerson.toLowerCase().includes(searchLower)) ||
        (d.country && d.country.toLowerCase().includes(searchLower)) ||
        // Halkan waxaa lagu daray raadinta nambarka talifanka
        donorPhone.includes(searchLower)
      );
    });
  }, [donors, search]);

  // 🔢 SHADCN PAGINATION LOGIC
  const totalPages = Math.max(Math.ceil(filteredDonors.length / itemsPerPage), 1);
  
  const paginatedDonors = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDonors.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDonors, currentPage]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* HEADER BANNER - Africa Ihsan Aid Navy Style */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border-l-8 border-[#1e3a8a] dark:border-blue-500 shadow-sm border border-slate-100 dark:border-slate-800 transition-all">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 uppercase tracking-tight">Donors Directory</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manage and Track Africa Ihsan Aid Registered Partners</p>
        </div>

        <Button 
          type="button"
          onClick={() => { setDonorToEdit(null); setIsOpen(true); }}
          className="bg-[#1e3a8a] dark:bg-blue-600 hover:bg-[#172554] dark:hover:bg-blue-700 text-white px-6 shadow-md border-none transition-all gap-2 cursor-pointer"
        >
          <Plus size={18} /> Add New Donor
        </Button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-md shadow-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
        <input
          type="text"
          placeholder="Search name, country or phone number..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition-all bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1); 
          }}
        />
      </div>

      {/* DATA TABLE */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#1e3a8a] dark:bg-slate-800 text-white dark:text-slate-100 text-xs uppercase tracking-widest font-bold">
                <tr>
                  <th className="p-4">Partner</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4 text-center w-32">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedDonors.map((donor) => (
                  <tr key={donor.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">{donor.donorName}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {donor.contactPerson || 'No contact person'}
                      </span>
                    </td>
                    
                    <td className="p-4">
                      <span className="inline-flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm">
                        {ALL_COUNTRIES.find(c => c.name === donor.country)?.flag} {donor.country}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">{donor.phone}</div>
                      <div className="text-xs text-[#1e3a8a] dark:text-blue-400 font-medium">{donor.email}</div>
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(donor)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(donor.id)}
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

          {filteredDonors.length === 0 && (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500 italic">
              No donors found. Register a new donor partner above.
            </div>
          )}

          {/* 🔢 SHADCN PAGINATION SECTION */}
          {filteredDonors.length > 0 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <Pagination>
                <PaginationContent className="cursor-pointer">
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={`bg-white dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 ${currentPage === 1 ? "opacity-30 pointer-events-none" : ""}`}
                    />
                  </PaginationItem>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink 
                        isActive={currentPage === i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={currentPage === i + 1 
                          ? "bg-[#1e3a8a] dark:bg-blue-600 text-white border-[#1e3a8a] dark:border-blue-600" 
                          : "bg-white dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700"}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className={`bg-white dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 ${currentPage === totalPages ? "opacity-30 pointer-events-none" : ""}`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CREATE / EDIT DIALOG COMPONENT */}
      <CreateDonor 
        isOpen={isOpen} 
        onClose={handleCloseModal} 
        refreshDonors={refreshDonors} 
        donorToEdit={donorToEdit}
        createDonor={createDonor}
        updateDonor={updateDonor}
      />
    </div>
  );
}