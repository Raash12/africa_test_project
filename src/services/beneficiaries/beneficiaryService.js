import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";

const beneficiaryCollection = collection(db, "beneficiaries");

export const createBeneficiary = (data) => addDoc(beneficiaryCollection, data);

export const getBeneficiaries = async () => {
  const snapshot = await getDocs(beneficiaryCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateBeneficiary = (id, data) => updateDoc(doc(db, "beneficiaries", id), data);
export const deleteBeneficiary = (id) => deleteDoc(doc(db, "beneficiaries", id));