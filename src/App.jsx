import React from "react";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

import Login from "@/auth/Login";
import DashboardLayout from "@/layouts/DashboardLayout";

// PAGES
import DashboardHome from "@/pages/DashboardHome";

import EmployeesPage from "@/pages/employees/EmployeesPage";

import UsersList from "@/pages/users/UsersList";
import CreateUser from "@/pages/users/CreateUser";
import UserRoles from "@/pages/users/UserRoles";

export default function App() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading ERP...
      </div>
    );
  }

  return (
    <Routes>

      {/* LOGIN */}
      <Route path="/login" element={<Login />} />

      {/* PROTECTED ERP */}
      <Route
        path="/"
        element={currentUser ? <DashboardLayout /> : <Login />}
      >
        {/* DASHBOARD */}
        <Route index element={<DashboardHome />} />

        {/* EMPLOYEES */}
        <Route path="employees" element={<EmployeesPage />} />
       

        {/* USERS */}
        <Route path="users" element={<UsersList />} />
        <Route path="users/create" element={<CreateUser />} />
        <Route path="roles" element={<UserRoles />} />
      </Route>

    </Routes>
  );
}