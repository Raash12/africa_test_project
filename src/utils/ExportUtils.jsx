// src/utils/exportUtils.js
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

/**
 * Premium Export Utility for General Ledger
 */

// Helper to format currency
const formatCurrency = (val) => {
  return `$${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Helper to clean text
const cleanText = (text) => {
  if (!text) return "N/A";
  return text.replace(/[^\w\s\-.,():/]/g, '').trim();
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
    console.warn("Logo not found, proceeding without logo...");
    return null;
  }
};

export const downloadPDF = async (data, title, companyName = "AFRICAN IHSAN FOUNDATION") => {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Load logo
  const logoData = await loadLogo();
  
  let startY = 20;
  
  // === HEADER SECTION ===
  if (logoData) {
    try {
      doc.addImage(logoData, 'JPEG', 14, 10, 20, 20);
    } catch (e) {
      console.warn("Could not add logo", e);
    }
  }

  // Company Name - UPPERCASE
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(30, 58, 138);
  doc.text("AFRICAN IHSAN FOUNDATION", logoData ? 40 : 14, 18);
  
  // Report Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(50, 50, 50);
  doc.text("General Ledger Report", logoData ? 40 : 14, 26);

  // Decorative Line
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.5);
  doc.line(14, 32, pageWidth - 14, 32);
  doc.setLineWidth(0.2);
  doc.line(14, 33, pageWidth - 14, 33);

  // === SUMMARY SECTION ===
  let totalDebit = 0;
  let totalCredit = 0;
  data.forEach(item => {
    totalDebit += Number(item.debit || 0);
    totalCredit += Number(item.credit || 0);
  });

  const netIncome = totalDebit - totalCredit;

  startY = 40;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, startY);
  doc.text(`Total Debits: ${formatCurrency(totalDebit)}`, 14, startY + 5);
  doc.text(`Total Credits: ${formatCurrency(totalCredit)}`, 80, startY + 5);
  doc.text(`Total Entries: ${data.length}`, 14, startY + 10);

  // Net Income
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  if (netIncome > 0) {
    doc.setTextColor(22, 163, 74);
    doc.text(`Net Income (Profit): ${formatCurrency(netIncome)}`, 80, startY + 10);
  } else if (netIncome < 0) {
    doc.setTextColor(220, 38, 38);
    doc.text(`Net Loss: ${formatCurrency(Math.abs(netIncome))}`, 80, startY + 10);
  } else {
    doc.setTextColor(80, 80, 80);
    doc.text(`Net Income: ${formatCurrency(0)}`, 80, startY + 10);
  }

  // === TABLE SECTION ===
  const tableData = data.map(item => [
    item.date || "N/A",
    cleanText(item.accountName || "N/A"),
    cleanText(item.description || "N/A"),
    cleanText(item.counterparty || "-"),
    formatCurrency(Number(item.debit) || 0),
    formatCurrency(Number(item.credit) || 0),
    formatCurrency(Number(item.rowRunningBalance) || 0)
  ]);

  autoTable(doc, {
    startY: 56,
    head: [['Date', 'Account', 'Description', 'Party', 'Debit', 'Credit', 'Balance']],
    body: tableData,
    headStyles: { 
      fillColor: [30, 58, 138], 
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 7,
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    styles: { 
      fontSize: 6.5, 
      cellPadding: 2,
      valign: 'middle',
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 48 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 25, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
    tableWidth: 'auto',
    didDrawPage: function(data) {
      const pageNum = doc.internal.getCurrentPageInfo().pageNumber;
      doc.setFontSize(6);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `AFRICAN IHSAN FOUNDATION - Confidential | Page ${pageNum}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );
      
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
    }
  });

  // Save PDF
  const fileName = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;
  doc.save(`${fileName}.pdf`);
};

