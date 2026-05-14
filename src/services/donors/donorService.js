import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";

const donorCollection = collection(db, "donors");

export const createDonor = (data) => addDoc(donorCollection, data);

export const getDonors = async () => {
  const snapshot = await getDocs(donorCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// MAKE SURE THESE TWO ARE HERE
export const updateDonor = (id, data) => updateDoc(doc(db, "donors", id), data);
export const deleteDonor = (id) => deleteDoc(doc(db, "donors", id));