import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";

import useProjects from "@/hooks/useProjects";
import useStockIn from "@/hooks/useStockIn";
import { deleteProject } from "@/services/projects/projectService";
import CreateProject from "./CreateProject";

export default function ListProject() {
  const { projects = [], grants = [], refreshProjects } = useProjects();
  const { stockInEntries = [] } = useStockIn();
  
  const [isOpen, setIsOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [search, setSearch] = useState("");
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => { refreshProjects(); }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => 
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      grants.find(g => g.id === p.grantId)?.grantName?.toLowerCase().includes(search.toLowerCase())
    );
  }, [projects, search, grants]);

  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProjects.slice(start, start + itemsPerPage);
  }, [filteredProjects, currentPage]);

  const executeDelete = async () => {
    try {
      await deleteProject(projectToDelete);
      await refreshProjects();
      toast.success("Project deleted.");
    } catch (e) { toast.error("Error deleting project."); }
    setIsAlertOpen(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border-l-8 border-[#1e3a8a] shadow-sm">
        <h1 className="text-2xl font-bold uppercase">Project Implementation</h1>
        <Button onClick={() => { setProjectToEdit(null); setIsOpen(true); }} className="bg-[#1e3a8a] text-white">
          <Plus size={18} className="mr-2" /> Launch New Project
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-[#1e3a8a] text-white uppercase text-xs font-bold">
              <tr>
                <th className="p-4">Project Name</th>
                <th className="p-4">Grant Name</th>
                <th className="p-4">Allocations</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedProjects.map((project) => (
                <tr key={project.id}>
                  <td className="p-4 font-bold">{project.name}</td>
                  <td className="p-4 text-xs font-medium text-blue-700">
                    {grants.find(g => g.id === project.grantId)?.grantName || "N/A"}
                  </td>
                  <td className="p-4">
                    <div className="max-h-[70px] overflow-y-auto border-l-2 border-blue-200 pl-2">
                      {project.allocations?.map((a, i) => (
                        <div key={i} className="text-[10px] bg-slate-50 p-1 mb-1 flex justify-between">
                          <span>{a.region} / {a.district}</span>
                          <span className="font-bold">{a.qty}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 flex justify-center gap-2">
                    <button onClick={() => { setProjectToEdit(project); setIsOpen(true); }} className="text-blue-600"><Edit2 size={16} /></button>
                    <button onClick={() => { setProjectToDelete(project.id); setIsAlertOpen(true); }} className="text-red-500"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Modal - Halkan ayuu `projectToEdit` u dhaafayaa xogta UPDATE */}
      <CreateProject 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        refreshProjects={refreshProjects} 
        projectToEdit={projectToEdit} // 🌟 Xogta ayaa halkan ku socota
        grants={grants}
        stockItems={stockInEntries} 
      />

      {/* Delete Dialog */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}