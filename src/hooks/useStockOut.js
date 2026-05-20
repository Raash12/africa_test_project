import { useState, useEffect, useCallback } from "react";
import { getStockOutEntries } from "@/services/inventory/stockOutService";

export default function useStockOut() {
  const [stockOutEntries, setStockOutEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStockOutData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const outData = await getStockOutEntries();
      setStockOutEntries(outData);
    } catch (err) {
      console.error("Error loading stock out data:", err);
      setError(err.message || "Khalad ayaa dhacay.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStockOutData();
  }, [fetchStockOutData]);

  return { 
    stockOutEntries, 
    loading, 
    error, 
    refreshStockOutData: fetchStockOutData 
  };
}