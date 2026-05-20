// services/inventory/warehouseService.js
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";

export const createWarehouse = async (warehouseData) => {
  try {
    const finalData = {
      ...warehouseData,
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, "warehouses"), finalData);
    return { id: docRef.id, ...finalData };
  } catch (error) {
    console.error("Error creating warehouse:", error);
    throw error;
  }
};

export const updateWarehouse = async (id, updatedData) => {
  try {
    const docRef = doc(db, "warehouses", id);
    await updateDoc(docRef, updatedData);
    return true;
  } catch (error) {
    console.error("Error updating warehouse:", error);
    throw error;
  }
};

export const deleteWarehouse = async (id) => {
  try {
    const docRef = doc(db, "warehouses", id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting warehouse:", error);
    throw error;
  }
};