import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export const fetchCashFlowRawData = async () => {
  try {
    // Waxaan soo jiideynaa akoonada iyo dhammaan dhaqdhaqaaqa ledger-ka (GL)
    const [accountsSnap, transactionsSnap] = await Promise.all([
      getDocs(collection(db, "accounts")),
      getDocs(collection(db, "transactions")) // Hubi haddii magaca collection-ka uu yahay transactions ama journalEntries
    ]);

    const accounts = accountsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const transactions = transactionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return { accounts, transactions };
  } catch (error) {
    console.error("Error fetching GL data for Cash Flow:", error);
    throw error;
  }
};