export const downloadExcel = async (data, fileName, companyName = "AFRICAN IHSAN FOUNDATION") => {
  // Calculate totals
  const totalDebit = data.reduce((sum, item) => sum + Number(item.debit || 0), 0);
  const totalCredit = data.reduce((sum, item) => sum + Number(item.credit || 0), 0);
  const netIncome = totalDebit - totalCredit;

  // Clean the data
  const cleanData = data.map(item => ({
    Date: item.date || "N/A",
    Account: cleanText(item.accountName || "N/A"),
    Description: cleanText(item.description || "N/A"),
    Counterparty: cleanText(item.counterparty || "-"),
    Debit: Number(item.debit || 0).toFixed(2),
    Credit: Number(item.credit || 0).toFixed(2),
    Balance: Number(item.rowRunningBalance || 0).toFixed(2)
  }));

  // Format data for Excel with better structure
  const exportData = [
    // Header Section
    {
      Date: "",
      Account: "AFRICAN IHSAN FOUNDATION",
      Description: "",
      Counterparty: "",
      Debit: "",
      Credit: "",
      Balance: ""
    },
    {
      Date: "",
      Account: "General Ledger Report",
      Description: "",
      Counterparty: "",
      Debit: "",
      Credit: "",
      Balance: ""
    },
    {
      Date: "",
      Account: "",
      Description: "",
      Counterparty: `Generated: ${new Date().toLocaleString()}`,
      Debit: "",
      Credit: "",
      Balance: ""
    },
    {
      Date: "",
      Account: "",
      Description: "",
      Counterparty: "",
      Debit: "",
      Credit: "",
      Balance: ""
    },
    // Column Headers
    {
      Date: "DATE",
      Account: "ACCOUNT",
      Description: "DESCRIPTION",
      Counterparty: "PARTY",
      Debit: "DEBIT",
      Credit: "CREDIT",
      Balance: "BALANCE"
    },
    // Separator
    {
      Date: "────────────",
      Account: "────────────",
      Description: "────────────",
      Counterparty: "────────────",
      Debit: "────────────",
      Credit: "────────────",
      Balance: "────────────"
    },
    // Data Rows
    ...cleanData,
    // Separator
    {
      Date: "────────────",
      Account: "────────────",
      Description: "────────────",
      Counterparty: "────────────",
      Debit: "────────────",
      Credit: "────────────",
      Balance: "────────────"
    },
    // Summary Section
    {
      Date: "SUMMARY",
      Account: "TOTALS",
      Description: "",
      Counterparty: "",
      Debit: totalDebit.toFixed(2),
      Credit: totalCredit.toFixed(2),
      Balance: ""
    },
    {
      Date: "",
      Account: netIncome > 0 ? "NET INCOME (PROFIT)" : netIncome < 0 ? "NET LOSS" : "NET INCOME",
      Description: "",
      Counterparty: "",
      Debit: "",
      Credit: "",
      Balance: Math.abs(netIncome).toFixed(2)
    },
    {
      Date: "",
      Account: "TOTAL ENTRIES",
      Description: "",
      Counterparty: cleanData.length.toString(),
      Debit: "",
      Credit: "",
      Balance: ""
    },
    {
      Date: "",
      Account: "",
      Description: "",
      Counterparty: "",
      Debit: "",
      Credit: "",
      Balance: ""
    },
    // Footer
    {
      Date: "",
      Account: "──────────── END OF REPORT ────────────",
      Description: "",
      Counterparty: "",
      Debit: "",
      Credit: "",
      Balance: ""
    }
  ];

  const ws = XLSX.utils.json_to_sheet(exportData);

  // Set column widths
  ws['!cols'] = [
    { wch: 16 },  // Date
    { wch: 32 },  // Account
    { wch: 48 },  // Description
    { wch: 24 },  // Counterparty
    { wch: 16 },  // Debit
    { wch: 16 },  // Credit
    { wch: 20 },  // Balance
  ];

  // Set row heights for better readability
  ws['!rows'] = [
    { hpt: 30 }, // Company Name row
    { hpt: 22 }, // Report Title row
    { hpt: 18 }, // Generated date row
    { hpt: 10 }, // Empty row
    { hpt: 18 }, // Column headers
    { hpt: 12 }, // Separator
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "General Ledger");

  // Summary Sheet with better formatting
  const summaryData = [
    { Metric: "COMPANY NAME", Value: "AFRICAN IHSAN FOUNDATION" },
    { Metric: "REPORT TYPE", Value: "General Ledger Report" },
    { Metric: "REPORT DATE", Value: new Date().toLocaleString() },
    { Metric: "", Value: "" },
    { Metric: "FINANCIAL SUMMARY", Value: "" },
    { Metric: "Total Debits", Value: formatCurrency(totalDebit) },
    { Metric: "Total Credits", Value: formatCurrency(totalCredit) },
    { Metric: "Net Income", Value: netIncome > 0 ? `PROFIT: ${formatCurrency(netIncome)}` : netIncome < 0 ? `LOSS: ${formatCurrency(Math.abs(netIncome))}` : formatCurrency(0) },
    { Metric: "", Value: "" },
    { Metric: "STATISTICS", Value: "" },
    { Metric: "Total Entries", Value: cleanData.length },
    { Metric: "", Value: "" },
    { Metric: "CONFIDENTIAL", Value: "For Internal Use Only" },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  // Save Excel file
  const finalFileName = `${fileName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;
  XLSX.writeFile(wb, `${finalFileName}.xlsx`);
};