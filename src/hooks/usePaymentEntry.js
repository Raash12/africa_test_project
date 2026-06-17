// hooks/usePaymentEntry.js
import { useState, useEffect, useCallback } from "react";
// Waxaan beddelnay magaca function-ka halkan
import { getAllPaymentEntries } from "@/services/payment/paymentEntryService";

export default function usePaymentEntry() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Halkan isticmaal magaca saxda ah
      const data = await getAllPaymentEntries();
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