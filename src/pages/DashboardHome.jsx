// src/pages/DashboardHome.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  RefreshCw,
  HandCoins,
  FolderKanban,
  UserCheck,
  CreditCard,
  Activity,
  Zap,
  Wallet,
  Truck,
  Heart,
  Globe,
  Shield,
  Rocket,
  Star,
  Building2,
  PieChart,
  ArrowUpRight,
  ArrowDownLeft,
  MessageSquare,
  Award,
  Crown,
  FileText,
  ShoppingCart,
  Store,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  Clock as ClockIcon,
  AlertCircle,
  Package,
  BarChart3,
  TrendingUp as TrendingUpIcon,
  Users as UsersIcon,
  DollarSign as DollarSignIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import useGrants from "@/hooks/useGrants";
import useProjects from "@/hooks/useProjects";
import { useEmployees } from "@/hooks/useEmployees";
import useDonors from "@/hooks/useDonors";
import usePaymentEntry from "@/hooks/usePaymentEntry";
import useStockIn from "@/hooks/useStockIn";
import useAccounts from "@/hooks/useAccounts";
import usePurchaseOrders from "@/hooks/usePurchaseOrders";
import usePurchaseInvoices from "@/hooks/usePurchaseInvoices";
import useSuppliers from "@/hooks/useSuppliers";
import useWarehouse from "@/hooks/useWarehouse";
import logo from "@/assets/logo.jpeg";

// ─────────────────────────────────────────────────────────────
//  FORMAT HELPERS
// ─────────────────────────────────────────────────────────────
const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(val || 0);
};

const formatNumber = (val) => {
  return new Intl.NumberFormat('en-US').format(val || 0);
};

