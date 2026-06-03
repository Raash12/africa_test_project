import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";

const financeBookCollection = collection(db, "financeBooks");

export const createFinanceBook = (data) => addDoc(financeBookCollection, data);
export const getFinanceBooks = async () => {
  const snapshot = await getDocs(financeBookCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
export const updateFinanceBook = (id, data) => updateDoc(doc(db, "financeBooks", id), data);
export const deleteFinanceBook = (id) => deleteDoc(doc(db, "financeBooks", id));