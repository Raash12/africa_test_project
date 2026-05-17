import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

import Login from "@/auth/Login";
import DashboardLayout from "@/layouts/DashboardLayout";

// PAGES
import DashboardHome from "@/pages/DashboardHome";
import EmployeesList from "@/pages/employees/EmployeesList";
import ItemsPage from "@/pages/item/Items"; 
import UsersList from "@/pages/users/UsersList";
import CreateUser from "@/pages/users/CreateUser";
import UserRoles from "@/pages/users/UserRoles";
import Programs from "@/pages/program/ListProgram"; // 🌟 Lagu daray halkan Program Category Setup
import Donors from "@/pages/donors/ListDonor";
import Grants from "@/pages/grants/ListGrant"; 
import Projects from "@/pages/projects/ListProject";
import Beneficiaries from "@/pages/beneficiaries/ListBeneficiary"; 

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

        {/* PROGRAMS, DONORS, GRANTS, PROJECTS, BENEFICIARIES & ITEMS */}
        <Route path="programs" element={<Programs />} /> {/* 🌟 Route-ka cusub ee Program halkan ayuu fariisay */}
        <Route path="donors" element={<Donors />} />
        <Route path="grants" element={<Grants />} /> 
        <Route path="projects" element={<Projects />} />
        <Route path="beneficiaries" element={<Beneficiaries />} /> 
        <Route path="items" element={<ItemsPage />} />
      </Route>

      {/* Haddii uu qofku qoro URL khaldan, si toos ah ugu celi guriga */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}