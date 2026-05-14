import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const usersRef = collection(db, "users");

export const createUserData = async (data) => {
  return await addDoc(usersRef, { ...data, createdAt: serverTimestamp() });
};

export const getUsers = async () => {
  const snap = await getDocs(usersRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const updateUser = async (id, data) => {
  const ref = doc(db, "users", id);
  return await updateDoc(ref, data);
};

export const deleteUser = async (id) => {
  const ref = doc(db, "users", id);
  return await deleteDoc(ref);
};