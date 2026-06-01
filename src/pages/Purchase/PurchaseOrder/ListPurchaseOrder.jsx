import { useState, useMemo, useEffect } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  Edit2,
  Trash2,
  Plus,
  Search,
  FileText,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

import { toast } from "sonner";

import usePurchaseOrders from "@/hooks/usePurchaseOrders";
import useSuppliers from "@/hooks/useSuppliers";
import useGrants from "@/hooks/useGrants";
import useItems from "@/hooks/useItems";

import {
  updatePurchaseOrder,
  deletePurchaseOrder,
} from "@/services/purchase/purchaseOrderService";

import CreatePurchaseOrder from "./CreatePurchaseOrder";

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
  const { suppliers = [] } = useSuppliers();
  const { grants = [] } = useGrants();
  const { items = [] } = useItems();

  const [isOpen, setIsOpen] = useState(false);
  const [poToEdit, setPoToEdit] = useState(null);
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [activePO, setActivePO] = useState(null);
  const [pendingStatus, setPendingStatus] = useState("");
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [poToDelete, setPoToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // HELPERS
  const getSupplierName = (supplierId) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    return supplier ? `${supplier.company}` : "N/A";
  };

  const getGrantName = (grantId) => {
    const grant = grants.find((g) => g.id === grantId);
    return grant ? grant.grantName : "N/A";
  };

  const getItemNames = (poItems = []) => {
    if (!poItems || poItems.length === 0) return "No items";
    return poItems
      .map((poItem) => {
        const found = items.find((i) => i.id === poItem.itemId);
        return found?.itemName || "Unknown";
      })
      .join(", ");
  };

  // EDIT
  const handleEdit = (po) => {
    setPoToEdit(po);
    setIsOpen(true);
  };

  // DELETE INIT
  const initiateDelete = (po) => {
    setPoToDelete(po);
    setIsDeleteAlertOpen(true);
  };

  // DELETE CONFIRM
  const handleConfirmDelete = async (e) => {
    if (e) e.preventDefault();
    if (!poToDelete || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await deletePurchaseOrder(poToDelete.id);
      await refreshPOs();
      toast.success(`Dalabkii ${poToDelete.poNumber} waa la tirtiray si guul ah sxb!`);
    } catch (error) {
      console.error("Error deleting PO:", error);
      toast.error("Wuu guuldarraystay tirtirku sxb.");
    } finally {
      setIsSubmitting(false);
      setIsDeleteAlertOpen(false);
      setPoToDelete(null);
    }
  };

  // STATUS INIT
  const initiateStatusChange = (po, status) => {
    setActivePO(po);
    setPendingStatus(status);
    setIsAlertOpen(true);
  };

  // STATUS CONFIRM
  const handleConfirmStatusChange = async (e) => {
    if (e) e.preventDefault();
    if (!activePO || !pendingStatus || isSubmitting) return;

    setIsSubmitting(true);
    const targetPO = activePO;
    const targetStatus = pendingStatus;

    try {
      await updatePurchaseOrder(targetPO.id, { status: targetStatus });
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
      setIsSubmitting(false);
      setIsAlertOpen(false);
      setActivePO(null);
      setPendingStatus("");
    }
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setPoToEdit(null);
  };

  // SEARCH & FILTER
  const filteredPOs = useMemo(() => {
    const valid = (purchaseOrders || []).filter((p) => p && p.poNumber);
    const searchLower = search.toLowerCase().trim();

    if (!searchLower) return valid;

    return valid.filter((p) => {
      const poNum = p.poNumber.toLowerCase();
      const status = (p.status || "").toLowerCase();
      const supplier = getSupplierName(p.supplierId).toLowerCase();
      const grant = getGrantName(p.grantId).toLowerCase();
      const total = p.totalAmount ? p.totalAmount.toString() : "";

      return (
        poNum.includes(searchLower) ||
        status.includes(searchLower) ||
        supplier.includes(searchLower) ||
        grant.includes(searchLower) ||
        total.includes(searchLower)
      );
    });
  }, [purchaseOrders, search, suppliers, grants]);

  // PAGINATION CALCULATIONS
  const totalPages = Math.max(Math.ceil(filteredPOs.length / itemsPerPage), 1);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredPOs, totalPages, currentPage]);

  const paginatedPOs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPOs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPOs, currentPage]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border-l-8 border-[#1e3a8a] dark:border-blue-500 shadow-sm border border-slate-100 dark:border-slate-800 transition-all">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 uppercase tracking-tight">
            Purchase Orders
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Manage Procurement & Material Requisitions
          </p>
        </div>

        <Button
          type="button"
          onClick={() => {
            setPoToEdit(null);
            setIsOpen(true);
          }}
          className="bg-[#1e3a8a] dark:bg-blue-600 hover:bg-[#172554] dark:hover:bg-blue-700 text-white px-6 shadow-md border-none transition-all gap-2 cursor-pointer"
        >
          <Plus size={18} />
          New Purchase Order
        </Button>
      </div>

      {/* SEARCH */}
      <div className="relative max-w-md shadow-sm">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          size={18}
        />
        <input
          type="text"
          placeholder="Search PO, supplier, grant or amount..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition-all bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* TABLE */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#1e3a8a] dark:bg-slate-800 text-white dark:text-slate-100 text-xs uppercase tracking-widest font-bold">
                <tr>
                  <th className="p-4">PO Number</th>
                  <th className="p-4">Supplier</th>
                  <th className="p-4">Grant</th>
                  <th className="p-4">Items</th>
                  <th className="p-4">Account</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center w-40">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedPOs.map((po) => (
                  <tr
                    key={po.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* PO */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-[#1e3a8a] dark:text-blue-400" />
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block font-mono">
                            {po.poNumber}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {(po.items || []).length} items
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* SUPPLIER */}
                    <td className="p-4">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                        {getSupplierName(po.supplierId)}
                      </span>
                    </td>

                    {/* GRANT */}
                    <td className="p-4">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-xs">
                        {getGrantName(po.grantId)}
                      </span>
                    </td>

                    {/* ITEMS */}
                    <td className="p-4 max-w-[220px]">
                      <span className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">
                        {getItemNames(po.items)}
                      </span>
                    </td>

                    {/* ACCOUNT */}
                    <td className="p-4">
                      <span className="text-[10px] uppercase font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-600 dark:text-slate-300">
                        {po.accountCategory || "N/A"}
                      </span>
                    </td>

                    {/* TOTAL */}
                    <td className="p-4 font-mono font-bold text-[#1e3a8a] dark:text-blue-400">
                      ${(po.totalAmount || 0).toLocaleString()}
                    </td>

                    {/* DATE */}
                    <td className="p-4 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-slate-400 shrink-0" />
                        {po.createdAt ? new Date(po.createdAt).toLocaleDateString() : "N/A"}
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="p-4 text-center">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          po.status === "PENDING"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                            : po.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400"
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="p-4 text-center">
                      <div className="flex justify-center items-center gap-1">
                        {po.status === "PENDING" && (
                          <>
                            <button
                              type="button"
                              onClick={() => initiateStatusChange(po, "APPROVED")}
                              className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-all cursor-pointer"
                            >
                              <CheckCircle2 size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => initiateStatusChange(po, "REJECTED")}
                              className="p-1.5 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all cursor-pointer"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => handleEdit(po)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all cursor-pointer"
                        >
                          <Edit2 size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => initiateDelete(po)}
                          className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all cursor-pointer"
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

          {/* EMPTY STATE */}
          {filteredPOs.length === 0 && (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500 italic">
              No purchase orders registered yet.
            </div>
          )}

          {/* PAGINATION PANEL */}
          {filteredPOs.length > 0 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage((p) => Math.max(1, p - 1));
                      }}
                      className={`bg-white dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 cursor-pointer ${
                        currentPage === 1 ? "opacity-30 pointer-events-none" : ""
                      }`}
                    />
                  </PaginationItem>

                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        isActive={currentPage === i + 1}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(i + 1);
                        }}
                        className={`cursor-pointer ${
                          currentPage === i + 1
                            ? "bg-[#1e3a8a] dark:bg-blue-600 text-white border-[#1e3a8a] dark:border-blue-600"
                            : "bg-white dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage((p) => Math.min(totalPages, p + 1));
                      }}
                      className={`bg-white dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 cursor-pointer ${
                        currentPage === totalPages ? "opacity-30 pointer-events-none" : ""
                      }`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* STATUS ALERT */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-slate-100 font-bold">
              Confirm Status Change
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-slate-400 text-sm">
              Are you sure to update{" "}
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {activePO?.poNumber}
              </span>{" "}
              to{" "}
              <span className={`font-bold uppercase ${pendingStatus === "APPROVED" ? "text-emerald-600" : "text-rose-600"}`}>
                {pendingStatus}
              </span>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmStatusChange}
              disabled={isSubmitting}
              className={`text-white ${
                pendingStatus === "APPROVED"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-rose-600 hover:bg-rose-700"
              }`}
            >
              {isSubmitting && <Loader2 className="animate-spin mr-1" />}
              {pendingStatus === "APPROVED" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DELETE ALERT */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-slate-100 font-bold">
              Delete Purchase Order
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-slate-400 text-sm">
              Delete PO{" "}
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {poToDelete?.poNumber}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting && <Loader2 className="animate-spin mr-1" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CREATE/EDIT MODAL */}
      <CreatePurchaseOrder
        isOpen={isOpen}
        onClose={handleCloseModal}
        refreshPOs={refreshPOs}
        poToEdit={poToEdit}
      />
    </div>
  );
}