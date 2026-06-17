import { db } from "@/lib/firebase";
import { 
  collection, getDocs, doc, runTransaction, serverTimestamp, query, where 
} from "firebase/firestore";

const COLLECTION_NAME = "payment_entries";

// 1. Soo wada aqri dhamaan entries-ka (Kani wuxuu GL-ka u keenayaa xogta oo dhan)
export const getAllPaymentEntries = async () => {
  try {
    // 🛠️ FIX: Waxaan ka saarnay orderBy si haddii uu jiro document aan date lahayn uusan query-gu u haman.
    const q = query(collection(db, COLLECTION_NAME));
    const snap = await getDocs(q);
    
    // Haddii database-ku madan yahay log yar inoo reeb
    if (snap.empty) {
      console.warn("⚠️ HOOK WARNING: Wax xog ah lagama helin collection-ka payment_entries!");
    }

    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("🔴 Error fetching all payment entries:", error);
    throw error;
  }
};

// 2. Create ama Update Entry (Labadaba midaysan)
export const createPaymentEntryService = async (payload) => {
  const { 
    id, type, amount, paidFromAccountId, chargedToAccountId, 
    description, month, category, employeeId, employeeName, invoiceId 
  } = payload;
  
  const numericAmount = parseFloat(amount);

  return await runTransaction(db, async (transaction) => {
    // --- A. Salary Duplicate Check ---
    if (!id && type === "SALARY" && employeeId && month) {
      const q = query(
        collection(db, COLLECTION_NAME), 
        where("employeeId", "==", employeeId), 
        where("month", "==", month), 
        where("type", "==", "SALARY")
      );
      const snap = await getDocs(q);
      if (!snap.empty) throw new Error("Mushaarka bishaas horey ayaa loo bixiyay!");
    }

    // --- B. Balances Update (Accounting Ledger logic) ---
    const fromAccRef = doc(db, "chart_of_accounts", paidFromAccountId);
    const toAccRef = doc(db, "chart_of_accounts", chargedToAccountId);
    
    const [fromSnap, toSnap] = await Promise.all([transaction.get(fromAccRef), transaction.get(toAccRef)]);

    if (!fromSnap.exists() || !toSnap.exists()) throw new Error("Account-ada la doonayo lama helin!");

    let oldAmount = 0;
    let existingJournalEntryId = null;

    if (id) {
      const oldEntry = await transaction.get(doc(db, COLLECTION_NAME, id));
      if (oldEntry.exists()) {
        oldAmount = parseFloat(oldEntry.data().amount || 0);
        existingJournalEntryId = oldEntry.data().journalEntryId || null;
      }
    }

    // Isku dheelitirka Haraaga (Cusbooneysiin)
    transaction.update(fromAccRef, { balance: parseFloat(fromSnap.data().balance || 0) + oldAmount - numericAmount });
    transaction.update(toAccRef, { balance: parseFloat(toSnap.data().balance || 0) - oldAmount + numericAmount });

    // --- C. Diyaarinta References-ka ---
    const entryRef = id ? doc(db, COLLECTION_NAME, id) : doc(collection(db, COLLECTION_NAME));
    const jeDocRef = existingJournalEntryId ? doc(db, "journal_entries", existingJournalEntryId) : doc(collection(db, "journal_entries"));

    // --- D. Journal Entry (Accounting Trail for GL) ---
    const journalEntryData = {
      referenceId: entryRef.id, 
      description, 
      month,
      date: serverTimestamp(), 
      type: type, 
      entries: [
        { accountId: chargedToAccountId, accountName: toSnap.data().accountName, debit: numericAmount, credit: 0 },
        { accountId: paidFromAccountId, accountName: fromSnap.data().accountName, debit: 0, credit: numericAmount }
      ]
    };
    transaction.set(jeDocRef, journalEntryData, { merge: true });

    // --- E. Save Main Entry ---
    const entryData = {
      type, 
      amount: numericAmount, 
      paidFromAccountId, 
      chargedToAccountId, 
      paidFromAccount: fromSnap.data().accountName,
      chargedToAccount: toSnap.data().accountName,
      description, 
      month, 
      category: category || type,
      employeeId: employeeId || null, 
      employeeName: employeeName || null, 
      invoiceId: invoiceId || null, 
      journalEntryId: jeDocRef.id,
      date: serverTimestamp() 
    };
    transaction.set(entryRef, entryData, { merge: true });

    // --- F. Invoice Status Update ---
    if (type === "PURCHASE_INVOICE" && invoiceId) {
      transaction.update(doc(db, "purchase_invoices", invoiceId), { status: "PAID" });
    }

    return entryRef.id;
  });
};

// 3. Tirtiridda Entry-ga iyo dib u saxida haraaga xisaabta
export const deletePaymentEntryService = async (id, invoiceId = null) => {
  return await runTransaction(db, async (transaction) => {
    const entryRef = doc(db, COLLECTION_NAME, id);
    const entrySnap = await transaction.get(entryRef);
    if (!entrySnap.exists()) return;
    
    const data = entrySnap.data();
    const amount = parseFloat(data.amount);

    const fromAccRef = doc(db, "chart_of_accounts", data.paidFromAccountId);
    const toAccRef = doc(db, "chart_of_accounts", data.chargedToAccountId);
    
    const [fromSnap, toSnap] = await Promise.all([transaction.get(fromAccRef), transaction.get(toAccRef)]);

    if (fromSnap.exists()) transaction.update(fromAccRef, { balance: parseFloat(fromSnap.data().balance || 0) + amount });
    if (toSnap.exists()) transaction.update(toAccRef, { balance: parseFloat(toSnap.data().balance || 0) - amount });

    transaction.delete(entryRef);
    if (data.journalEntryId) {
      transaction.delete(doc(db, "journal_entries", data.journalEntryId));
    }

    if (invoiceId || data.invoiceId) {
      transaction.update(doc(db, "purchase_invoices", invoiceId || data.invoiceId), { status: "UNPAID" });
    }
  });
};