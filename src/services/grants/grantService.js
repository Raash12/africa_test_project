import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";

const grantCollection = collection(db, "grants");

export const createGrant = (data) => addDoc(grantCollection, data);

export const getGrants = async () => {
  const snapshot = await getDocs(grantCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateGrant = (id, data) => updateDoc(doc(db, "grants", id), data);
export const deleteGrant = (id) => deleteDoc(doc(db, "grants", id));