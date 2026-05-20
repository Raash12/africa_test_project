// hooks/usePaymentEntry.js
import { useState, useEffect, useCallback } from "react";
import { getPaymentEntries } from "@/services/payment/paymentEntryService";

export default function usePaymentEntry() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPaymentEntries();
      setPayments(data);
    } catch (err) {
      setError(err.message || "Wax ka khaldamay soo dhuuqista lacag bixinta.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return {
    payments,
    loading,
    error,
    refreshPayments: fetchPayments
  };
}