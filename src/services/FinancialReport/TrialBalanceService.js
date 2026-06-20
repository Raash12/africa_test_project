// src/services/FinancialReport/TrialBalanceService.js
import { db } from "@/lib/firebase";

import { collection, getDocs } from "firebase/firestore";

export const fetchTrialBalanceRawData = async () => {
  try {
    const [accountsSnap, paymentsSnap, grantsSnap, invoicesSnap, projectsSnap] = await Promise.all([
      getDocs(collection(db, "accounts")),
      getDocs(collection(db, "payments")),
      getDocs(collection(db, "grants")),
      getDocs(collection(db, "purchaseInvoices")),
      getDocs(collection(db, "projects"))
    ]);

    const accounts = accountsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const payments = paymentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const grants = grantsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const purchaseInvoices = invoicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const projects = projectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return { accounts, payments, grants, purchaseInvoices, projects };
  } catch (error) {
    console.error("Error fetching Trial Balance raw data:", error);
    throw error;
  }
};