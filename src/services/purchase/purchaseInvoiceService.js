// services/purchase/purchaseInvoiceService.js
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, limit, doc, updateDoc, deleteDoc } from "firebase/firestore";

const generateInvoiceNumber = async () => {
  const currentYear = new Date().getFullYear();
  const invoiceRef = collection(db, "purchase_invoices");
  const q = query(invoiceRef, orderBy("invoiceNumber", "desc"), limit(1));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const lastInvoiceNumber = querySnapshot.docs[0].data().invoiceNumber;
    const lastSerialNumber = parseInt(lastInvoiceNumber.split("-")[2]) || 0;
    const nextSerialNumber = String(lastSerialNumber + 1).padStart(3, "0");
    return `PI-${currentYear}-${nextSerialNumber}`;
  }

  return `PI-${currentYear}-001`;
};

export const createPurchaseInvoice = async (invoiceData) => {
  try {
    const invoiceNumber = await generateInvoiceNumber();
    const finalData = {
      ...invoiceData,
      invoiceNumber,
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, "purchase_invoices"), finalData);
    return { id: docRef.id, ...finalData };
  } catch (error) {
    console.error("Error creating PI:", error);
    throw error;
  }
};

export const updatePurchaseInvoice = async (id, updatedData) => {
  try {
    const docRef = doc(db, "purchase_invoices", id);
    await updateDoc(docRef, updatedData);
    return true;
  } catch (error) {
    console.error("Error updating PI:", error);
    throw error;
  }
};

export const deletePurchaseInvoice = async (id) => {
  try {
    const docRef = doc(db, "purchase_invoices", id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting PI:", error);
    throw error;
  }
};