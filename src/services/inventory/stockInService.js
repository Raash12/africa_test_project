// services/inventory/stockInService.js
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, deleteDoc } from "firebase/firestore";

export const createStockIn = async (stockInData) => {
  try {
    const finalData = {
      ...stockInData,
      totalValue: Number(stockInData.quantity) * Number(stockInData.costPrice),
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, "stock_in"), finalData);
    return { id: docRef.id, ...finalData };
  } catch (error) {
    console.error("Error creating stock in:", error);
    throw error;
  }
};

export const deleteStockIn = async (id) => {
  try {
    const docRef = doc(db, "stock_in", id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting stock in entry:", error);
    throw error;
  }
};