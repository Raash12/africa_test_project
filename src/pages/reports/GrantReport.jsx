// src/pages/reports/GrantReport.jsx
import React, { useState, useMemo, useEffect } from "react";
import { 
  Search, 
  Loader2, 
  Calendar, 
  FileText, 
  FileSpreadsheet as ExcelIcon,
  Filter,
  X,
  Award,
  Users,
  DollarSign,
  Package
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useGrants from "@/hooks/useGrants";
import useAccounts from "@/hooks/useAccounts";
import useDonors from "@/hooks/useDonors";
import usePrograms from "@/hooks/usePrograms";
import { exportGrantsPDF, exportGrantsExcel } from "@/utils/exportGrantUtils";
import logo from "@/assets/logo.jpeg";

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val || 0);
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

export default function GrantReport() {
  const { grants = [] } = useGrants();
  const { accounts = [] } = useAccounts();
  const { donors = [] } = useDonors();
  const { programs = [] } = usePrograms();
  
  // Filter States
  const [selectedGrant, setSelectedGrant] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDonor, setSelectedDonor] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  // Create donor map for quick lookup
  const donorMap = useMemo(() => {
    const map = {};
    donors.forEach(d => {
      map[d.id] = d.name || d.donorName || d;
    });
    return map;
  }, [donors]);

  // Create program map for quick lookup
  const programMap = useMemo(() => {
    const map = {};
    programs.forEach(p => {
      map[p.id] = p.name || p.programName || p;
    });
    return map;
  }, [programs]);

  // Enrich grants with donor and program names
  const enrichedGrants = useMemo(() => {
    return grants.map(g => ({
      ...g,
      donorName: g.donorName || donorMap[g.donorId] || "Unknown Donor",
      programName: g.programName || programMap[g.programId] || "Unknown Program"
    }));
  }, [grants, donorMap, programMap]);

  // Get unique months and years from grants
  const availableMonths = useMemo(() => {
    const months = new Set();
    enrichedGrants.forEach(g => {
      if (g.startDate) {
        const date = new Date(g.startDate);
        if (!isNaN(date.getTime())) {
          months.add(date.getMonth());
        }
      }
    });
    return Array.from(months).sort((a, b) => a - b);
  }, [enrichedGrants]);

  const availableYears = useMemo(() => {
    const years = new Set();
    enrichedGrants.forEach(g => {
      if (g.startDate) {
        const date = new Date(g.startDate);
        if (!isNaN(date.getTime())) {
          years.add(date.getFullYear());
        }
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [enrichedGrants]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Filter Grants
  const filteredGrants = useMemo(() => {
    let filtered = [...enrichedGrants];

    // Filter by Grant ID
    if (selectedGrant) {
      filtered = filtered.filter(g => g.id === selectedGrant);
    }
    
    // Filter by Donor Name
    if (selectedDonor) {
      filtered = filtered.filter(g => g.donorName === selectedDonor);
    }
    
    // Filter by Program Name
    if (selectedProgram) {
      filtered = filtered.filter(g => g.programName === selectedProgram);
    }
    
    // Filter by Month & Year
    if (selectedMonth !== "" && selectedYear) {
      filtered = filtered.filter(g => {
        if (!g.startDate) return false;
        const date = new Date(g.startDate);
        if (isNaN(date.getTime())) return false;
        return date.getMonth() === parseInt(selectedMonth) && 
               date.getFullYear() === parseInt(selectedYear);
      });
    } else if (selectedYear) {
      filtered = filtered.filter(g => {
        if (!g.startDate) return false;
        const date = new Date(g.startDate);
        if (isNaN(date.getTime())) return false;
        return date.getFullYear() === parseInt(selectedYear);
      });
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(g => 
        g.grantName?.toLowerCase().includes(searchLower) ||
        g.donorName?.toLowerCase().includes(searchLower) ||
        g.programName?.toLowerCase().includes(searchLower) ||
        g.notes?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [enrichedGrants, selectedGrant, selectedMonth, selectedYear, selectedDonor, selectedProgram, search]);

  // Calculate Summary Statistics
  const summaryStats = useMemo(() => {
    const totalGrants = filteredGrants.length;
    const totalAmount = filteredGrants.reduce((sum, g) => sum + Number(g.amount || 0), 0);
    const totalItems = filteredGrants.reduce((sum, g) => sum + (g.items?.length || 0), 0);
    const uniqueDonors = new Set(filteredGrants.map(g => g.donorName)).size;
    
    const donorSummary = filteredGrants.reduce((acc, g) => {
      const donor = g.donorName || "Unknown";
      if (!acc[donor]) {
        acc[donor] = { count: 0, total: 0 };
      }
      acc[donor].count++;
      acc[donor].total += Number(g.amount || 0);
      return acc;
    }, {});

    return {
      totalGrants,
      totalAmount,
      totalItems,
      uniqueDonors,
      donorSummary,
      averageAmount: totalGrants > 0 ? totalAmount / totalGrants : 0
    };
  }, [filteredGrants]);

  const getAccountNameById = (id) => {
    if (!id) return "Unassigned";
    const found = accounts.find(acc => String(acc.id) === String(id));
    return found ? `[${found.accountCode}] ${found.accountName}` : "Unassigned";
  };

  // Prepare data for export
  const prepareExportData = () => {
    return filteredGrants.map(g => ({
      grantName: g.grantName || "N/A",
      donorName: g.donorName || "N/A",
      programName: g.programName || "N/A",
      receivingAccount: getAccountNameById(g.receivingAccountId),
      revenueAccount: getAccountNameById(g.revenueAccountId),
      amount: Number(g.amount || 0),
      currency: g.currency || "USD",
      items: g.items?.length || 0,
      startDate: formatDate(g.startDate),
      endDate: formatDate(g.endDate),
      status: g.status || "Active",
      notes: g.notes || ""
    }));
  };

  // Export Handlers
  const handleExportPDF = async () => {
    if (filteredGrants.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    setExporting(true);
    try {
      const data = prepareExportData();
      await exportGrantsPDF(data, summaryStats);
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast.error("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (filteredGrants.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    setExporting(true);
    try {
      const data = prepareExportData();
      exportGrantsExcel(data, summaryStats);
      toast.success("Excel exported successfully!");
    } catch (error) {
      console.error("Excel Export Error:", error);
      toast.error("Failed to export Excel");
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setSelectedGrant("");
    setSelectedMonth("");
    setSelectedYear(new Date().getFullYear());
    setSelectedDonor("");
    setSelectedProgram("");
    setSearch("");
  };

  // Get selected filter names for display
  const getSelectedFilterNames = () => {
    const filters = [];
    if (selectedGrant) {
      const grant = enrichedGrants.find(g => g.id === selectedGrant);
      if (grant) filters.push(`Grant: ${grant.grantName}`);
    }
    if (selectedDonor) filters.push(`Donor: ${selectedDonor}`);
    if (selectedProgram) filters.push(`Program: ${selectedProgram}`);
    if (selectedMonth !== "") filters.push(`Month: ${monthNames[parseInt(selectedMonth)]}`);
    if (selectedYear) filters.push(`Year: ${selectedYear}`);
    return filters;
  };

  // Get unique donor names for filter
  const uniqueDonorNames = useMemo(() => {
    const names = new Set();
    enrichedGrants.forEach(g => {
      if (g.donorName) names.add(g.donorName);
    });
    return Array.from(names).sort();
  }, [enrichedGrants]);

  // Get unique program names for filter
  const uniqueProgramNames = useMemo(() => {
    const names = new Set();
    enrichedGrants.forEach(g => {
      if (g.programName) names.add(g.programName);
    });
    return Array.from(names).sort();
  }, [enrichedGrants]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
      
      {/* Premium Header with Logo */}
      <div className="bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <img src={logo} alt="AIF" className="w-12 h-12 object-contain rounded-lg" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white uppercase tracking-tight">African Ihsan Foundation</h1>
              <p className="text-blue-100 text-sm font-medium">Grants Report - Comprehensive Analysis</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={handleExportExcel}
              disabled={exporting || filteredGrants.length === 0}
              className="bg-white text-[#1e3a8a] hover:bg-blue-50 font-bold"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ExcelIcon size={16} className="mr-2" />}
              Export Excel
            </Button>
            <Button 
              onClick={handleExportPDF}
              disabled={exporting || filteredGrants.length === 0}
              className="bg-white text-[#1e3a8a] hover:bg-blue-50 font-bold"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText size={16} className="mr-2" />}
              Export PDF
            </Button>
          </div>
        </div>
        
        {/* Active Filters Display */}
        {getSelectedFilterNames().length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {getSelectedFilterNames().map((filter, index) => (
              <span key={index} className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                {filter}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Filters Card */}
      <Card className="shadow-sm border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-[#1e3a8a]" />
              <h3 className="font-bold text-sm uppercase text-slate-700">Filters</h3>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                {filteredGrants.length} grants found
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetFilters}
              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X size={14} className="mr-1" /> Reset Filters
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Grant Name Filter */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-500">Grant Name</label>
              <select
                className="w-full mt-1 p-2 border rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={selectedGrant}
                onChange={(e) => setSelectedGrant(e.target.value)}
              >
                <option value="">All Grants</option>
                {enrichedGrants.map(g => (
                  <option key={g.id} value={g.id}>{g.grantName}</option>
                ))}
              </select>
            </div>

            {/* Donor Filter */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-500">Donor</label>
              <select
                className="w-full mt-1 p-2 border rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={selectedDonor}
                onChange={(e) => setSelectedDonor(e.target.value)}
              >
                <option value="">All Donors</option>
                {uniqueDonorNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {/* Program Filter */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-500">Program</label>
              <select
                className="w-full mt-1 p-2 border rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
              >
                <option value="">All Programs</option>
                {uniqueProgramNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {/* Month Filter */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-500">Month</label>
              <select
                className="w-full mt-1 p-2 border rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="">All Months</option>
                {availableMonths.map(m => (
                  <option key={m} value={m}>{monthNames[m]}</option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-500">Year</label>
              <select
                className="w-full mt-1 p-2 border rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search grants, donors, programs..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-900 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-blue-600 uppercase">Total Grants</p>
              <Award size={18} className="text-blue-500" />
            </div>
            <p className="text-2xl font-bold mt-1">{summaryStats.totalGrants}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-emerald-600 uppercase">Total Funding</p>
              <DollarSign size={18} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-bold mt-1">{formatCurrency(summaryStats.totalAmount)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-purple-600 uppercase">Unique Donors</p>
              <Users size={18} className="text-purple-500" />
            </div>
            <p className="text-2xl font-bold mt-1">{summaryStats.uniqueDonors}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-orange-600 uppercase">Total Items</p>
              <Package size={18} className="text-orange-500" />
            </div>
            <p className="text-2xl font-bold mt-1">{summaryStats.totalItems}</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className="shadow-sm border-0">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#1e3a8a] text-white uppercase text-xs font-bold">
              <tr>
                <th className="p-3">Grant</th>
                <th className="p-3">Donor</th>
                <th className="p-3">Program</th>
                <th className="p-3">Receiving Account</th>
                <th className="p-3">Revenue Account</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-center">Items</th>
                <th className="p-3">Timeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGrants.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Award size={40} className="text-slate-300" />
                      <p>No grants found matching your filters</p>
                      <Button variant="ghost" size="sm" onClick={resetFilters} className="text-blue-600">
                        Clear Filters
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredGrants.map((grant) => (
                  <tr key={grant.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{grant.grantName}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-[#1e3a8a] bg-blue-50 px-2 py-1 rounded text-xs">
                        {grant.donorName}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-slate-600">{grant.programName}</td>
                    <td className="p-3 text-xs text-slate-600">{getAccountNameById(grant.receivingAccountId)}</td>
                    <td className="p-3 text-xs text-slate-600">{getAccountNameById(grant.revenueAccountId)}</td>
                    <td className="p-3 text-right font-bold text-emerald-600">
                      {formatCurrency(grant.amount)}
                    </td>
                    <td className="p-3 text-center">
                      <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold">
                        {grant.items?.length || 0}
                      </span>
                    </td>
                    <td className="p-3 text-xs">
                      <Calendar size={12} className="inline mr-1 text-slate-400" />
                      {formatDate(grant.startDate)} - {formatDate(grant.endDate)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Donor Summary */}
      {Object.keys(summaryStats.donorSummary).length > 0 && (
        <Card className="shadow-sm border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users size={18} className="text-[#1e3a8a]" />
              <h3 className="font-bold text-sm uppercase text-[#1e3a8a]">Donor Summary</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-xs uppercase font-bold">
                  <tr>
                    <th className="p-2">Donor</th>
                    <th className="p-2 text-center">Number of Grants</th>
                    <th className="p-2 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(summaryStats.donorSummary).map(([donor, data]) => (
                    <tr key={donor} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2 font-medium">{donor}</td>
                      <td className="p-2 text-center">{data.count}</td>
                      <td className="p-2 text-right font-bold text-emerald-600">
                        {formatCurrency(data.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exporting Status */}
      {exporting && (
        <div className="fixed bottom-4 right-4 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Exporting report...</span>
        </div>
      )}
    </div>
  );
}