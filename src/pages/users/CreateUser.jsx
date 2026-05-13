import { useEffect, useState } from "react";
import { getEmployees } from "@/services/employees/employeeService";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CreateUserForm({ onSuccess }) {
  const [employees, setEmployees] = useState([]);

  const [form, setForm] = useState({
    employeeId: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  useEffect(() => {
    (async () => {
      const data = await getEmployees();
      setEmployees(data);
    })();
  }, []);

  const handleEmployee = (id) => {
    const emp = employees.find((e) => e.id === id);

    setForm((prev) => ({
      ...prev,
      employeeId: id,
      email: emp?.email || "",
    }));
  };

  const submit = async () => {
    if (!form.employeeId) return alert("Select employee");
    if (form.password !== form.confirmPassword)
      return alert("Passwords do not match");

    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      await setDoc(doc(db, "users", userCred.user.uid), {
        employeeId: form.employeeId,
        email: form.email,
        role: form.role,
        isActive: true,
      });

      alert("User created successfully");

      onSuccess?.(); // refresh list + close modal
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-blue-600">
        Create User Account
      </h2>

      <Select onValueChange={handleEmployee}>
        <SelectTrigger>
          <SelectValue placeholder="Select Employee" />
        </SelectTrigger>
        <SelectContent>
          {employees.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.fullName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input value={form.email} disabled placeholder="Email auto-filled" />

      <Input
        type="password"
        placeholder="Password"
        onChange={(e) =>
          setForm({ ...form, password: e.target.value })
        }
      />

      <Input
        type="password"
        placeholder="Confirm Password"
        onChange={(e) =>
          setForm({ ...form, confirmPassword: e.target.value })
        }
      />

      <Select onValueChange={(v) => setForm({ ...form, role: v })}>
        <SelectTrigger>
          <SelectValue placeholder="Select Role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Admin">Admin</SelectItem>
          <SelectItem value="Finance">Finance</SelectItem>
          <SelectItem value="HR">HR</SelectItem>
        </SelectContent>
      </Select>

      <Button
        onClick={submit}
        className="w-full bg-blue-600 hover:bg-green-600 transition"
      >
        Create Account
      </Button>
    </div>
  );
}