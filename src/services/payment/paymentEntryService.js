import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  query, 
  orderBy,
  runTransaction 
} from "firebase/firestore";

const COLLECTION_NAME = "payment_entries";

// 1. Soo wada aqri dhamaan payment_entries (General Expense + Purchase Invoices)
export const getAllPaymentEntries = async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting all payment entries: ", error);
    throw error;
  }
};

// 2. Add New Payment (Waxay u shaqaysaa labadaba: Invoices iyo Expenses)
export const createPaymentEntry = async (paymentData, type = "GENERAL_EXPENSE") => {
  try {
    const finalData = {
      ...paymentData,
      type: type, // Si aad u kala soocdo (e.g., "PURCHASE_INVOICE" ama "GENERAL_EXPENSE")
      createdAt: new Date().toISOString()
    };

    // Haddii ay tahay Invoice, waxaan u baahanahay Atomic Transaction
    if (type === "PURCHASE_INVOICE" && paymentData.invoiceId) {
      return await runTransaction(db, async (transaction) => {
        const entryRef = doc(collection(db, COLLECTION_NAME));
        transaction.set(entryRef, finalData);
        
        const invoiceRef = doc(db, "purchase_invoices", paymentData.invoiceId);
        transaction.update(invoiceRef, { 
          status: "PAID", 
          updatedAt: new Date().toISOString() 
        });
        
        return { id: entryRef.id, ...finalData };
      });
    }

    // Haddii ay tahay General Expense caadi ah
    const docRef = await addDoc(collection(db, COLLECTION_NAME), finalData);
    return { id: docRef.id, ...finalData };

  } catch (error) {
    console.error("Error creating payment entry: ", error);
    throw error;
  }
};

// 3. Tirtiridda Entry
export const deletePaymentEntry = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error("Error deleting payment entry: ", error);
    throw error;
  }
};