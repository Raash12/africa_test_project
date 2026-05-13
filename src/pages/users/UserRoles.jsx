import { useEffect, useState } from "react";
import { getUsers, updateUserRole } from "@/services/userService";
import { Select, SelectItem, SelectTrigger, SelectContent } from "@/components/ui/select";

export default function UserRoles() {
  const [users, setUsers] = useState([]);

  const load = async () => {
    const data = await getUsers();
    setUsers(data);
  };

  useEffect(() => {
    load();
  }, []);

  const changeRole = async (id, role) => {
    await updateUserRole(id, role);
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">User Roles</h1>

      <div className="space-y-4">
        {users.map((u) => (
          <div key={u.id} className="flex gap-4 items-center">
            <div className="w-40">{u.fullName}</div>

            <Select onValueChange={(v) => changeRole(u.id, v)}>
              <SelectTrigger>{u.role}</SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
                <SelectItem value="Accountant">Accountant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}