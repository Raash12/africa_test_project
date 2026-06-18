import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  doc, 
  where,
  runTransaction 
} from "firebase/firestore";

// Helper: Auto-generate Purchase Invoice Number
const generateInvoiceNumber = async () => {
  const currentYear = new Date().getFullYear();
  const invoiceRef = collection(db, "purchase_invoices");
  const q = query(invoiceRef, orderBy("invoiceNumber", "desc"), limit(1));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const lastInvoiceNumber = querySnapshot.docs[0].data().invoiceNumber;
    try {
      const lastSerialNumber = parseInt(lastInvoiceNumber.split("-")[2]) || 0;
      const nextSerialNumber = String(lastSerialNumber + 1).padStart(3, "0");
      return `PI-${currentYear}-${nextSerialNumber}`;
    } catch (e) {
      return `PI-${currentYear}-001`;
    }
  }
  return `PI-${currentYear}-001`;
};

// 🌟 1. CREATE PURCHASE INVOICE & AUTOMATIC JOURNAL ENTRY
export const createPurchaseInvoice = async (invoiceData) => {
  const invoiceNumber = await generateInvoiceNumber();
  
  // Sxb, halkan waxaan si toos ah ugu isticmaaleynaa account-kii uu user-ku foomka ka doortay
  if (!invoiceData.inventoryAccountId) {
    throw new Error("Khalad: Fadlan dooro koontada Inventory/Stock ee foomka sxb.");
  }

  const inventoryAccountRef = doc(db, "chart_of_accounts", invoiceData.inventoryAccountId);
  const liabilityAccountRef = doc(db, "chart_of_accounts", invoiceData.liabilityAccountId);
  
  const invoiceRef = doc(collection(db, "purchase_invoices"));
  const journalRef = doc(collection(db, "journal_entries"));

  return await runTransaction(db, async (transaction) => {
    // A. Akhri xogta Liability Account
    const liabilitySnap = await transaction.get(liabilityAccountRef);
    if (!liabilitySnap.exists()) throw new Error("Liability Account-ka la doortay lama helin db-ga!");
    const currentLiabilityBal = Number(liabilitySnap.data().balance || 0);

    // B. Akhri xogta Inventory Account
    const inventorySnap = await transaction.get(inventoryAccountRef);
    if (!inventorySnap.exists()) throw new Error("Inventory Account-ka la doortay lama helin db-ga!");
    const currentInventoryBal = Number(inventorySnap.data().balance || 0);

    const amount = Number(invoiceData.totalAmount || 0);

    // C. UPDATE ACCOUNT BALANCES
    transaction.update(liabilityAccountRef, {
      balance: Number((currentLiabilityBal + amount).toFixed(2))
    });
    transaction.update(inventoryAccountRef, {
      balance: Number((currentInventoryBal + amount).toFixed(2))
    });

    // D. CREATE AUTOMATIC JOURNAL ENTRY
    const journalPayload = {
      date: invoiceData.dueDate || new Date().toISOString().split("T")[0],
      docNo: `JE-${invoiceNumber}`,
      description: `Auto Journal for Purchase Invoice: ${invoiceNumber} (PO: ${invoiceData.poNumber})`,
      fiscalYearId: invoiceData.fiscalYearId || "FY-2026",
      financeBookId: invoiceData.financeBookId || "default_book",
      totalAmount: amount,
      status: "Posted",
      createdAt: new Date().toISOString(),
      items: [
        {
          accountId: invoiceData.liabilityAccountId,
          accountName: liabilitySnap.data().accountName || "Accounts Payable",
          accountCode: liabilitySnap.data().accountCode || "",
          debit: 0,
          credit: amount,
          memo: `Payable to Vendor: ${invoiceData.supplierName}`
        },
        {
          accountId: invoiceData.inventoryAccountId,
          accountName: inventorySnap.data().accountName || "Inventory / Stock Asset",
          accountCode: inventorySnap.data().accountCode || "1200",
          debit: amount,
          credit: 0,
          memo: `Received Stock from Invoice ${invoiceNumber}`
        }
      ]
    };
    transaction.set(journalRef, journalPayload);

    // E. SAVE THE PURCHASE INVOICE
    const finalInvoiceData = {
      ...invoiceData,
      invoiceNumber,
      totalAmount: amount,
      journalEntryId: journalRef.id,
      createdAt: new Date().toISOString()
    };
    transaction.set(invoiceRef, finalInvoiceData);

    return { id: invoiceRef.id, ...finalInvoiceData };
  });
};

