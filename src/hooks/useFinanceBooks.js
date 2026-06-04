import { useEffect, useState } from "react";
import { getFinanceBooks } from "@/services/accounting/financeBookService";

export default function useFinanceBooks() {
  const [financeBooks, setFinanceBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFinanceBooks = async () => {
    setLoading(true);
    try {
      const data = await getFinanceBooks();
      setFinanceBooks(data);
    } catch (error) {
      console.error("Error fetching finance books:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFinanceBooks(); }, []);

  return { financeBooks, loading, refreshFinanceBooks: fetchFinanceBooks };
}