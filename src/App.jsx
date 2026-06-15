import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

import Login from "@/auth/Login";
import DashboardLayout from "@/layouts/DashboardLayout";

// PAGES
import DashboardHome from "@/pages/DashboardHome";
import EmployeesList from "@/pages/employees/EmployeesList";
import ItemsPage from "@/pages/Item/ListItem"; // 🌟 UPDATED: Wuxuu hadda si toos ah u akhrinayaa ListItem.jsx
import UsersList from "@/pages/users/UsersList";
import CreateUser from "@/pages/users/CreateUser";
import UserRoles from "@/pages/users/UserRoles";
import Programs from "@/pages/program/ListProgram"; // 🌟 Program Category Setup
import Donors from "@/pages/donors/ListDonor";
import Grants from "@/pages/grants/ListGrant"; 
import Projects from "@/pages/projects/ListProject";
import Beneficiaries from "@/pages/beneficiaries/ListBeneficiary"; 
import ListSupplier from "@/pages/Suppliers/ListSupplier"; // 🌟 Suppliers Module path-kiisa
import ListPurchaseOrder from "@/pages/Purchase/PurchaseOrder/ListPurchaseOrder";
import ListPurchaseInvoice from "./pages/Purchase/PurchaseInvoice/ListPurchaseInvoice";
import ListPaymentEntry from "./pages/Payment/ListPaymentEntry";
import ListWarehouse from "./pages/Inventory/ListWarehouse";
import ListStockIn from "./pages/Inventory/ListStockIn";
import ListStockOut from "./pages/Inventory/ListStockOut"; // 🌟 Stock Out Module path-kiisa
import ListAdjustment from "./pages/Inventory/listAdjustment";
import ListFiscalYear from "./pages/Accounting/ListFiscalYear";
import ListAccounts from "./pages/Accounting/ListAccounts";
import ListFinanceBook from "./pages/Accounting/ListFinanceBook";
import ListJournalEntries from "./pages/Accounting/ListJournalEntries"; // 🌟 Journal Entries Module path-kiisa
// Corrected spelling
import ListGeneralLedger from "./pages/Accounting/ListGeneralLedger";
// PAYROLL PAGES
import ListSalaryExpense from "./pages/payroll/ListSalaryExpense"; // 🌟 Payroll - Salary Expense List
import SalaryForm from "./pages/payroll/SalaryForm"; // 🌟 PAYROLL - Salary Form (Kusoo daris cusub)
import ListGeneralExpense from "./pages/payroll/ListGeneralExpense"; // 🌟 Payroll - General Expense List
import GeneralExpenseForm from "./pages/payroll/GeneralExpenseForm"; // 🌟 Payroll - General Expense Form
// 🛡️ PROTECTED ROUTE COMPONENT (Wuxuu xalliyaa is-diidmada Brave iyo Chrome)
function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  // Haddii Firebase uu weli xogta baarayo, tus loading kooban oo nadiif ah
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#1e3a8a] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Connecting AIF ERP...</p>
        </div>
      </div>
    );
  }

  // Haddii aanu isticmaaruhu soo gelin (not logged in), u tuur barta Login-ka si nabad ah
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  const { currentUser, loading } = useAuth();

  // Loading-ka guud ee bilowga hore (Kaliya marka uu abka kiciyo browser-ka)
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium font-mono">Loading AIF ERP...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* LOGIN ROUTE - Haddii uu hore u guulaystay toos u gee gudaha */}
      <Route 
        path="/login" 
        element={currentUser ? <Navigate to="/" replace /> : <Login />} 
      />

      {/* 🛡️ ERP ROUTES CUSUB - Waxaa lagu hubiyay ProtectedRoute si aanay u xayirmin */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* DASHBOARD HOME */}
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
        
        {/* 🌟 INVENTORY ITEMS ROUTE */}
        <Route path="items" element={<ItemsPage />} />
        
        {/* SUPPLIERS REGISTER */}
        <Route path="suppliers" element={<ListSupplier />} />
        
        {/* PURCHASE ORDER ROUTE */}
        <Route path="purchase-orders" element={<ListPurchaseOrder />} /> 
        {/* PURCHASE INVOICE ROUTE */}
        <Route path="purchase-invoices" element={<ListPurchaseInvoice />} />
        {/* PAYMENT ENTRY ROUTE */}
        <Route path="payment-entries" element={<ListPaymentEntry />} />
        {/* WAREHOUSE ROUTE */}
        <Route path="warehouses" element={<ListWarehouse />} />
        {/* STOCK IN ROUTE */}
        <Route path="stock-in" element={<ListStockIn />} />
        {/* 🌟 STOCK OUT ROUTE */ }
        <Route path="stock-out" element={<ListStockOut />} />
        {/* ADJUSTMENT ROUTE */}
        <Route path="stock-adjustment" element={<ListAdjustment />} />
        {/* ACCOUNTING - FISCAL YEAR ROUTE */}
        <Route path="fiscal-years" element={<ListFiscalYear />} />
        {/* ACCOUNTING - CHART OF ACCOUNTS ROUTE */}
        <Route path="chart-of-accounts" element={<ListAccounts />} />
        {/* ACCOUNTING - FINANCE BOOKS ROUTE */}
        <Route path="finance-books" element={<ListFinanceBook />} />
        {/* 🌟 ACCOUNTING - JOURNAL ENTRIES ROUTE */ }
        <Route path="journal-entries" element={<ListJournalEntries />} />
        {/* 🌟 ACCOUNTING - GENERAL LEDGER ROUTE */ }
        <Route path="general-ledger" element={<ListGeneralLedger />} />
        {/* 🌟 PAYROLL - SALARY EXPENSE LIST ROUTE */ }
        <Route path="salary-expenses" element={<ListSalaryExpense />} />
        <Route path="salary-form" element={<SalaryForm />} />
        {/* 🌟 PAYROLL - GENERAL EXPENSES ROUTE */    }
        <Route path="general-expenses" element={<ListGeneralExpense />} />
        <Route path="general-expense-form" element={<GeneralExpenseForm />} />
      </Route>


      {/* Haddii uu qofku qoro URL khaldan, si toos ah ugu celi guriga */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}