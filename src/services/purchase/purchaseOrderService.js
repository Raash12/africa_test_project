import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, getDoc } from "firebase/firestore";

const poCollection = collection(db, "purchase_orders");

export const createPurchaseOrder = async (data) => {
  // Waxaan hubinaa inaan siino auto-generated PO Number haddii uusan jirin
  const poNumber = `PO-${Date.now().toString().slice(-6)}`;
  return addDoc(poCollection, {
    ...data,
    poNumber,
    status: data.status || "PENDING",
    createdAt: new Date().toISOString(),
  });
};

export const getPurchaseOrders = async () => {
  const snapshot = await getDocs(poCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updatePurchaseOrder = (id, data) => updateDoc(doc(db, "purchase_orders", id), data);
export const deletePurchaseOrder = (id) => deleteDoc(doc(db, "purchase_orders", id));