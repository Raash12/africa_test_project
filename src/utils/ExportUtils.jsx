import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

/**
 * Premium Export Utility
 */

// Helper to format currency
const formatCurrency = (val) => `$${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

export const downloadPDF = (data, title, openingBalance, companyName) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // 1. Header: Logo & Company Name
  // Note: Ensure your logo is in the public folder as /logo.png
  try {
    doc.addImage("/logo.png", "PNG", 14, 10, 20, 20); 
  } catch (e) {
    console.warn("Logo not found, skipping...");
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(companyName || "Company Name", 40, 20);
  doc.setFontSize(14);
  doc.text(title, 40, 28);

  // 2. Summary Section
  doc.setDrawColor(30, 58, 138); // Navy blue line
  doc.line(14, 35, pageWidth - 14, 35);
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 14, 42);
  doc.text(`Account Opening Balance: ${formatCurrency(openingBalance)}`, 14, 48);

  // 3. Table
  const tableData = data.map(item => [
    item.date,
    item.description,
    item.entries?.map(e => e.accountName).join(", ") || "N/A",
    formatCurrency(item.entries?.reduce((acc, curr) => acc + (Number(curr.debit) || 0), 0)),
    formatCurrency(item.entries?.reduce((acc, curr) => acc + (Number(curr.credit) || 0), 0))
  ]);

  autoTable(doc, {
    startY: 55,
    head: [['Date', 'Description', 'Accounts', 'Debit', 'Credit']],
    body: tableData,
    headStyles: { fillColor: [30, 58, 138], textColor: 255 }, // Premium Blue
    alternateRowStyles: { fillColor: [245, 247, 250] },
    styles: { fontSize: 9, cellPadding: 3 }
  });

  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
};

export const downloadExcel = (data, fileName, openingBalance) => {
  // Format data for Excel
  const exportData = [
    { Date: "SUMMARY", Description: "Opening Balance", Accounts: "", Debit: "", Credit: Number(openingBalance || 0).toFixed(2) },
    ...data.map(item => ({
      Date: item.date,
      Description: item.description,
      Accounts: item.entries?.map(e => e.accountName).join(", ") || "N/A",
      Debit: item.entries?.reduce((acc, curr) => acc + (Number(curr.debit) || 0), 0).toFixed(2),
      Credit: item.entries?.reduce((acc, curr) => acc + (Number(curr.credit) || 0), 0).toFixed(2)
    }))
  ];

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "General Ledger");
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};