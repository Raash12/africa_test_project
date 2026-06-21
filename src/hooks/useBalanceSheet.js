// src/hooks/useBalanceSheet.js
import { useMemo } from "react";
import useAccounts from "@/hooks/useAccounts";
import usePaymentEntry from "@/hooks/usePaymentEntry";
import useGrants from "@/hooks/useGrants";
import usePurchaseInvoices from "@/hooks/usePurchaseInvoices";
import useProjects from "@/hooks/useProjects";

export default function useBalanceSheet() {
  const { accounts = [], loading: l1 } = useAccounts() || {};
  const { payments = [], loading: l2 } = usePaymentEntry() || {};
  const { grants = [], loading: l3 } = useGrants() || {};
  const { purchaseInvoices = [], loading: l4 } = usePurchaseInvoices() || {};
  const { projects = [], loading: l5 } = useProjects() || {};

  const loading = l1 || l2 || l3 || l4 || l5;

  const balanceSheetData = useMemo(() => {
    // 1. Samee khariidadda xisaabaadka (Account Map)
    const accountMap = accounts.reduce((acc, curr) => {
      const accId = curr.id || curr.docId;
      if (accId) {
        acc[accId] = {
          id: accId,
          name: curr.accountName || curr.name || "Unnamed Account",
          normalBalance: curr.normalBalance || "Debit",
          accountType: curr.accountType || curr.classificationGroup || "Assets",
          balance: Number(curr.openingBalance ?? curr.balance ?? 0),
        };
      }
      return acc;
    }, {});

    // 2. Ku dar xogtii dhabta ahayd ee ka dhalatay Payments (Kharashyada & Bankiga)
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

    // 3. Ku dar xogta Deeqaha (Grants)
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
        else accountMap[revId].balance -= amt;
      }
    });

    // 4. Ku dar xogta Invoices-ka (Purchase Invoices)
    purchaseInvoices.forEach((inv) => {
      const amt = Number(inv.totalAmount || 0);
      if (amt <= 0) return;

      if (accountMap[inv.inventoryAccountId]) {
        accountMap[inv.inventoryAccountId].balance += amt;
      }
      if (accountMap[inv.liabilityAccountId]) {
        accountMap[inv.liabilityAccountId].balance += amt;
      }
    });

    // 5. Ku dar xogta Mashaariicda (Projects)
    projects.forEach((proj) => {
      const amt = Number(proj.totalValue || 0);
      if (amt <= 0) return;

      if (accountMap[proj.expenseAccountId]) {
        accountMap[proj.expenseAccountId].balance += amt;
      }
      if (accountMap[proj.assetAccountId]) {
        accountMap[proj.assetAccountId].balance -= amt;
      }
    });

    // 6. Kala sooc qaybaha Balance Sheet-ka (Assets, Liabilities, Equity)
    const assetsList = [];
    const liabilitiesList = [];
    const equityList = [];

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    Object.values(accountMap).forEach((acc) => {
      const type = acc.accountType.toLowerCase();
      
      if (type === "assets" || type === "asset") {
        assetsList.push({ name: acc.name, amount: acc.balance });
        totalAssets += acc.balance;
      } else if (type === "liabilities" || type === "liability") {
        liabilitiesList.push({ name: acc.name, amount: acc.balance });
        totalLiabilities += acc.balance;
      } else if (type === "equity") {
        equityList.push({ name: acc.name, amount: acc.balance });
        totalEquity += acc.balance;
      }
    });

    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
    const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01;

    return {
      assetsList,
      liabilitiesList,
      equityList,
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalLiabilitiesAndEquity,
      isBalanced,
    };
  }, [accounts, payments, grants, purchaseInvoices, projects]);

  return { ...balanceSheetData, loading };
}