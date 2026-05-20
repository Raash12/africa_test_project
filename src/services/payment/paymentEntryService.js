// services/payment/paymentEntryService.js
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

const COLLECTION_NAME = "paymentEntries";

// 1. Soo dhuuq dhamaan lacag bixinnada la keydiyey
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

// 2. Keydi Payment Entry cusub + Auto Update Invoice Status
export const createPaymentEntry = async (paymentData) => {
  try {
    // A. Keydi xogta lacag bixinta ee cusub
    const finalPaymentData = {
      ...paymentData,
      createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, COLLECTION_NAME), finalPaymentData);

    // B. Si toos ah (Auto) u cusboonaysii status-ka Purchase Invoice-ka uu ku xiran yahay
    const invoiceRef = doc(db, "purchaseInvoices", paymentData.invoiceId);
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