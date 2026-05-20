import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Plus, Search, Calendar, MapPin, Building2 } from "lucide-react";
import { toast } from "sonner";

// SHADCN COMPONENTS
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import useProjects from "@/hooks/useProjects";
import useStockIn from "@/hooks/useStockIn"; // 🌟 Lagu daray hook-gii Stock In
import { createProject, updateProject, deleteProject } from "@/services/projects/projectService";
import CreateProject from "./CreateProject";

export default function ListProject() {
  const { projects = [], grants = [], refreshProjects } = useProjects();
  const { stockInEntries = [] } = useStockIn(); // 🌟 Soo dhuuq alaabta kaydka taal sxb
  const [isOpen, setIsOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [search, setSearch] = useState("");

  // DELETE STATES
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  // PAGINATION STATES
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleEdit = (project) => {
    setProjectToEdit(project);
    setIsOpen(true);
  };

  // DELETE LOGIC
  const confirmDelete = (id) => {
    setProjectToDelete(id);
    setIsAlertOpen(true);
  };

  const executeDelete = async () => {
    try {
      await deleteProject(projectToDelete);
      await refreshProjects();
      toast.success("Project deleted successfully.");
    } catch (error) {
      toast.error("Failed to delete project. Please try again.");
    } finally {
      setIsAlertOpen(false);
      setProjectToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setProjectToEdit(null);
  };

  // SEARCH LOGIC
  const filteredProjects = useMemo(() => {
    const valid = (projects || []).filter(p => p && p.id && p.name);
    const searchLower = search.toLowerCase();

    return valid.filter((p) => {
      return (
        p.name.toLowerCase().includes(searchLower) ||
        (p.grantName && p.grantName.toLowerCase().includes(searchLower)) ||
        (p.location && p.location.toLowerCase().includes(searchLower))
      );
    });
  }, [projects, search]);

  // PAGINATION LOGIC
  const totalPages = Math.max(Math.ceil(filteredProjects.length / itemsPerPage), 1);
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProjects.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProjects, currentPage]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border-l-8 border-[#1e3a8a] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Project Implementation</h1>
          <p className="text-sm text-slate-500 font-medium">Track ground operations funded by active organization grants</p>
        </div>
        <Button onClick={() => { setProjectToEdit(null); setIsOpen(true); }} className="bg-[#1e3a8a] hover:bg-[#172554] text-white">
          <Plus size={18} className="mr-2" /> Launch New Project
        </Button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search project name, grant or location..."
          className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white dark:bg-slate-900"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
        />
      </div>

      {/* DATA TABLE */}
      <Card className="shadow-sm">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#1e3a8a] text-white uppercase text-xs font-bold">
              <tr>
                <th className="p-4">Project Details</th>
                <th className="p-4">Connected Grant Link</th>
                <th className="p-4">Budget Given</th>
                <th className="p-4">Timeline & Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedProjects.map((project) => (
                <tr key={project.id} className="hover:bg-slate-50">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-[#1e3a8a]"/>
                        <div>
                            <span className="font-bold">{project.name}</span><br/>
                            <span className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={10}/> {project.location}</span>
                        </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-[#1e3a8a] bg-blue-50 px-2 py-1 rounded text-xs">{project.grantName}</span>
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-800">{formatCurrency(project.totalBudget || project.budget)}</td>
                  <td className="p-4 text-xs">
                    <div className="flex items-center gap-1"><Calendar size={12}/> {project.startDate} - {project.endDate}</div>
                    <span className={`mt-1 inline-block px-2 py-0.5 rounded-full font-bold uppercase ${project.status === "Completed" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>{project.status}</span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleEdit(project)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={() => confirmDelete(project.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* DELETE ALERT DIALOG */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project record from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PAGINATION */}
      {filteredProjects.length > 0 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
            </PaginationItem>
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink onClick={() => setCurrentPage(i + 1)} isActive={currentPage === i + 1}>{i + 1}</PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* 🌟 Halkan waxaa lagu daray stockItems={stockInEntries} */}
      <CreateProject 
        isOpen={isOpen} 
        onClose={handleCloseModal} 
        refreshProjects={refreshProjects} 
        projectToEdit={projectToEdit}
        grants={grants}
        stockItems={stockInEntries} 
        createProject={createProject}
        updateProject={updateProject}
      />
    </div>
  );
}