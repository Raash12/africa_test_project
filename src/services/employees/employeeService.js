import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const employeesRef = collection(db, "employees");

export const createEmployee = async (data) => {
  return await addDoc(employeesRef, {
    ...data,
    createdAt: serverTimestamp(),
  });
};

export const getEmployees = async () => {
  const snap = await getDocs(employeesRef);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
};