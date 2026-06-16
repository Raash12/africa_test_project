import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function useAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const accountsRef = collection(db, "chart_of_accounts"); 

    const unsubscribe = onSnapshot(accountsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // 🌟 MUHIIM: Qasab in balance-ku noqdo Number
        balance: Number(doc.data().balance || 0)
      }));
      setAccounts(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching accounts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { accounts, loading };
}