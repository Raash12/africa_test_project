import { collection, getDocs, doc, runTransaction, serverTimestamp, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

const accountsRef = collection(db, "chart_of_accounts");
const transactionsRef = collection(db, "transactions");
const journalEntriesRef = collection(db, "journal_entries"); // Collection-ka cusub ee JE

// 1. Soo aqri Account-yada
export const getAccountsService = async () => {
  const snap = await getDocs(accountsRef);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
};

// 2. Soo aqri Dhammaan Diiwaanka Lacag Bixinta (Salary Transactions)
export const getSalaryTransactionsService = async () => {
  const snap = await getDocs(transactionsRef);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
};

// 3. Fuli Transaction-ka Labalabaynta Xisaabaadka (Double-Entry / Create & Update)
export const createSalaryTransactionService = async (payload) => {
  const { 
    id, // Haddii uu jiro waa Update Mode
    amount, 
    paidFromAccountId, 
    chargedToAccountId, 
    description, 
    month, 
    category, 
    employeeId, 
    employeeName 
  } = payload;
  
  const numericAmount = parseFloat(amount);

  return await runTransaction(db, async (transaction) => {
    // 🌟 A) HUBI DUPLICATE KALIYA MARKA AY TAHAY NEW TRANSACTION
    if (!id && employeeId && month) {
      const duplicateQuery = query(
        collection(db, "transactions"),
        where("employeeId", "==", employeeId),
        where("month", "==", month),
        where("category", "==", "Salary")
      );
      
      const duplicateSnap = await getDocs(duplicateQuery);
      if (!duplicateSnap.empty) {
        throw new Error(`DUPLICATE_SALARY|Mushaarka bisha ${month} ee ${employeeName} horey ayaa loo bixiyay sxb!`);
      }
    }

    const fromAccountRef = doc(db, "chart_of_accounts", paidFromAccountId);
    const toAccountRef = doc(db, "chart_of_accounts", chargedToAccountId);

    const fromAccountSnap = await transaction.get(fromAccountRef);
    const toAccountSnap = await transaction.get(toAccountRef);

    if (!fromAccountSnap.exists()) throw new Error("Account-ka lacagta laga goynayo lama helin sxb!");
    if (!toAccountSnap.exists()) throw new Error("Account-ka kharashka lagu qorayo lama helin sxb!");

    const fromAccountData = fromAccountSnap.data();
    const toAccountData = toAccountSnap.data();

    // Haddii ay tahay edit, waxaan marka hore dib u celinaa balance-kii hore intaan midka cusub la xisaabin
    let oldAmount = 0;
    if (id) {
      const oldTxRef = doc(db, "transactions", id);
      const oldTxSnap = await transaction.get(oldTxRef);
      if (oldTxSnap.exists()) {
        oldAmount = parseFloat(oldTxSnap.data().amount || 0);
      }
    }

    // Xisaabi Balances-ka cusub
    // Asset Account (Credit): Balance-kii hore + oldAmount - numericAmount
    const newFromBalance = parseFloat(fromAccountData.balance || 0) + oldAmount - numericAmount;
    // Expense Account (Debit): Balance-kii hore - oldAmount + numericAmount
    const newToBalance = parseFloat(toAccountData.balance || 0) - oldAmount + numericAmount;

    // Hubi haraaga haddii ay cusub tahay
    if (!id && newFromBalance < 0) {
      throw new Error("INSUFFICIENT_FUNDS|Haraaga xisaabta xubinta laga goynayo kuma filna sxb!");
    }

    // B) Cusbooneysii Balances-ka Labada Account
    transaction.update(fromAccountRef, { balance: newFromBalance });
    transaction.update(toAccountRef, { balance: newToBalance });

    // C) Keydi Transaction-ka weyn
    const txDocRef = id ? doc(db, "transactions", id) : doc(collection(db, "transactions"));
    const txData = {
      amount: numericAmount,
      paidFromAccountId,
      chargedToAccountId,
      accountName: fromAccountData.accountName || "",
      description,
      month,
      category: category || "Salary",
      employeeId,
      employeeName,
      date: serverTimestamp()
    };

    transaction.set(txDocRef, txData, { merge: true });

    // 🌟 D) ABUUR AMA CUSBOONEYSII JOURNAL ENTRY (Sida ka muuqata sawirka)
    // Waxaan u isticmaalaynaa ID-ga transaction-ka si ay isku xirnaadaan markasta
    const jeDocRef = doc(db, "journal_entries", txDocRef.id);
    const jeData = {
      referenceId: txDocRef.id,
      description: description,
      date: serverTimestamp(),
      fy: new Date().getFullYear(), // Sanadka maaliyadeed (FY: 2026)
      entries: [
        {
          accountId: chargedToAccountId,
          accountName: toAccountData.accountName || "Salaries Expense",
          debit: numericAmount,
          credit: 0
        },
        {
          accountId: paidFromAccountId,
          accountName: fromAccountData.accountName || "salaama",
          debit: 0,
          credit: numericAmount
        }
      ]
    };

    transaction.set(jeDocRef, jeData, { merge: true });

    return txDocRef.id;
  });
};

// 4. Delete Transaction (Kalliya badbaado ahaan dib u habayn Balance-kii hore)
export const deleteSalaryTransactionService = async (id) => {
  if (!id) return;
  
  return await runTransaction(db, async (transaction) => {
    const txRef = doc(db, "transactions", id);
    const txSnap = await transaction.get(txRef);
    if (!txSnap.exists()) throw new Error("Transaction-ka la tirtirayo lama helin sxb!");

    const txData = txSnap.data();
    const amount = parseFloat(txData.amount || 0);

    const fromAccountRef = doc(db, "chart_of_accounts", txData.paidFromAccountId);
    const toAccountRef = doc(db, "chart_of_accounts", txData.chargedToAccountId);

    const fromSnap = await transaction.get(fromAccountRef);
    const toSnap = await transaction.get(toAccountRef);

    if (fromSnap.exists()) {
      transaction.update(fromAccountRef, { balance: parseFloat(fromSnap.data().balance || 0) + amount });
    }
    if (toSnap.exists()) {
      transaction.update(toAccountRef, { balance: parseFloat(toSnap.data().balance || 0) - amount });
    }

    // Tirtir transaction-ka iyo Journal Entry-gaba
    transaction.delete(txRef);
    
    const jeRef = doc(db, "journal_entries", id);
    transaction.delete(jeRef);
  });
};