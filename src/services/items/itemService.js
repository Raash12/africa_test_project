import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc 
} from "firebase/firestore";

const itemsCollectionRef = collection(db, "items");

// CREATE
export const createItem = async (itemData) => {
  return await addDoc(itemsCollectionRef, itemData);
};

// READ
export const getItems = async () => {
  const data = await getDocs(itemsCollectionRef);
  return data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
};

// UPDATE (The missing piece)
export const updateItem = async (id, updatedData) => {
  const itemDoc = doc(db, "items", id);
  return await updateDoc(itemDoc, updatedData);
};

// DELETE (The missing piece)
export const deleteItem = async (id) => {
  const itemDoc = doc(db, "items", id);
  return await deleteDoc(itemDoc);
};