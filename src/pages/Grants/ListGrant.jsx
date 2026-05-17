import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Plus, Search, Calendar } from "lucide-react";

import useGrants from "@/hooks/useGrants";
import { createGrant, updateGrant, deleteGrant } from "@/services/grants/grantService";
import CreateGrant from "./CreateGrant";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function ListGrant() {
  const { grants = [], donors = [], programs = [], refreshGrants } = useGrants(); // Soo qaado programs halkan
  const [isOpen, setIsOpen] = useState(false);
  const [grantToEdit, setGrantToEdit] = useState(null);
  const [search, setSearch] = useState("");

  // 🔢 PAGINATION STATES
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; 

  const handleEdit = (grant) => {
    setGrantToEdit(grant);
    setIsOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Ma hubtaa inaad tirtirto grant-kaan?")) return;
    await deleteGrant(id);
    await refreshGrants();
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setGrantToEdit(null);
  };

  // 🔍 SEARCH LOGIC
  const filteredGrants = useMemo(() => {
    const valid = (grants || []).filter(g => g && g.id && g.grantName);
    const searchLower = search.toLowerCase();

    return valid.filter((g) => {
      return (
        g.grantName.toLowerCase().includes(searchLower) ||
        g.donorName.toLowerCase().includes(searchLower) ||
        (g.programName && g.programName.toLowerCase().includes(searchLower)) || // Ku dar baaritaanka barnaamijka
        (g.notes && g.notes.toLowerCase().includes(searchLower))
      );
    });
  }, [grants, search]);

  // 🔢 PAGINATION LOGIC
  const totalPages = Math.max(Math.ceil(filteredGrants.length / itemsPerPage), 1);
  
  const paginatedGrants = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredGrants.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredGrants, currentPage]);

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border-l-8 border-[#1e3a8a] dark:border-blue-500 shadow-sm border border-slate-100 dark:border-slate-800 transition-all">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 uppercase tracking-tight">Grants & Funding</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manage Agreements and Funds Linked to Donors</p>
        </div>

        <Button 
          type="button"
          onClick={() => { setGrantToEdit(null); setIsOpen(true); }}
          className="bg-[#1e3a8a] dark:bg-blue-600 hover:bg-[#172554] dark:hover:bg-blue-700 text-white px-6 shadow-md border-none transition-all gap-2 cursor-pointer"
        >
          <Plus size={18} /> Allocate New Grant
        </Button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-md shadow-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
        <input
          type="text"
          placeholder="Search grant, donor or program..."
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
                  <th className="p-4">Grant / Project Funding</th>
                  <th className="p-4">Source Donor</th>
                  <th className="p-4">Allocated Budget</th>
                  <th className="p-4">Timeline</th>
                  <th className="p-4 text-center w-32">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedGrants.map((grant) => (
                  <tr key={grant.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">{grant.grantName}</span>
                      <span className="text-xs text-blue-600 dark:text-blue-400 block font-medium">Program: {grant.programName}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 italic block">
                        {grant.notes || 'No extra notes'}
                      </span>
                    </td>
                    
                    <td className="p-4">
                      <span className="font-semibold text-[#1e3a8a] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded text-xs border border-blue-100 dark:border-blue-900">
                        {grant.donorName}
                      </span>
                    </td>

                    <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(grant.amount, grant.currency)}
                    </td>

                    <td className="p-4 text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                      <div className="flex items-center gap-1"><Calendar size={12} className="text-slate-400"/> Start: {grant.startDate}</div>
                      <div className="flex items-center gap-1"><Calendar size={12} className="text-slate-400"/> End: {grant.endDate}</div>
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(grant)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(grant.id)}
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

          {filteredGrants.length === 0 && (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500 italic">
              No grants found. Setup a new grant linked to a donor partner.
            </div>
          )}

          {/* 🔢 PAGINATION */}
          {filteredGrants.length > 0 && (
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

      {/* MODAL COMPONENT */}
      <CreateGrant 
        isOpen={isOpen} 
        onClose={handleCloseModal} 
        refreshGrants={refreshGrants} 
        grantToEdit={grantToEdit}
        donors={donors}
        programs={programs} // Halkan ugu baas barnaamijyada modal-ka sxb
        createGrant={createGrant}
        updateGrant={updateGrant}
      />
    </div>
  );
}