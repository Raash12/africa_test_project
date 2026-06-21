import { useMemo } from "react";
import useAccounts from "@/hooks/useAccounts";
import usePaymentEntry from "@/hooks/usePaymentEntry";
import useGrants from "@/hooks/useGrants";
import usePurchaseInvoices from "@/hooks/usePurchaseInvoices";
import useProjects from "@/hooks/useProjects";

export default function useCashFlow() {
  const { accounts = [], loading: l1 } = useAccounts() || {};
  const { payments = [], loading: l2 } = usePaymentEntry() || {};
  const { grants = [], loading: l3 } = useGrants() || {};
  const { purchaseInvoices = [], loading: l4 } = usePurchaseInvoices() || {};
  const { projects = [], loading: l5 } = useProjects() || {};

  const loading = l1 || l2 || l3 || l4 || l5;

  const cashFlowCalculations = useMemo(() => {
    // 1. Samee khariidadda xisaabaadka
    const accountMap = accounts.reduce((acc, curr) => {
      const accId = curr.id || curr.docId;
      if (accId) {
        const group = String(curr.classificationGroup || curr.accountType || "Assets").trim().toUpperCase();
        const baseBalance = Number(curr.openingBalance !== undefined ? curr.openingBalance : (curr.balance ?? 0));

        acc[accId] = {
          id: accId,
          name: curr.accountName || curr.name || "Unnamed Account",
          normalBalance: curr.normalBalance || (["ASSETS", "EXPENSES", "EXPENSE"].includes(group) ? "Debit" : "Credit"),
          accountType: group,
          openingBalance: baseBalance, 
          balance: baseBalance,        
        };
      }
      return acc;
    }, {});

    // 2. Xisaabi Opening Cash
    let openingCash = Object.values(accountMap).reduce((sum, acc) => {
      const name = acc.name.toLowerCase();
      const isCashOrBank = name.includes("bank") || name.includes("cash") || name.includes("zaad") || name.includes("evc") || name.includes("salam");
      if ((acc.accountType === "ASSETS" || acc.accountType === "ASSET") && isCashOrBank) {
        return sum + acc.openingBalance;
      }
      return sum;
    }, 0);

    // 3. Process Payments
    payments.forEach((p) => {
      const amt = Number(p.amount ?? p.amountPaid ?? 0);
      if (amt <= 0) return;
      const debId = p.chargedToAccountId || p.expenseAccountId;
      const credId = p.paidFromAccountId || p.fromAccountId;

      if (accountMap[debId]) {
        if (accountMap[debId].normalBalance === "Debit") accountMap[debId].balance += amt;
        else accountMap[debId].balance -= amt;
      }
      if (accountMap[credId]) {
        if (accountMap[credId].normalBalance === "Debit") accountMap[credId].balance -= amt;
        else accountMap[credId].balance += amt;
      }
    });

    // 4. Process Grants
    grants.forEach((g) => {
      const amt = Number(g.amount || 0);
      if (amt <= 0) return;
      const recId = g.receivingAccountId;
      const revId = g.revenueAccountId;

      if (accountMap[recId]) {
        if (accountMap[recId].normalBalance === "Debit") accountMap[recId].balance += amt;
        else accountMap[recId].balance -= amt;
      }
      if (accountMap[revId]) {
        if (accountMap[revId].normalBalance === "Credit") accountMap[revId].balance += amt;
        else accountMap[revId].balance += amt;
      }
    });

    // 5. Process Purchase Invoices
    purchaseInvoices.forEach((inv) => {
      const amt = Number(inv.totalAmount || 0);
      if (amt <= 0) return;

      if (accountMap[inv.inventoryAccountId]) {
        if (accountMap[inv.inventoryAccountId].normalBalance === "Debit") accountMap[inv.inventoryAccountId].balance += amt;
        else accountMap[inv.inventoryAccountId].balance -= amt;
      }
      if (accountMap[inv.liabilityAccountId]) {
        if (accountMap[inv.liabilityAccountId].normalBalance === "Credit") accountMap[inv.liabilityAccountId].balance += amt;
        else accountMap[inv.liabilityAccountId].balance -= amt;
      }
    });

    // 6. Process Projects
    projects.forEach((proj) => {
      const amt = Number(proj.totalValue || 0);
      if (amt <= 0) return;

      if (accountMap[proj.expenseAccountId]) {
        if (accountMap[proj.expenseAccountId].normalBalance === "Debit") accountMap[proj.expenseAccountId].balance += amt;
        else accountMap[proj.expenseAccountId].balance -= amt;
      }
      if (accountMap[proj.assetAccountId]) {
        if (accountMap[proj.assetAccountId].normalBalance === "Debit") accountMap[proj.assetAccountId].balance -= amt;
        else accountMap[proj.assetAccountId].balance += amt;
      }
    });

    // 7. KALA SOOC ACCOUNADA CUSUB (Inflows vs Outflows)
    let totalRevenue = 0;
    let totalExpenses = 0;
    const cashInflows = [];
    const cashOutflows = [];

    Object.values(accountMap).forEach((acc) => {
      const type = acc.accountType;
      const movement = acc.balance - acc.openingBalance;

      if (type === "REVENUE" || type === "INCOME" || type === "REVENUES") {
        totalRevenue += movement;
        if (movement !== 0) {
          cashInflows.push({ name: acc.name, amount: movement });
        }
      } else if (type === "EXPENSES" || type === "EXPENSE") {
        totalExpenses += movement;
        if (movement !== 0) {
          cashOutflows.push({ name: acc.name, amount: movement });
        }
      }
    });

    const netIncome = totalRevenue - totalExpenses;

    // 8. WORKING CAPITAL CHANGES
    let changeInInventory = 0;
    let changeInLiabilities = 0;

    Object.values(accountMap).forEach((acc) => {
      const type = acc.accountType;
      const name = acc.name.toLowerCase();
      const change = acc.balance - acc.openingBalance;

      if (type === "ASSETS" || type === "ASSET") {
        const isCashOrBank = name.includes("bank") || name.includes("cash") || name.includes("zaad") || name.includes("evc") || name.includes("salam");
        if (!isCashOrBank && name.includes("inventory")) {
          changeInInventory += change; 
        }
      } else if (type === "LIABILITIES" || type === "LIABILITY") {
        changeInLiabilities += change; 
      }
    });

    const netOperatingCash = netIncome + changeInLiabilities - changeInInventory;
    const netChangeInCash = netOperatingCash; 
    const closingCash = openingCash + netChangeInCash;

    return {
      netIncome,
      changeInInventory,
      changeInLiabilities,
      openingCash,
      netChangeInCash,
      closingCash,
      cashInflows,   // Liiska dakhliga soo galay
      cashOutflows,  // Liiska kharashka baxay
    };
  }, [accounts, payments, grants, purchaseInvoices, projects]);

  return { ...cashFlowCalculations, loading };
}