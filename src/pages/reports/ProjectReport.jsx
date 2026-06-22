// src/pages/reports/ProjectReport.jsx
import React, { useState, useMemo, useEffect } from "react";
import { 
  Search, 
  Loader2, 
  Calendar, 
  FileText, 
  FileSpreadsheet as ExcelIcon,
  Filter,
  X,
  FolderKanban,
  MapPin,
  Package,
  Users,
  Award
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useProjects from "@/hooks/useProjects";
import useGrants from "@/hooks/useGrants";
import { exportProjectsPDF, exportProjectsExcel } from "@/utils/exportProjectUtils";
import logo from "@/assets/logo.jpeg";

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

const formatDateTime = (createdAt) => {
  if (!createdAt) return "N/A";
  const date = createdAt.seconds ? new Date(createdAt.seconds * 1000) : new Date(createdAt);
  if (isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
};

export default function ProjectReport() {
  const { projects = [], grants = [], refreshProjects } = useProjects();
  
  // Filter States
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedGrant, setSelectedGrant] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  // Refresh projects on load
  useEffect(() => {
    refreshProjects();
  }, []);

  // Create grant map for quick lookup
  const grantMap = useMemo(() => {
    const map = {};
    grants.forEach(g => {
      map[g.id] = g.grantName || g.name || "Unknown Grant";
    });
    return map;
  }, [grants]);

  // Enrich projects with grant names and flatten allocations
  const enrichedProjects = useMemo(() => {
    const enriched = [];
    projects.forEach(p => {
      const grantName = grantMap[p.grantId] || "Unknown Grant";
      
      // If project has allocations, create a row for each allocation
      if (p.allocations && p.allocations.length > 0) {
        p.allocations.forEach((alloc, index) => {
          enriched.push({
            id: `${p.id}-${index}`,
            projectId: p.id,
            projectName: p.name || "Unnamed Project",
            grantId: p.grantId,
            grantName: grantName,
            region: alloc.region || "N/A",
            district: alloc.district || "N/A",
            quantity: alloc.qty || alloc.quantity || 0,
            status: p.status || "Active",
            createdAt: p.createdAt,
            date: formatDate(p.createdAt),
            fullDate: formatDateTime(p.createdAt),
            notes: p.notes || ""
          });
        });
      } else {
        // If no allocations, create single row
        enriched.push({
          id: p.id,
          projectId: p.id,
          projectName: p.name || "Unnamed Project",
          grantId: p.grantId,
          grantName: grantName,
          region: "N/A",
          district: "N/A",
          quantity: 0,
          status: p.status || "Active",
          createdAt: p.createdAt,
          date: formatDate(p.createdAt),
          fullDate: formatDateTime(p.createdAt),
          notes: p.notes || ""
        });
      }
    });
    return enriched;
  }, [projects, grantMap]);

  // Get unique values for filters
  const uniqueRegions = useMemo(() => {
    const regions = new Set();
    enrichedProjects.forEach(p => {
      if (p.region && p.region !== "N/A") regions.add(p.region);
    });
    return Array.from(regions).sort();
  }, [enrichedProjects]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set();
    enrichedProjects.forEach(p => {
      if (p.status) statuses.add(p.status);
    });
    return Array.from(statuses).sort();
  }, [enrichedProjects]);

  const availableMonths = useMemo(() => {
    const months = new Set();
    enrichedProjects.forEach(p => {
      if (p.createdAt) {
        const date = p.createdAt.seconds ? new Date(p.createdAt.seconds * 1000) : new Date(p.createdAt);
        if (!isNaN(date.getTime())) {
          months.add(date.getMonth());
        }
      }
    });
    return Array.from(months).sort((a, b) => a - b);
  }, [enrichedProjects]);

  const availableYears = useMemo(() => {
    const years = new Set();
    enrichedProjects.forEach(p => {
      if (p.createdAt) {
        const date = p.createdAt.seconds ? new Date(p.createdAt.seconds * 1000) : new Date(p.createdAt);
        if (!isNaN(date.getTime())) {
          years.add(date.getFullYear());
        }
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [enrichedProjects]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Filter Projects
  const filteredProjects = useMemo(() => {
    let filtered = [...enrichedProjects];

    // Filter by Project Name
    if (selectedProject) {
      filtered = filtered.filter(p => p.projectId === selectedProject);
    }
    
    // Filter by Grant
    if (selectedGrant) {
      filtered = filtered.filter(p => p.grantId === selectedGrant);
    }
    
    // Filter by Region
    if (selectedRegion) {
      filtered = filtered.filter(p => p.region === selectedRegion);
    }
    
    // Filter by Status
    if (selectedStatus) {
      filtered = filtered.filter(p => p.status === selectedStatus);
    }
    
    // Filter by Month & Year
    if (selectedMonth !== "" && selectedYear) {
      filtered = filtered.filter(p => {
        if (!p.createdAt) return false;
        const date = p.createdAt.seconds ? new Date(p.createdAt.seconds * 1000) : new Date(p.createdAt);
        if (isNaN(date.getTime())) return false;
        return date.getMonth() === parseInt(selectedMonth) && 
               date.getFullYear() === parseInt(selectedYear);
      });
    } else if (selectedYear) {
      filtered = filtered.filter(p => {
        if (!p.createdAt) return false;
        const date = p.createdAt.seconds ? new Date(p.createdAt.seconds * 1000) : new Date(p.createdAt);
        if (isNaN(date.getTime())) return false;
        return date.getFullYear() === parseInt(selectedYear);
      });
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(p => 
        p.projectName?.toLowerCase().includes(searchLower) ||
        p.grantName?.toLowerCase().includes(searchLower) ||
        p.region?.toLowerCase().includes(searchLower) ||
        p.district?.toLowerCase().includes(searchLower) ||
        p.status?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => {
      const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
      const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [enrichedProjects, selectedProject, selectedGrant, selectedRegion, selectedStatus, selectedMonth, selectedYear, search]);

  // Calculate Summary Statistics
  const summaryStats = useMemo(() => {
    // Get unique project IDs
    const uniqueProjectIds = new Set(filteredProjects.map(p => p.projectId));
    const totalProjects = uniqueProjectIds.size;
    
    const totalQuantity = filteredProjects.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const totalAllocations = filteredProjects.length;
    const uniqueRegions = new Set(filteredProjects.map(p => p.region).filter(r => r && r !== "N/A")).size;
    
    // Status summary
    const statusSummary = filteredProjects.reduce((acc, p) => {
      const status = p.status || "Unknown";
      if (!acc[status]) {
        acc[status] = 0;
      }
      acc[status]++;
      return acc;
    }, {});

    // Region summary
    const regionSummary = filteredProjects.reduce((acc, p) => {
      const region = p.region || "Unknown";
      if (!acc[region]) {
        acc[region] = { count: 0, quantity: 0 };
      }
      acc[region].count++;
      acc[region].quantity += p.quantity || 0;
      return acc;
    }, {});

    return {
      totalProjects,
      totalQuantity,
      totalAllocations,
      uniqueRegions,
      statusSummary,
      regionSummary,
      averageQuantity: totalAllocations > 0 ? totalQuantity / totalAllocations : 0
    };
  }, [filteredProjects]);

  // Prepare data for export
  const prepareExportData = () => {
    return filteredProjects.map(p => ({
      projectName: p.projectName || "N/A",
      grantName: p.grantName || "N/A",
      region: p.region || "N/A",
      district: p.district || "N/A",
      quantity: p.quantity || 0,
      status: p.status || "Active",
      date: p.fullDate || "N/A",
      notes: p.notes || ""
    }));
  };

  // Export Handlers
  const handleExportPDF = async () => {
    if (filteredProjects.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    setExporting(true);
    try {
      const data = prepareExportData();
      await exportProjectsPDF(data, summaryStats);
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast.error("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (filteredProjects.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    setExporting(true);
    try {
      const data = prepareExportData();
      exportProjectsExcel(data, summaryStats);
      toast.success("Excel exported successfully!");
    } catch (error) {
      console.error("Excel Export Error:", error);
      toast.error("Failed to export Excel");
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setSelectedProject("");
    setSelectedGrant("");
    setSelectedRegion("");
    setSelectedStatus("");
    setSelectedMonth("");
    setSelectedYear(new Date().getFullYear());
    setSearch("");
  };

  // Get selected filter names for display
  const getSelectedFilterNames = () => {
    const filters = [];
    if (selectedProject) {
      const project = projects.find(p => p.id === selectedProject);
      if (project) filters.push(`Project: ${project.name}`);
    }
    if (selectedGrant) {
      const grant = grants.find(g => g.id === selectedGrant);
      if (grant) filters.push(`Grant: ${grant.grantName}`);
    }
    if (selectedRegion) filters.push(`Region: ${selectedRegion}`);
    if (selectedStatus) filters.push(`Status: ${selectedStatus}`);
    if (selectedMonth !== "") filters.push(`Month: ${monthNames[parseInt(selectedMonth)]}`);
    if (selectedYear) filters.push(`Year: ${selectedYear}`);
    return filters;
  };

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
              <p className="text-blue-100 text-sm font-medium">Projects Report - Implementation Tracking</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={handleExportExcel}
              disabled={exporting || filteredProjects.length === 0}
              className="bg-white text-[#1e3a8a] hover:bg-blue-50 font-bold"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ExcelIcon size={16} className="mr-2" />}
              Export Excel
            </Button>
            <Button 
              onClick={handleExportPDF}
              disabled={exporting || filteredProjects.length === 0}
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
                {filteredProjects.length} allocations found
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

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Project Name Filter */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-500">Project</label>
              <select
                className="w-full mt-1 p-2 border rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                <option value="">All Projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Grant Filter */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-500">Grant</label>
              <select
                className="w-full mt-1 p-2 border rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={selectedGrant}
                onChange={(e) => setSelectedGrant(e.target.value)}
              >
                <option value="">All Grants</option>
                {grants.map(g => (
                  <option key={g.id} value={g.id}>{g.grantName}</option>
                ))}
              </select>
            </div>

            {/* Region Filter */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-500">Region</label>
              <select
                className="w-full mt-1 p-2 border rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                <option value="">All Regions</option>
                {uniqueRegions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-500">Status</label>
              <select
                className="w-full mt-1 p-2 border rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">All Status</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
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
              placeholder="Search projects, grants, regions, districts..."
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
              <p className="text-xs font-bold text-blue-600 uppercase">Total Projects</p>
              <FolderKanban size={18} className="text-blue-500" />
            </div>
            <p className="text-2xl font-bold mt-1">{summaryStats.totalProjects}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-emerald-600 uppercase">Total Allocations</p>
              <Package size={18} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-bold mt-1">{summaryStats.totalAllocations}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-purple-600 uppercase">Total Quantity</p>
              <Award size={18} className="text-purple-500" />
            </div>
            <p className="text-2xl font-bold mt-1">{summaryStats.totalQuantity}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-orange-600 uppercase">Unique Regions</p>
              <MapPin size={18} className="text-orange-500" />
            </div>
            <p className="text-2xl font-bold mt-1">{summaryStats.uniqueRegions}</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className="shadow-sm border-0">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#1e3a8a] text-white uppercase text-xs font-bold">
              <tr>
                <th className="p-3">Project</th>
                <th className="p-3">Grant</th>
                <th className="p-3">Region</th>
                <th className="p-3">District</th>
                <th className="p-3 text-center">Quantity</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <FolderKanban size={40} className="text-slate-300" />
                      <p>No projects found matching your filters</p>
                      <Button variant="ghost" size="sm" onClick={resetFilters} className="text-blue-600">
                        Clear Filters
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{project.projectName}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-[#1e3a8a] bg-blue-50 px-2 py-1 rounded text-xs">
                        {project.grantName}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-slate-600">{project.region}</td>
                    <td className="p-3 text-xs text-slate-600">{project.district}</td>
                    <td className="p-3 text-center font-bold text-emerald-600">
                      {project.quantity}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        project.status === "Completed" ? "bg-green-100 text-green-700" :
                        project.status === "In Progress" ? "bg-blue-100 text-blue-700" :
                        project.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                        "bg-slate-100 text-slate-700"
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="p-3 text-xs">
                      <Calendar size={12} className="inline mr-1 text-slate-400" />
                      {project.fullDate}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Region Summary */}
      {Object.keys(summaryStats.regionSummary).length > 0 && (
        <Card className="shadow-sm border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={18} className="text-[#1e3a8a]" />
              <h3 className="font-bold text-sm uppercase text-[#1e3a8a]">Region Summary</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-xs uppercase font-bold">
                  <tr>
                    <th className="p-2">Region</th>
                    <th className="p-2 text-center">Allocations</th>
                    <th className="p-2 text-right">Total Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(summaryStats.regionSummary).map(([region, data]) => (
                    <tr key={region} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2 font-medium">{region}</td>
                      <td className="p-2 text-center">{data.count}</td>
                      <td className="p-2 text-right font-bold text-emerald-600">
                        {data.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Summary */}
      {Object.keys(summaryStats.statusSummary).length > 0 && (
        <Card className="shadow-sm border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users size={18} className="text-[#1e3a8a]" />
              <h3 className="font-bold text-sm uppercase text-[#1e3a8a]">Status Summary</h3>
            </div>
            <div className="flex flex-wrap gap-4">
              {Object.entries(summaryStats.statusSummary).map(([status, count]) => (
                <div key={status} className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-lg">
                  <span className={`w-3 h-3 rounded-full ${
                    status === "Completed" ? "bg-green-500" :
                    status === "In Progress" ? "bg-blue-500" :
                    status === "Pending" ? "bg-yellow-500" :
                    "bg-slate-500"
                  }`}></span>
                  <span className="text-sm font-medium">{status}</span>
                  <span className="text-sm font-bold text-slate-600">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}