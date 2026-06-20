import { Outlet, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
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
  Users,
  Handshake,
  HeartHandshake,
  Layers,
  ChevronDown,
  UserCheck,
  Truck,
  FileText,
  Receipt,
  CreditCard,
  Home,
  ArrowUpRight,
  ArrowDownLeft,
  SlidersHorizontal,
  CalendarDays,
  FolderTree,
  ShoppingCart,
  BookOpen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.jpeg";

export default function DashboardLayout() {
  const [open, setOpen] = useState(true);
  const [dark, setDark] = useState(false);

  // States-ka dropdown-ada menu-yada
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [pmOpen, setPmOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [hrmOpen, setHrmOpen] = useState(false);
  const [payrollOpen, setPayrollOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false); // State for Reports

  const location = useLocation();

  const navItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
    },
  ];

  const inventoryItems = [
    { name: "Items", path: "/items", icon: Package },
    { name: "Warehouse", path: "/warehouses", icon: Home },
    { name: "Stock In", path: "/stock-in", icon: ArrowUpRight },
    { name: "Stock Out", path: "/stock-out", icon: ArrowDownLeft },
  ];

  const programManagementItems = [
    { name: "Programs", path: "/programs", icon: Layers },
    { name: "Donors", path: "/donors", icon: HandCoins },
    { name: "Grants", path: "/grants", icon: Handshake },
    { name: "Projects", path: "/projects", icon: FolderKanban },
  ];

  const accountItems = [
    { name: "Chart of Accounts", path: "/chart-of-accounts", icon: FolderTree },
    { name: "Finance Book", path: "/finance-books", icon: BookOpen },
    { name: "Fiscal Years", path: "/fiscal-years", icon: CalendarDays },
    { name: "Suppliers", path: "/suppliers", icon: Truck },
    { name: "Journal Entries", path: "/journal-entries", icon: FileText },
    { name: "general ledger", path: "/general-ledger", icon: Receipt }
  ];

  const purchaseItems = [
    { name: "Purchase Order", path: "/purchase-orders", icon: FileText },
    { name: "Purchase Invoice", path: "/purchase-invoices", icon: Receipt },
  ];

  const paymentItems = [
    { name: "Payment Entry", path: "/payment-entries", icon: CreditCard },
  ];

  const payrollItems = [
    { name: "Salary Expenses", path: "/salary-expenses", icon: Briefcase },
    { name: "General Expenses", path: "/general-expenses", icon: Receipt },
  ];

  const reportsItems = [
    { name: "Grant Report", path: "/reports/grants" },
    { name: "Project Report", path: "/reports/projects" },
  ];

  // Hubinta in menu-ga hadda la joogo uu active yahay
  const isInventoryActive = inventoryItems.some((item) => location.pathname === item.path);
  const isPmActive = programManagementItems.some((item) => location.pathname === item.path);
  const isAccountActive = accountItems.some((item) => location.pathname === item.path);
  const isPurchaseActive = purchaseItems.some((item) => location.pathname === item.path);
  const isPaymentActive = paymentItems.some((item) => location.pathname === item.path);
  const isHrmActive = location.pathname === "/employees" || location.pathname === "/users";
  const isPayrollActive = payrollItems.some((item) => location.pathname === item.path);
  const isReportsActive = reportsItems.some((item) => location.pathname === item.path);

  // In dropdown-ku si toos ah isu furo haddii link gudihiisa ah la joogo
  useEffect(() => {
    if (isInventoryActive) setInventoryOpen(true);
    if (isPmActive) setPmOpen(true);
    if (isAccountActive) setAccountOpen(true);
    if (isPurchaseActive) setPurchaseOpen(true);
    if (isPaymentActive) setPaymentOpen(true);
    if (isHrmActive) setHrmOpen(true);
    if (isPayrollActive) setPayrollOpen(true);
    if (isReportsActive) setReportsOpen(true);
  }, [location.pathname, isInventoryActive, isPmActive, isAccountActive, isPurchaseActive, isPaymentActive, isHrmActive, isPayrollActive, isReportsActive]);

  return (
    <div className={dark ? "dark" : ""}>
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        
        {/* SIDEBAR */}
        <aside
          className={`
            bg-slate-900 text-white
            transition-all duration-300
            ${open ? "w-64" : "w-20"}
            p-4 flex flex-col shadow-2xl z-20 h-full
          `}
        >
          {/* LOGO AREA */}
          <div className="flex items-center justify-between mb-10">
            {open ? (
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
            ) : (
              <div className="p-1 bg-white rounded-md mx-auto">
                <img src={logo} alt="AIF Logo" className="w-6 h-6 object-contain" />
              </div>
            )}

            {open && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setOpen(!open)}
                className="text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Menu size={20} />
              </Button>
            )}
          </div>

          {!open && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setOpen(!open)}
              className="text-slate-400 hover:text-white hover:bg-slate-800 transition-colors mx-auto mb-6"
            >
              <Menu size={20} />
            </Button>
          )}

          {/* NAVIGATION */}
          <nav
            className="space-y-1.5 flex-1 overflow-y-auto"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <style>{`
              nav::-webkit-scrollbar { display: none; }
            `}</style>

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
                    ${!open && "justify-center px-0"}
                  `}
                >
                  <Icon size={20} />
                  {open && <span>{item.name}</span>}
                </Link>
              );
            })}

            {/* PARENT: INVENTORY */}
            <div className="space-y-1">
              <button
                onClick={() => {
                  if (!open) setOpen(true);
                  setInventoryOpen(!inventoryOpen);
                }}
                className={`
                  w-full flex items-center justify-between
                  px-4 py-3 rounded-xl
                  transition-all duration-200
                  text-sm font-medium
                  ${
                    isInventoryActive
                      ? "text-white bg-slate-800/50 font-semibold"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }
                  ${!open && "justify-center px-0"}
                `}
              >
                <div className="flex items-center gap-3">
                  <Package size={20} className={isInventoryActive ? "text-green-500" : ""} />
                  {open && <span>Inventory</span>}
                </div>
                {open && (
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${inventoryOpen ? "rotate-180" : ""}`}
                  />
                )}
              </button>

              {inventoryOpen && open && (
                <div className="pl-6 space-y-1 transition-all duration-200">
                  {inventoryItems.map((child) => {
                    const ChildIcon = child.icon;
                    const isChildActive = location.pathname === child.path;

                    return (
                      <Link
                        key={child.name}
                        to={child.path}
                        className={`
                          flex items-center gap-3
                          px-4 py-2.5 rounded-xl
                          text-xs font-medium transition-all duration-200
                          ${
                            isChildActive
                              ? "bg-green-600 text-white shadow-md shadow-green-900/10"
                              : "text-slate-400 hover:bg-slate-800 hover:text-white"
                          }
                        `}
                      >
                        <ChildIcon size={16} />
                        <span>{child.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PARENT: PROGRAM MANAGEMENT */}
            <div className="space-y-1">
              <button
                onClick={() => {
                  if (!open) setOpen(true);
                  setPmOpen(!pmOpen);
                }}
                className={`
                  w-full flex items-center justify-between
                  px-4 py-3 rounded-xl
                  transition-all duration-200
                  text-sm font-medium
                  ${
                    isPmActive
                      ? "text-white bg-slate-800/50 font-semibold"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }
                  ${!open && "justify-center px-0"}
                `}
              >
                <div className="flex items-center gap-3">
                  <Layers size={20} className={isPmActive ? "text-green-500" : ""} />
                  {open && <span>Operations</span>}
                </div>
                {open && (
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${pmOpen ? "rotate-180" : ""}`}
                  />
                )}
              </button>

              {pmOpen && open && (
                <div className="pl-6 space-y-1 transition-all duration-200">
                  {programManagementItems.map((child) => {
                    const ChildIcon = child.icon;
                    const isChildActive = location.pathname === child.path;

                    return (
                      <Link
                        key={child.name}
                        to={child.path}
                        className={`
                          flex items-center gap-3
                          px-4 py-2.5 rounded-xl
                          text-xs font-medium transition-all duration-200
                          ${
                            isChildActive
                              ? "bg-green-600 text-white shadow-md shadow-green-900/10"
                              : "text-slate-400 hover:bg-slate-800 hover:text-white"
                          }
                        `}
                      >
                        <ChildIcon size={16} />
                        <span>{child.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PARENT: ACCOUNTING */}
            <div className="space-y-1">
              <button
                onClick={() => {
                  if (!open) setOpen(true);
                  setAccountOpen(!accountOpen);
                }}
                className={`
                  w-full flex items-center justify-between
                  px-4 py-3 rounded-xl
                  transition-all duration-200
                  text-sm font-medium
                  ${
                    isAccountActive
                      ? "text-white bg-slate-800/50 font-semibold"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }
                  ${!open && "justify-center px-0"}
                `}
              >
                <div className="flex items-center gap-3">
                  <Handshake size={20} className={isAccountActive ? "text-green-500" : ""} />
                  {open && <span>Accounting</span>}
                </div>
                {open && (
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${accountOpen ? "rotate-180" : ""}`}
                  />
                )}
              </button>

              {accountOpen && open && (
                <div className="pl-6 space-y-1 transition-all duration-200">
                  {accountItems.map((child) => {
                    const ChildIcon = child.icon;
                    const isChildActive = location.pathname === child.path;

                    return (
                      <Link
                        key={child.name}
                        to={child.path}
                        className={`
                          flex items-center gap-3
                          px-4 py-2.5 rounded-xl
                          text-xs font-medium transition-all duration-200
                          ${
                            isChildActive
                              ? "bg-green-600 text-white shadow-md shadow-green-900/10"
                              : "text-slate-400 hover:bg-slate-800 hover:text-white"
                          }
                        `}
                      >
                        <ChildIcon size={16} />
                        <span>{child.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PARENT: PURCHASE */}
            <div className="space-y-1">
              <button
                onClick={() => {
                  if (!open) setOpen(true);
                  setPurchaseOpen(!purchaseOpen);
                }}
                className={`
                  w-full flex items-center justify-between
                  px-4 py-3 rounded-xl
                  transition-all duration-200
                  text-sm font-medium
                  ${
                    isPurchaseActive
                      ? "text-white bg-slate-800/50 font-semibold"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }
                  ${!open && "justify-center px-0"}
                `}
              >
                <div className="flex items-center gap-3">
                  <ShoppingCart size={20} className={isPurchaseActive ? "text-green-500" : ""} />
                  {open && <span>Purchase</span>}
                </div>
                {open && (
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${purchaseOpen ? "rotate-180" : ""}`}
                  />
                )}
              </button>

              {purchaseOpen && open && (
                <div className="pl-6 space-y-1 transition-all duration-200">
                  {purchaseItems.map((child) => {
                    const ChildIcon = child.icon;
                    const isChildActive = location.pathname === child.path;

                    return (
                      <Link
                        key={child.name}
                        to={child.path}
                        className={`
                          flex items-center gap-3
                          px-4 py-2.5 rounded-xl
                          text-xs font-medium transition-all duration-200
                          ${
                            isChildActive
                              ? "bg-green-600 text-white shadow-md shadow-green-900/10"
                              : "text-slate-400 hover:bg-slate-800 hover:text-white"
                          }
                        `}
                      >
                        <ChildIcon size={16} />
                        <span>{child.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PARENT: PAYMENT */}
            <div className="space-y-1">
              <button
                onClick={() => {
                  if (!open) setOpen(true);
                  setPaymentOpen(!paymentOpen);
                }}
                className={`
                  w-full flex items-center justify-between
                  px-4 py-3 rounded-xl
                  transition-all duration-200
                  text-sm font-medium
                  ${
                    isPaymentActive
                      ? "text-white bg-slate-800/50 font-semibold"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }
                  ${!open && "justify-center px-0"}
                `}
              >
                <div className="flex items-center gap-3">
                  <CreditCard size={20} className={isPaymentActive ? "text-green-500" : ""} />
                  {open && <span>Payment</span>}
                </div>
                {open && (
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${paymentOpen ? "rotate-180" : ""}`}
                  />
                )}
              </button>

              {paymentOpen && open && (
                <div className="pl-6 space-y-1 transition-all duration-200">
                  {paymentItems.map((child) => {
                    const ChildIcon = child.icon;
                    const isChildActive = location.pathname === child.path;

                    return (
                      <Link
                        key={child.name}
                        to={child.path}
                        className={`
                          flex items-center gap-3
                          px-4 py-2.5 rounded-xl
                          text-xs font-medium transition-all duration-200
                          ${
                            isChildActive
                              ? "bg-green-600 text-white shadow-md shadow-green-900/10"
                              : "text-slate-400 hover:bg-slate-800 hover:text-white"
                          }
                        `}
                      >
                        <ChildIcon size={16} />
                        <span>{child.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PARENT: HRM */}
            <div className="space-y-1">
              <button
                onClick={() => {
                  if (!open) setOpen(true);
                  setHrmOpen(!hrmOpen);
                }}
                className={`
                  w-full flex items-center justify-between
                  px-4 py-3 rounded-xl
                  transition-all duration-200
                  text-sm font-medium
                  ${
                    isHrmActive
                      ? "text-white bg-slate-800/50 font-semibold"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }
                  ${!open && "justify-center px-0"}
                `}
              >
                <div className="flex items-center gap-3">
                  <UserCheck size={20} className={isHrmActive ? "text-green-500" : ""} />
                  {open && <span>HRM</span>}
                </div>
                {open && (
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${hrmOpen ? "rotate-180" : ""}`}
                  />
                )}
              </button>

              {hrmOpen && open && (
                <div className="pl-6 space-y-1 transition-all duration-200">
                  <Link
                    to="/employees"
                    className={`
                      flex items-center gap-3
                      px-4 py-2.5 rounded-xl
                      text-xs font-medium transition-all duration-200
                      ${
                        location.pathname === "/employees"
                          ? "bg-green-600 text-white shadow-md shadow-green-900/10"
                          : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      }
                    `}
                  >
                    <Briefcase size={16} />
                    <span>Employees</span>
                  </Link>

                  <Link
                    to="/users"
                    className={`
                      flex items-center gap-3
                      px-4 py-2.5 rounded-xl
                      text-xs font-medium transition-all duration-200
                      ${
                        location.pathname === "/users"
                          ? "bg-green-600 text-white shadow-md shadow-green-900/10"
                          : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      }
                    `}
                  >
                    <Users size={16} />
                    <span>Users</span>
                  </Link>
                </div>
              )}
            </div>

            {/* PARENT: PAYROLL */}
            <div className="space-y-1">
              <button
                onClick={() => {
                  if (!open) setOpen(true);
                  setPayrollOpen(!payrollOpen);
                }}
                className={`
                  w-full flex items-center justify-between
                  px-4 py-3 rounded-xl
                  transition-all duration-200
                  text-sm font-medium
                  ${
                    isPayrollActive
                      ? "text-white bg-slate-800/50 font-semibold"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }
                  ${!open && "justify-center px-0"}
                `}
              >
                <div className="flex items-center gap-3">
                  <HandCoins size={20} className={isPayrollActive ? "text-green-500" : ""} />
                  {open && <span>Payroll</span>}
                </div>
                {open && (
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${payrollOpen ? "rotate-180" : ""}`}
                  />
                )}
              </button>

              {payrollOpen && open && (
                <div className="pl-6 space-y-1 transition-all duration-200">
                  {payrollItems.map((child) => {
                    const ChildIcon = child.icon;
                    const isChildActive = location.pathname === child.path;

                    return (
                      <Link
                        key={child.name}
                        to={child.path}
                        className={`
                          flex items-center gap-3
                          px-4 py-2.5 rounded-xl
                          text-xs font-medium transition-all duration-200
                          ${
                            isChildActive
                              ? "bg-green-600 text-white shadow-md shadow-green-900/10"
                              : "text-slate-400 hover:bg-slate-800 hover:text-white"
                          }
                        `}
                      >
                        <ChildIcon size={16} />
                        <span>{child.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PARENT: REPORTS */}
            <div className="space-y-1">
              <button
                onClick={() => {
                  if (!open) setOpen(true);
                  setReportsOpen(!reportsOpen);
                }}
                className={`
                  w-full flex items-center justify-between
                  px-4 py-3 rounded-xl
                  transition-all duration-200
                  text-sm font-medium
                  ${
                    isReportsActive
                      ? "text-white bg-slate-800/50 font-semibold"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }
                  ${!open && "justify-center px-0"}
                `}
              >
                <div className="flex items-center gap-3">
                  <FileText size={20} className={isReportsActive ? "text-green-500" : ""} />
                  {open && <span>Reports</span>}
                </div>
                {open && (
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${reportsOpen ? "rotate-180" : ""}`}
                  />
                )}
              </button>

              {reportsOpen && open && (
                <div className="pl-6 space-y-1 transition-all duration-200">
                  {/* Grant Report */}
                  <Link
                    to="/reports/grants"
                    className={`
                      flex items-center gap-3
                      px-4 py-2.5 rounded-xl
                      text-xs font-medium transition-all duration-200
                      ${
                        location.pathname === "/reports/grants"
                          ? "bg-green-600 text-white shadow-md shadow-green-900/10"
                          : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      }
                    `}
                  >
                    <HandCoins size={16} />
                    <span>Grant Report</span>
                  </Link>

                  {/* Project Report */}
                  <Link
                    to="/reports/projects"
                    className={`
                      flex items-center gap-3
                      px-4 py-2.5 rounded-xl
                      text-xs font-medium transition-all duration-200
                      ${
                        location.pathname === "/reports/projects"
                          ? "bg-green-600 text-white shadow-md shadow-green-900/10"
                          : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      }
                    `}
                  >
                    <FolderKanban size={16} />
                    <span>Project Report</span>
                  </Link>
                </div>
              )}
            </div>

          </nav>

          {/* BOTTOM ACTIONS */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDark(!dark)}
              className={`w-full text-slate-400 hover:text-white hover:bg-slate-800 px-4 ${
                open ? "justify-start" : "justify-center px-0"
              }`}
            >
              {dark ? <Sun size={18} className="mr-2" /> : <Moon size={18} className="mr-2" />}
              {open && <span>{dark ? "Light Mode" : "Dark Mode"}</span>}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut(auth)}
              className={`w-full text-red-400 hover:text-red-300 hover:bg-red-950/30 px-4 ${
                open ? "justify-start" : "justify-center px-0"
              }`}
            >
              <LogOut size={18} className="mr-2" />
              {open && <span>Logout</span>}
            </Button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-950">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}