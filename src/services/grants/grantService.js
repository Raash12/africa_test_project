import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  runTransaction, 
  serverTimestamp, 
  getDocs 
} from "firebase/firestore";

const grantCollection = collection(db, "grants");

// 1. GET ALL GRANTS
export const getGrants = async () => {
  const snapshot = await getDocs(grantCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// 2. CREATE GRANT (Adds to balance)
export const createGrant = async (data) => {
  const accountRef = doc(db, "chart_of_accounts", data.receivingAccountId);
  const grantRef = doc(collection(db, "grants"));

  await runTransaction(db, async (transaction) => {
    const accountDoc = await transaction.get(accountRef);
    if (!accountDoc.exists()) throw new Error("Account not found!");

    const currentBalance = Number(accountDoc.data().balance || 0);
    const amount = Number(data.amount || 0);

    // Update Balance
    transaction.update(accountRef, { 
      balance: Number((currentBalance + amount).toFixed(2)) 
    });
    
    // Create Grant Record
    transaction.set(grantRef, { 
      ...data, 
      amount: amount, 
      processed: true, // Flag-gan wuxuu ka hortagayaa in xisaabta laba jeer loo xisaabiyo
      createdAt: serverTimestamp() 
    });
  });
};

// 3. UPDATE GRANT (Calculates Delta/Difference)
export const updateGrant = async (id, data) => {
  const grantRef = doc(db, "grants", id);

  await runTransaction(db, async (transaction) => {
    const grantDoc = await transaction.get(grantRef);
    if (!grantDoc.exists()) throw new Error("Grant not found!");
    
    const oldData = grantDoc.data();
    const oldAmount = Number(oldData.amount || 0);
    const newAmount = Number(data.amount || 0);
    const oldAccountId = oldData.receivingAccountId;
    const newAccountId = data.receivingAccountId;

    // A. If Account changed: Subtract from OLD, Add to NEW
    if (oldAccountId !== newAccountId) {
      const oldAccountRef = doc(db, "chart_of_accounts", oldAccountId);
      const newAccountRef = doc(db, "chart_of_accounts", newAccountId);
      
      const oldAccountSnap = await transaction.get(oldAccountRef);
      const newAccountSnap = await transaction.get(newAccountRef);

      if (oldAccountSnap.exists()) {
        const oldBal = Number(oldAccountSnap.data().balance || 0);
        transaction.update(oldAccountRef, { balance: Number((oldBal - oldAmount).toFixed(2)) });
      }
      if (newAccountSnap.exists()) {
        const newBal = Number(newAccountSnap.data().balance || 0);
        transaction.update(newAccountRef, { balance: Number((newBal + newAmount).toFixed(2)) });
      }
    } 
    // B. If Account is SAME: Update by Difference (Delta)
    else {
      const diff = newAmount - oldAmount;
      if (diff !== 0) {
        const accountRef = doc(db, "chart_of_accounts", newAccountId);
        const accountSnap = await transaction.get(accountRef);
        if (accountSnap.exists()) {
          const currentBal = Number(accountSnap.data().balance || 0);
          transaction.update(accountRef, { balance: Number((currentBal + diff).toFixed(2)) });
        }
      }
    }

    // Update Grant Record
    transaction.update(grantRef, {
      ...data,
      amount: newAmount,
      updatedAt: serverTimestamp()
    });
  });
};

// 4. DELETE GRANT (Subtracts balance and removes record)
export const deleteGrant = async (id) => {
  const grantRef = doc(db, "grants", id);

  await runTransaction(db, async (transaction) => {
    const grantDoc = await transaction.get(grantRef);
    if (!grantDoc.exists()) throw new Error("Grant not found!");
    
    const amount = Number(grantDoc.data().amount || 0);
    const accountId = grantDoc.data().receivingAccountId;
    const accountRef = doc(db, "chart_of_accounts", accountId);

    const accountDoc = await transaction.get(accountRef);
    if (accountDoc.exists()) {
      const currentBal = Number(accountDoc.data().balance || 0);
      transaction.update(accountRef, { 
        balance: Number((currentBal - amount).toFixed(2)) 
      });
    }

    transaction.delete(grantRef);
  });
};