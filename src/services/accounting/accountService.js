import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";

const accountCollection = collection(db, "chart_of_accounts");
const grantsCollection = collection(db, "grants"); // Collection-ka Grants-ka

export const createAccount = (data) => addDoc(accountCollection, {
  ...data,
  createdAt: new Date()
});

// CODAYN: Funksion-kan wuxuu isku darayaa Opening Balance + Lacagaha Grants-ka ee akoonka ku dhacay
export const getAccounts = async () => {
  // 1. Soo aqri dhammaan akoonada (Chart of Accounts)
  const q = query(accountCollection, orderBy("accountCode", "asc"));
  const snapshot = await getDocs(q);
  const accountsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // 2. Soo aqri dhammaan Grants-ka ku jira collection-ka 'grants'
  const grantsSnapshot = await getDocs(grantsCollection);
  const grantsList = grantsSnapshot.docs.map(doc => doc.data());

  // 3. Akoon walba u xisaabi Haraga guud (Opening Balance + Grants Amount)
  return accountsList.map(account => {
    const baseBalance = account.openingBalance ? parseFloat(account.openingBalance) : 0;
    
    // HAGAAGIN: Waxaa hadda la isticmaalayaa 'receivingAccountId' si loogu xiro Chart of Accounts
    const totalGrantsAmount = grantsList
      .filter(grant => grant.receivingAccountId === account.id) // Halkan waa la toosiyey sxb
      .reduce((sum, grant) => sum + (grant.amount ? parseFloat(grant.amount) : 0), 0);

    return {
      ...account,
      // Haraga Cusub = Opening Balance + Wixii Grants ah ee ku dhacay akoonkaas
      openingBalance: baseBalance + totalGrantsAmount
    };
  });
};

export const updateAccount = (id, data) => updateDoc(doc(db, "chart_of_accounts", id), data);
export const deleteAccount = (id) => deleteDoc(doc(db, "chart_of_accounts", id));