import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Plus, Search, Calendar, Package } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase"; // 🌟 Hubi in kani yahay wadada saxda ah ee db-gaaga Firebase
import { collection, getDocs } from "firebase/firestore";

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

import useGrants from "@/hooks/useGrants";
import { createGrant, updateGrant, deleteGrant } from "@/services/grants/grantService";
import CreateGrant from "./CreateGrant";

export default function ListGrant() {
  const { grants = [], donors = [], programs = [], refreshGrants } = useGrants();
  const [itemsList, setItemsList] = useState([]); // State-ka cusub ee kaydinaya items-ka
  const [isOpen, setIsOpen] = useState(false);
  const [grantToEdit, setGrantToEdit] = useState(null);
  const [search, setSearch] = useState("");

  // DELETE STATES
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [grantToDelete, setGrantToDelete] = useState(null);

  // PAGINATION STATES
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 🌟 WAXA KELIYA EE LAGU DARAY: Soo aqrinta alaabta (Items) si loogu dhiibo foomka hoose
  useEffect(() => {
    const fetchInventoryItems = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "items"));
        const fetchedItems = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setItemsList(fetchedItems);
      } catch (error) {
        console.error("Error fetching inventory items:", error);
      }
    };
    fetchInventoryItems();
  }, []);

  const handleEdit = (grant) => {
    setGrantToEdit(grant);
    setIsOpen(true);
  };

  // DELETE LOGIC
  const confirmDelete = (id) => {
    setGrantToDelete(id);
    setIsAlertOpen(true);
  };

  const executeDelete = async () => {
    try {
      await deleteGrant(grantToDelete);
      await refreshGrants();
      toast.success("Grant deleted successfully.");
    } catch (error) {
      toast.error("Failed to delete grant. Please try again.");
    } finally {
      setIsAlertOpen(false);
      setGrantToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setGrantToEdit(null);
  };

  // SEARCH LOGIC
  const filteredGrants = useMemo(() => {
    const valid = (grants || []).filter(g => g && g.id && g.grantName);
    const searchLower = search.toLowerCase();

    return valid.filter((g) => {
      return (
        g.grantName.toLowerCase().includes(searchLower) ||
        g.donorName.toLowerCase().includes(searchLower) ||
        (g.programName && g.programName.toLowerCase().includes(searchLower)) ||
        (g.notes && g.notes.toLowerCase().includes(searchLower))
      );
    });
  }, [grants, search]);

  // PAGINATION LOGIC
  const totalPages = Math.max(Math.ceil(filteredGrants.length / itemsPerPage), 1);
  const paginatedGrants = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredGrants.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredGrants, currentPage]);

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount);
  };

  // 🌟 HELPER FUNCTION: Waxay itemId-ga u beddelaysa itemName-ka saxda ah ee foomka laga dhex heli karo
  const getItemNameById = (id) => {
    const found = itemsList.find(item => item.id === id);
    return found ? found.itemName : "Unknown Item";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border-l-8 border-[#1e3a8a] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Grants & Funding</h1>
          <p className="text-sm text-slate-500 font-medium">Manage Agreements and Funds Linked to Donors</p>
        </div>
        <Button onClick={() => { setGrantToEdit(null); setIsOpen(true); }} className="bg-[#1e3a8a] hover:bg-[#172554] text-white">
          <Plus size={18} className="mr-2" /> Allocate New Grant
        </Button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search grant, donor or program..."
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
                <th className="p-4">Grant / Project Funding</th>
                <th className="p-4">Source Donor</th>
                <th className="p-4">Allocated Items</th> {/* 🌟 Magaca tiirka waa la cusboonaysiiyay */}
                <th className="p-4">Allocated Budget</th>
                <th className="p-4">Timeline</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedGrants.map((grant) => (
                <tr key={grant.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-4">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{grant.grantName}</span><br/>
                    <span className="text-blue-600 dark:text-blue-400 text-xs font-medium">Program: {grant.programName}</span>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-[#1e3a8a] bg-blue-50 px-2 py-1 rounded text-xs">{grant.donorName}</span>
                  </td>
                  
                  {/* 🌟 WAXA CUSUB: Halkan waxay ku tuseysaa dhamaan Items-ka loo qoondeeyay Grant-kan */}
                  <td className="p-4">
                    {grant.items && grant.items.length > 0 ? (
                      <div className="flex flex-col gap-1 max-w-[200px]">
                        {grant.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                            <Package size={12} className="text-slate-400 flex-shrink-0" />
                            <span className="truncate font-medium">{getItemNameById(item.itemId)}</span>
                            <span className="ml-auto font-mono bg-white dark:bg-slate-900 px-1 rounded border font-bold text-blue-600 dark:text-blue-400">
                              x{item.qty}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No items allocated</span>
                    )}
                  </td>

                  <td className="p-4 font-mono font-bold text-emerald-600">{formatCurrency(grant.amount, grant.currency)}</td>
                  <td className="p-4 text-xs">
                    <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400"><Calendar size={12}/> Start: {grant.startDate}</div>
                    <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400"><Calendar size={12}/> End: {grant.endDate}</div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleEdit(grant)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={() => confirmDelete(grant.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg"><Trash2 size={16} /></button>
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
              This action cannot be undone. This will permanently delete the grant record from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700">Yes, Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PAGINATION */}
      {filteredGrants.length > 0 && (
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

      <CreateGrant 
        isOpen={isOpen} 
        onClose={handleCloseModal} 
        refreshGrants={refreshGrants} 
        grantToEdit={grantToEdit}
        donors={donors}
        programs={programs}
        items={itemsList} 
        createGrant={createGrant}
        updateGrant={updateGrant}
      />
    </div>
  );
}