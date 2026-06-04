import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy } from "firebase/firestore";

const journalCollection = collection(db, "journal_entries");

// 1. Create Journal Entry (Double Entry)
export const createJournalEntry = async (journalData) => {
  // journalData waa inay ku jirto: { date, docNo, description, fiscalYearId, financeBookId, items: [...] }
  
  // Hubinta Double Entry (Debits must equal Credits)
  const totalDebit = journalData.items.reduce((sum, item) => sum + Number(item.debit || 0), 0);
  const totalCredit = journalData.items.reduce((sum, item) => sum + Number(item.credit || 0), 0);

  if (Math.abs(totalDebit - totalCredit) > 0.001) {
    throw new Error("Double entry mismatch: Total Debits must equal Total Credits.");
  }

  const payload = {
    date: journalData.date,
    docNo: journalData.docNo || `JE-${Date.now()}`,
    description: journalData.description,
    fiscalYearId: journalData.fiscalYearId,
    financeBookId: journalData.financeBookId,
    totalAmount: totalDebit, // Maadaama ay siman yihiin
    items: journalData.items.map(item => ({
      accountId: item.accountId,
      accountName: item.accountName,
      accountCode: item.accountCode,
      debit: Number(item.debit || 0),
      credit: Number(item.credit || 0),
      memo: item.memo || ""
    })),
    status: "Posted",
    createdAt: new Date().toISOString()
  };

  return await addDoc(journalCollection, payload);
};

// 2. Get Journal Entries (with optional Finance Book filter)
export const getJournalEntries = async (financeBookId = null) => {
  let q = query(journalCollection, orderBy("date", "desc"));
  
  if (financeBookId) {
    q = query(journalCollection, where("financeBookId", "==", financeBookId), orderBy("date", "desc"));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// 3. Delete Journal Entry
export const deleteJournalEntry = (id) => deleteDoc(doc(db, "journal_entries", id));