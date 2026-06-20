// src/utils/exportProjectUtils.js
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// Helper to load logo
const loadLogo = async () => {
  try {
    const paths = [
      '/src/assets/logo.jpeg',
      '/assets/logo.jpeg',
      '/logo.jpeg',
      '/src/assets/logo.png',
      '/assets/logo.png',
      '/logo.png'
    ];
    
    for (const path of paths) {
      try {
        const response = await fetch(path);
        if (response.ok) {
          const blob = await response.blob();
          return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        }
      } catch (e) {
        continue;
      }
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Export Projects to PDF with Logo - A4 Portrait
 */
export const exportProjectsPDF = async (data, summaryStats) => {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Load and add logo
  const logoData = await loadLogo();
  let textX = 14;
  
  if (logoData) {
    try {
      doc.addImage(logoData, 'JPEG', 14, 8, 20, 20);
      textX = 40;
    } catch (e) {
      console.warn("Could not add logo", e);
    }
  }

  // Company Name - Smaller font
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 58, 138);
  doc.text("AFRICAN IHSAN FOUNDATION", textX, 16);
  
  // Report Title - Smaller font
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.text("Projects Report", textX, 23);

  // Decorative Line
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.3);
  doc.line(14, 28, pageWidth - 14, 28);
  doc.setLineWidth(0.1);
  doc.line(14, 29, pageWidth - 14, 29);

  // Summary - Smaller font
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  let yPos = 35;
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPos);
  yPos += 5;
  doc.text(`Total Projects: ${summaryStats.totalProjects || 0}`, 14, yPos);
  doc.text(`Total Allocations: ${summaryStats.totalAllocations || 0}`, 70, yPos);
  doc.text(`Total Quantity: ${summaryStats.totalQuantity || 0}`, 140, yPos);

  // Table - Smaller fonts and compact
  const tableData = data.map(item => [
    item.projectName || "N/A",
    item.grantName || "N/A",
    item.region || "N/A",
    item.district || "N/A",
    (item.quantity || 0).toString(),
    item.status || "Active",
    item.date || "N/A"
  ]);

  autoTable(doc, {
    startY: 48,
    head: [['Project', 'Grant', 'Region', 'District', 'Qty', 'Status', 'Date']],
    body: tableData,
    headStyles: { 
      fillColor: [30, 58, 138], 
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 6,
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    styles: { 
      fontSize: 6, 
      cellPadding: 1.5,
      lineHeight: 1.2,
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 25 },
      2: { cellWidth: 22 },
      3: { cellWidth: 22 },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 28, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
    tableWidth: 'auto',
    didDrawPage: function(data) {
      // Footer
      doc.setFontSize(5);
      doc.setTextColor(150, 150, 150);
      doc.text(
        'AFRICAN IHSAN FOUNDATION - Confidential',
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );
      
      // Small footer line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.1);
      doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
    }
  });

  doc.save(`Project_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  return true;
};

/**
 * Export Projects to Excel
 */
export const exportProjectsExcel = (data, summaryStats) => {
  const excelData = [
    {
      "Report": "AFRICAN IHSAN FOUNDATION",
      "Project": "Projects Report",
      "Grant": "",
      "Region": "",
      "District": "",
      "Quantity": "",
      "Status": "",
      "Date": ""
    },
    {
      "Report": "",
      "Project": `Generated: ${new Date().toLocaleString()}`,
      "Grant": "",
      "Region": "",
      "District": "",
      "Quantity": "",
      "Status": "",
      "Date": ""
    },
    {
      "Report": "─────────────────",
      "Project": "─────────────────",
      "Grant": "─────────────────",
      "Region": "─────────────────",
      "District": "─────────────────",
      "Quantity": "─────────────────",
      "Status": "─────────────────",
      "Date": "─────────────────"
    },
    ...data.map(item => ({
      "Report": "",
      "Project": item.projectName || "N/A",
      "Grant": item.grantName || "N/A",
      "Region": item.region || "N/A",
      "District": item.district || "N/A",
      "Quantity": item.quantity || 0,
      "Status": item.status || "Active",
      "Date": item.date || "N/A"
    })),
    {
      "Report": "─────────────────",
      "Project": "─────────────────",
      "Grant": "─────────────────",
      "Region": "─────────────────",
      "District": "─────────────────",
      "Quantity": "─────────────────",
      "Status": "─────────────────",
      "Date": "─────────────────"
    },
    {
      "Report": "SUMMARY",
      "Project": "TOTAL PROJECTS",
      "Grant": (summaryStats.totalProjects || 0).toString(),
      "Region": "",
      "District": "",
      "Quantity": (summaryStats.totalQuantity || 0).toString(),
      "Status": "",
      "Date": ""
    },
    {
      "Report": "",
      "Project": "TOTAL ALLOCATIONS",
      "Grant": (summaryStats.totalAllocations || 0).toString(),
      "Region": "",
      "District": "",
      "Quantity": "",
      "Status": "",
      "Date": ""
    },
    {
      "Report": "",
      "Project": "UNIQUE REGIONS",
      "Grant": (summaryStats.uniqueRegions || 0).toString(),
      "Region": "",
      "District": "",
      "Quantity": "",
      "Status": "",
      "Date": ""
    }
  ];

  const ws = XLSX.utils.json_to_sheet(excelData);
  ws['!cols'] = [
    { wch: 20 }, // Report
    { wch: 35 }, // Project
    { wch: 30 }, // Grant
    { wch: 22 }, // Region
    { wch: 22 }, // District
    { wch: 15 }, // Quantity
    { wch: 20 }, // Status
    { wch: 25 }, // Date
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Projects Report");
  
  XLSX.writeFile(wb, `Project_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  return true;
};