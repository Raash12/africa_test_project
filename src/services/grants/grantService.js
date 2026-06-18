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

// 2. CREATE GRANT + JOURNAL ENTRY
export const createGrant = async (data) => {
  const accountRef = doc(db, "chart_of_accounts", data.receivingAccountId);
  const revenueRef = doc(db, "chart_of_accounts", data.revenueAccountId);
  const grantRef = doc(collection(db, "grants"));
  const journalRef = doc(collection(db, "journal_entries")); 

  await runTransaction(db, async (transaction) => {
    const accountDoc = await transaction.get(accountRef);
    const revenueDoc = await transaction.get(revenueRef);

    if (!accountDoc.exists()) throw new Error("Receiving Account not found!");
    if (!revenueDoc.exists()) throw new Error("Revenue Account not found!");

    const currentBalance = Number(accountDoc.data().balance || 0);
    const currentRevBalance = Number(revenueDoc.data().balance || 0);
    const amount = Number(data.amount || 0);

    const recAccountData = accountDoc.data();
    const revAccountData = revenueDoc.data();

    // Soo qaado magacyada rasmiga ah (haddii field-ku yahay name ama accountName)
    const officialRecName = recAccountData.accountName || recAccountData.name || "Receiving Account";
    const officialRevName = revAccountData.accountName || revAccountData.name || "Revenue Account";

    // A. Update Asset/Bank Account (Debit Side)
    transaction.update(accountRef, { 
      balance: Number((currentBalance + amount).toFixed(2)) 
    });

    // B. Update Revenue Account (Credit Side)
    transaction.update(revenueRef, { 
      balance: Number((currentRevBalance + amount).toFixed(2)) 
    });
    
    // C. Qorista Journal Entry (Dynamic Names)
    transaction.set(journalRef, {
      date: data.startDate || new Date().toISOString().split('T')[0],
      description: `Grant Funding Received: ${data.grantName}`,
      reference: `GRANT-${grantRef.id.substring(0, 5).toUpperCase()}`,
      type: "JE-GRANT",
      createdAt: serverTimestamp(),
      entries: [
        {
          accountId: data.receivingAccountId,
          accountName: officialRecName, 
          accountCode: recAccountData.accountCode || "",
          debit: amount,
          credit: 0
        },
        {
          accountId: data.revenueAccountId,
          accountName: officialRevName, 
          accountCode: revAccountData.accountCode || "",
          debit: 0,
          credit: amount
        }
      ]
    });

    // D. Create Grant Record
    transaction.set(grantRef, { 
      ...data, 
      amount: amount, 
      processed: true, 
      journalId: journalRef.id, 
      createdAt: serverTimestamp() 
    });
  });
};

