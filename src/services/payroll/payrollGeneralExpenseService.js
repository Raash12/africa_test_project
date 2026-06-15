import { collection, getDocs, doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const accountsRef = collection(db, "chart_of_accounts");
const transactionsRef = collection(db, "transactions");

// 1. Soo aqri Account-yada
export const getAccountsService = async () => {
  const snap = await getDocs(accountsRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// 2. Soo aqri Kharashyada Guud
export const getGeneralExpensesService = async () => {
  const snap = await getDocs(transactionsRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// 🌟 3. KANI WAA QAABKA UU HOOK-GAAGU RAADINAYO (createGeneralExpenseService)
export const createGeneralExpenseService = async (payload) => {
  const { id, amount, paidFromAccountId, chargedToAccountId, description, month, category } = payload;
  const numericAmount = parseFloat(amount);

  return await runTransaction(db, async (transaction) => {
    const fromAccountRef = doc(db, "chart_of_accounts", paidFromAccountId);
    const toAccountRef = doc(db, "chart_of_accounts", chargedToAccountId);

    const [fromSnap, toSnap] = await Promise.all([
      transaction.get(fromAccountRef), 
      transaction.get(toAccountRef)
    ]);

    if (!fromSnap.exists() || !toSnap.exists()) throw new Error("Account lama helin sxb!");

    const fromAccountData = fromSnap.data();
    const toAccountData = toSnap.data();

    let oldAmount = 0;
    if (id) {
      const oldTxSnap = await transaction.get(doc(db, "transactions", id));
      if (oldTxSnap.exists()) oldAmount = parseFloat(oldTxSnap.data().amount || 0);
    }

    // Double-Entry Balances
    const newFromBalance = parseFloat(fromAccountData.balance || 0) + oldAmount - numericAmount;
    const newToBalance = parseFloat(toAccountData.balance || 0) - oldAmount + numericAmount;

    if (!id && newFromBalance < 0) {
      throw new Error("INSUFFICIENT_FUNDS|Haraaga xisaabta kuma filna sxb!");
    }

    transaction.update(fromAccountRef, { balance: newFromBalance });
    transaction.update(toAccountRef, { balance: newToBalance });

    const txDocRef = id ? doc(db, "transactions", id) : doc(transactionsRef);
    
    // Xogta la keydinayo
    const txData = {
      amount: numericAmount,
      paidFromAccountId,
      chargedToAccountId,
      accountName: fromAccountData.accountName || "",
      description,
      month,
      category: category || "General Expense",
      date: serverTimestamp()
    };

    transaction.set(txDocRef, txData, { merge: true });
    return txDocRef.id;
  });
};

// 4. Tirtir Kharashka
export const deleteGeneralExpenseService = async (id) => {
  if (!id) return;
  return await runTransaction(db, async (transaction) => {
    const txRef = doc(db, "transactions", id);
    const txSnap = await transaction.get(txRef);
    if (!txSnap.exists()) throw new Error("Transaction lama helin sxb!");

    const txData = txSnap.data();
    const amount = parseFloat(txData.amount || 0);

    const fromAccountRef = doc(db, "chart_of_accounts", txData.paidFromAccountId);
    const toAccountRef = doc(db, "chart_of_accounts", txData.chargedToAccountId);

    const [fromSnap, toSnap] = await Promise.all([
      transaction.get(fromAccountRef), 
      transaction.get(toAccountRef)
    ]);

    if (fromSnap.exists()) transaction.update(fromAccountRef, { balance: parseFloat(fromSnap.data().balance || 0) + amount });
    if (toSnap.exists()) transaction.update(toAccountRef, { balance: parseFloat(toSnap.data().balance || 0) - amount });

    transaction.delete(txRef);
  });
};