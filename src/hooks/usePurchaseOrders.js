import { useEffect, useState } from "react";
import { getPurchaseOrders } from "@/services/purchase/purchaseOrderService";

export default function usePurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPOs = async () => {
    setLoading(true);
    try {
      const data = await getPurchaseOrders();
      setPurchaseOrders(data);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOs();
  }, []);

  return {
    purchaseOrders,
    loading,
    refreshPOs: fetchPOs,
  };
}