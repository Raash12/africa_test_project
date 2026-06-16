import React, { useState, useMemo } from "react";
import { Search, FileSpreadsheet, Download, Loader2 } from "lucide-react";
import useGrants from "@/hooks/useGrants";
import usePaymentEntry from "@/hooks/usePaymentEntry";
import useAccounts from "@/hooks/useAccounts"; 
import { useSalary } from "@/hooks/useSalary";
import { useGeneralExpense } from "@/hooks/useGeneralExpense";
import { useEmployees } from "@/hooks/useEmployees"; // 🌟 Waxaan soo dhex darnay hook-gii shaqaalaha sxb

const formatCurrency = (val) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

export default function ListGeneralLedger() {
  const { accounts = [], loading: loadingAccounts } = useAccounts() || {};
  const { grants = [], loading: loadingGrants } = useGrants() || {};
  const { payments = [], loading: loadingPayments } = usePaymentEntry() || {};
  const { transactions: salaryTransactions = [], loading: loadingSalary } = useSalary() || {};
  const { transactions: generalTransactions = [], loading: loadingGeneral } = useGeneralExpense() || {};
  const { employees = [], loading: loadingEmployees } = useEmployees() || {}; // 🌟 Soo aqri live employees

  const [selectedAccountId, setSelectedAccountId] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const rowsPerPage = 10;

  // 1. Map-ka rasmiga ah ee Chart of Accounts
  const accountMap = useMemo(() => {
    return accounts.reduce((acc, curr) => {
      const accId = curr.id || curr.docId;
      if (accId) {
        acc[accId] = { 
          name: curr.accountName, 
          code: curr.accountCode || "",
          currentBalance: Number(curr.balance ?? 0),
          normalBalance: curr.normalBalance || "Debit",
          accountType: curr.accountType || "Assets"
        };
      }
      return acc;
    }, {});
  }, [accounts]);

  // 2. Map-ka rasmiga ah ee Shaqaalaha (Employee Quick Lookup)
  const employeeMap = useMemo(() => {
    return employees.reduce((acc, emp) => {
      if (emp.id) {
        // Labada qaabba u diyaarso (Haddii magacu yahay firstName/lastName ama fullName)
        const fullName = emp.fullName || `${emp.firstName || ""} ${emp.lastName || ""}`.trim();
        acc[emp.id] = fullName || "Staff Member";
      }
      return acc;
    }, {});
  }, [employees]);

  const parseDate = (dateField) => {
    if (!dateField) return new Date('2026-01-01');
    if (typeof dateField.toDate === "function") return dateField.toDate();
    if (dateField.seconds) return new Date(dateField.seconds * 1000);
    const d = new Date(dateField);
    return isNaN(d.getTime()) ? new Date('2026-01-01') : d;
  };

  const isGlobalLoading = loadingAccounts || loadingGrants || loadingPayments || loadingSalary || loadingGeneral || loadingEmployees;

  // 3. Data Engine: Isku duba-ridka Dhammaan Journal Entries-ka (Double-Entry Engine)
  const ledgerData = useMemo(() => {
    let entries = [];

    // --- A. GRANTS MAP (Income/Inflow) ---
    grants.forEach(g => {
      const amt = Number(g.amount || 0);
      if (g.receivingAccountId) {
        entries.push({
          id: `${g.id}-grant`, date: g.startDate || '2026-01-01', description: `Grant Received: ${g.grantName}`,
          counterparty: g.donorName || "-", debit: amt, credit: 0,
          accountId: g.receivingAccountId,
          accountName: accountMap[g.receivingAccountId]?.name || "Bank Account"
        });
      }
    });

    // --- B. INVOICE PAYMENTS MAP ---
    payments.forEach(p => {
      const amt = Number(p.amountPaid || p.amount || 0);
      const pDate = p.paymentDate || '2026-01-01';
      
      if (p.fromAccountId) {
        entries.push({
          id: `${p.journalEntryId}-pay-bank`, date: pDate, description: `Expense Payment: ${p.invoiceNumber || ""}`,
          counterparty: p.supplierName || "-", debit: 0, credit: amt,
          accountId: p.fromAccountId,
          accountName: accountMap[p.fromAccountId]?.name || "Bank Account"
        });
      }
      if (p.expenseAccountId) {
        entries.push({
          id: `${p.journalEntryId}-pay-exp`, date: pDate, description: `Expense Charging: ${p.invoiceNumber || ""}`,
          counterparty: p.supplierName || "-", debit: amt, credit: 0,
          accountId: p.expenseAccountId,
          accountName: accountMap[p.expenseAccountId]?.name || "Expense Account"
        });
      }
    });

    // --- C. SALARY DOUBLE ENTRY MAP (Halkan ka firi sxb) ---
    salaryTransactions.forEach(s => {
      // Hubi dhamaan field-yada xaddiga ee suurtogalka ah si aysan $20 u noqon
      const amt = Number(s.amount || s.amountPaid || s.debit || s.credit || 0);
      if (amt === 0) return;

      const sDate = s.date ? parseDate(s.date).toISOString().split('T')[0] : '2026-01-01';
      
      // Aqoonsi magaca shaqaalaha haddii uu ku jiro employeeId ama s.employeeName
      const empName = s.employeeName || employeeMap[s.employeeId] || s.staffName || "";
      const dynamicDescription = empName 
        ? `Salary Paid to: ${empName} (${s.month || 'Payroll'})` 
        : (s.description || `Salary Payment (${s.month || 'Payroll'})`);

      // 1. Dhinaca Bankiga / Cash (Credit Side -> Lacag bixinta)
      const bankId = s.accountId || s.paidFromAccountId || s.fromAccountId;
      if (bankId) {
        entries.push({
          id: `${s.id}-sal-credit`, 
          date: sDate, 
          description: dynamicDescription,
          counterparty: empName || "-", 
          debit: 0, 
          credit: amt,
          accountId: bankId,
          accountName: accountMap[bankId]?.name || "Bank Account"
        });
      }

      // 2. Dhinaca Kharashka (Debit Side -> Salaries Expense)
      // Haddii expenseAccountId uusan ku jirin s, waxaan si otomaatig ah u raadinaynaa akoonka "Salaries Expense"
      const expenseAccId = s.expenseAccountId || Object.keys(accountMap).find(id => 
        accountMap[id].name.toLowerCase().includes("salary") || 
        accountMap[id].name.toLowerCase().includes("mushaar")
      );

      if (expenseAccId) {
        entries.push({
          id: `${s.id}-sal-debit`, 
          date: sDate, 
          description: s.description || `Salary Expense Booking (${s.month || 'Payroll'})`,
          counterparty: empName || "-", 
          debit: amt, 
          credit: 0,
          accountId: expenseAccId,
          accountName: accountMap[expenseAccId]?.name || "Salaries Expense"
        });
      }
    });

    // --- D. GENERAL EXPENSES MAP ---
    generalTransactions.forEach(e => {
      const amt = Number(e.amount || 0);
      const eDate = e.date ? parseDate(e.date).toISOString().split('T')[0] : '2026-01-01';

      if (e.paidFromAccountId) {
        entries.push({
          id: `${e.id}-gen-cr`, date: eDate, description: `General Expense: ${e.description || ""}`,
          counterparty: "-", debit: 0, credit: amt,
          accountId: e.paidFromAccountId,
          accountName: accountMap[e.paidFromAccountId]?.name || "Paid From Account"
        });
      }

      if (e.chargedToAccountId) {
        entries.push({
          id: `${e.id}-gen-dr`, date: eDate, description: `Expense Debit: ${e.description || ""}`,
          counterparty: "-", debit: amt, credit: 0,
          accountId: e.chargedToAccountId,
          accountName: accountMap[e.chargedToAccountId]?.name || "Charged Expense Account"
        });
      }
    });

    // U kala horree taariikh ahaan (Newest First)
    return entries.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [grants, payments, salaryTransactions, generalTransactions, accountMap, employeeMap]);

  // 4. Calculation Engine: Live Reverse Running Balance Calculator
  const processedData = useMemo(() => {
    const runningBalances = {};
    
    accounts.forEach(acc => {
      const accId = acc.id || acc.docId;
      runningBalances[accId] = Number(acc.balance ?? 0);
    });

    // Sifee xogta UI-ga ku xiran akoonka la doorto
    let filteredEntries = ledgerData.filter(e => {
      const matchesAccount = selectedAccountId === "all" || e.accountId === selectedAccountId;
      const matchesSearch = (e.description || "").toLowerCase().includes(search.toLowerCase()) || 
                           (e.counterparty || "").toLowerCase().includes(search.toLowerCase()) ||
                           (e.accountName || "").toLowerCase().includes(search.toLowerCase());
      return matchesAccount && matchesSearch;
    });

    // Reverse reconstruction algorithm
    const calculated = filteredEntries.map((entry) => {
      const accId = entry.accountId;
      const norm = accountMap[accId]?.normalBalance || "Debit";
      
      const displayBalance = runningBalances[accId] ?? 0;

      if (norm === "Debit") {
        runningBalances[accId] -= (entry.debit - entry.credit);
      } else {
        runningBalances[accId] -= (entry.credit - entry.debit);
      }

      return {
        ...entry,
        accountRunningBalance: displayBalance,
      };
    });

    // Ku dar xariiqda Balance-ka ee "Current Account Balance" xagga hoose (oo ah halka xisaabtu ku dhamaanayso)
    if (selectedAccountId !== "all" && search === "") {
      const selectedAcc = accountMap[selectedAccountId];
      if (selectedAcc) {
        calculated.push({
          id: `open-${selectedAccountId}`,
          date: '2026-06-16',
          description: `Current Account Balance (Chart of Accounts)`,
          counterparty: '-',
          debit: 0,
          credit: 0,
          isOpening: true,
          accountId: selectedAccountId,
          accountName: selectedAcc.name,
          accountRunningBalance: selectedAcc.currentBalance
        });
      }
    }

    // Sort: Hubi in Opening Row uu had iyo jeer hoos maro marka Newest uu kor joogo
    return calculated.sort((a, b) => {
      if (a.isOpening) return 1;
      if (b.isOpening) return -1;
      return new Date(b.date) - new Date(a.date);
    });
  }, [ledgerData, selectedAccountId, search, accounts, accountMap]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return processedData.slice(start, start + rowsPerPage);
  }, [processedData, currentPage]);

  const totalPages = Math.max(Math.ceil(processedData.length / rowsPerPage), 1);

  if (isGlobalLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4 bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-[#1e3a8a]" />
        <p className="text-sm text-slate-500 animate-pulse font-medium">Syncing Ledger and Employee Databases sxb...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">General Ledger</h1>
          <p className="text-slate-500 mt-2 font-medium">Audit-Ready Financial Tracking</p>
        </div>
        <select 
          className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm outline-none cursor-pointer"
          value={selectedAccountId}
          onChange={(e) => { setSelectedAccountId(e.target.value); setCurrentPage(1); }}
        >
          <option value="all">All Accounts (Consolidated)</option>
          {accounts.map(acc => {
            const accId = acc.id || acc.docId;
            return <option key={accId} value={accId}>{acc.accountCode ? `[${acc.accountCode}] ` : ""}{acc.accountName}</option>;
          })}
        </select>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center bg-white">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" 
              placeholder="Search description, account or counterparty..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} 
            />
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-emerald-700 transition-colors">Export CSV</button>
            <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-slate-800 transition-colors">Download PDF</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-5">Date</th>
                <th className="px-8 py-5">Account</th>
                <th className="px-8 py-5">Description</th>
                <th className="px-8 py-5 text-right">Debit</th>
                <th className="px-8 py-5 text-right">Credit</th>
                <th className="px-8 py-5 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-xs font-medium text-slate-400">
                    No transactions found in the general ledger.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => (
                  <tr key={idx} className={`${row.isOpening ? 'bg-slate-50 italic font-bold text-slate-700' : 'hover:bg-slate-50'} transition-colors`}>
                    <td className="px-8 py-5 text-xs font-mono text-slate-500">{row.date}</td>
                    <td className="px-8 py-5 text-xs font-bold text-slate-900">{row.accountName}</td>
                    <td className="px-8 py-5 text-sm font-semibold text-slate-900">{row.description}</td>
                    <td className="px-8 py-5 text-right text-emerald-600 font-bold tabular-nums">
                      {row.debit > 0 ? formatCurrency(row.debit) : "-"}
                    </td>
                    <td className="px-8 py-5 text-right text-red-600 font-bold tabular-nums">
                      {row.credit > 0 ? formatCurrency(row.credit) : "-"}
                    </td>
                    <td className="px-8 py-5 text-right font-black text-slate-900 tabular-nums">
                      {formatCurrency(row.accountRunningBalance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {processedData.length > rowsPerPage && (
          <div className="p-4 bg-slate-50 border-t flex justify-between items-center text-xs font-semibold text-slate-500">
            <div>
              Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, processedData.length)} of {processedData.length} entries
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-md shadow-sm disabled:opacity-50 text-slate-700 cursor-pointer"
              >
                Previous
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-md shadow-sm disabled:opacity-50 text-slate-700 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}