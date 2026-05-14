// src/pages/projects/ListProject.jsx
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Plus, Search } from "lucide-react";

import useProjects from "@/hooks/useProjects";
import { deleteProject } from "@/services/projects/projectService";
import CreateProject from "./CreateProject"; // 👈 Halkan baa sax ah hadda!

// 🔢 SHADCN PAGINATION IMPORTS
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function ListProject() {
  const { projects = [], refreshProjects } = useProjects();
  const [isOpen, setIsOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [search, setSearch] = useState("");

  // 🔢 PAGINATION STATES
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; 

  const handleEdit = (project) => {
    setProjectToEdit(project);
    setIsOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Ma hubtaa inaad tirtirto mashruucan?")) return;
    await deleteProject(id);
    await refreshProjects();
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setProjectToEdit(null);
  };

  // 🔍 ADVANCED FILTER (Nambarada iyo Qoraalkaba waa la raadin karaa sxb)
  const filteredProjects = useMemo(() => {
    const valid = (projects || []).filter(
      (p) => p && p.id && p.projectName && p.donorName
    );

    const searchLower = search.toLowerCase().trim();

    return valid.filter((p) => {
      // 1. Qoraalka
      const matchesText =
        p.projectName.toLowerCase().includes(searchLower) ||
        p.donorName.toLowerCase().includes(searchLower) ||
        (p.itemName && p.itemName.toLowerCase().includes(searchLower));

      // 2. Nambarada (Budget, Balance, Quantity)
      const matchesNumbers =
        (p.totalBudget && String(p.totalBudget).includes(searchLower)) ||
        (p.remainingBalance && String(p.remainingBalance).includes(searchLower)) ||
        (p.quantity && String(p.quantity).includes(searchLower));

      return matchesText || matchesNumbers;
    });
  }, [projects, search]);

  // 🔢 SHADCN PAGINATION LOGIC
  const totalPages = Math.max(Math.ceil(filteredProjects.length / itemsPerPage), 1);
  
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProjects.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProjects, currentPage]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border-l-8 border-[#1e3a8a] dark:border-blue-500 shadow-sm border border-slate-100 dark:border-slate-800 transition-all">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 uppercase tracking-tight">Project Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manage and Track Africa Ihsan Aid Projects</p>
        </div>

        <Button 
          type="button"
          onClick={() => { setProjectToEdit(null); setIsOpen(true); }}
          className="bg-[#1e3a8a] dark:bg-blue-600 hover:bg-[#172554] dark:hover:bg-blue-700 text-white px-6 shadow-md border-none transition-all gap-2 cursor-pointer"
        >
          <Plus size={18} /> New Project
        </Button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-md shadow-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
        <input
          type="text"
          placeholder="Search projects, donors, budget, balance or qty..."
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
                  <th className="p-4">Project</th>
                  <th className="p-4">Item Name</th>
                  <th className="p-4">Donor</th>
                  <th className="p-4">Budget</th>
                  <th className="p-4">Balance</th>
                  <th className="p-4 text-center w-32">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">{p.projectName}</span>
                      {p.quantity > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          Qty: {p.quantity}
                        </span>
                      )}
                    </td>
                    
                    <td className="p-4">
                      {p.itemName ? (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                          {p.itemName}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 font-medium">-</span>
                      )}
                    </td>

                    <td className="p-4 font-medium text-slate-600 dark:text-slate-400">{p.donorName}</td>
                    <td className="p-4 font-mono font-semibold text-green-600 dark:text-green-400">${p.totalBudget}</td>
                    <td className="p-4 font-mono font-semibold text-amber-600 dark:text-amber-500">${p.remainingBalance}</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(p)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
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

          {filteredProjects.length === 0 && (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500 italic">
              No projects found. Add a new project above.
            </div>
          )}

          {/* 🔢 SHADCN PAGINATION SECTION */}
          {filteredProjects.length > 0 && (
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
      <CreateProject 
        isOpen={isOpen} 
        onClose={handleCloseModal} 
        refreshProjects={refreshProjects} 
        projectToEdit={projectToEdit}
      />
    </div>
  );
}