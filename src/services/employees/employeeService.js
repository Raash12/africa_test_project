import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const employeesRef = collection(db, "employees");

export const createEmployeeService = async (data) => {
  return await addDoc(employeesRef, {
    ...data,
    createdAt: serverTimestamp(),
  });
};

export const getEmployeesService = async () => {
  const snap = await getDocs(employeesRef);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
};

export const updateEmployeeService = async (id, data) => {
  const ref = doc(db, "employees", id);
  return await updateDoc(ref, data);
};

export const deleteEmployeeService = async (id) => {
  const ref = doc(db, "employees", id);
  return await deleteDoc(ref);
};