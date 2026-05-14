import { useEffect, useState } from "react";
import { createEmployee, updateEmployee } from "@/services/employees/employeeService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CreateEmployee({ editData, onSuccess }) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    salary: "",
  });

  // Haddii Edit la riixo, xogta halkan ayay ku soo dhacaysaa
  useEffect(() => {
    if (editData) {
      setForm({
        fullName: editData.fullName || "",
        email: editData.email || "",
        phone: editData.phone || "",
        salary: editData.salary || "",
      });
    } else {
      setForm({ fullName: "", email: "", phone: "", salary: "" });
    }
  }, [editData]);

  const submit = async () => {
    try {
      if (!form.fullName || !form.email) return alert("Please fill required fields");

      if (editData) {
        await updateEmployee(editData.id, form);
        alert("Employee updated successfully");
      } else {
        await createEmployee(form);
        alert("Employee created successfully");
      }
      onSuccess?.(); // Waxay xiraysaa popup-ka, waxayna dib u load-garaynaysaa list-ka
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Full Name</label>
        <Input 
          placeholder="e.g. Ahmed Ali" 
          className="dark:bg-slate-800 dark:border-slate-700"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })} 
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Email Address</label>
        <Input 
          placeholder="email@example.com" 
          className="dark:bg-slate-800 dark:border-slate-700"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Phone</label>
          <Input 
            placeholder="61xxxxxxx" 
            className="dark:bg-slate-800 dark:border-slate-700"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} 
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Salary ($)</label>
          <Input 
            type="number"
            placeholder="500" 
            className="dark:bg-slate-800 dark:border-slate-700"
            value={form.salary}
            onChange={(e) => setForm({ ...form, salary: e.target.value })} 
          />
        </div>
      </div>

      <Button 
        className="w-full bg-[#1e3a8a] dark:bg-blue-600 hover:bg-green-600 dark:hover:bg-green-700 font-bold text-white transition-all mt-2" 
        onClick={submit}
      >
        {editData ? "Update Employee" : "Save Employee"}
      </Button>
    </div>
  );
}