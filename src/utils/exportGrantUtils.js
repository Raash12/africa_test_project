// src/utils/exportGrantUtils.js
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const formatCurrency = (val) => {
  return `$${Number(val || 0).toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

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
 * Export Grants to PDF with Logo - A4 Portrait
 */
export const exportGrantsPDF = async (data, summaryStats) => {
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
  doc.text("Grants Report", textX, 23);

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
  doc.text(`Total Grants: ${summaryStats.totalGrants || 0}`, 14, yPos);
  doc.text(`Total Funding: ${formatCurrency(summaryStats.totalAmount || 0)}`, 70, yPos);
  doc.text(`Unique Donors: ${summaryStats.uniqueDonors || 0}`, 140, yPos);

  // Table - Smaller fonts and compact
  const tableData = data.map(item => [
    item.grantName || "N/A",
    item.donorName || "N/A",
    item.programName || "N/A",
    formatCurrency(item.amount || 0),
    (item.items || 0).toString(),
    item.startDate || "N/A"
  ]);

  autoTable(doc, {
    startY: 48,
    head: [['Grant', 'Donor', 'Program', 'Amount', 'Items', 'Start Date']],
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
      0: { cellWidth: 35 },
      1: { cellWidth: 30 },
      2: { cellWidth: 30 },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 25, halign: 'center' },
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

  doc.save(`Grant_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  return true;
};

/**
 * Export Grants to Excel
 */
export const exportGrantsExcel = (data, summaryStats) => {
  const excelData = [
    {
      "Report": "AFRICAN IHSAN FOUNDATION",
      "Grant": "Grants Report",
      "Donor": "",
      "Program": "",
      "Amount": "",
      "Items": "",
      "Start Date": "",
      "End Date": "",
      "Status": ""
    },
    {
      "Report": "",
      "Grant": `Generated: ${new Date().toLocaleString()}`,
      "Donor": "",
      "Program": "",
      "Amount": "",
      "Items": "",
      "Start Date": "",
      "End Date": "",
      "Status": ""
    },
    {
      "Report": "─────────────────",
      "Grant": "─────────────────",
      "Donor": "─────────────────",
      "Program": "─────────────────",
      "Amount": "─────────────────",
      "Items": "─────────────────",
      "Start Date": "─────────────────",
      "End Date": "─────────────────",
      "Status": "─────────────────"
    },
    ...data.map(item => ({
      "Report": "",
      "Grant": item.grantName || "N/A",
      "Donor": item.donorName || "N/A",
      "Program": item.programName || "N/A",
      "Amount": (item.amount || 0).toFixed(2),
      "Items": item.items || 0,
      "Start Date": item.startDate || "N/A",
      "End Date": item.endDate || "N/A",
      "Status": item.status || "Active"
    })),
    {
      "Report": "─────────────────",
      "Grant": "─────────────────",
      "Donor": "─────────────────",
      "Program": "─────────────────",
      "Amount": "─────────────────",
      "Items": "─────────────────",
      "Start Date": "─────────────────",
      "End Date": "─────────────────",
      "Status": "─────────────────"
    },
    {
      "Report": "SUMMARY",
      "Grant": "TOTAL GRANTS",
      "Donor": (summaryStats.totalGrants || 0).toString(),
      "Program": "",
      "Amount": (summaryStats.totalAmount || 0).toFixed(2),
      "Items": (summaryStats.totalItems || 0).toString(),
      "Start Date": "",
      "End Date": "",
      "Status": ""
    },
    {
      "Report": "",
      "Grant": "UNIQUE DONORS",
      "Donor": (summaryStats.uniqueDonors || 0).toString(),
      "Program": "",
      "Amount": "",
      "Items": "",
      "Start Date": "",
      "End Date": "",
      "Status": ""
    },
    {
      "Report": "",
      "Grant": "AVERAGE AMOUNT",
      "Donor": formatCurrency(summaryStats.averageAmount || 0),
      "Program": "",
      "Amount": "",
      "Items": "",
      "Start Date": "",
      "End Date": "",
      "Status": ""
    }
  ];

  const ws = XLSX.utils.json_to_sheet(excelData);
  ws['!cols'] = [
    { wch: 20 }, // Report
    { wch: 35 }, // Grant
    { wch: 30 }, // Donor
    { wch: 25 }, // Program
    { wch: 16 }, // Amount
    { wch: 12 }, // Items
    { wch: 16 }, // Start Date
    { wch: 16 }, // End Date
    { wch: 14 }, // Status
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Grants Report");
  
  XLSX.writeFile(wb, `Grant_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  return true;
};