// 3. UPDATE GRANT + ADJUST ACCOUNTS & JOURNAL ENTRY
export const updateGrant = async (id, data) => {
  const grantRef = doc(db, "grants", id);

  await runTransaction(db, async (transaction) => {
    const grantDoc = await transaction.get(grantRef);
    if (!grantDoc.exists()) throw new Error("Grant not found!");
    
    const oldData = grantDoc.data();
    const oldAmount = Number(oldData.amount || 0);
    const newAmount = Number(data.amount || 0);
    const journalId = oldData.journalId;
    
    const oldRecId = oldData.receivingAccountId;
    const newRecId = data.receivingAccountId;
    const oldRevId = oldData.revenueAccountId;
    const newRevId = data.revenueAccountId;

    // --- A. ADJUST RECEIVING ACCOUNT (BANK) ---
    if (oldRecId !== newRecId) {
      const oldRecRef = doc(db, "chart_of_accounts", oldRecId);
      const newRecRef = doc(db, "chart_of_accounts", newRecId);
      const oldSnap = await transaction.get(oldRecRef);
      const newSnap = await transaction.get(newRecRef);

      if (oldSnap.exists()) transaction.update(oldRecRef, { balance: Number((Number(oldSnap.data().balance || 0) - oldAmount).toFixed(2)) });
      if (newSnap.exists()) transaction.update(newRecRef, { balance: Number((Number(newSnap.data().balance || 0) + newAmount).toFixed(2)) });
    } else {
      const diff = newAmount - oldAmount;
      if (diff !== 0) {
        const recRef = doc(db, "chart_of_accounts", newRecId);
        const snap = await transaction.get(recRef);
        if (snap.exists()) transaction.update(recRef, { balance: Number((Number(snap.data().balance || 0) + diff).toFixed(2)) });
      }
    }

    // --- B. ADJUST REVENUE ACCOUNT (INCOME) ---
    if (oldRevId && oldRevId !== newRevId) {
      const oldRevRef = doc(db, "chart_of_accounts", oldRevId);
      const newRevRef = doc(db, "chart_of_accounts", newRevId);
      const oldSnap = await transaction.get(oldRevRef);
      const newSnap = await transaction.get(newRevRef);

      if (oldSnap.exists()) transaction.update(oldRevRef, { balance: Number((Number(oldSnap.data().balance || 0) - oldAmount).toFixed(2)) });
      if (newSnap.exists()) transaction.update(newRevRef, { balance: Number((Number(newSnap.data().balance || 0) + newAmount).toFixed(2)) });
    } else if (newRevId) {
      const diff = newAmount - oldAmount;
      if (diff !== 0) {
        const revRef = doc(db, "chart_of_accounts", newRevId);
        const snap = await transaction.get(revRef);
        if (snap.exists()) transaction.update(revRef, { balance: Number((Number(snap.data().balance || 0) + diff).toFixed(2)) });
      }
    }

    // --- C. UPDATE ACTUAL JOURNAL ENTRY ---
    if (journalId) {
      const journalRef = doc(db, "journal_entries", journalId);
      const accountDoc = await transaction.get(doc(db, "chart_of_accounts", newRecId));
      const revenueDoc = await transaction.get(doc(db, "chart_of_accounts", newRevId));

      if (accountDoc.exists() && revenueDoc.exists()) {
        const recData = accountDoc.data();
        const revData = revenueDoc.data();

        transaction.update(journalRef, {
          date: data.startDate || new Date().toISOString().split('T')[0],
          description: `Grant Funding Received: ${data.grantName}`,
          entries: [
            {
              accountId: newRecId,
              accountName: recData.accountName || recData.name || "Receiving Account", 
              accountCode: recData.accountCode || "",
              debit: newAmount,
              credit: 0
            },
            {
              accountId: newRevId,
              accountName: revData.accountName || revData.name || "Revenue Account", 
              accountCode: revData.accountCode || "",
              debit: 0,
              credit: newAmount
            }
          ]
        });
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

// 4. DELETE GRANT + REMOVE JOURNAL ENTRY
export const deleteGrant = async (id) => {
  const grantRef = doc(db, "grants", id);

  await runTransaction(db, async (transaction) => {
    const grantDoc = await transaction.get(grantRef);
    if (!grantDoc.exists()) throw new Error("Grant not found!");
    
    const grantData = grantDoc.data();
    const amount = Number(grantData.amount || 0);
    const recId = grantData.receivingAccountId;
    const revId = grantData.revenueAccountId;
    const journalId = grantData.journalId;

    const recRef = doc(db, "chart_of_accounts", recId);
    const recDoc = await transaction.get(recRef);
    if (recDoc.exists()) {
      transaction.update(recRef, { balance: Number((Number(recDoc.data().balance || 0) - amount).toFixed(2)) });
    }

    if (revId) {
      const revRef = doc(db, "chart_of_accounts", revId);
      const revDoc = await transaction.get(revRef);
      if (revDoc.exists()) {
        transaction.update(revRef, { balance: Number((Number(revDoc.data().balance || 0) - amount).toFixed(2)) });
      }
    }

    if (journalId) {
      const journalRef = doc(db, "journal_entries", journalId);
      transaction.delete(journalRef);
    }

    transaction.delete(grantRef);
  });
};