import { useState, useEffect } from "react";
import { 
  getEmployeesService, 
  createEmployeeService, 
  updateEmployeeService, 
  deleteEmployeeService 
} from "@/services/employees/employeeService";

export function useEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Soo aqriska shaqaalaha
  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await getEmployeesService();
      setEmployees(data || []);
    } catch (error) {
      console.error("Error loading employees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  // Isku duba ridka shaqooyinka kale (CRUD)
  const addEmployee = async (data) => {
    await createEmployeeService(data);
    await loadEmployees(); // Markuu dhamaystiro dib ayuu u soo cusboonaysiinayaa list-ka
  };

  const editEmployee = async (id, data) => {
    await updateEmployeeService(id, data);
    await loadEmployees();
  };

  const removeEmployee = async (id) => {
    await deleteEmployeeService(id);
    await loadEmployees();
  };

  return {
    employees,
    loading,
    addEmployee,
    editEmployee,
    removeEmployee,
    refresh: loadEmployees
  };
}