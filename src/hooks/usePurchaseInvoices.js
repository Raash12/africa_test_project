import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function usePurchaseInvoices() {
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const invoiceSnapshot = await getDocs(collection(db, "purchase_invoices"));
      const programSnapshot = await getDocs(collection(db, "programs"));
      const supplierSnapshot = await getDocs(collection(db, "suppliers"));

      // Diyaarinta Maabka Program-yada
      const programsMap = {};
      programSnapshot.forEach(doc => {
        programsMap[doc.id] = doc.data().programName || "N/A";
      });

      // Diyaarinta Maabka Suppliers-ka
      const suppliersMap = {};
      supplierSnapshot.forEach(doc => {
        const data = doc.data();
        suppliersMap[doc.id] = data.company || data.supplierName || "N/A";
      });

      // Isku xirka Xogta
      const invoicesList = invoiceSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          program: programsMap[data.programId] || "N/A",
          supplierName: suppliersMap[data.supplierId] || "N/A",
        };
      });

      // Newest first sorting
      invoicesList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setPurchaseInvoices(invoicesList);
    } catch (err) {
      console.error("Error loading purchase invoices:", err);
      setError(err.message || "Khalad ayaa dhacay sxb.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return {
    purchaseInvoices,
    loading,
    refreshInvoices: fetchInvoices
  };
}