// 🌟 2. UPDATE PURCHASE INVOICE
export const updatePurchaseInvoice = async (id, updatedData) => {
  const invoiceRef = doc(db, "purchase_invoices", id);

  return await runTransaction(db, async (transaction) => {
    const invoiceSnap = await transaction.get(invoiceRef);
    if (!invoiceSnap.exists()) throw new Error("Invoice-ka lama helin!");

    const oldData = invoiceSnap.data();
    const inventoryAccountId = updatedData.inventoryAccountId || oldData.inventoryAccountId;
    const inventoryAccountRef = doc(db, "chart_of_accounts", inventoryAccountId);

    const oldAmount = Number(oldData.totalAmount || 0);
    const newAmount = Number(updatedData.totalAmount || 0);
    const oldAccountId = oldData.liabilityAccountId;
    const newAccountId = updatedData.liabilityAccountId;
    const journalEntryId = oldData.journalEntryId;

    // A. SAXIDDA INVENTORY
    const inventorySnap = await transaction.get(inventoryAccountRef);
    if (inventorySnap.exists()) {
      const invBal = Number(inventorySnap.data().balance || 0);
      transaction.update(inventoryAccountRef, { 
        balance: Number((invBal - oldAmount + newAmount).toFixed(2)) 
      });
    }

    // B. SAXIDDA LIABILITY
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
    } else {
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

    // C. CUSBOONAYSIINTA JOURNAL ENTRY
    if (journalEntryId) {
      const journalRef = doc(db, "journal_entries", journalEntryId);
      const newLiabilitySnap = await transaction.get(doc(db, "chart_of_accounts", newAccountId));

      transaction.update(journalRef, {
        totalAmount: newAmount,
        items: [
          {
            accountId: newAccountId,
            accountName: newLiabilitySnap.exists() ? newLiabilitySnap.data().accountName : "Accounts Payable",
            accountCode: newLiabilitySnap.exists() ? newLiabilitySnap.data().accountCode : "",
            debit: 0,
            credit: newAmount,
            memo: `Updated Payable to Vendor`
          },
          {
            accountId: inventoryAccountId,
            accountName: inventorySnap.exists() ? inventorySnap.data().accountName : "Inventory Asset",
            accountCode: inventorySnap.exists() ? inventorySnap.data().accountCode : "1200",
            debit: newAmount,
            credit: 0,
            memo: `Updated Stock Asset`
          }
        ]
      });
    }

    // D. CUSBOONAYSII INVOICE
    transaction.update(invoiceRef, {
      ...updatedData,
      inventoryAccountId,
      totalAmount: newAmount
    });

    return true;
  });
};

// 🌟 3. DELETE PURCHASE INVOICE
export const deletePurchaseInvoice = async (id) => {
  const invoiceRef = doc(db, "purchase_invoices", id);

  return await runTransaction(db, async (transaction) => {
    const invoiceSnap = await transaction.get(invoiceRef);
    if (!invoiceSnap.exists()) throw new Error("Invoice lama helin!");

    const data = invoiceSnap.data();
    const amount = Number(data.totalAmount || 0);
    const accountId = data.liabilityAccountId;
    const inventoryAccountId = data.inventoryAccountId;
    const journalEntryId = data.journalEntryId;

    // A. Ka jar Liability
    if (accountId) {
      const accountRef = doc(db, "chart_of_accounts", accountId);
      const accountDoc = await transaction.get(accountRef);
      if (accountDoc.exists()) {
        const currentBal = Number(accountDoc.data().balance || 0);
        transaction.update(accountRef, { balance: Number((currentBal - amount).toFixed(2)) });
      }
    }

    // B. Ka jar Inventory
    if (inventoryAccountId) {
      const inventoryAccountRef = doc(db, "chart_of_accounts", inventoryAccountId);
      const inventorySnap = await transaction.get(inventoryAccountRef);
      if (inventorySnap.exists()) {
        const invBal = Number(inventorySnap.data().balance || 0);
        transaction.update(inventoryAccountRef, { balance: Number((invBal - amount).toFixed(2)) });
      }
    }

    // C. Tirtir Journal Entry
    if (journalEntryId) {
      const journalRef = doc(db, "journal_entries", journalEntryId);
      transaction.delete(journalRef);
    }

    // D. Tirtir Invoice
    transaction.delete(invoiceRef);
    return true;
  });
};