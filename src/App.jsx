import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react"; // 🌟 Waxaan keenay spinner

import Login from "@/auth/Login";
import DashboardLayout from "@/layouts/DashboardLayout";

// PAGES
import DashboardHome from "@/pages/DashboardHome";
import EmployeesList from "@/pages/employees/EmployeesList";
import ItemsPage from "@/pages/Item/ListItem";
import UsersList from "@/pages/users/UsersList";
import CreateUser from "@/pages/users/CreateUser";
import UserRoles from "@/pages/users/UserRoles";
import Programs from "@/pages/program/ListProgram";
import Donors from "@/pages/donors/ListDonor";
import Grants from "@/pages/grants/ListGrant"; 
import Projects from "@/pages/projects/ListProject";
import Beneficiaries from "@/pages/beneficiaries/ListBeneficiary"; 
import ListSupplier from "@/pages/Suppliers/ListSupplier";
import ListPurchaseOrder from "@/pages/Purchase/PurchaseOrder/ListPurchaseOrder";
import ListPurchaseInvoice from "./pages/Purchase/PurchaseInvoice/ListPurchaseInvoice";
import ListPaymentEntry from "./pages/Payment/ListPaymentEntry";
import ListWarehouse from "./pages/Inventory/ListWarehouse";
import ListStockIn from "./pages/Inventory/ListStockIn";
import ListStockOut from "./pages/Inventory/ListStockOut";
import ListFiscalYear from "./pages/Accounting/ListFiscalYear";
import ListAccounts from "./pages/Accounting/ListAccounts";
import ListFinanceBook from "./pages/Accounting/ListFinanceBook";
import ListJournalEntries from "./pages/Accounting/ListJournalEntries";
import ListGeneralLedger from "./pages/Accounting/ListGeneralLedger";
import ListSalaryExpense from "./pages/payroll/ListSalaryExpense";
import SalaryForm from "./pages/payroll/SalaryForm";
import ListGeneralExpense from "./pages/payroll/ListGeneralExpense";
import GeneralExpenseForm from "./pages/payroll/GeneralExpenseForm";

// TRIAL BALANCE & INCOME STATEMENT IMPORTS
import TrialBalance from "@/pages/FinancialReport/TrialBalance";
import IncomeStatement from "@/pages/FinancialReport/IncomeStatement"; 
import BalanceSheet from "@/pages/FinancialReport/BalanceSheet";
import CashFlowStatement from "@/pages/FinancialReport/CashFlowStatement";

// REPORTS
import GrantReport from "@/pages/reports/GrantReport";
import ProjectReport from "@/pages/reports/ProjectReport";

// 🔐 PROTECTED ROUTE: Waxay hortaagan tahay boggaga xasaasiga ah inta loading-ku jiro
function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth(); // 🌟 Hubi in loading uu ku jiro AuthContext-kaaga

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-[#1e3a8a] dark:text-blue-500" size={40} />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  const { currentUser, loading } = useAuth(); // 🌟 Dib u soo celi loading-kii halkan

  // 🌟 Halkan haddii bogga la refresh gareeyo, loogin u carari mayo, meeshaan ayuu ku hakanayaa
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-[#1e3a8a] dark:text-blue-500" size={40} />
      </div>
    );
  }

  return (
    <Routes>
      {/* LOGIN ROUTE */}
      <Route 
        path="/login" 
        element={currentUser ? <Navigate to="/" replace /> : <Login />} 
      />

      <Route
        path="/"
        element = {
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />

        {/* EMPLOYEES */}
        <Route path="employees" element={<EmployeesList />} />

        {/* USERS & ROLES */}
        <Route path="users" element={<UsersList />} />
        <Route path="users/create" element={<CreateUser />} />
        <Route path="roles" element={<UserRoles />} />

        {/* LOGISTICS, PROGRAMS, DONORS, GRANTS, PROJECTS, BENEFICIARIES & ITEMS */}
        <Route path="programs" element={<Programs />} />
        <Route path="donors" element={<Donors />} />
        <Route path="grants" element={<Grants />} /> 
        <Route path="projects" element={<Projects />} />
        <Route path="beneficiaries" element={<Beneficiaries />} /> 
        
        <Route path="items" element={<ItemsPage />} />
        <Route path="suppliers" element={<ListSupplier />} />
        <Route path="purchase-orders" element={<ListPurchaseOrder />} /> 
        <Route path="purchase-invoices" element={<ListPurchaseInvoice />} />
        <Route path="payment-entries" element={<ListPaymentEntry />} />
        <Route path="warehouses" element={<ListWarehouse />} />
        <Route path="stock-in" element={<ListStockIn />} />
        <Route path="stock-out" element={<ListStockOut />} />
        <Route path="fiscal-years" element={<ListFiscalYear />} />
        <Route path="chart-of-accounts" element={<ListAccounts />} />
        <Route path="finance-books" element={<ListFinanceBook />} />
        <Route path="journal-entries" element={<ListJournalEntries />} />
        <Route path="general-ledger" element={<ListGeneralLedger />} />
        
        {/* FINANCIAL REPORTS */}
        <Route path="reports/trial-balance" element={<TrialBalance />} />
        <Route path="reports/income-statement" element={<IncomeStatement />} /> 
        <Route path="reports/balance-sheet" element={<BalanceSheet />} />
        <Route path="reports/cash-flow" element={<CashFlowStatement />} />
        
        {/* PAYROLL */}
        <Route path="salary-expenses" element={<ListSalaryExpense />} />
        <Route path="salary-form" element={<SalaryForm />} />
        <Route path="general-expenses" element={<ListGeneralExpense />} />
        <Route path="general-expense-form" element={<GeneralExpenseForm />} />
        
        {/* REPORTS ROUTES */}
        <Route path="reports/grants" element={<GrantReport />} />
        <Route path="reports/projects" element={<ProjectReport />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}