import { useEffect, useState } from "react";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function useAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🌟 HALKAN KA FIRI SXB: Waa inuu noqdaa chart_of_accounts
    const accountsRef = collection(db, "chart_of_accounts"); 

    const unsubscribe = onSnapshot(accountsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAccounts(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching chart of accounts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { accounts, loading };
}