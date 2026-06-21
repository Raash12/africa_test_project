import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

/**
 * Waxay u dhoofisaa xogta qaab PDF ah
 * @param {Array} columns - Magacyada tiirarka (e.g., ["Magaca", "Imeilka"])
 * @param {Array} data - Xogta la muujinayo (e.g., [["Axmed", "axmed@email.com"]])
 * @param {string} fileName - Magaca feylka marka la soo dejiyo
 */
export const downloadPDF = (columns, data, fileName = "document.pdf") => {
  const doc = new jsPDF();
  
  // Waxay dhalineysaa shaxda PDF-ka dhexdiisa ah (Halkan ayaa la saxay)
  autoTable(doc, {
    head: [columns],
    body: data,
    theme: "striped", // Waxaad u bedeli kartaa 'grid' ama 'plain'
    styles: { font: "helvetica", fontSize: 10 },
  });

  // Waxay soo dejineysaa feylka
  const validFileName = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
  doc.save(validFileName);
};

/**
 * Waxay u dhoofisaa xogta qaab Excel (XLSX) ah
 * @param {Array} data - Liiska xogta ah oo ah Objects (e.g., [{Magaca: "Axmed", Imeil: "axmed@..."}])
 * @param {string} fileName - Magaca feylka marka la soo dejiyo
 */
export const downloadExcel = (data, fileName = "excel-data.xlsx") => {
  // Wuxuu xogta u bedelaa qaab worksheet ah
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  
  // Ku dar worksheet-ka workbook-ga cad
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

  // Waxay soo dejineysaa feylka Excel-ka ah
  const validFileName = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(workbook, validFileName);
};