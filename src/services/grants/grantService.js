import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  runTransaction, 
  serverTimestamp 
} from "firebase/firestore";

const grantCollection = collection(db, "grants");

// 1. CREATE: Adds the grant amount to the current balance
export const createGrant = async (data) => {
  const accountRef = doc(db, "chart_of_accounts", data.receivingAccountId);
  const grantRef = doc(collection(db, "grants"));

  await runTransaction(db, async (transaction) => {
    const accountDoc = await transaction.get(accountRef);
    if (!accountDoc.exists()) throw new Error("Account not found!");

    const currentBalance = parseFloat(accountDoc.data().balance || 0);
    const amount = parseFloat(data.amount || 0);

    // Update Balance: Always base it on the existing 'balance' in Firestore
    transaction.update(accountRef, { 
      balance: Number((currentBalance + amount).toFixed(2)) 
    });
    
    // Create Grant Record
    transaction.set(grantRef, { 
      ...data, 
      amount: amount, // Ensure this is stored as a number
      createdAt: serverTimestamp() 
    });
  });
};

// 2. UPDATE: Calculates the Delta (Difference) to prevent double-adding
export const updateGrant = async (id, data) => {
  const grantRef = doc(db, "grants", id);

  await runTransaction(db, async (transaction) => {
    const grantDoc = await transaction.get(grantRef);
    if (!grantDoc.exists()) throw new Error("Grant not found!");
    const oldData = grantDoc.data();

    const oldAmount = parseFloat(oldData.amount || 0);
    const newAmount = parseFloat(data.amount || 0);
    const oldAccountId = oldData.receivingAccountId;
    const newAccountId = data.receivingAccountId;

    // A. If Account changed: Subtract from OLD, Add to NEW
    if (oldAccountId !== newAccountId) {
      const oldAccountRef = doc(db, "chart_of_accounts", oldAccountId);
      const newAccountRef = doc(db, "chart_of_accounts", newAccountId);
      
      const oldAccountSnap = await transaction.get(oldAccountRef);
      const newAccountSnap = await transaction.get(newAccountRef);

      if (oldAccountSnap.exists()) {
        const oldBal = parseFloat(oldAccountSnap.data().balance || 0);
        transaction.update(oldAccountRef, { balance: Number((oldBal - oldAmount).toFixed(2)) });
      }
      if (newAccountSnap.exists()) {
        const newBal = parseFloat(newAccountSnap.data().balance || 0);
        transaction.update(newAccountRef, { balance: Number((newBal + newAmount).toFixed(2)) });
      }
    } 
    // B. If Account is SAME: Just update by the Difference (Delta)
    else {
      const diff = newAmount - oldAmount;
      if (diff !== 0) {
        const accountRef = doc(db, "chart_of_accounts", newAccountId);
        const accountSnap = await transaction.get(accountRef);
        if (accountSnap.exists()) {
          const currentBal = parseFloat(accountSnap.data().balance || 0);
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

// 3. GET: Fetch all grants
export const getGrants = async () => {
  const snapshot = await getDocs(grantCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// 4. DELETE: Subtracts balance and removes record
export const deleteGrant = async (id) => {
  const grantRef = doc(db, "grants", id);

  await runTransaction(db, async (transaction) => {
    const grantDoc = await transaction.get(grantRef);
    if (!grantDoc.exists()) throw new Error("Grant not found!");
    
    const amount = parseFloat(grantDoc.data().amount || 0);
    const accountId = grantDoc.data().receivingAccountId;
    const accountRef = doc(db, "chart_of_accounts", accountId);

    const accountDoc = await transaction.get(accountRef);
    if (accountDoc.exists()) {
      const currentBal = parseFloat(accountDoc.data().balance || 0);
      transaction.update(accountRef, { 
        balance: Number((currentBal - amount).toFixed(2)) 
      });
    }

    transaction.delete(grantRef);
  });
};