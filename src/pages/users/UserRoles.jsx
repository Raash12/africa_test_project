import { useEffect, useState } from "react";
// 1. Bedel import-ka (updateUserRole -> updateUser)
import { getUsers, updateUser } from "@/services/userService"; 
import { Select, SelectItem, SelectTrigger, SelectContent, SelectValue } from "@/components/ui/select";

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
    // 2. Halkan u gudbi object { role: role } maadaama uu yahay function guud
    await updateUser(id, { role: role });
    load();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">User Roles Management</h1>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden max-w-2xl">
        <div className="grid grid-cols-2 bg-slate-50 p-4 border-b font-semibold text-slate-600">
          <div>User Full Name</div>
          <div>Assigned Role</div>
        </div>

        <div className="divide-y">
          {users.map((u) => (
            <div key={u.id} className="grid grid-cols-2 gap-4 items-center p-4 hover:bg-slate-50 transition">
              <div className="font-medium text-slate-700">{u.fullName || "No Name"}</div>

              <Select 
                defaultValue={u.role} 
                onValueChange={(v) => changeRole(u.id, v)}
              >
                <SelectTrigger className="w-[180px]">
                  {/* SelectValue wuxuu muujinayaa waxa hadda doortan */}
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Accountant">Accountant</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}