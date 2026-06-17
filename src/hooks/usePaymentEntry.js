// hooks/usePaymentEntry.js
import { useState, useEffect, useCallback } from "react";
import { 
  getAllPaymentEntries, 
  createPaymentEntry, 
  deletePaymentEntry 
} from "@/services/payment/paymentEntryService";

export default function usePaymentEntry() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllPaymentEntries();
      setPayments(data);
    } catch (err) {
      setError(err.message || "Wax ka khaldamay soo dhuuqista lacag bixinta.");
    } finally {
      setLoading(false);
    }
  }, []);

  // 1. Add Payment Function
  const addPayment = async (data, type) => {
    try {
      const newEntry = await createPaymentEntry(data, type);
      await fetchPayments(); // Dib u cusbooneysii liiska
      return newEntry;
    } catch (err) {
      throw err;
    }
  };

  // 2. Delete Payment Function
  const removePayment = async (id, invoiceId = null) => {
    try {
      await deletePaymentEntry(id, invoiceId);
      await fetchPayments(); // Dib u cusbooneysii liiska
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return {
    payments,
    loading,
    error,
    refreshPayments: fetchPayments,
    addPayment,
    removePayment
  };
}