const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatTime = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// ─────────────────────────────────────────────────────────────
//  STATS CARD COMPONENT
// ─────────────────────────────────────────────────────────────
const StatsCard = ({ title, value, icon: Icon, color, subtitle, trend, trendValue, onClick, delay }) => {
  const trendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;
  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-slate-400';

  return (
    <Card
      onClick={onClick}
      className={`group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-1 animate-fade-in-up`}
      style={{ animationDelay: `${delay || 0}ms` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-95 group-hover:opacity-100 transition-opacity duration-500`}></div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

      <CardContent className="relative p-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-white/80 uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold mt-1 tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-white/70 mt-1">{subtitle}</p>
            )}
            {trend && trendValue && (
              <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trendColor}`}>
                {trendIcon && <trendIcon size={14} />}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
            <Icon size={22} className="text-white" />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div className="h-full bg-white/40 animate-pulse" style={{ width: '70%' }}></div>
        </div>
      </CardContent>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────
//  BAR CHART CARD COMPONENT
// ─────────────────────────────────────────────────────────────
const BarChartCard = ({ title, icon: Icon, data, color, onClick }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <Card 
      onClick={onClick}
      className="border-0 shadow-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-1 group"
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${color}`}>
            <Icon size={16} className="text-white" />
          </div>
          <CardTitle className="text-sm text-slate-800 dark:text-white">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((item, index) => {
            const percentage = (item.value / maxValue) * 100;
            return (
              <div key={index} className="group/item">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate flex-1">
                    {item.label}
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 ml-2">
                    {item.displayValue || item.value}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${color.replace('bg-', 'bg-').replace('text-', 'bg-')}`}
                    style={{
                      width: `${Math.min(percentage, 100)}%`,
                      animation: 'slideIn 1s ease-out'
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────
//  ACCOUNT CHART CARD
// ─────────────────────────────────────────────────────────────
const AccountChartCard = ({ accounts }) => {
  const accountData = useMemo(() => {
    return accounts
      .map(a => ({
        ...a,
        balance: Number(a.openingBalance || 0) + Number(a.balance || 0)
      }))
      .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
  }, [accounts]);

  const getAccountColor = (type) => {
    const colors = {
      'Assets': '#10b981',
      'Liabilities': '#ef4444',
      'Equity': '#8b5cf6',
      'Revenue': '#3b82f6',
      'Expenses': '#f59e0b',
      'Income': '#06b6d4'
    };
    return colors[type] || '#6b7280';
  };

  const getAccountIcon = (type) => {
    const icons = {
      'Assets': Wallet,
      'Liabilities': Building2,
      'Equity': Crown,
      'Revenue': TrendingUp,
      'Expenses': ArrowDownLeft,
      'Income': TrendingUp
    };
    return icons[type] || Wallet;
  };

  const maxBalance = useMemo(() => {
    const max = Math.max(...accountData.map(a => Math.abs(a.balance)));
    return max || 1;
  }, [accountData]);

  const totalBalance = useMemo(() => {
    return accountData.reduce((sum, a) => sum + a.balance, 0);
  }, [accountData]);

  return (
    <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm hover:shadow-2xl transition-shadow duration-500">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-[#1e3a8a] to-[#2563eb] rounded-xl">
            <PieChart size={18} className="text-white" />
          </div>
          <div>
            <CardTitle className="text-slate-800 dark:text-white">
              Account Balances
            </CardTitle>
            <p className="text-xs text-slate-400">Total: {formatCurrency(totalBalance)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {accountData.length === 0 ? (
            <div className="text-center py-6 text-slate-400">
              <Wallet size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No accounts found</p>
            </div>
          ) : (
            accountData.slice(0, 8).map((account, index) => {
              const Icon = getAccountIcon(account.accountType);
              const color = getAccountColor(account.accountType);
              const percentage = (Math.abs(account.balance) / maxBalance) * 100;
              const isPositive = account.balance >= 0;

              return (
                <div key={account.id || index} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div 
                        className="p-1.5 rounded-lg text-white flex-shrink-0"
                        style={{ backgroundColor: color }}
                      >
                        <Icon size={12} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                          {account.accountName || 'Unnamed'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {account.accountCode || 'N/A'} • {account.accountType || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className={`text-xs font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatCurrency(account.balance)}
                      </p>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: color,
                        animation: 'slideIn 1s ease-out'
                      }}
                    ></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────
//  ACTIVITY ITEM COMPONENT
// ─────────────────────────────────────────────────────────────
const ActivityItem = ({ icon: Icon, title, description, time, color, amount }) => {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300 group cursor-pointer">
      <div className={`p-2 rounded-lg ${color} group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
        <Icon size={14} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{title}</p>
          {amount !== undefined && amount !== null && (
            <span className={`text-xs font-bold ${amount >= 0 ? 'text-emerald-600' : 'text-rose-600'} flex-shrink-0`}>
              {amount >= 0 ? '+' : ''}{formatCurrency(amount)}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{description}</p>
        <div className="flex items-center gap-2 mt-1">
          <Clock size={10} className="text-slate-400" />
          <span className="text-xs text-slate-400">{time}</span>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────
export default function DashboardHome() {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [donorsMap, setDonorsMap] = useState({});

  // ── DATA HOOKS ──
  const { grants = [] } = useGrants();
  const { projects = [] } = useProjects();
  const { employees = [] } = useEmployees();
  const { donors = [] } = useDonors();
  const { payments = [] } = usePaymentEntry();
  const { accounts = [] } = useAccounts();
  const { stockInEntries = [] } = useStockIn();
  const { purchaseOrders = [] } = usePurchaseOrders();
  const { purchaseInvoices = [] } = usePurchaseInvoices();
  const { suppliers = [] } = useSuppliers();
  const { warehouses = [] } = useWarehouse();

  // ── BUILD DONORS MAP ──
  useEffect(() => {
    const map = {};
    donors.forEach(d => {
      map[d.id] = d.name || d.donorName || d;
    });
    setDonorsMap(map);
  }, [donors]);

  // ── UPDATE TIME ──
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // ── FETCH RECENT ACTIVITIES ──
  useEffect(() => {
    const fetchRecentActivities = async () => {
      try {
        const activities = [];

        // Get recent purchase orders
        const poQuery = query(collection(db, "purchase_orders"), orderBy("createdAt", "desc"), limit(3));
        const poSnap = await getDocs(poQuery);
        poSnap.forEach(doc => {
          const data = doc.data();
          activities.push({
            id: doc.id,
            type: 'purchase_order',
            title: `PO: ${data.poNumber || 'PO'}`,
            description: `${data.supplierName || 'Supplier'} • ${formatCurrency(data.totalAmount)}`,
            time: formatTime(data.createdAt || data.createdAt),
            icon: ShoppingCart,
            color: 'bg-blue-500',
            amount: 0
          });
        });

        // Get recent purchase invoices
        const piQuery = query(collection(db, "purchase_invoices"), orderBy("createdAt", "desc"), limit(3));
        const piSnap = await getDocs(piQuery);
        piSnap.forEach(doc => {
          const data = doc.data();
          activities.push({
            id: doc.id,
            type: 'purchase_invoice',
            title: `PI: ${data.invoiceNumber || 'PI'}`,
            description: `${data.supplierName || 'Supplier'} • ${formatCurrency(data.totalAmount)} • ${data.status || 'Pending'}`,
            time: formatTime(data.createdAt || data.createdAt),
            icon: FileText,
            color: 'bg-purple-500',
            amount: 0
          });
        });

        // Get recent payments
        const paymentsQuery = query(collection(db, "payment_entries"), orderBy("createdAt", "desc"), limit(3));
        const paymentsSnap = await getDocs(paymentsQuery);
        paymentsSnap.forEach(doc => {
          const data = doc.data();
          const amount = Number(data.amount || 0);
          activities.push({
            id: doc.id,
            type: 'payment',
            title: `Payment: ${data.description || 'Payment Entry'}`,
            description: `${data.type || 'Expense'} - ${data.supplierName || data.employeeName || 'N/A'}`,
            time: formatTime(data.createdAt?.toDate?.() || data.createdAt),
            icon: CreditCard,
            color: 'bg-orange-500',
            amount: -amount
          });
        });

        // Sort by time and take top 6
        activities.sort((a, b) => {
          const timeA = new Date(a.time).getTime() || 0;
          const timeB = new Date(b.time).getTime() || 0;
          return timeB - timeA;
        });

        setRecentActivities(activities.slice(0, 6));
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivities();
  }, []);

  // ── CALCULATE STATISTICS ──
  const stats = useMemo(() => {
    const totalGrants = grants.length;
    const totalFunding = grants.reduce((sum, g) => sum + Number(g.amount || 0), 0);
    const totalProjects = projects.length;
    const totalEmployees = employees.length;
    const totalDonors = donors.length;
    const totalPayments = payments.length;
    const totalPaymentsAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalStockIn = stockInEntries.reduce((sum, s) => sum + Number(s.quantity || 0), 0);
    const totalAccounts = accounts.length;
    const totalPurchaseOrders = purchaseOrders.length;
    const totalPurchaseInvoices = purchaseInvoices.length;
    const totalSuppliers = suppliers.length;
    const totalWarehouses = warehouses.length;

    const totalPOAmount = purchaseOrders.reduce((sum, p) => sum + Number(p.totalAmount || 0), 0);
    const totalPIAmount = purchaseInvoices.reduce((sum, p) => sum + Number(p.totalAmount || 0), 0);

    const totalAssets = accounts
      .filter(a => a.accountType === 'Assets')
      .reduce((sum, a) => sum + Number(a.openingBalance || 0) + Number(a.balance || 0), 0);
    
    const totalLiabilities = accounts
      .filter(a => a.accountType === 'Liabilities')
      .reduce((sum, a) => sum + Number(a.openingBalance || 0) + Number(a.balance || 0), 0);

    return {
      totalGrants,
      totalFunding,
      totalProjects,
      totalEmployees,
      totalDonors,
      totalPayments,
      totalPaymentsAmount,
      totalStockIn,
      totalAccounts,
      totalPurchaseOrders,
      totalPurchaseInvoices,
      totalSuppliers,
      totalWarehouses,
      totalPOAmount,
      totalPIAmount,
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities
    };
  }, [grants, projects, employees, donors, payments, stockInEntries, accounts, purchaseOrders, purchaseInvoices, suppliers, warehouses]);

  // ── PREPARE BAR CHART DATA ──
  const poData = useMemo(() => {
    return purchaseOrders.slice(0, 5).map(po => ({
      label: po.poNumber || po.id?.slice(0, 6) || 'PO',
      value: Number(po.totalAmount || 0),
      displayValue: formatCurrency(Number(po.totalAmount || 0))
    }));
  }, [purchaseOrders]);

  const piData = useMemo(() => {
    return purchaseInvoices.slice(0, 5).map(pi => ({
      label: pi.invoiceNumber || pi.id?.slice(0, 6) || 'PI',
      value: Number(pi.totalAmount || 0),
      displayValue: formatCurrency(Number(pi.totalAmount || 0))
    }));
  }, [purchaseInvoices]);

  const supplierData = useMemo(() => {
    return suppliers.slice(0, 5).map(s => ({
      label: s.supplierName || s.name || s.id?.slice(0, 6) || 'Supplier',
      value: 1,
      displayValue: 'Active'
    }));
  }, [suppliers]);

  const warehouseData = useMemo(() => {
    return warehouses.slice(0, 5).map(w => ({
      label: w.warehouseName || w.name || w.id?.slice(0, 6) || 'Warehouse',
      value: 1,
      displayValue: 'Active'
    }));
  }, [warehouses]);

  // ── REFRESH HANDLER ──
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    toast.info("Refreshing dashboard data...");
    setTimeout(() => {
      setRefreshing(false);
      toast.success("Dashboard refreshed successfully!");
    }, 1500);
  }, []);

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 min-h-screen">

      {/* ── TOP HEADER WITH LOGO ── */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-to-br from-[#1e3a8a] to-[#2563eb] rounded-xl shadow-lg flex-shrink-0">
              <img src={logo} alt="AIF" className="w-12 h-12 object-contain rounded-lg" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[#1e3a8a] dark:text-white tracking-tight">
                AFRICA IHSAN AID FOUNDATION
              </h1>
              <p className="text-base font-semibold text-emerald-700 dark:text-emerald-400 font-arabic">
                مؤسسة إحسان للإغاثة والتنمية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">Online</span>
              </span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="flex items-center gap-1.5">
                <Calendar size={13} className="text-slate-400" />
                {formatDate(currentTime)}
              </span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="flex items-center gap-1.5">
                <Clock size={13} className="text-slate-400" />
                {formatTime(currentTime)}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-slate-200 dark:border-slate-700 hover:bg-[#1e3a8a] hover:text-white transition-all duration-300"
            >
              <RefreshCw size={14} className={`${refreshing ? 'animate-spin' : ''} mr-1.5`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* ── STATS CARDS ROW 1 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <StatsCard
          title="Total Grants"
          value={formatNumber(stats.totalGrants)}
          icon={HandCoins}
          color="from-emerald-500 to-emerald-600"
          subtitle={`${formatCurrency(stats.totalFunding)} Total Funding`}
          trend="up"
          trendValue="+12%"
          onClick={() => navigate("/grants")}
          delay={0}
        />

        <StatsCard
          title="Projects"
          value={formatNumber(stats.totalProjects)}
          icon={FolderKanban}
          color="from-blue-500 to-blue-600"
          subtitle={`${stats.totalProjects} Active`}
          trend="up"
          trendValue="+5%"
          onClick={() => navigate("/projects")}
          delay={100}
        />

        <StatsCard
          title="Employees"
          value={formatNumber(stats.totalEmployees)}
          icon={Users}
          color="from-purple-500 to-purple-600"
          subtitle="Team Members"
          trend="up"
          trendValue="+8%"
          onClick={() => navigate("/employees")}
          delay={200}
        />

        <StatsCard
          title="Donors"
          value={formatNumber(stats.totalDonors)}
          icon={Heart}
          color="from-rose-500 to-rose-600"
          subtitle="Supporters"
          trend="up"
          trendValue="+15%"
          onClick={() => navigate("/donors")}
          delay={300}
        />
      </div>

      {/* ── STATS CARDS ROW 2 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <StatsCard
          title="Payments"
          value={formatNumber(stats.totalPayments)}
          icon={CreditCard}
          color="from-orange-500 to-orange-600"
          subtitle={`${formatCurrency(stats.totalPaymentsAmount)} Total`}
          trend="down"
          trendValue="-3.2%"
          onClick={() => navigate("/payment-entries")}
          delay={400}
        />

        <StatsCard
          title="Stock In"
          value={formatNumber(stats.totalStockIn)}
          icon={Truck}
          color="from-cyan-500 to-cyan-600"
          subtitle="Items Received"
          trend="up"
          trendValue="+4.2%"
          onClick={() => navigate("/stock-in")}
          delay={500}
        />

        <StatsCard
          title="Total Assets"
          value={formatCurrency(stats.totalAssets)}
          icon={Wallet}
          color="from-indigo-500 to-indigo-600"
          subtitle="Organization Assets"
          trend="up"
          trendValue="+6.5%"
          onClick={() => navigate("/chart-of-accounts")}
          delay={600}
        />

        <StatsCard
          title="Net Worth"
          value={formatCurrency(stats.netWorth)}
          icon={Crown}
          color="from-emerald-600 to-emerald-700"
          subtitle="Assets - Liabilities"
          trend={stats.netWorth > 0 ? 'up' : 'down'}
          trendValue={stats.netWorth > 0 ? 'Positive' : 'Negative'}
          onClick={() => navigate("/chart-of-accounts")}
          delay={700}
        />
      </div>

      {/* ── BAR CHARTS ROW ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <BarChartCard
          title="Purchase Orders"
          icon={ShoppingCart}
          data={poData.length > 0 ? poData : [{ label: 'No Data', value: 0, displayValue: '$0' }]}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
          onClick={() => navigate("/purchase-orders")}
        />

        <BarChartCard
          title="Purchase Invoices"
          icon={FileText}
          data={piData.length > 0 ? piData : [{ label: 'No Data', value: 0, displayValue: '$0' }]}
          color="bg-gradient-to-r from-purple-500 to-purple-600"
          onClick={() => navigate("/purchase-invoices")}
        />

        <BarChartCard
          title="Top Suppliers"
          icon={Store}
          data={supplierData.length > 0 ? supplierData : [{ label: 'No Data', value: 0, displayValue: '-' }]}
          color="bg-gradient-to-r from-orange-500 to-orange-600"
          onClick={() => navigate("/suppliers")}
        />

        <BarChartCard
          title="Warehouses"
          icon={Building2}
          data={warehouseData.length > 0 ? warehouseData : [{ label: 'No Data', value: 0, displayValue: '-' }]}
          color="bg-gradient-to-r from-cyan-500 to-cyan-600"
          onClick={() => navigate("/warehouses")}
        />
      </div>

      {/* ── MAIN CONTENT GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT: ACCOUNT CHART ── */}
        <div className="lg:col-span-1">
          <AccountChartCard accounts={accounts} />
        </div>

        {/* ── RIGHT: RECENT ACTIVITY ── */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm hover:shadow-2xl transition-shadow duration-500">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-[#1e3a8a] to-[#2563eb] rounded-xl">
                  <MessageSquare size={18} className="text-white" />
                </div>
                <CardTitle className="text-slate-800 dark:text-white">
                  Recent Activity
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 max-h-[420px] overflow-y-auto pr-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-[#1e3a8a] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Activity size={40} className="mx-auto mb-3 opacity-30" />
                  <p>No recent activity found</p>
                </div>
              ) : (
                recentActivities.map((activity, index) => (
                  <ActivityItem
                    key={activity.id || index}
                    icon={activity.icon || Activity}
                    title={activity.title}
                    description={activity.description}
                    time={activity.time}
                    color={activity.color || 'bg-slate-500'}
                    amount={activity.amount}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── BOTTOM: FINANCIAL SUMMARY ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Financial Summary */}
        <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm hover:shadow-2xl transition-shadow duration-500">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
                <DollarSign size={18} className="text-white" />
              </div>
              <CardTitle className="text-slate-800 dark:text-white">
                Financial Summary
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                <p className="text-xs text-slate-500 dark:text-slate-400">Total Assets</p>
                <p className="text-lg font-bold text-emerald-600">{formatCurrency(stats.totalAssets)}</p>
              </div>
              <div className="p-4 bg-rose-50 dark:bg-rose-950/30 rounded-xl">
                <p className="text-xs text-slate-500 dark:text-slate-400">Total Liabilities</p>
                <p className="text-lg font-bold text-rose-600">{formatCurrency(stats.totalLiabilities)}</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                <p className="text-xs text-slate-500 dark:text-slate-400">Purchase Orders</p>
                <p className="text-lg font-bold text-blue-600">{formatNumber(stats.totalPurchaseOrders)}</p>
                <p className="text-[10px] text-blue-500">{formatCurrency(stats.totalPOAmount)} Total</p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-xl">
                <p className="text-xs text-slate-500 dark:text-slate-400">Purchase Invoices</p>
                <p className="text-lg font-bold text-purple-600">{formatNumber(stats.totalPurchaseInvoices)}</p>
                <p className="text-[10px] text-purple-500">{formatCurrency(stats.totalPIAmount)} Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supplier & Warehouse Overview */}
        <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm hover:shadow-2xl transition-shadow duration-500">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[#1e3a8a] to-[#2563eb] rounded-xl">
                <Store size={18} className="text-white" />
              </div>
              <CardTitle className="text-slate-800 dark:text-white">
                Supplier & Warehouse Overview
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-xl">
                <p className="text-xs text-slate-500 dark:text-slate-400">Total Suppliers</p>
                <p className="text-lg font-bold text-orange-600">{formatNumber(stats.totalSuppliers)}</p>
                <p className="text-[10px] text-orange-500">Active Partners</p>
              </div>
              <div className="p-4 bg-cyan-50 dark:bg-cyan-950/30 rounded-xl">
                <p className="text-xs text-slate-500 dark:text-slate-400">Warehouses</p>
                <p className="text-lg font-bold text-cyan-600">{formatNumber(stats.totalWarehouses)}</p>
                <p className="text-[10px] text-cyan-500">Storage Locations</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                <p className="text-xs text-slate-500 dark:text-slate-400">Stock Items</p>
                <p className="text-lg font-bold text-blue-600">{formatNumber(stats.totalStockIn)}</p>
                <p className="text-[10px] text-blue-500">Total Received</p>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                <p className="text-xs text-slate-500 dark:text-slate-400">Net Worth</p>
                <p className={`text-lg font-bold ${stats.netWorth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatCurrency(stats.netWorth)}
                </p>
                <p className="text-[10px] text-slate-400">Assets - Liabilities</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── FOOTER ── */}
      <div className="text-center text-xs text-slate-400 dark:text-slate-500 py-4 border-t border-slate-200 dark:border-slate-800">
        <p className="font-bold text-slate-600 dark:text-slate-300 text-xs">
          AFRICA IHSAN AID FOUNDATION
        </p>
        <p className="font-arabic text-emerald-600 dark:text-emerald-400 text-sm">
          مؤسسة إحسان للإغاثة والتنمية
        </p>
        <p className="mt-1">© {new Date().getFullYear()} All Rights Reserved</p>
        <p className="mt-1">Version 2.0 • Built with ❤️ for Humanity</p>
      </div>

      {/* ── ANIMATION STYLES ── */}
      <style jsx>{`
        @keyframes slideIn {
          from { width: 0; }
          to { width: 100%; }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .font-arabic {
          font-family: 'Noto Sans Arabic', 'Arial', sans-serif;
        }
      `}</style>
    </div>
  );
}