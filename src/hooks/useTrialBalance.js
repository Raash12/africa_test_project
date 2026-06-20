// src/hooks/useTrialBalance.js
import { useState, useEffect, useMemo } from "react";
import { fetchTrialBalanceRawData } from "@/services/FinancialReport/TrialBalanceService";

export default function useTrialBalance() {
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrialBalanceRawData()
      .then(data => {
        setRawData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);

  const trialBalanceData = useMemo(() => {
    if (!rawData) return [];

    const { accounts, payments, grants, purchaseInvoices, projects } = rawData;

    // 1. Samee khariidada akoonada (Account Map)
    const accountMap = accounts.reduce((acc, curr) => {
      const accId = curr.id || curr.docId;
      if (accId) {
        const oBalance = Number(curr.openingBalance ?? curr.balance ?? 0);
        acc[accId] = {
          id: accId,
          name: curr.accountName || curr.name || "Unnamed Account",
          code: curr.accountCode || "",
          accountType: curr.accountType || "Assets",
          normalBalance: curr.normalBalance || "Debit",
          debit: curr.normalBalance === "Debit" ? oBalance : 0,
          credit: curr.normalBalance === "Credit" ? oBalance : 0,
        };
      }
      return acc;
    }, {});

    // 2. Xisaabi Payments
    payments.forEach(p => {
      const amt = Number(p.amount ?? p.amountPaid ?? 0);
      if (amt <= 0) return;

      const targetDebAccId = p.chargedToAccountId || p.expenseAccountId;
      const targetCredAccId = p.paidFromAccountId || p.fromAccountId;

      if (targetDebAccId && accountMap[targetDebAccId]) {
        accountMap[targetDebAccId].debit += amt;
      }
      if (targetCredAccId && accountMap[targetCredAccId]) {
        accountMap[targetCredAccId].credit += amt;
      }
    });

    // 3. Xisaabi Grants
    grants.forEach(g => {
      const amt = Number(g.amount || 0);
      if (amt <= 0) return;

      const recAccId = g.receivingAccountId;
      const revAccId = g.revenueAccountId;

      if (recAccId && accountMap[recAccId]) accountMap[recAccId].debit += amt;
      if (revAccId && accountMap[revAccId]) accountMap[revAccId].credit += amt;
    });

    // 4. Xisaabi Purchase Invoices
    purchaseInvoices.forEach(inv => {
      const amt = Number(inv.totalAmount || 0);
      if (amt <= 0) return;

      if (inv.inventoryAccountId && accountMap[inv.inventoryAccountId]) {
        accountMap[inv.inventoryAccountId].debit += amt;
      }
      if (inv.liabilityAccountId && accountMap[inv.liabilityAccountId]) {
        accountMap[inv.liabilityAccountId].credit += amt;
      }
    });

    // 5. Xisaabi Projects
    projects.forEach(proj => {
      const amt = Number(proj.totalValue || 0);
      if (amt <= 0) return;

      if (proj.expenseAccountId && accountMap[proj.expenseAccountId]) {
        accountMap[proj.expenseAccountId].debit += amt;
      }
      if (proj.assetAccountId && accountMap[proj.assetAccountId]) {
        accountMap[proj.assetAccountId].credit += amt;
      }
    });

    // 6. U badal Array oo xisaabi dhamaadka (Net Debit/Credit) hadba normal balance-ka
    return Object.values(accountMap).map(acc => {
      let finalDebit = 0;
      let finalCredit = 0;

      if (acc.normalBalance === "Debit") {
        const net = acc.debit - acc.credit;
        if (net >= 0) finalDebit = net;
        else finalCredit = Math.abs(net);
      } else {
        const net = acc.credit - acc.debit;
        if (net >= 0) finalCredit = net;
        else finalDebit = Math.abs(net);
      }

      return {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        accountType: acc.accountType,
        debit: finalDebit,
        credit: finalCredit
      };
    }).filter(acc => acc.debit > 0 || acc.credit > 0); // Kaliya soo saar kuwa hanti hayo

  }, [rawData]);

  return { trialBalanceData, loading, error };
}