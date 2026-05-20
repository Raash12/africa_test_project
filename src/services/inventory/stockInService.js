import { db } from "@/lib/firebase";
import { collection, addDoc, doc, deleteDoc } from "firebase/firestore";

export const createStockIn = async (stockInData) => {
  try {
    // Xisaabi wadarta guud ee invoice-ka oo dhan (Sum of all items qty * price)
    const totalInvoiceValue = (stockInData.items || []).reduce((sum, item) => {
      return sum + (Number(item.quantity) * Number(item.costPrice));
    }, 0);

    const finalData = {
      ...stockInData,
      totalValue: totalInvoiceValue,
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
    await deleteDoc(doc(db, "stock_in", id));
    return true;
  } catch (error) {
    console.error("Error deleting stock in:", error);
    throw error;
  }
};