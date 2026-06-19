import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  runTransaction,
  serverTimestamp 
} from "firebase/firestore";

const projectCollection = collection(db, "projects");

// =================================================================
// 1. READ PROJECTS (Kani ayaa maqnaa sxb oo error-ka bixinayay!)
// =================================================================
export const getProjects = async () => {
  try {
    const snapshot = await getDocs(projectCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }
};

// =================================================================
// 2. CREATE PROJECT & TRANSACTION (Koodkii cusbaa ee maaliyadda)
// =================================================================
export const createProject = async (projectData) => {
  const numericAmount = parseFloat(projectData.totalValue || 0); 

  return await runTransaction(db, async (transaction) => {
    
    // --- SECTION 1: READS FIRST ---
    const assetAccRef = doc(db, "chart_of_accounts", projectData.assetAccountId);
    const expenseAccRef = doc(db, "chart_of_accounts", projectData.expenseAccountId);
    
    const [assetSnap, expenseSnap] = await Promise.all([
      transaction.get(assetAccRef),
      transaction.get(expenseAccRef)
    ]);

    if (!assetSnap.exists() || !expenseSnap.exists()) {
      throw new Error("Asset account ama Expense account aad dooratay midna lagama helin nidaamka!");
    }

    const readsMap = {};
    for (const a of projectData.allocations) {
      if (a.stockInDocId && !readsMap[a.stockInDocId]) {
        const stockInRef = doc(db, "stock_in", a.stockInDocId);
        const stockInDoc = await transaction.get(stockInRef);
        if (stockInDoc.exists()) {
          readsMap[a.stockInDocId] = {
            ref: stockInRef,
            data: stockInDoc.data()
          };
        }
      }
    }

    // --- SECTION 2: WRITES LATER ---
    transaction.update(assetAccRef, { 
      balance: parseFloat(assetSnap.data().balance || 0) - numericAmount 
    });
    transaction.update(expenseAccRef, { 
      balance: parseFloat(expenseSnap.data().balance || 0) + numericAmount 
    });

    const remainingDeductions = {};
    projectData.allocations.forEach(a => {
      remainingDeductions[a.itemId] = (remainingDeductions[a.itemId] || 0) + Number(a.qty);
    });

    for (const docId in readsMap) {
      const cachedDoc = readsMap[docId];
      let currentItems = cachedDoc.data.items || [];
      
      const updatedItems = currentItems.map(item => {
        const neededDeduction = remainingDeductions[item.itemId] || 0;
        if (neededDeduction > 0) {
          const currentQty = Number(item.quantity || item.qty || 0);
          const deduction = Math.min(currentQty, neededDeduction);
          
          remainingDeductions[item.itemId] -= deduction;
          
          return {
            ...item,
            quantity: currentQty - deduction
          };
        }
        return item;
      });

      transaction.update(cachedDoc.ref, {
        items: updatedItems,
        lastUpdated: serverTimestamp()
      });
    }

    const projectRef = doc(collection(db, "projects"));
    const jeDocRef = doc(collection(db, "journal_entries"));

    const journalEntryData = {
      referenceId: projectRef.id,
      description: `Distribution for Project: ${projectData.name}`,
      month: projectData.month || "June 2026",
      date: serverTimestamp(),
      type: "PROJECT_DISTRIBUTION",
      entries: [
        { accountId: projectData.expenseAccountId, accountName: expenseSnap.data().accountName, debit: numericAmount, credit: 0 },
        { accountId: projectData.assetAccountId, accountName: assetSnap.data().accountName, debit: 0, credit: numericAmount }
      ]
    };
    transaction.set(jeDocRef, journalEntryData);

    transaction.set(projectRef, {
      name: projectData.name,
      grantId: projectData.grantId,
      grantName: projectData.grantName,
      poId: projectData.poId,
      assetAccountId: projectData.assetAccountId,
      expenseAccountId: projectData.expenseAccountId,
      assetAccountName: assetSnap.data().accountName,
      expenseAccountName: expenseSnap.data().accountName,
      journalEntryId: jeDocRef.id,
      allocations: projectData.allocations,
      totalValue: numericAmount,
      createdAt: serverTimestamp()
    });

    return projectRef.id;
  });
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