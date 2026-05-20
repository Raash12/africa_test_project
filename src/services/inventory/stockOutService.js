import { db } from "@/lib/firebase";
import { collection, getDocs, doc, runTransaction } from "firebase/firestore";

const adjustmentCollection = collection(db, "stock_adjustments");

export const getStockAdjustments = async () => {
  try {
    const snapshot = await getDocs(adjustmentCollection);
    const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error("Error fetching stock adjustments:", error);
    throw error;
  }
};

export const adjustStock = async (adjustmentData) => {
  const { stockItemId, subItemId, adjustmentType, quantity, notes, warehouseName } = adjustmentData; 

  if (!stockItemId) throw new Error("Fadlan dooro alaabta aad rabto inaad saxdo sxb!");
  if (!quantity || Number(quantity) <= 0) throw new Error("Fadlan geli tirada saxda ah sxb!");

  return await runTransaction(db, async (transaction) => {
    const stockInDocRef = doc(db, "stock_in", stockItemId);
    const stockInSnap = await transaction.get(stockInDocRef);

    if (!stockInSnap.exists()) {
      throw new Error("Alaabta aad dooratay kama jiro kaydka sxb!");
    }

    const stockInData = stockInSnap.data();
    let currentStockQty = 0;
    let selectedItemName = "Unknown Item";
    let updatedItems = [];

    if (stockInData.items && Array.isArray(stockInData.items) && stockInData.items.length > 0) {
      updatedItems = [...stockInData.items];
      
      const itemIndex = updatedItems.findIndex(
        (item) => String(item.itemId || item.id) === String(subItemId)
      );

      if (itemIndex === -1) {
        throw new Error("Shayga aad dooratay lagama helin invoice-kan sxb!");
      }

      currentStockQty = Number(updatedItems[itemIndex].quantity ?? updatedItems[itemIndex].qty ?? 0);
      selectedItemName = updatedItems[itemIndex].itemName || updatedItems[itemIndex].name || "Unknown Item";

      const adjustQty = Number(quantity);
      let newQuantity = currentStockQty;

      if (adjustmentType === "Addition") {
        newQuantity = currentStockQty + adjustQty;
      } else if (adjustmentType === "Deduction") {
        if (currentStockQty < adjustQty) {
          throw new Error(`Ma dhimi kartid (${adjustQty}) sxb! Kaydka hadda yaal waa (${currentStockQty}).`);
        }
        newQuantity = currentStockQty - adjustQty;
      } else {
        throw new Error("Nooc adjustment oo aan la aqoon!");
      }

      if (updatedItems[itemIndex].quantity !== undefined) {
        updatedItems[itemIndex].quantity = newQuantity;
      } else {
        updatedItems[itemIndex].qty = newQuantity;
      }

      transaction.update(stockInDocRef, { items: updatedItems });

      const newAdjustmentRef = doc(collection(db, "stock_adjustments"));
      transaction.set(newAdjustmentRef, {
        stockItemId,
        subItemId,
        itemName: selectedItemName,
        invoiceNumber: stockInData.invoiceNumber || "N/A",
        // 🌟 HUBINTA WAREHOUSE: Waxay mudnaanta siinaysaa foomka, kadib xogta DB, ugu dambayn "Main Warehouse"
        warehouseName: warehouseName || stockInData.warehouseName || stockInData.warehouse || stockInData.warehouseId || "Main Warehouse",
        adjustmentType,
        quantityChanged: adjustQty,
        oldQuantity: currentStockQty,
        newQuantity: newQuantity,
        notes: notes || "",
        createdAt: new Date().toISOString()
      });

    } else {
      throw new Error("Invoice-ka la doortay kuma jiraan wax alaab ah sxb!");
    }
  });
};