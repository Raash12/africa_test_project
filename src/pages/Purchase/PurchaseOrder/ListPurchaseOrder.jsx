import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Plus, Search, FileText, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner"; 

import usePurchaseOrders from "@/hooks/usePurchaseOrders";
import { createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder } from "@/services/purchase/purchaseOrderService";
import CreatePurchaseOrder from "./CreatePurchaseOrder";

// 🌟 SHADCN ALERT DIALOG IMPORTS
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

export default function ListPurchaseOrder() {
  const { purchaseOrders = [], refreshPOs } = usePurchaseOrders();
  const [isOpen, setIsOpen] = useState(false);
  const [poToEdit, setPoToEdit] = useState(null);
  const [search, setSearch] = useState("");

  // 🌟 STATUS UPDATE ALERT STATES
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [activePO, setActivePO] = useState(null);
  const [pendingStatus, setPendingStatus] = useState("");

  // 🌟 DELETE ALERT STATES
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [poToDelete, setPoToDelete] = useState(null);

  // 🔢 PAGINATION STATES
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleEdit = (po) => {
    setPoToEdit(po);
    setIsOpen(true);
  };

  // 🌟 INITIATE DELETE
  const initiateDelete = (po) => {
    setPoToDelete(po);
    setIsDeleteAlertOpen(true);
  };

  // 🌟 CONFIRM DELETE BACKEND
  const handleConfirmDelete = async () => {
    if (!poToDelete) return;

    try {
      await deletePurchaseOrder(poToDelete.id);
      await refreshPOs();
      toast.success(`Dalabkii ${poToDelete.poNumber} waa la tirtiray si guul ah sxb!`);
    } catch (error) {
      console.error("Error deleting PO:", error);
      toast.error("Wuu guuldarraystay tirtirku sxb.");
    } finally {
      setIsDeleteAlertOpen(false);
      setPoToDelete(null);
    }
  };

  // 🌟 DIIWAANGALINTA STATUS CLICK-KA
  const initiateStatusChange = (po, status) => {
    setActivePO(po);
    setPendingStatus(status);
    setIsAlertOpen(true);
  };

  // 🌟 FUNCTION-KA RUNTA AH EE STATUS UPDATE
  const handleConfirmStatusChange = async (e) => {
    if (e) e.preventDefault();
    if (!activePO || !pendingStatus) return;

    const targetPO = activePO;
    const targetStatus = pendingStatus;

    try {
      await updatePurchaseOrder(targetPO.id, { 
        status: targetStatus 
      });
      
      await refreshPOs(); 
      
      if (targetStatus === "APPROVED") {
        toast.success(`Dalabkii ${targetPO.poNumber} waa la ansixiyey si guul ah!`);
      } else {
        toast.error(`Dalabkii ${targetPO.poNumber} waa la diiday!`);
      }
    } catch (error) {
      console.error("Error updating PO status:", error);
      toast.error("Wuu guuldarraystay isbeddelku sxb.");
    } finally {
      setIsAlertOpen(false);
      setActivePO(null);
      setPendingStatus("");
    }
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setPoToEdit(null);
  };

  // 🔍 SEARCH LOGIC
  const filteredPOs = useMemo(() => {
    const valid = (purchaseOrders || []).filter(p => p && p.poNumber);
    const searchLower = search.toLowerCase();

    return valid.filter((p) => {
      return (
        p.poNumber.toLowerCase().includes(searchLower) ||
        (p.status && p.status.toLowerCase().includes(searchLower)) ||
        (p.program && p.program.toLowerCase().includes(searchLower)) ||
        (p.totalAmount && p.totalAmount.toString().includes(searchLower))
      );
    });
  }, [purchaseOrders, search]);

  // 🔢 PAGINATION LOGIC
  const totalPages = Math.max(Math.ceil(filteredPOs.length / itemsPerPage), 1);
  
  const paginatedPOs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPOs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPOs, currentPage]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border-l-8 border-[#1e3a8a] dark:border-blue-500 shadow-sm border border-slate-100 dark:border-slate-800 transition-all">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 uppercase tracking-tight">Purchase Orders</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manage Procurement & Material Requisitions</p>
        </div>

        <Button 
          type="button"
          onClick={() => { setPoToEdit(null); setIsOpen(true); }}
          className="bg-[#1e3a8a] dark:bg-blue-600 hover:bg-[#172554] dark:hover:bg-blue-700 text-white px-6 shadow-md border-none transition-all gap-2 cursor-pointer"
        >
          <Plus size={18} /> New Purchase Order
        </Button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-md shadow-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
        <input
          type="text"
          placeholder="Search PO number, amount or status..."
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
                  <th className="p-4">PO Number</th>
                  <th className="p-4">Items Count</th>
                  <th className="p-4">Total Budget</th>
                  <th className="p-4">Date Issued</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center w-40">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedPOs.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    
                    {/* PO Number */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-[#1e3a8a] dark:text-blue-400" />
                        <span className="font-bold text-slate-800 dark:text-slate-200 block font-mono">{po.poNumber}</span>
                      </div>
                    </td>
                    
                    {/* Items Count */}
                    <td className="p-4">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-xs">
                        {(po.items || []).length} Items
                      </span>
                    </td>

                    {/* Total Amount */}
                    <td className="p-4 font-mono font-bold text-[#1e3a8a] dark:text-blue-400">
                      ${(po.totalAmount || 0).toLocaleString()}
                    </td>

                    {/* Date */}
                    <td className="p-4 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-slate-400 shrink-0"/> 
                        {po.createdAt ? new Date(po.createdAt).toLocaleDateString() : "N/A"}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="p-4 text-center">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        po.status === "PENDING" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400" :
                        po.status === "APPROVED" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400" : 
                        "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400"
                      }`}>
                        {po.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center">
                      <div className="flex justify-center items-center gap-1">
                        
                        {/* BADHAMADA STATUS UPDATE */}
                        {po.status === "PENDING" && (
                          <>
                            <button
                              type="button"
                              onClick={() => initiateStatusChange(po, "APPROVED")}
                              className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-all cursor-pointer"
                              title="Approve PO"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => initiateStatusChange(po, "REJECTED")}
                              className="p-1.5 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all cursor-pointer"
                              title="Reject PO"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}

                        {/* Edit iyo Delete */}
                        <button
                          type="button"
                          onClick={() => handleEdit(po)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all cursor-pointer"
                          title="Edit PO"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => initiateDelete(po)} // 🌟 LABADELAY SHADCN ALERT DIALOG
                          className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all cursor-pointer"
                          title="Delete PO"
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

          {filteredPOs.length === 0 && (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500 italic">
              No purchase orders registered yet. Click new order to begin.
            </div>
          )}

          {/* 🔢 PAGINATION SECTION */}
          {filteredPOs.length > 0 && (
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

      {/* 🌟 SHADCN ALERT DIALOG FOR STATUS UPDATE */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-slate-100 font-bold">
              Xaqiiji Wax ka Beddelka Status-ka
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-slate-400 text-sm">
              Ma hubtaa inaad dalabkaan lambarkiisu yahay {" "}
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{activePO?.poNumber}</span> {" "}
              aad ka dhigto <span className="font-bold uppercase text-blue-600">{pendingStatus}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-none rounded-lg text-xs font-medium cursor-pointer">
              cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmStatusChange}
              className={`text-white font-medium rounded-lg text-xs cursor-pointer border-none ${
                pendingStatus === "APPROVED" 
                  ? "bg-emerald-600 hover:bg-emerald-700" 
                  : "bg-rose-600 hover:bg-rose-700"
              }`}
            >
              {pendingStatus === "APPROVED" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 🌟 SHADCN ALERT DIALOG FOR DELETE PO */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-slate-100 font-bold flex items-center gap-2">
               Are you sure you want to delete
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-slate-400 text-sm">
              this (PO)  {" "}
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{poToDelete?.poNumber}</span> {" "}
            
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-none rounded-lg text-xs font-medium cursor-pointer">
               Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-xs cursor-pointer border-none"
            >
              delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MODAL COMPONENT */}
      <CreatePurchaseOrder 
        isOpen={isOpen} 
        onClose={handleCloseModal} 
        refreshPOs={refreshPOs} 
        poToEdit={poToEdit}
        createPurchaseOrder={createPurchaseOrder}
        updatePurchaseOrder={updatePurchaseOrder}
      />
    </div>
  );
}