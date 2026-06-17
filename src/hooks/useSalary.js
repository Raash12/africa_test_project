import { useState, useEffect } from "react";
import { 
  getAccountsService, 
  getPaymentEntriesService, 
  createPaymentEntryService, 
  deletePaymentEntryService 
} from "@/services/payroll/payrollSalaryServices";

export function useSalary() {
  const [accounts, setAccounts] = useState([]);
  const [paymentEntries, setPaymentEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [accs, entries] = await Promise.all([getAccountsService(), getPaymentEntriesService()]);
      setAccounts(accs || []);
      setPaymentEntries(entries || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  return { 
    accounts, 
    paymentEntries, 
    loading, 
    addPaymentEntry: createPaymentEntryService, 
    deletePaymentEntry: deletePaymentEntryService, 
    refresh: loadData 
  };
}