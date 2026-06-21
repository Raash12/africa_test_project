// src/hooks/useIncomeStatement.js
import { useState, useEffect, useMemo } from "react";
import { fetchIncomeStatementRawData } from "@/services/FinancialReport/IncomeStatementService";

export default function useIncomeStatement() {
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchIncomeStatementRawData()
      .then(data => {
        setRawData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);

  const incomeStatementData = useMemo(() => {
    if (!rawData) return { revenueList: [], expenseList: [], totalRevenue: 0, totalExpense: 0, netIncome: 0 };

    const { accounts, payments, grants, projects } = rawData;

    // A. Samee khariidada akoonada (Account Map)
    const accountMap = accounts.reduce((acc, curr) => {
      const accId = curr.id || curr.docId;
      if (accId) {
        const rawCategory = curr.accountType || curr.category || "Assets";
        let standardizedType = "Assets";

        if (/asset/i.test(rawCategory)) standardizedType = "Assets";
        else if (/liabilit/i.test(rawCategory)) standardizedType = "Liabilities";
        else if (/equity/i.test(rawCategory)) standardizedType = "Equity";
        else if (/revenue/i.test(rawCategory)) standardizedType = "Revenue";
        else if (/expense/i.test(rawCategory)) standardizedType = "Expenses";

        acc[accId] = {
          code: curr.accountCode || curr.code || "-",
          name: curr.accountName || curr.name || "Unnamed Account",
          accountType: standardizedType,
        };
      }
      return acc;
    }, {});

    const revenueBalances = {};
    const expenseBalances = {};

    // B. Xisaabi Dakhliga (Grants -> Revenue)
    grants.forEach(g => {
      const amt = Number(g.amount || 0);
      if (amt <= 0) return;
      const revId = g.revenueAccountId;
      if (revId && accountMap[revId]) {
        const accName = accountMap[revId].name;
        revenueBalances[accName] = (revenueBalances[accName] || 0) + amt;
      }
    });

    // C. Xisaabi Kharashyada Payments (Payments -> Expense)
    payments.forEach(p => {
      const amt = Number(p.amount ?? p.amountPaid ?? 0);
      if (amt <= 0) return;
      const debId = p.chargedToAccountId || p.expenseAccountId;
      if (debId && accountMap[debId]) {
        const accName = accountMap[debId].name;
        expenseBalances[accName] = (expenseBalances[accName] || 0) + amt;
      }
    });

    // D. Xisaabi Kharashyada Mashaariicda (Projects -> Expense)
    projects.forEach(proj => {
      const projectExpenseAmt = Number(proj.budgetUsed || proj.totalValue || 0);
      if (projectExpenseAmt <= 0) return;
      const expAccId = proj.expenseAccountId;
      if (expAccId && accountMap[expAccId]) {
        const accName = accountMap[expAccId].name;
        expenseBalances[accName] = (expenseBalances[accName] || 0) + projectExpenseAmt;
      }
    });

    // E. U kala beddel qaab Array ah
    const revenueList = Object.keys(revenueBalances).map(name => ({ name, amount: revenueBalances[name] }));
    const expenseList = Object.keys(expenseBalances).map(name => ({ name, amount: expenseBalances[name] }));

    const totalRevenue = revenueList.reduce((sum, item) => sum + item.amount, 0);
    const totalExpense = expenseList.reduce((sum, item) => sum + item.amount, 0);
    const netIncome = totalRevenue - totalExpense;

    return { revenueList, expenseList, totalRevenue, totalExpense, netIncome };

  }, [rawData]);

  return { ...incomeStatementData, loading, error };
}