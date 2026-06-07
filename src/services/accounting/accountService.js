import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";

const accountCollection = collection(db, "chart_of_accounts");
const grantsCollection = collection(db, "grants"); 

export const createAccount = (data) => {
  // Marka akoon cusub la abuurayo, balance-kiisa ugu horeeya wuxuu la mid yahay openingBalance
  const opening = data.openingBalance ? parseFloat(data.openingBalance) : 0;
  return addDoc(accountCollection, {
    ...data,
    balance: opening, // State-ka rasmiga ah ee isbeddelaya
    createdAt: new Date()
  });
};

export const getAccounts = async () => {
  // 1. Soo aqri dhammaan akoonada (Chart of Accounts)
  const q = query(accountCollection, orderBy("accountCode", "asc"));
  const snapshot = await getDocs(q);
  const accountsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // 2. Soo aqri dhammaan Grants-ka ku jira collection-ka 'grants'
  const grantsSnapshot = await getDocs(grantsCollection);
  const grantsList = grantsSnapshot.docs.map(doc => doc.data());

  // 3. Xisaabi Haraga dhabta ah ee meesha yaal
  return accountsList.map(account => {
    // Haddii balance uu jiro (foomka payment-ku wax ka baddalay), ka bilow halkan, haddii kale openingBalance
    const baseBalance = account.balance !== undefined 
      ? parseFloat(account.balance) 
      : (account.openingBalance ? parseFloat(account.openingBalance) : 0);
    
    // Wixii grants ah ee ku dhacay akoonkaas
    const totalGrantsAmount = grantsList
      .filter(grant => grant.receivingAccountId === account.id) 
      .reduce((sum, grant) => sum + (grant.amount ? parseFloat(grant.amount) : 0), 0);

    return {
      ...account,
      // Halkan waxaa loogu yeerayaa balance si uu koodhka kale u akhriyo
      balance: baseBalance + totalGrantsAmount
    };
  });
};

export const updateAccount = (id, data) => updateDoc(doc(db, "chart_of_accounts", id), data);
export const deleteAccount = (id) => deleteDoc(doc(db, "chart_of_accounts", id));