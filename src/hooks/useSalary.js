import { useState, useEffect } from "react";
import { 
  getAccountsService, 
  getSalaryTransactionsService, 
  createSalaryTransactionService,
  deleteSalaryTransactionService
} from "@/services/payroll/payrollSalaryServices";

export function useSalary() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSalaryData = async () => {
    setLoading(true);
    try {
      const [accs, txs] = await Promise.all([
        getAccountsService(), 
        getSalaryTransactionsService()
      ]);
      
      // 🌟 DEBUGGING: Xaqiiji in xogta ay si sax ah kuugu soo dhacayso
      console.log("🔥 FIRESTORE RAW SALARY TRANSACTIONS:", txs);
      
      setAccounts(accs || []);
      setTransactions(txs || []);
    } catch (error) {
      console.error("Error loading salary bookkeeping data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalaryData();
  }, []);

  // Function-ka lagu daro ama lagu beddelo transaction
  const addTransaction = async (payload) => {
    try {
      await createSalaryTransactionService(payload);
      await loadSalaryData(); // Dib u soo aqri xogta cusub
    } catch (error) {
      console.error("Error adding salary transaction:", error);
      throw error;
    }
  };

  // Function-ka lagu tirtiro transaction
  const deleteTransaction = async (id) => {
    try {
      await deleteSalaryTransactionService(id);
      await loadSalaryData(); // Dib u soo aqri xogta cusub
    } catch (error) {
      console.error("Error deleting salary transaction:", error);
      throw error;
    }
  };

  return {
    accounts,
    transactions,
    loading,
    addTransaction,
    deleteTransaction,
    refresh: loadSalaryData
  };
}