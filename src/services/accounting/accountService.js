import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";

const accountCollection = collection(db, "chart_of_accounts");

export const createAccount = (data) => addDoc(accountCollection, {
  ...data,
  createdAt: new Date()
});

export const getAccounts = async () => {
  const q = query(accountCollection, orderBy("accountCode", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateAccount = (id, data) => updateDoc(doc(db, "chart_of_accounts", id), data);
export const deleteAccount = (id) => deleteDoc(doc(db, "chart_of_accounts", id));