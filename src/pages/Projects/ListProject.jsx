import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Plus, Search, Calendar } from "lucide-react";
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

  // Format Firestore timestamp si uu u noqdo qoraal la akhriyi karo
  const formatDateTime = (createdAt) => {
    if (!createdAt) return "N/A";
    const date = createdAt.seconds ? new Date(createdAt.seconds * 1000) : new Date(createdAt);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  // 🛠️ Halkan ayaa lagu daray habaynta (Sorting: Latest First)
  const filteredProjects = useMemo(() => {
    // Marka hore xogta sifee (Filter)
    const filtered = projects.filter((p) => {
      const projectName = p.name?.toLowerCase() || "";
      const grantName = grants.find(g => g.id === p.grantId)?.grantName?.toLowerCase() || "";
      const projectDate = formatDateTime(p.createdAt).toLowerCase();
      const searchTerm = search.toLowerCase();

      return projectName.includes(searchTerm) || 
             grantName.includes(searchTerm) || 
             projectDate.includes(searchTerm);
    });

    // Marka xigta u kala saar kii ugu dambeeyey ha ugu kor maro (Descending Order)
    return filtered.sort((a, b) => {
      const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
      const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
      return timeB - timeA; // Kii ugu weyn (ugu dambeeyey) ayaa soo horraynaya
    });
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
        <div className="space-y-1">
          <h1 className="text-2xl font-bold uppercase">Project Implementation</h1>
          <p className="text-xs text-slate-500">Kala soco halkan mashaariicda la fuliyey iyo taariikhda la diwangeliyey.</p>
        </div>
        <Button onClick={() => { setProjectToEdit(null); setIsOpen(true); }} className="bg-[#1e3a8a] text-white">
          <Plus size={18} className="mr-2" /> Launch New Project
        </Button>
      </div>

      {/* Search Input Control */}
      <div className="flex items-center gap-2 max-w-sm bg-white border rounded-lg px-3 py-2 shadow-sm">
        <Search size={16} className="text-slate-400" />
        <input 
          type="text" 
          placeholder="Search by name, grant or date..." 
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} // Reset bogga kowaad marka la raadinayo
          className="text-sm outline-none w-full bg-transparent"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-[#1e3a8a] text-white uppercase text-xs font-bold">
              <tr>
                <th className="p-4 text-left">Project Name</th>
                <th className="p-4 text-left">Grant Name</th>
                <th className="p-4 text-left">Allocations</th>
                <th className="p-4 text-left">Date & Time</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y bg-white">
              {paginatedProjects.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400 font-medium">
                    Wax mashruuc ah lama helin.
                  </td>
                </tr>
              ) : (
                paginatedProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-800">{project.name}</td>
                    <td className="p-4 text-xs font-medium text-blue-700">
                      {grants.find(g => g.id === project.grantId)?.grantName || "N/A"}
                    </td>
                    <td className="p-4">
                      <div className="max-h-[70px] overflow-y-auto border-l-2 border-blue-200 pl-2">
                        {project.allocations?.map((a, i) => (
                          <div key={i} className="text-[10px] bg-slate-50 p-1 mb-1 flex justify-between rounded">
                            <span>{a.region} / {a.district}</span>
                            <span className="font-bold text-slate-700">{a.qty}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-xs font-semibold text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-400" />
                        {formatDateTime(project.createdAt)}
                      </div>
                    </td>
                    <td className="p-4 flex justify-center gap-3 items-center h-full">
                      <button onClick={() => { setProjectToEdit(project); setIsOpen(true); }} className="text-blue-600 hover:text-blue-800 transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => { setProjectToDelete(project.id); setIsAlertOpen(true); }} className="text-red-500 hover:text-red-700 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Modal */}
      <CreateProject 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        refreshProjects={refreshProjects} 
        projectToEdit={projectToEdit}
        grants={grants}
        stockItems={stockInEntries} 
      />

      {/* Delete Dialog */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-slate-500">
            Ficilkan dib looma soo celin karo. Mashruucan si joogto ah ayaa looga tirtiri doonaa xogta.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}