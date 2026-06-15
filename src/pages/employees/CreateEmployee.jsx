import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CreateEmployee({ editData, actions, onSuccess }) {
  const { addEmployee, editEmployee } = actions;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    salary: "",
  });

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
      setIsSubmitting(true);

      if (editData) {
        await editEmployee(editData.id, form);
        alert("Employee updated successfully");
      } else {
        await addEmployee(form);
        alert("Employee created successfully");
      }
      onSuccess?.(); 
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
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
        disabled={isSubmitting}
      >
        {isSubmitting ? "Processing..." : editData ? "Update Employee" : "Save Employee"}
      </Button>
    </div>
  );
}