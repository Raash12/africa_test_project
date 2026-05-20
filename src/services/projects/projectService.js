import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  runTransaction 
} from "firebase/firestore";

const projectCollection = collection(db, "projects");

// =================================================================
// 1. CREATE PROJECT & DEDUCT INVENTORY (TRANSACTION WITH ARRAY/DIRECT SUPPORT)
// =================================================================
export const createProject = async (projectData) => {
  // Haddii foomka aan laga dooran wax kayd ah (Stock Item) ama uu yahay "none"
  if (!projectData.stockItemId || projectData.stockItemId === "none") {
    const cleanedData = { ...projectData };
    // Ka saar field-yada stock-ka haddii aan waxba la dooran
    delete cleanedData.stockItemId;
    delete cleanedData.stockItemName;
    return await addDoc(projectCollection, cleanedData);
  }

  // Waxaan bilaabaynaa Transaction si labada dhinacba hal mar u wada fulaan
  return await runTransaction(db, async (transaction) => {
    // 1. Hel xogta rasmiga ah ee alaabta kaydka taal (Stock In)
    const stockInDocRef = doc(db, "stock_in", projectData.stockItemId);
    const stockInSnap = await transaction.get(stockInDocRef);

    if (!stockInSnap.exists()) {
      throw new Error("Alaabta aad dooratay kama jiro kaydka (Stock In) sxb!");
    }

    const stockInData = stockInSnap.data();
    
    // 🛠️ DIB U HAGAAJIN: Hubi haddii tiradu ay ku dhex jirto array (items) ama ay toos u taalo
    let rawQty = 0;
    let isNestedArray = false;

    if (stockInData.items && Array.isArray(stockInData.items) && stockInData.items.length > 0) {
      rawQty = stockInData.items[0].quantity ?? stockInData.items[0].qty ?? 0;
      isNestedArray = true;
    } else {
      rawQty = stockInData.quantity ?? stockInData.qty ?? 0;
    }

    const currentStockQty = Number(rawQty);
    const projectNeededQty = Number(projectData.quantity || 0);

    // Badbaado: Hubi in kayd ku filan uu jiro
    if (currentStockQty < projectNeededQty) {
      throw new Error(`Kaydka ku haray waa kaliya (${currentStockQty}). Kuma filna mashruuca sxb!`);
    }

    // 2. Goami inta dhimanaysa
    const newQuantity = currentStockQty - projectNeededQty;
    
    // Haddii ay eber noqoto, status-ka wuxuu isu beddelayaa "Stock Out"
    const newStatus = newQuantity <= 0 ? "Stock Out" : "Stock In";

    // 3. Cusbooneysii dukumeentiga Stock In-ka ah (Dhimis + Status beddel)
    if (isNestedArray) {
      // Haddii xogtu array ku dhex jirtay, koobi garee array-ga oo gudaha ka beddel tirada
      const updatedItems = [...stockInData.items];
      if (updatedItems[0].quantity !== undefined) updatedItems[0].quantity = newQuantity;
      if (updatedItems[0].qty !== undefined) updatedItems[0].qty = newQuantity;
      
      transaction.update(stockInDocRef, {
        items: updatedItems,
        status: newStatus
      });
    } else {
      // Haddii ay toos u taallay xogtu, si caadi ah u update garee
      transaction.update(stockInDocRef, {
        quantity: newQuantity,
        status: newStatus
      });
    }

    // 4. Kaydi Mashruuca cusub oo ay la socoto xogtii kaydka laga jaray
    const newProjectRef = doc(collection(db, "projects"));
    transaction.set(newProjectRef, {
      ...projectData,
      createdAt: new Date().toISOString()
    });

    return newProjectRef;
  });
};

// =================================================================
// 2. READ PROJECTS
// =================================================================
export const getProjects = async () => {
  const snapshot = await getDocs(projectCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// =================================================================
// 3. UPDATE PROJECT
// =================================================================
export const updateProject = (id, data) => {
  return updateDoc(doc(db, "projects", id), data);
};

// =================================================================
// 4. DELETE PROJECT
// =================================================================
export const deleteProject = (id) => {
  return deleteDoc(doc(db, "projects", id));
};