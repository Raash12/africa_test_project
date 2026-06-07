import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  query, 
  orderBy 
} from "firebase/firestore";

const COLLECTION_NAME = "payment_entries"; // HAGAAGIN: Loo waafajiyey magaca saxsan

export const getPaymentEntries = async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting payment entries: ", error);
    throw error;
  }
};

export const createPaymentEntry = async (paymentData) => {
  try {
    const finalPaymentData = {
      ...paymentData,
      createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, COLLECTION_NAME), finalPaymentData);

    const invoiceRef = doc(db, "purchase_invoices", paymentData.invoiceId);
    await updateDoc(invoiceRef, {
      status: "PAID",
      updatedAt: new Date().toISOString()
    });

    return { id: docRef.id, ...finalPaymentData };
  } catch (error) {
    console.error("Error creating payment entry: ", error);
    throw error;
  }
};