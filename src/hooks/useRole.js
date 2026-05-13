import { useAuth } from "@/context/AuthContext";

export default function useRole() {
  const { role } = useAuth();

  return {
    role,
    isAdmin: role === "Admin",
    isHR: role === "HR",
    isAccountant: role === "Accountant",
  };
}