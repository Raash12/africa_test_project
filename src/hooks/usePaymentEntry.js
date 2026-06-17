import { useState, useEffect, useCallback } from "react";
import { 
  getAllPaymentEntries, 
  createPaymentEntryService, 
  deletePaymentEntryService 
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
      
      // 🛠️ FIX: Halkaan ku kala saar taariikhda (Newest First) si ammaan ah haddii Firebase laga saaray orderBy
      const sortedData = data.sort((a, b) => {
        const dateA = a.date?.seconds ? a.date.seconds : 0;
        const dateB = b.date?.seconds ? b.date.seconds : 0;
        return dateB - dateA;
      });

      setPayments(sortedData);
    } catch (err) {
      setError(err.message || "Wax ka khaldamay soo dhuuqista xogta lacag bixinta.");
    } finally {
      setLoading(false);
    }
  }, []);

  const addPayment = async (payload) => {
    try {
      const resultId = await createPaymentEntryService(payload);
      await fetchPayments(); 
      return resultId;
    } catch (err) {
      throw err;
    }
  };

  const removePayment = async (id, invoiceId = null) => {
    try {
      await deletePaymentEntryService(id, invoiceId);
      await fetchPayments(); 
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const salaries = payments.filter(p => p.type === "SALARY");
  const expenses = payments.filter(p => p.type === "GENERAL_EXPENSE");
  const invoices = payments.filter(p => p.type === "PURCHASE_INVOICE");

  return {
    payments,      
    salaries,      
    expenses,      
    invoices,      
    loading,
    error,
    refreshPayments: fetchPayments,
    addPayment,
    removePayment
  };
}