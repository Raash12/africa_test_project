import { useState, useEffect, useCallback } from "react";
import { getStockAdjustments } from "@/services/inventory/stockAdjustmentService";

export default function useAdjustment() {
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAdjustmentData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const adjustmentData = await getStockAdjustments();
      setAdjustments(adjustmentData);
    } catch (err) {
      console.error("Error loading adjustments data:", err);
      setError(err.message || "Khalad ayaa dhacay.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdjustmentData();
  }, [fetchAdjustmentData]);

  return { 
    adjustments, 
    loading, 
    error, 
    refreshAdjustmentData: fetchAdjustmentData 
  };
}