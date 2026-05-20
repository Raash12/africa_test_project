import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, getDoc } from "firebase/firestore";

const poCollection = collection(db, "purchase_orders");

// 1. CREATE
export const createPurchaseOrder = async (data) => {
  const poNumber = `PO-${Date.now().toString().slice(-6)}`;
  return addDoc(poCollection, {
    ...data,
    poNumber,
    status: data.status || "PENDING",
    createdAt: new Date().toISOString(),
  });
};

// 2. READ ALL
export const getPurchaseOrders = async () => {
  const snapshot = await getDocs(poCollection);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// 3. UPDATE
export const updatePurchaseOrder = async (id, updatedData) => {
  const poDocRef = doc(db, "purchase_orders", id);
  return updateDoc(poDocRef, {
    ...updatedData,
    updatedAt: new Date().toISOString()
  });
};

// 4. DELETE
export const deletePurchaseOrder = async (id) => {
  const poDocRef = doc(db, "purchase_orders", id);
  return deleteDoc(poDocRef);
};