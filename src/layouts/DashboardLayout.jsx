import { Outlet, Link } from "react-router-dom";
import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserPlus,
  Menu,
  Moon,
  Sun,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export default function DashboardLayout() {
  const [open, setOpen] = useState(true);
  const [dark, setDark] = useState(false);

  return (
    <div className={dark ? "dark" : ""}>
      <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950">

        {/* SIDEBAR */}
        <div className={`bg-slate-900 text-white transition-all duration-300
          ${open ? "w-64" : "w-20"} p-4`}>

          {/* HEADER */}
          <div className="flex items-center justify-between mb-6">
            {open && (
              <h1 className="text-lg font-bold text-green-400">
                AIF ERP
              </h1>
            )}

            <Button size="icon" onClick={() => setOpen(!open)}>
              <Menu />
            </Button>
          </div>

          {/* NAV */}
          <nav className="space-y-4 text-sm">

            <Link to="/" className="flex gap-2 items-center">
              <LayoutDashboard /> {open && "Dashboard"}
            </Link>

            <Link to="/employees" className="flex gap-2 items-center">
              <Briefcase /> {open && "Employees"}
            </Link>

            <Link to="/users" className="flex gap-2 items-center">
              <Users /> {open && "Users"}
            </Link>

          </nav>

          {/* DARK MODE */}
          <div className="mt-6 flex gap-2">
            <Button size="icon" onClick={() => setDark(!dark)}>
              {dark ? <Sun /> : <Moon />}
            </Button>
          </div>

          {/* LOGOUT */}
          <Button
            className="mt-10 w-full bg-red-600"
            onClick={() => signOut(auth)}
          >
            {open && "Logout"}
          </Button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 p-6">
          <Outlet />
        </div>

      </div>
    </div>
  );
}