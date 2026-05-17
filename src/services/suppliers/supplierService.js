import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";

const supplierCollection = collection(db, "suppliers");

export const createSupplier = (data) => addDoc(supplierCollection, data);

export const getSuppliers = async () => {
  const snapshot = await getDocs(supplierCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateSupplier = (id, data) => updateDoc(doc(db, "suppliers", id), data);
export const deleteSupplier = (id) => deleteDoc(doc(db, "suppliers", id));