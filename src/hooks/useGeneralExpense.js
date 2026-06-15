import { useState, useEffect } from "react";
import { 
  getAccountsService, 
  getGeneralExpensesService, 
  createGeneralExpenseService, 
  deleteGeneralExpenseService 
} from "@/services/payroll/payrollGeneralExpenseService";

export function useGeneralExpense() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadGeneralExpenseData = async () => {
    setLoading(true);
    try {
      const [accs, txs] = await Promise.all([
        getAccountsService(),
        getGeneralExpensesService()
      ]);
      setAccounts(accs || []);
      setTransactions(txs || []);
    } catch (error) {
      console.error("Error loading general expense data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGeneralExpenseData();
  }, []);

  // Function-kan wuxuu fulinayaa Journal Entry-ga cusub ee Firestore
  const addTransaction = async (payload) => {
    try {
      const docId = await createGeneralExpenseService(payload);
      await loadGeneralExpenseData(); // Dib u cusbooneysii UI-ga iyo List-iga
      return docId;
    } catch (error) {
      console.error("Error in General Expense Journal Entry:", error);
      throw error;
    }
  };

  // Function-kan wuxuu tirtirayaa Journal Entry-ga isagoo xisaabtana saxaya
  const deleteTransaction = async (id) => {
    try {
      await deleteGeneralExpenseService(id);
      await loadGeneralExpenseData(); // Dib u cusbooneysii UI-ga
    } catch (error) {
      console.error("Error deleting general expense:", error);
      throw error;
    }
  };

  return { 
    accounts, 
    transactions, 
    loading, 
    addTransaction, 
    deleteTransaction, 
    refresh: loadGeneralExpenseData 
  };
}