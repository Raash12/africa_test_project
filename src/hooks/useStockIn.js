// hooks/useStockIn.js
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
      // 1. Soo dhuuq dhammaan collections-ka muhiimka ah
      const stockInSnapshot = await getDocs(collection(db, "stock_in"));
      const warehouseSnapshot = await getDocs(collection(db, "warehouses"));
      const itemsSnapshot = await getDocs(collection(db, "items"));

      // 2. Diyaari Khariidad (Map) lagu ogaanayo magaca bakhaarka (Warehouse Name)
      const warehousesMap = {};
      warehouseSnapshot.forEach((doc) => {
        warehousesMap[doc.id] = doc.data().warehouseName || "N/A";
      });

      // 3. Diyaari Khariidad (Map) lagu ogaanayo magaca alaabta (Item Name)
      const itemsMap = {};
      itemsSnapshot.forEach((doc) => {
        itemsMap[doc.id] = doc.data().name || "Unknown Item";
      });

      // 4. Isku xidh xogta Stock In, Warehouses, iyo Items
      const entriesList = stockInSnapshot.docs.map((doc) => {
        const data = doc.data();
        const qty = Number(data.quantity) || 0;
        const cost = Number(data.costPrice) || 0;

        return {
          id: doc.id,
          ...data,
          // Haddii itemName uu database-ka ku dhex jiray ama map-ka laga dhuuqo
          itemName: itemsMap[data.itemId] || data.itemName || "Unknown Item",
          // Sidoo kale bakhaarka
          warehouseName: warehousesMap[data.warehouseId] || data.warehouseName || "N/A",
          // Xisaabi wadarta guud si dynamic ah haddii loo baahdo
          totalValue: data.totalValue || qty * cost,
        };
      });

      // 5. U kala sooc si kii ugu dambeeyey uu kor u jiro (Newest First)
      entriesList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setStockInEntries(entriesList);
    } catch (err) {
      console.error("Error loading stock in entries:", err);
      setError(err.message || "Khalad ayaa dhacay xilliga soo dhuuqista Stock In sxb.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStockInEntries();
  }, [fetchStockInEntries]);

  return {
    stockInEntries,
    loading,
    error,
    refreshStockIn: fetchStockInEntries,
  };
}