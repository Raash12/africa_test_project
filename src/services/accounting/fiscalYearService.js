import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";

const fiscalYearCollection = collection(db, "fiscal_years");

export const createFiscalYear = (data) => {
  // Hubi in marka hore xogta la nadiifiyo
  const payload = {
    yearName: data.yearName,
    startDate: data.startDate,
    endDate: data.endDate,
    status: data.status || "Active",
    createdAt: new Date().toISOString()
  };
  return addDoc(fiscalYearCollection, payload);
};

export const getFiscalYears = async () => {
  const snapshot = await getDocs(fiscalYearCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateFiscalYear = (id, data) => updateDoc(doc(db, "fiscal_years", id), data);
export const deleteFiscalYear = (id) => deleteDoc(doc(db, "fiscal_years", id));