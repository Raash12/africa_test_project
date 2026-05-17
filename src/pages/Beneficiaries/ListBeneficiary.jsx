import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Plus, Search, Calendar, MapPin, User, Users } from "lucide-react";

import useBeneficiaries from "@/hooks/useBeneficiaries";
import { createBeneficiary, updateBeneficiary, deleteBeneficiary } from "@/services/beneficiaries/beneficiaryService";
import CreateBeneficiary from "./CreateBeneficiary";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function ListBeneficiary() {
  const { beneficiaries = [], projects = [], refreshBeneficiaries } = useBeneficiaries();
  const [isOpen, setIsOpen] = useState(false);
  const [beneficiaryToEdit, setBeneficiaryToEdit] = useState(null);
  const [search, setSearch] = useState("");

  // 🔢 PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; 

  const handleEdit = (beneficiary) => {
    setBeneficiaryToEdit(beneficiary);
    setIsOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Ma hubtaa inaad tirtirto ka-faaiideystaan?")) return;
    await deleteBeneficiary(id);
    await refreshBeneficiaries();
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setBeneficiaryToEdit(null);
  };

  // 🔍 SEARCH LOGIC (Magaca, Mashruuca ama Deegaanka)
  const filteredBeneficiaries = useMemo(() => {
    const valid = (beneficiaries || []).filter(b => b && b.id && b.fullName);
    const searchLower = search.toLowerCase();

    return valid.filter((b) => {
      return (
        b.fullName.toLowerCase().includes(searchLower) ||
        (b.projectName && b.projectName.toLowerCase().includes(searchLower)) ||
        (b.location && b.location.toLowerCase().includes(searchLower)) ||
        (b.idNumber && b.idNumber.toLowerCase().includes(searchLower))
      );
    });
  }, [beneficiaries, search]);

  // 🔢 PAGINATION LOGIC
  const totalPages = Math.max(Math.ceil(filteredBeneficiaries.length / itemsPerPage), 1);
  
  const paginatedBeneficiaries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBeneficiaries.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBeneficiaries, currentPage]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border-l-8 border-[#1e3a8a] dark:border-blue-500 shadow-sm border border-slate-100 dark:border-slate-800 transition-all">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a8a] dark:text-blue-400 uppercase tracking-tight">Beneficiary Registration</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manage and audit project beneficiaries on the ground</p>
        </div>

        <Button 
          type="button"
          onClick={() => { setBeneficiaryToEdit(null); setIsOpen(true); }}
          className="bg-[#1e3a8a] hover:bg-[#172554] dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-6 shadow-md border-none transition-all gap-2 cursor-pointer"
        >
          <Plus size={18} /> Register Beneficiary
        </Button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-md shadow-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
        <input
          type="text"
          placeholder="Search name, project, ID or location..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] dark:focus:ring-blue-600 outline-none transition-all bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
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
              <thead className="bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-100 text-xs uppercase tracking-widest font-bold">
                <tr>
                  <th className="p-4">Beneficiary Profile</th>
                  <th className="p-4">Linked Project</th>
                  <th className="p-4">Assistance Received</th>
                  <th className="p-4">Demographics & Date</th>
                  <th className="p-4 text-center w-32">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedBeneficiaries.map((ben) => (
                  <tr key={ben.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    
                    {/* Profile */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-[#1e3a8a] dark:text-blue-400 rounded-lg">
                          <User size={16} />
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">{ben.fullName}</span>
                          <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            ID: <span className="font-mono">{ben.idNumber || "N/A"}</span> • {ben.phone}
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    {/* Linked Project */}
                    <td className="p-4">
                      <span className="font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded text-xs border border-blue-100 dark:border-blue-900">
                        {ben.projectName}
                      </span>
                    </td>

                    {/* Assistance Received */}
                    <td className="p-4 font-medium text-slate-900 dark:text-white">
                      <div>{ben.assistanceType}</div>
                      <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {Number(ben.quantityReceived).toLocaleString()} {ben.unitType}
                      </div>
                    </td>

                    {/* Demographics */}
                    <td className="p-4 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                      <div className="flex items-center gap-1"><MapPin size={12}/> {ben.location}</div>
                      <div className="flex items-center gap-1 text-[11px]">
                        <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-semibold">{ben.gender}</span>
                        <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-medium">
                          <Users size={10}/> Fam: {ben.familySize}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-0.5">
                        <Calendar size={10}/> Reg: {ben.registrationDate}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(ben)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(ben.id)}
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

          {filteredBeneficiaries.length === 0 && (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500 italic">
              No registered beneficiaries found for the active operation plans.
            </div>
          )}

          {/* 🔢 PAGINATION RENDERING */}
          {filteredBeneficiaries.length > 0 && (
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
                          ? "bg-[#1e3a8a] text-white border-[#1e3a8a] dark:bg-blue-600 dark:border-blue-600" 
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

      {/* MODAL WINDOW */}
      <CreateBeneficiary 
        isOpen={isOpen} 
        onClose={handleCloseModal} 
        refreshBeneficiaries={refreshBeneficiaries} 
        beneficiaryToEdit={beneficiaryToEdit}
        projects={projects}
        createBeneficiary={createBeneficiary}
        updateBeneficiary={updateBeneficiary}
      />
    </div>
  );
}