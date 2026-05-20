import { useState, useEffect, useCallback } from "react";
import { getPurchaseOrders } from "@/services/purchase/purchaseOrderService";
import useSuppliers from "@/hooks/useSuppliers";
import usePrograms from "@/hooks/usePrograms";

export default function usePurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { suppliers = [] } = useSuppliers();
  const { programs = [] } = usePrograms();

  const refreshPOs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPurchaseOrders();
      
      // Map garee si loogu daro Supplier Name iyo Program Name halkii ID kaliya laga tusi lahaa list-ga
      const formattedPOs = data.map(po => {
        const supplierObj = suppliers.find(s => s.id === po.supplierId);
        const programObj = programs.find(p => p.id === po.programId);
        
        return {
          ...po,
          supplier: supplierObj ? `${supplierObj.company} (${supplierObj.supplierName})` : "Unknown Vendor",
          program: programObj ? programObj.programName : "Unknown Program"
        };
      });

      // U kala sooc si taariikhda u dambaysa kor u tusto (Newest first)
      formattedPOs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setPurchaseOrders(formattedPOs);
      setError(null);
    } catch (err) {
      console.error("Error fetching POs in hook:", err);
      setError(err.message || "Waa uu guuldarraystay soo jiidashada PO-da");
    } finally {
      setLoading(false);
    }
  }, [suppliers, programs]);

  useEffect(() => {
    if (suppliers.length > 0 || programs.length > 0) {
      refreshPOs();
    }
  }, [suppliers, programs, refreshPOs]);

  return { purchaseOrders, loading, error, refreshPOs };
}