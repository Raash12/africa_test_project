import { useEffect, useState } from "react";
import { getJournalEntries } from "@/services/accounting/journalService";

export default function useJournalEntries(financeBookId = null) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const data = await getJournalEntries(financeBookId);
      setEntries(data);
    } catch (error) {
      console.error("Error fetching journal entries:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [financeBookId]);

  return {
    entries,
    loading,
    refreshEntries: fetchEntries,
  };
}