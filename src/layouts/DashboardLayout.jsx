import { Outlet, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { signOut } from "firebase/auth";

import { auth } from "@/lib/firebase";

import {
  LayoutDashboard,
  Briefcase,
  Menu,
  Moon,
  Sun,
  HandCoins,
  FolderKanban,
  LogOut,
  Package,
  Users, // Icon for Users
} from "lucide-react";

import { Button } from "@/components/ui/button";

// 👉 IMPORT YOUR LOGO
import logo from "@/assets/logo.jpeg";

export default function DashboardLayout() {
  const [open, setOpen] = useState(true);
  const [dark, setDark] = useState(false);

  const location = useLocation();

  // Navigation Items including Users, Donors, Items, and Projects
  const navItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Employees",
      path: "/employees",
      icon: Briefcase,
    },
    {
      name: "Donors",
      path: "/donors",
      icon: HandCoins,
    },
    {
      name: "Items",
      path: "/items",
      icon: Package,
    },
    {
      name: "Projects",
      path: "/projects",
      icon: FolderKanban,
    },
    {
      name: "Users", // Added Users back in
      path: "/users",
      icon: Users,
    },
  ];

  return (
    <div className={dark ? "dark" : ""}>
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">

        {/* SIDEBAR */}
        <aside
          className={`
            bg-slate-900 text-white
            transition-all duration-300
            ${open ? "w-64" : "w-20"}
            p-4 flex flex-col shadow-2xl z-20
          `}
        >

          {/* LOGO AREA */}
          <div className="flex items-center justify-between mb-10">
            {open && (
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-white rounded-lg">
                    <img
                        src={logo}
                        alt="AIF Logo"
                        className="w-8 h-8 object-contain"
                    />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-white">
                    AIF <span className="text-green-500">ERP</span>
                  </h1>
                </div>
              </div>
            )}

            <Button
              size="icon"
              variant="ghost"
              onClick={() => setOpen(!open)}
              className="text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Menu size={20} />
            </Button>
          </div>

          {/* NAVIGATION */}
          <nav className="space-y-1.5 flex-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`
                    flex items-center gap-3
                    px-4 py-3 rounded-xl
                    transition-all duration-200
                    text-sm font-medium
                    ${
                      active
                        ? "bg-green-600 text-white shadow-lg shadow-green-900/20"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }
                  `}
                >
                  <Icon size={20} />
                  {open && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          {/* BOTTOM ACTIONS */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
             <Button
                variant="ghost"
                size="sm"
                onClick={() => setDark(!dark)}
                className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800 px-4"
              >
                {dark ? <Sun size={18} className="mr-3" /> : <Moon size={18} className="mr-3" />}
                {open && (dark ? "Light Mode" : "Dark Mode")}
              </Button>

              <Button
                variant="destructive"
                className="w-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all rounded-xl py-6"
                onClick={() => signOut(auth)}
              >
                <LogOut size={18} className={open ? "mr-2" : ""} />
                {open && "Logout"}
              </Button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
          
          {/* HEADER */}
          <header className="relative py-8 px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-green-500/5 to-transparent pointer-events-none" />
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-6">
                <img
                  src={logo}
                  alt="Organization Logo"
                  className="w-16 h-16 object-contain drop-shadow-sm"
                />
                <div className="h-12 w-[1px] bg-slate-200 dark:bg-slate-700 hidden sm:block" />
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                    Africa <span className="text-green-600 dark:text-green-500">Ihsan</span> Aid Foundation
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Resource Management System
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* DYNAMIC CONTENT */}
          <div className="flex-1 p-8 overflow-auto bg-slate-50 dark:bg-slate-950">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}