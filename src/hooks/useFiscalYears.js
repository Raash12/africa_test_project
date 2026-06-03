import { useEffect, useState } from "react";
import { getFiscalYears } from "@/services/accounting/fiscalYearService";

export default function useFiscalYears() {
  const [fiscalYears, setFiscalYears] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFiscalYears = async () => {
    setLoading(true);
    try {
      const data = await getFiscalYears();
      setFiscalYears(data);
    } catch (error) {
      console.error("Error fetching fiscal years:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiscalYears();
  }, []);

  return {
    fiscalYears,
    loading,
    refreshFiscalYears: fetchFiscalYears,
  };
}