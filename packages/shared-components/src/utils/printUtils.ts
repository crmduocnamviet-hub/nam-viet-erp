/**
 * Utility functions for printing documents
 */

/**
 * In phiếu thu chi
 * @param elementId ID của element cần in (mặc định: 'printable-receipt')
 */
export const printReceipt = (elementId: string = "printable-receipt"): void => {
  const printContent = document.getElementById(elementId);

  if (!printContent) {
    console.error(`Element with ID "${elementId}" not found`);
    return;
  }

  // Create a new window for printing
  const printWindow = window.open("", "_blank", "width=800,height=600");

  if (!printWindow) {
    console.error("Could not open print window");
    return;
  }

  // Get all stylesheets from the current document
  const stylesheets = Array.from(document.styleSheets)
    .map((styleSheet) => {
      try {
        // Try to get CSS rules
        if (styleSheet.cssRules) {
          return Array.from(styleSheet.cssRules)
            .map((rule) => rule.cssText)
            .join("\n");
        }
        // If it's a link stylesheet
        if (styleSheet.href) {
          return `<link rel="stylesheet" href="${styleSheet.href}">`;
        }
      } catch (e) {
        // Cross-origin stylesheets might throw errors
        if (styleSheet.href) {
          return `<link rel="stylesheet" href="${styleSheet.href}">`;
        }
      }
      return "";
    })
    .join("\n");

  // Write content to print window
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>In phiếu</title>
        <style>
          ${stylesheets}

          /* Additional print styles */
          @media print {
            @page {
              size: A4;
              margin: 10mm;
            }

            body {
              margin: 0;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        ${printContent.outerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();

  // Wait for content to load
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      // Close window after printing
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    }, 250);
  };
};

/**
 * Xuất PDF bằng cách sử dụng chức năng in của trình duyệt
 * Người dùng có thể chọn "Save as PDF" trong dialog in
 */
export const exportToPDF = (elementId: string = "printable-receipt"): void => {
  printReceipt(elementId);
};

/**
 * Download HTML content as file
 * @param content HTML content
 * @param filename Tên file
 */
export const downloadHTML = (
  content: string,
  filename: string = "receipt.html",
): void => {
  const blob = new Blob([content], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Copy element content to clipboard
 * @param elementId ID của element cần copy
 */
export const copyToClipboard = async (elementId: string): Promise<boolean> => {
  const element = document.getElementById(elementId);

  if (!element) {
    console.error(`Element with ID "${elementId}" not found`);
    return false;
  }

  try {
    const htmlContent = element.outerHTML;
    await navigator.clipboard.writeText(htmlContent);
    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
};
