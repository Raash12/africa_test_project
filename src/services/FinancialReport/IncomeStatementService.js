// src/services/FinancialReport/IncomeStatementService.js
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export const fetchIncomeStatementRawData = async () => {
  try {
    const [accountsSnap, paymentsSnap, grantsSnap, projectsSnap] = await Promise.all([
      getDocs(collection(db, "accounts")),
      getDocs(collection(db, "payments")),
      getDocs(collection(db, "grants")),
      getDocs(collection(db, "projects"))
    ]);

    const accounts = accountsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const payments = paymentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const grants = grantsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const projects = projectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return { accounts, payments, grants, projects };
  } catch (error) {
    console.error("Error fetching Income Statement raw data:", error);
    throw error;
  }
};