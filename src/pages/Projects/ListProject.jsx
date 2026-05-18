import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Plus, Search, Calendar, MapPin, Building2, Layers, DollarSign, Users } from "lucide-react";

import useProjects from "@/hooks/useProjects";
import { createProject, updateProject, deleteProject } from "@/services/projects/projectService";
import CreateProject from "./CreateProject";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function ListProject() {
  const { projects = [], grants = [], refreshProjects } = useProjects();
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
    if (!window.confirm("Ma hubtaa inaad tirtirto project-kaan?")) return;
    await deleteProject(id);
    await refreshProjects();
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setProjectToEdit(null);
  };

  // 🔍 SEARCH LOGIC (Waxay baari kartaa Name, Grant, Location iyo xataa Status)
  const filteredProjects = useMemo(() => {
    const valid = (projects || []).filter(p => p && p.id && p.name);
    const searchLower = search.toLowerCase();

    return valid.filter((p) => {
      return (
        p.name.toLowerCase().includes(searchLower) ||
        (p.grantName && p.grantName.toLowerCase().includes(searchLower)) ||
        (p.location && p.location.toLowerCase().includes(searchLower)) ||
        (p.status && p.status.toLowerCase().includes(searchLower))
      );
    });
  }, [projects, search]);

  // 🔢 PAGINATION LOGIC
  const totalPages = Math.max(Math.ceil(filteredProjects.length / itemsPerPage), 1);
  
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProjects.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProjects, currentPage]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount || 0);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* HEADER BANNER (Professional Blue Theme) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border-l-8 border-[#1e3a8a] dark:border-blue-500 shadow-sm border border-slate-100 dark:border-slate-800 transition-all">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a8a] dark:text-blue-400 uppercase tracking-tight">Project Implementation</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Track ground operations funded by active organization grants</p>
        </div>

        <Button 
          type="button"
          onClick={() => { setProjectToEdit(null); setIsOpen(true); }}
          className="bg-[#1e3a8a] hover:bg-[#172554] dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-6 shadow-md border-none transition-all gap-2 cursor-pointer"
        >
          <Plus size={18} /> Launch New Project
        </Button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-md shadow-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
        <input
          type="text"
          placeholder="Search project name, grant or location..."
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
                  <th className="p-4">Project & Location</th>
                  <th className="p-4">Connected Grant</th>
                  <th className="p-4">Metrics (Qty & Target)</th>
                  <th className="p-4">Financial Breakdown</th>
                  <th className="p-4">Timeline & Status</th>
                  <th className="p-4 text-center w-32">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    
                    {/* 1: Project Info & Location */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-[#1e3a8a] dark:text-blue-400 rounded-lg">
                          <Building2 size={16} />
                        </div>
                        <div className="max-w-[220px]">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block truncate" title={project.name}>
                            {project.name}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate" title={project.location}>
                            <MapPin size={12} className="text-slate-400 shrink-0"/> {project.location || "No Location"}
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    {/* 2: Linked Grant */}
                    <td className="p-4">
                      <span className="font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded text-xs border border-blue-100 dark:border-blue-900 block w-fit">
                        {project.grantName || "Linked Grant"}
                      </span>
                    </td>

                    {/* 3: Metrics (Quantity & Families) */}
                    <td className="p-4 space-y-1">
                      <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <Layers size={13} className="text-slate-400" />
                        <span>Qty: <strong className="text-slate-800 dark:text-slate-200">{project.quantity || 0}</strong></span>
                        <span className="text-slate-300">|</span>
                        <span>Unit: <strong className="text-slate-800 dark:text-slate-200">${project.unitPrice || 0}</strong></span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <Users size={13} className="text-slate-400" />
                        <span>Intend Fam: <strong className="text-emerald-600 dark:text-emerald-400">{project.intendFamily || 0}</strong></span>
                      </div>
                    </td>

                    {/* 4: Financial Breakdown (Total, Advance, Net) */}
                    <td className="p-4 space-y-0.5 font-mono text-xs">
                      <div className="flex justify-between max-w-[150px]">
                        <span className="text-slate-400">Total:</span>
                        <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(project.totalBudget)}</span>
                      </div>
                      {project.advancePayment > 0 && (
                        <div className="flex justify-between max-w-[150px] text-rose-500">
                          <span>Adv:</span>
                          <span>-{formatCurrency(project.advancePayment)}</span>
                        </div>
                      )}
                      <div className="flex justify-between max-w-[150px] pt-0.5 border-t border-slate-100 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 font-bold">
                        <span>Net:</span>
                        <span>{formatCurrency(project.netImplementationBudget ?? project.totalBudget)}</span>
                      </div>
                    </td>

                    {/* 5: Timeline & Status */}
                    <td className="p-4 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
                      <div className="flex items-center gap-1"><Calendar size={12} className="text-slate-400"/> {project.startDate} - {project.endDate}</div>
                      <div>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          project.status === "Completed" 
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                            : project.status === "Active"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                        }`}>
                          {project.status || "Active"}
                        </span>
                      </div>
                    </td>

                    {/* 6: Actions */}
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(project)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(project.id)}
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
              No active projects found. Setup a new execution plan linked to an active grant.
            </div>
          )}

          {/* 🔢 PAGINATION */}
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

      {/* MODAL COMPONENT */}
      <CreateProject 
        isOpen={isOpen} 
        onClose={handleCloseModal} 
        refreshProjects={refreshProjects} 
        projectToEdit={projectToEdit}
        grants={grants}
        createProject={createProject}
        updateProject={updateProject}
      />
    </div>
  );
}