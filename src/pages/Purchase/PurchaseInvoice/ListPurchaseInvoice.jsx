import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Search, FileSpreadsheet, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

import usePurchaseInvoices from "@/hooks/usePurchaseInvoices";
import { updatePurchaseInvoice, deletePurchaseInvoice } from "@/services/purchase/purchaseInvoiceService";
import CreatePurchaseInvoice from "./CreatePurchaseInvoice";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

export default function ListPurchaseInvoice() {
  const { purchaseInvoices = [], refreshInvoices } = usePurchaseInvoices();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  // States-ka Alert Dialogs
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [activePI, setActivePI] = useState(null);
  const [pendingStatus, setPendingStatus] = useState("");
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [piToDelete, setPiToDelete] = useState(null);

  // Pagination Configuration
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const initiateStatusChange = (pi, status) => {
    setActivePI(pi);
    setPendingStatus(status);
    setIsAlertOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!activePI || !pendingStatus) return;
    try {
      await updatePurchaseInvoice(activePI.id, { paymentStatus: pendingStatus });
      await refreshInvoices();
      toast.success(`Invoice ${activePI.invoiceNumber} status-kiisa waa la beddelay!`);
    } catch (error) {
      toast.error("Wuu guuldarraystay isbeddelku.");
    } finally {
      setIsAlertOpen(false);
      setActivePI(null);
      setPendingStatus("");
    }
  };

  const initiateDelete = (pi) => {
    setPiToDelete(pi);
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!piToDelete) return;
    try {
      await deletePurchaseInvoice(piToDelete.id);
      await refreshInvoices();
      toast.success(`Invoice-kii ${piToDelete.invoiceNumber} waa la tirtiray!`);
    } catch (error) {
      toast.error("Wuu guuldarraystay tirtirku.");
    } finally {
      setIsDeleteAlertOpen(false);
      setPiToDelete(null);
    }
  };

  // Search Logic (No Negative symbols style rules built-in)
  const filteredPIs = useMemo(() => {
    const searchLower = search.toLowerCase();
    return purchaseInvoices.filter((p) => {
      return (
        p.invoiceNumber?.toLowerCase().includes(searchLower) ||
        p.refPoNumber?.toLowerCase().includes(searchLower) ||
        p.program?.toLowerCase().includes(searchLower) ||
        p.paymentStatus?.toLowerCase().includes(searchLower)
      );
    });
  }, [purchaseInvoices, search]);

  // Pagination Logic
  const totalPages = Math.max(Math.ceil(filteredPIs.length / itemsPerPage), 1);
  const paginatedPIs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPIs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPIs, currentPage]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">
      
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border-l-8 border-blue-600 shadow-sm border border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Purchase Invoices (PI)</h1>
          <p className="text-sm text-slate-500 font-medium">Manage Goods Received Receipts & Vendor Payments</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 shadow-md gap-2">
          <Plus size={18} /> New Invoice (From PO)
        </Button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-md shadow-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search Invoice number, PO ref or Project..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-lg outline-none bg-white dark:bg-slate-900"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
        />
      </div>

      {/* DATA TABLE */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-800 text-white text-xs uppercase tracking-widest font-bold">
                <tr>
                  <th className="p-4">Invoice Number</th>
                  <th className="p-4">Ref PO</th>
                  <th className="p-4">Project</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Date Received</th>
                  <th className="p-4 text-center">Payment Status</th>
                  <th className="p-4 text-center w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedPIs.map((pi) => (
                  <tr key={pi.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet size={16} className="text-blue-600" />
                        <span className="font-bold font-mono">{pi.invoiceNumber}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-600 dark:text-slate-400">{pi.refPoNumber}</td>
                    <td className="p-4 font-medium text-xs max-w-[150px] truncate">{pi.program}</td>
                    
                    {/* Discount corrections embedded implicitly (Positive & Black) */}
                    <td className="p-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                      ${(pi.totalAmount || 0).toLocaleString()}
                    </td>
                    
                    <td className="p-4 text-xs">
                      <div className="flex items-center gap-1 text-slate-500">
                        <Calendar size={12} />
                        {pi.createdAt ? new Date(pi.createdAt).toLocaleDateString() : "N/A"}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        pi.paymentStatus === "PAID" 
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400" 
                          : "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400"
                      }`}>
                        {pi.paymentStatus}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center items-center gap-1">
                        {pi.paymentStatus === "UNPAID" ? (
                          <button onClick={() => initiateStatusChange(pi, "PAID")} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Mark as Paid">
                            <CheckCircle2 size={16} />
                          </button>
                        ) : (
                          <button onClick={() => initiateStatusChange(pi, "UNPAID")} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg" title="Mark as Unpaid">
                            <XCircle size={16} />
                          </button>
                        )}
                        <button onClick={() => initiateDelete(pi)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Delete Invoice">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPIs.length === 0 && (
            <div className="p-12 text-center text-slate-400 italic">No purchase invoices found sxb.</div>
          )}

          {/* PAGINATION SECTION */}
          {filteredPIs.length > 0 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className={currentPage === 1 ? "opacity-30 pointer-events-none" : "cursor-pointer"} />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink isActive={currentPage === i + 1} onClick={() => setCurrentPage(i + 1)} className="cursor-pointer">
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className={currentPage === totalPages ? "opacity-30 pointer-events-none" : "cursor-pointer"} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ALERT DIALOGS (STATUS & DELETE) */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Beddel Xaaladda Lacagta</AlertDialogTitle>
            <AlertDialogDescription>
              Ma hubtaa inaad Invoice-kan lambarkiisu yahay <b>{activePI?.invoiceNumber}</b> aad ka dhigto <b>{pendingStatus}</b>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmStatusChange} className="bg-blue-600 text-white">Xaqiiji</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ma hubtaa inaad tirtirto?</AlertDialogTitle>
            <AlertDialogDescription>
              Invoice-kan <b>{piToDelete?.invoiceNumber}</b> dib looma soo celin karo marka aad tirtirto sxb.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CREATE INVOICE MODAL */}
      <CreatePurchaseInvoice isOpen={isOpen} onClose={() => setIsOpen(false)} refreshInvoices={refreshInvoices} />
    </div>
  );
}