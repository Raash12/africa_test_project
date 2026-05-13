import { useEffect, useState } from "react";
import { getUsers, deleteUser } from "@/services/userService";
import { getEmployees } from "@/services/employees/employeeService";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Plus, Search } from "lucide-react";
import CreateUserForm from "./CreateUser";

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // LOAD USERS + EMPLOYEES
  const load = async () => {
    const [userData, empData] = await Promise.all([
      getUsers(),
      getEmployees(),
    ]);

    setUsers(userData);
    setEmployees(empData);
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id) => {
    await deleteUser(id);
    load();
  };

  // JOIN USER + EMPLOYEE DATA
  const mergedData = users.map((u) => {
    const emp = employees.find((e) => e.id === u.employeeId);

    return {
      ...u,
      fullName: emp?.fullName || "Unknown",
      phone: emp?.phone || "-",
      department: emp?.department || "-",
      position: emp?.position || "-",
      salary: emp?.salary || "-",
    };
  });

  // FILTER SEARCH
  const filtered = mergedData.filter((u) =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-700">
          Users Management
        </h1>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-green-600 flex gap-2">
              <Plus size={18} />
              Add User
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-lg">
            <CreateUserForm
              onSuccess={() => {
                setOpen(false);
                load();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* SEARCH BAR */}
      <div className="flex items-center gap-2 mb-4 bg-white p-3 rounded-lg shadow">
        <Search size={18} className="text-gray-400" />
        <input
          placeholder="Search by name or email..."
          className="w-full outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-xl shadow overflow-hidden">

        <table className="w-full text-sm">
          <thead className="bg-blue-50 text-blue-700">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Department</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((u) => (
              <tr
                key={u.id}
                className="border-t hover:bg-gray-50 transition"
              >
                <td className="p-3 font-medium">
                  {u.fullName}
                </td>

                <td>{u.email}</td>
                <td>{u.phone}</td>
                <td>{u.department}</td>

                <td>
                  <Badge className="bg-green-600">
                    {u.role}
                  </Badge>
                </td>

                <td>
                  {u.isActive ? (
                    <span className="text-green-600 font-medium">
                      Active
                    </span>
                  ) : (
                    <span className="text-red-500">
                      Disabled
                    </span>
                  )}
                </td>

                <td className="text-gray-500 text-xs">
                  {u.createdAt?.toDate?.()?.toLocaleString?.() ||
                    "—"}
                </td>

                <td>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => remove(u.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
}