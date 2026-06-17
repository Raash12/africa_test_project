import { collection, getDocs, doc, runTransaction, serverTimestamp, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const accountsRef = collection(db, "chart_of_accounts");
const paymentEntriesRef = collection(db, "payment_entries"); // Collection name sax ah
const journalEntriesRef = collection(db, "journal_entries");

export const getAccountsService = async () => {
  const snap = await getDocs(accountsRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getPaymentEntriesService = async () => {
  const snap = await getDocs(paymentEntriesRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const deletePaymentEntryService = async (id) => {
  await deleteDoc(doc(db, "payment_entries", id));
};

export const createPaymentEntryService = async (payload) => {
  const { id, amount, paidFromAccountId, chargedToAccountId, description, month, category } = payload;
  const numericAmount = parseFloat(amount);

  return await runTransaction(db, async (transaction) => {
    const fromAccountRef = doc(db, "chart_of_accounts", paidFromAccountId);
    const toAccountRef = doc(db, "chart_of_accounts", chargedToAccountId);

    const [fromSnap, toSnap] = await Promise.all([transaction.get(fromAccountRef), transaction.get(toAccountRef)]);

    if (!fromSnap.exists() || !toSnap.exists()) throw new Error("Account lama helin sxb!");

    const fromAccountData = fromSnap.data();
    const toAccountData = toSnap.data();

    let oldAmount = 0;
    let existingJournalEntryId = null;

    if (id) {
      const oldEntrySnap = await transaction.get(doc(db, "payment_entries", id));
      if (oldEntrySnap.exists()) {
        const oldData = oldEntrySnap.data();
        oldAmount = parseFloat(oldData.amount || 0);
        existingJournalEntryId = oldData.journalEntryId || null;
      }
    }

    const newFromBalance = parseFloat(fromAccountData.balance || 0) + oldAmount - numericAmount;
    const newToBalance = parseFloat(toAccountData.balance || 0) - oldAmount + numericAmount;

    if (!id && newFromBalance < 0) throw new Error("INSUFFICIENT_FUNDS|Haraaga xisaabta kuma filna sxb!");

    transaction.update(fromAccountRef, { balance: newFromBalance });
    transaction.update(toAccountRef, { balance: newToBalance });

    const entryDocRef = id ? doc(db, "payment_entries", id) : doc(paymentEntriesRef);
    const jeDocRef = existingJournalEntryId ? doc(db, "journal_entries", existingJournalEntryId) : doc(journalEntriesRef);

    const journalEntryData = {
      date: serverTimestamp(),
      description,
      month,
      fiscalYear: 2026,
      referenceId: entryDocRef.id,
      type: "Expense",
      entries: [
        { accountId: chargedToAccountId, accountName: toAccountData.accountName, debit: numericAmount, credit: 0 },
        { accountId: paidFromAccountId, accountName: fromAccountData.accountName, debit: 0, credit: numericAmount }
      ]
    };
    transaction.set(jeDocRef, journalEntryData, { merge: true });

    const entryData = {
      amount: numericAmount,
      paidFromAccountId,
      chargedToAccountId,
      paidFromAccount: fromAccountData.accountName,
      chargedToAccount: toAccountData.accountName,
      description,
      month,
      category,
      journalEntryId: jeDocRef.id,
      date: serverTimestamp()
    };
    transaction.set(entryDocRef, entryData, { merge: true });
    return entryDocRef.id;
  });
};