// hooks/useWarehouse.js
import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function useWarehouse() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snap = await getDocs(collection(db, "warehouses"));
      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // U kala sooc kii ugu dambeeyey ee la dhoodhoobo
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setWarehouses(list);
    } catch (err) {
      console.error("Error loading warehouses:", err);
      setError(err.message || "Khalad ayaa dhacay sxb.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  return {
    warehouses,
    loading,
    refreshWarehouses: fetchWarehouses,
  };
}