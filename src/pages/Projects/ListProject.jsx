import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, Plus, Loader2, Calendar, ChevronLeft, ChevronRight } from "lucide-react"; // 🛠️ Halkan ayaa laga tagay hadda waa la saxay!
import { toast } from "sonner";

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

import useProjects from "@/hooks/useProjects";
import useStockIn from "@/hooks/useStockIn";
import useAccounts from "@/hooks/useAccounts"; 
import { deleteProject } from "@/services/projects/projectService";
import CreateProject from "./CreateProject";

export default function ListProject({ accounts: propAccounts = [] }) {
  const { projects = [], grants = [], loading: projectsLoading, refreshProjects } = useProjects();
  const { stockInEntries = [] } = useStockIn();
  const { accounts: hookAccounts = [], loading: accountsLoading } = useAccounts?.() || { accounts: [] };
  
  const activeAccounts = propAccounts.length > 0 ? propAccounts : hookAccounts;

  const [isOpen, setIsOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [search, setSearch] = useState("");
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; 

  useEffect(() => { 
    refreshProjects(); 
  }, []);

  const parseTransactionDate = (dateField) => {
    if (!dateField) return new Date();
    if (typeof dateField.toDate === "function") return dateField.toDate();
    if (dateField.seconds) return new Date(dateField.seconds * 1000);
    return new Date(dateField);
  };

  const formatDateTime = (createdAt) => {
    if (!createdAt) return "N/A";
    const date = parseTransactionDate(createdAt);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  const accountMap = useMemo(() => {
    return activeAccounts.reduce((acc, curr) => {
      const id = curr.id || curr.docId;
      if (id) acc[id] = curr.accountName || "Unnamed Account";
      return acc;
    }, {});
  }, [activeAccounts]);

  const executeDelete = async () => {
    try {
      await deleteProject(projectToDelete);
      await refreshProjects();
      toast.success("Project deleted successfully.");
    } catch (e) { 
      toast.error("Failed to delete project."); 
    } finally {
      setIsAlertOpen(false);
      setProjectToDelete(null);
    }
  };

  const searchedProjects = useMemo(() => {
    const searchLower = search.trim().toLowerCase();
    
    return projects
      .map((p) => {
        const grantName = grants.find(g => g.id === p.grantId)?.grantName || "Direct / No Grant";
        const assetAccName = p.assetAccountName || accountMap[p.assetAccountId] || "Unknown Asset/Bank";
        const expenseAccName = p.expenseAccountName || accountMap[p.expenseAccountId] || "Unknown Expense Account";
        
        return { 
          ...p, 
          resolvedGrantName: grantName,
          resolvedAssetAccount: assetAccName, 
          resolvedExpenseAccount: expenseAccName 
        };
      })
      .filter((p) => 
        (p.name || "").toLowerCase().includes(searchLower) ||
        (p.resolvedGrantName || "").toLowerCase().includes(searchLower) ||
        (p.resolvedAssetAccount || "").toLowerCase().includes(searchLower) ||
        (p.resolvedExpenseAccount || "").toLowerCase().includes(searchLower)
      )
      .sort((a, b) => parseTransactionDate(b.createdAt) - parseTransactionDate(a.createdAt));
  }, [projects, search, grants, accountMap]);

  const totalPages = Math.max(Math.ceil(searchedProjects.length / itemsPerPage), 1);
  const paginatedProjects = searchedProjects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (projectsLoading || accountsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1e3a8a]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      {/* Upper Banner Section */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border-l-8 border-l-[#1e3a8a] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold uppercase">Project Implementation</h1>
          <p className="text-sm text-slate-500">Track and Manage Project implementation & Allocations</p>
        </div>
        <Button onClick={() => { setProjectToEdit(null); setIsOpen(true); }} className="bg-[#1e3a8a] text-white">
          <Plus size={16} className="mr-2" /> Launch New Project
        </Button>
      </div>

      {/* Filter Control */}
      <input
        type="text"
        placeholder="Search description, accounts, grants..."
        className="w-full p-2 border rounded-lg text-xs mb-2 bg-white shadow-sm outline-none"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
      />

      {/* Main Records Matrix Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#1e3a8a] text-white uppercase">
              <tr>
                <th className="p-3">Project Name</th>
                <th className="p-3">Grant Name</th>
                <th className="p-3">Account Flow</th>
                <th className="p-3">Allocations</th>
                <th className="p-3 text-center">QTY</th>
                <th className="p-3 text-right">Total Value</th>
                <th className="p-3">Date & Time</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y bg-white">
              {paginatedProjects.length > 0 ? (
                paginatedProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{project.name}</td>
                    <td className="p-3">
                      <Badge variant="secondary" className="text-blue-700 font-medium">
                        {project.resolvedGrantName}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="text-amber-700 font-medium">CR: {project.resolvedAssetAccount}</div>
                      <div className="text-emerald-700 font-medium">DR: {project.resolvedExpenseAccount}</div>
                    </td>
                    <td className="p-3">
                      <div className="max-h-[70px] overflow-y-auto border-l-2 border-blue-200 pl-2">
                        {project.allocations?.map((a, i) => (
                          <div key={i} className="text-[11px] text-slate-700 font-medium p-0.5">
                            {a.region} / {a.district}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-center font-bold text-slate-800">
                      <div className="max-h-[70px] overflow-y-auto">
                        {project.allocations?.map((a, i) => (
                          <div key={i} className="p-0.5">
                            {a.qty || 0}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-right font-bold text-red-600">
                      ${Number(project.totalValue || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-slate-600 font-medium">
                      <div className="flex items-center gap-1">
                        <Calendar size={13} className="text-slate-400" />
                        {formatDateTime(project.createdAt)}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => { setProjectToEdit(project); setIsOpen(true); }} className="text-blue-600">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => { setProjectToDelete(project.id); setIsAlertOpen(true); }} className="text-red-500">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="p-10 text-center text-slate-500">
                    No projects found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* 🛠️ PAGINATION UI (Aad ayaan uga saaray shuruuddii si uu marwalba u muuqdo sxb) */}
      <div className="flex items-center justify-center gap-1 text-sm font-medium text-slate-500 pt-4">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors text-slate-600"
        >
          <ChevronLeft size={16} />
          <span>Previous</span>
        </button>
        
        <div className="flex items-center justify-center w-9 h-9 border border-slate-200 bg-white text-blue-600 font-semibold rounded-xl shadow-sm">
          {currentPage}
        </div>
        
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors text-slate-600"
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Delete Confirmation Block */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-red-600 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateProject 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        refreshProjects={refreshProjects} 
        projectToEdit={projectToEdit}
        grants={grants}
        stockItems={stockInEntries} 
      />
    </div>
  );
}