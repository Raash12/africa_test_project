import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";

const accountCollection = collection(db, "chart_of_accounts");

// 1. CREATE ACCOUNT
export const createAccount = (data) => {
  const opening = data.openingBalance ? parseFloat(data.openingBalance) : 0;
  return addDoc(accountCollection, {
    ...data,
    balance: opening, 
    createdAt: new Date()
  });
};

// 2. GET ACCOUNTS (Now purely reading from DB)
export const getAccounts = async () => {
  // We strictly fetch the accounts as they are saved in the database.
  // No extra math = No double counting.
  const q = query(accountCollection, orderBy("accountCode", "asc"));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data() 
  }));
};

// 3. UPDATE ACCOUNT
export const updateAccount = (id, data) => {
  return updateDoc(doc(db, "chart_of_accounts", id), data);
};

// 4. DELETE ACCOUNT
export const deleteAccount = (id) => {
  return deleteDoc(doc(db, "chart_of_accounts", id));
};