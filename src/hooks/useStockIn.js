import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function useStockIn() {
  const [stockInEntries, setStockInEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStockInEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stockInSnapshot = await getDocs(collection(db, "stock_in"));
      const warehouseSnapshot = await getDocs(collection(db, "warehouses"));
      const itemsSnapshot = await getDocs(collection(db, "items"));

      const warehousesMap = {};
      warehouseSnapshot.forEach((doc) => {
        warehousesMap[doc.id] = doc.data().warehouseName || "N/A";
      });

      const itemsMap = {};
      itemsSnapshot.forEach((doc) => {
        itemsMap[doc.id] = doc.data().itemName || doc.data().name || "Unknown Item";
      });

      const entriesList = stockInSnapshot.docs.map((doc) => {
        const data = doc.data();
        
        // Maadaama items ay array tahay, khariidaddooda halkan ku dhex sax sxb
        const formattedItems = (data.items || []).map(item => ({
          ...item,
          itemName: itemsMap[item.itemId] || item.itemName || "Unknown Item"
        }));

        return {
          id: doc.id,
          ...data,
          items: formattedItems,
          warehouseName: warehousesMap[data.warehouseId] || data.warehouseName || "N/A",
        };
      });

      entriesList.sort((a, b) => new Date(b.receivedAt || b.createdAt) - new Date(a.receivedAt || a.createdAt));
      setStockInEntries(entriesList);
    } catch (err) {
      console.error("Error loading stock in entries:", err);
      setError(err.message || "Khalad ayaa dhacay.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStockInEntries();
  }, [fetchStockInEntries]);

  return { stockInEntries, loading, error, refreshStockIn: fetchStockInEntries };
}