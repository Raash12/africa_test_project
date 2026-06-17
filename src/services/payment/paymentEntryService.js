import { db } from "@/lib/firebase";
import { 
  collection, getDocs, doc, runTransaction, serverTimestamp, query, orderBy, where 
} from "firebase/firestore";

const COLLECTION_NAME = "payment_entries";

// 1. Soo wada aqri dhamaan entries-ka hal meel
export const getAllPaymentEntries = async () => {
  const q = query(collection(db, COLLECTION_NAME), orderBy("date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// 2. Create/Update Entry (Midaysan)
export const createPaymentEntry = async (payload) => {
  const { 
    id, type, amount, paidFromAccountId, chargedToAccountId, 
    description, month, category, employeeId, employeeName, invoiceId 
  } = payload;
  
  const numericAmount = parseFloat(amount);

  return await runTransaction(db, async (transaction) => {
    // --- A. Salary Duplicate Check ---
    if (!id && type === "SALARY" && employeeId && month) {
      const q = query(collection(db, COLLECTION_NAME), where("employeeId", "==", employeeId), where("month", "==", month), where("type", "==", "SALARY"));
      const snap = await getDocs(q);
      if (!snap.empty) throw new Error("Mushaarka bishaas horey ayaa loo bixiyay!");
    }

    // --- B. Balances Update (Accounting) ---
    const fromAccRef = doc(db, "chart_of_accounts", paidFromAccountId);
    const toAccRef = doc(db, "chart_of_accounts", chargedToAccountId);
    
    const fromSnap = await transaction.get(fromAccRef);
    const toSnap = await transaction.get(toAccRef);

    if (!fromSnap.exists() || !toSnap.exists()) throw new Error("Account lama helin!");

    let oldAmount = 0;
    if (id) {
      const oldEntry = await transaction.get(doc(db, COLLECTION_NAME, id));
      if (oldEntry.exists()) oldAmount = parseFloat(oldEntry.data().amount || 0);
    }

    transaction.update(fromAccRef, { balance: parseFloat(fromSnap.data().balance || 0) + oldAmount - numericAmount });
    transaction.update(toAccRef, { balance: parseFloat(toSnap.data().balance || 0) - oldAmount + numericAmount });

    // --- C. Save Entry (Midaysan) ---
    const entryRef = id ? doc(db, COLLECTION_NAME, id) : doc(collection(db, COLLECTION_NAME));
    const entryData = {
      type, // SALARY, PURCHASE_INVOICE, ama EXPENSE
      amount: numericAmount, 
      paidFromAccountId, 
      chargedToAccountId, 
      description, 
      month, 
      category,
      employeeId, 
      employeeName, 
      invoiceId, 
      date: serverTimestamp()
    };
    transaction.set(entryRef, entryData, { merge: true });

    // --- D. Journal Entry (Accounting Trail) ---
    transaction.set(doc(db, "journal_entries", entryRef.id), {
      referenceId: entryRef.id, 
      description, 
      date: serverTimestamp(), 
      type, // Si loo ogaado nooca journal-ka
      entries: [
        { accountId: chargedToAccountId, accountName: toSnap.data().accountName, debit: numericAmount, credit: 0 },
        { accountId: paidFromAccountId, accountName: fromSnap.data().accountName, debit: 0, credit: numericAmount }
      ]
    }, { merge: true });

    // --- E. Update status haddii ay tahay Invoice ---
    if (type === "PURCHASE_INVOICE" && invoiceId) {
      transaction.update(doc(db, "purchase_invoices", invoiceId), { status: "PAID" });
    }

    return entryRef.id;
  });
};

// 3. Tirtiridda (Midaysan)
export const deletePaymentEntry = async (id, invoiceId = null) => {
  return await runTransaction(db, async (transaction) => {
    const entryRef = doc(db, COLLECTION_NAME, id);
    const entrySnap = await transaction.get(entryRef);
    if (!entrySnap.exists()) return;
    
    const data = entrySnap.data();
    const amount = parseFloat(data.amount);

    // Dib u celinta Balances
    const fromAccRef = doc(db, "chart_of_accounts", data.paidFromAccountId);
    const toAccRef = doc(db, "chart_of_accounts", data.chargedToAccountId);
    
    const [fromSnap, toSnap] = await Promise.all([transaction.get(fromAccRef), transaction.get(toAccRef)]);

    transaction.update(fromAccRef, { balance: parseFloat(fromSnap.data().balance || 0) + amount });
    transaction.update(toAccRef, { balance: parseFloat(toSnap.data().balance || 0) - amount });

    // Tirtiridda
    transaction.delete(entryRef);
    transaction.delete(doc(db, "journal_entries", id));

    // Update status Invoice haddii ay jirtay
    if (invoiceId) {
      transaction.update(doc(db, "purchase_invoices", invoiceId), { status: "UNPAID" });
    }
  });
};