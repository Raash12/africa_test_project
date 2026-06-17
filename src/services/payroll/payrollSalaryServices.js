import { collection, getDocs, doc, runTransaction, serverTimestamp, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

const accountsRef = collection(db, "chart_of_accounts");
const paymentEntriesRef = collection(db, "payment_entries");
const journalEntriesRef = collection(db, "journal_entries");

export const getAccountsService = async () => {
  const snap = await getDocs(accountsRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Waxaan ka dhigay getPaymentEntriesService si uu ula jaanqaado kan Expense-ka
export const getPaymentEntriesService = async () => {
  const q = query(paymentEntriesRef, where("category", "==", "Salary")); // Waxaan ku daray filter
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const createPaymentEntryService = async (payload) => {
  const { id, amount, paidFromAccountId, chargedToAccountId, description, month, category, employeeId, employeeName } = payload;
  const numericAmount = parseFloat(amount);

  return await runTransaction(db, async (transaction) => {
    // Duplicate Check
    if (!id && employeeId && month) {
      const duplicateQuery = query(paymentEntriesRef, where("employeeId", "==", employeeId), where("month", "==", month), where("category", "==", "Salary"));
      const duplicateSnap = await getDocs(duplicateQuery);
      if (!duplicateSnap.empty) throw new Error("Mushaarka bishaas horey ayaa loo bixiyay!");
    }

    const fromAccountRef = doc(db, "chart_of_accounts", paidFromAccountId);
    const toAccountRef = doc(db, "chart_of_accounts", chargedToAccountId);
    const [fromSnap, toSnap] = await Promise.all([transaction.get(fromAccountRef), transaction.get(toAccountRef)]);
    
    if (!fromSnap.exists() || !toSnap.exists()) throw new Error("Account lama helin!");

    const fromAccountData = fromSnap.data();
    const toAccountData = toSnap.data();

    // Logic-ga Balance (sida kii Expense-ka)
    let oldAmount = 0;
    let existingJournalEntryId = null;
    if (id) {
        const oldEntrySnap = await transaction.get(doc(db, "payment_entries", id));
        if (oldEntrySnap.exists()) {
            oldAmount = parseFloat(oldEntrySnap.data().amount || 0);
            existingJournalEntryId = oldEntrySnap.data().journalEntryId || null;
        }
    }

    transaction.update(fromAccountRef, { balance: parseFloat(fromAccountData.balance || 0) + oldAmount - numericAmount });
    transaction.update(toAccountRef, { balance: parseFloat(toAccountData.balance || 0) - oldAmount + numericAmount });

    const entryDocRef = id ? doc(db, "payment_entries", id) : doc(paymentEntriesRef);
    const jeDocRef = existingJournalEntryId ? doc(db, "journal_entries", existingJournalEntryId) : doc(journalEntriesRef);

    transaction.set(jeDocRef, {
      date: serverTimestamp(), description, month, referenceId: entryDocRef.id, type: "Salary",
      entries: [
        { accountId: chargedToAccountId, accountName: toAccountData.accountName, debit: numericAmount, credit: 0 },
        { accountId: paidFromAccountId, accountName: fromAccountData.accountName, debit: 0, credit: numericAmount }
      ]
    }, { merge: true });

    transaction.set(entryDocRef, {
      amount: numericAmount, paidFromAccountId, chargedToAccountId, description, month, category,
      employeeId, employeeName, journalEntryId: jeDocRef.id, date: serverTimestamp()
    }, { merge: true });

    return entryDocRef.id;
  });
};

export const deletePaymentEntryService = async (id) => {
    // Sida kii hore, isticmaal deleteDoc ama transaction
    return await runTransaction(db, async (transaction) => {
        const entryRef = doc(db, "payment_entries", id);
        const data = (await transaction.get(entryRef)).data();
        if(!data) return;
        
        transaction.update(doc(db, "chart_of_accounts", data.paidFromAccountId), { balance: parseFloat((await transaction.get(doc(db, "chart_of_accounts", data.paidFromAccountId))).data().balance || 0) + parseFloat(data.amount) });
        transaction.update(doc(db, "chart_of_accounts", data.chargedToAccountId), { balance: parseFloat((await transaction.get(doc(db, "chart_of_accounts", data.chargedToAccountId))).data().balance || 0) - parseFloat(data.amount) });
        transaction.delete(entryRef);
        if(data.journalEntryId) transaction.delete(doc(db, "journal_entries", data.journalEntryId));
    });
};