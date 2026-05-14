import React from "react";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

import Login from "@/auth/Login";
import DashboardLayout from "@/layouts/DashboardLayout";

// PAGES
import DashboardHome from "@/pages/DashboardHome";
import EmployeesPage from "@/pages/employees/EmployeesPage";
import ItemsPage from "@/pages/item/Items"; // Fixed casing: itemspage -> ItemsPage
import UsersList from "@/pages/users/UsersList";
import CreateUser from "@/pages/users/CreateUser";
import UserRoles from "@/pages/users/UserRoles";
import Donors from "@/pages/donors/Donors";
import Projects from "@/pages/projects/Projects";

export default function App() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Loading AIF ERP...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* LOGIN ROUTE */}
      <Route path="/login" element={<Login />} />

      {/* PROTECTED ERP ROUTES */}
      <Route
        path="/"
        element={currentUser ? <DashboardLayout /> : <Login />}
      >
        {/* DASHBOARD HOME */}
        <Route index element={<DashboardHome />} />

        {/* EMPLOYEES */}
        <Route path="employees" element={<EmployeesPage />} />

        {/* USERS & ROLES */}
        <Route path="users" element={<UsersList />} />
        <Route path="users/create" element={<CreateUser />} />
        <Route path="roles" element={<UserRoles />} />

        {/* DONORS, PROJECTS, & ITEMS */}
        {/* Note: Removed leading slashes as these are child routes of "/" */}
        <Route path="donors" element={<Donors />} />
        <Route path="projects" element={<Projects />} />
        <Route path="items" element={<ItemsPage />} />
      </Route>
    </Routes>
  );
}