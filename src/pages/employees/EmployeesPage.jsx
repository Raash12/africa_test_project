import { useEffect, useState } from "react";
import { getEmployees, createEmployee } from "@/services/employees/employeeService";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Plus, Search } from "lucide-react";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    salary: "",
  });

  const load = async () => {
    setEmployees(await getEmployees());
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    await createEmployee(form);
    setOpen(false);
    setForm({});
    load();
  };

  const filtered = employees.filter((e) =>
    e.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex justify-between items-center">

        <h1 className="text-2xl font-bold text-green-600">
          Employees
        </h1>

        <div className="flex gap-2">

          {/* SEARCH */}
          <div className="flex items-center border px-2 rounded-lg bg-white">
            <Search size={16} />
            <input
              className="p-2 outline-none"
              placeholder="Search..."
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* POPUP */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600">
                <Plus className="mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Employee</DialogTitle>
              </DialogHeader>

              <div className="space-y-3">

                <Input placeholder="Full Name"
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />

                <Input placeholder="Email"
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />

                <Input placeholder="Phone"
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />

                <Input placeholder="Salary"
                  onChange={(e) => setForm({ ...form, salary: e.target.value })}
                />

                <Button className="w-full bg-green-600" onClick={submit}>
                  Save Employee
                </Button>

              </div>

            </DialogContent>
          </Dialog>

        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow">

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Salary</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.map((e) => (
              <TableRow key={e.id}>
                <TableCell>{e.fullName}</TableCell>
                <TableCell>{e.email}</TableCell>
                <TableCell>{e.phone}</TableCell>
                <TableCell>{e.salary}</TableCell>
              </TableRow>
            ))}
          </TableBody>

        </Table>

      </div>
    </div>
  );
}