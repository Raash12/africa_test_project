import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function RoleProtectedRoute({ children, allowedRoles = [] }) {
  const { currentUser, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // 🔥 SAFE CHECK (IMPORTANT FIX)
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}