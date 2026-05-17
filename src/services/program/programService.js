import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";

const programCollection = collection(db, "programs");

export const createProgram = (data) => addDoc(programCollection, data);

export const getPrograms = async () => {
  const snapshot = await getDocs(programCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateProgram = (id, data) => updateDoc(doc(db, "programs", id), data);
export const deleteProgram = (id) => deleteDoc(doc(db, "programs", id));