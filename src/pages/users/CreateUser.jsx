import { useEffect, useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function CreateUserForm({ editData, employees, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    employeeId: "", email: "", password: "", confirmPassword: "", role: "", isActive: true,
  });

  useEffect(() => {
    if (editData) {
      setForm({ 
        ...editData, 
        password: "", 
        confirmPassword: "",
        isActive: editData.isActive ?? true 
      });
    }
  }, [editData]);

  const handleEmployeeChange = (id) => {
    const emp = employees.find((e) => e.id === id);
    if (emp) setForm((prev) => ({ ...prev, employeeId: id, email: emp.email || "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    try {
      setIsLoading(true);
      if (editData) {
        await updateDoc(doc(db, "users", editData.id), {
          role: form.role,
          isActive: form.isActive,
        });
      } else {
        if (form.password !== form.confirmPassword) throw new Error("Passwords match-maayaan!");
        
        const userCred = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await setDoc(doc(db, "users", userCred.user.uid), {
          employeeId: form.employeeId,
          email: form.email,
          role: form.role,
          isActive: form.isActive,
          createdAt: new Date().toISOString()
        });
      }
      onSuccess();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-slate-900 dark:text-slate-100">
      <div className="space-y-1">
        <Label>Select Employee</Label>
        <Select value={form.employeeId} onValueChange={handleEmployeeChange} disabled={!!editData}>
          <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <SelectValue placeholder="Dooro Shaqaalaha" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            {employees.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>Email</Label>
        <Input value={form.email} readOnly className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700" />
      </div>

      {!editData && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Password</Label>
            <Input type="password" placeholder="Password" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" onChange={(e) => setForm({...form, password: e.target.value})} required />
          </div>
          <div className="space-y-1">
            <Label>Confirm</Label>
            <Input type="password" placeholder="Confirm" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" onChange={(e) => setForm({...form, confirmPassword: e.target.value})} required />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 items-center">
        <div className="space-y-1">
          <Label>Role</Label>
          <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
            <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              {["Admin", "HR", "Finance", "Manager"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 pt-5">
          <input 
            type="checkbox" 
            id="status"
            checked={form.isActive} 
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            className="w-4 h-4 accent-[#1e3a8a] dark:accent-blue-500 cursor-pointer"
          />
          <Label htmlFor="status" className="cursor-pointer font-medium select-none text-slate-700 dark:text-slate-300">
            {form.isActive ? "Active Account" : "Inactive Account"}
          </Label>
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full bg-[#1e3a8a] text-white hover:bg-[#1a3378] dark:bg-blue-600 dark:hover:bg-blue-700">
        {isLoading ? <Loader2 className="animate-spin" /> : "Save Account"}
      </Button>
    </form>
  );
}