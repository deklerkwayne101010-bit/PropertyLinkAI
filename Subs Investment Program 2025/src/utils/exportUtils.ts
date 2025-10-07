import { InventoryItem, Purchase, Usage } from '../types/stock';
import * as XLSX from 'xlsx';

// Excel Export Functions
export const exportToExcel = (data: any[], filename: string, sheetName: string = 'Sheet1') => {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Convert data to worksheet
  const ws = XLSX.utils.json_to_sheet(data);

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Generate filename with date
  const fileName = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;

  // Write and download the file
  XLSX.writeFile(wb, fileName);
};

// Specific export functions for each data type
export const exportInventoryToExcel = (items: InventoryItem[]) => {
  const exportData = items.map(item => ({
    'Item Name': item.name,
    'Category': item.category,
    'Quantity': item.quantity,
    'Unit': item.unit,
    'Price': item.price,
    'Total Value': (item.quantity * item.price).toFixed(2),
    'Low Stock Threshold': item.lowStockThreshold,
    'Supplier': item.supplier,
    'Location': item.location,
    'Description': item.description || '',
    'Created At': new Date(item.createdAt).toLocaleDateString(),
    'Updated At': new Date(item.updatedAt).toLocaleDateString()
  }));
  exportToExcel(exportData, 'materials_inventory', 'Materials_Inventory');
};

export const exportPurchasesToExcel = (purchases: Purchase[]) => {
  const exportData = purchases.map(purchase => ({
    'Item Name': purchase.itemName,
    'Category': purchase.category,
    'Quantity': purchase.quantity,
    'Unit': purchase.unit,
    'Unit Price': purchase.unitPrice,
    'Total Cost': purchase.totalCost,
    'Supplier': purchase.supplier,
    'Purchase Date': new Date(purchase.purchaseDate).toLocaleDateString(),
    'Invoice Number': purchase.invoiceNumber || 'N/A',
    'Notes': purchase.notes || '',
    'Created At': new Date(purchase.createdAt).toLocaleDateString(),
    'Updated At': new Date(purchase.updatedAt).toLocaleDateString()
  }));
  exportToExcel(exportData, 'material_purchases', 'Material_Purchases');
};

export const exportUsageToExcel = (usage: Usage[]) => {
  const exportData = usage.map(item => ({
    'Item Name': item.itemName,
    'Category': item.category,
    'Quantity Used': item.quantityUsed,
    'Unit': item.unit,
    'Purpose': item.purpose,
    'Location': item.location,
    'Used By': item.usedBy,
    'Usage Date': new Date(item.usageDate).toLocaleDateString(),
    'Remaining Quantity': item.remainingQuantity || 'N/A',
    'Notes': item.notes || '',
    'Created At': new Date(item.createdAt).toLocaleDateString(),
    'Updated At': new Date(item.updatedAt).toLocaleDateString()
  }));
  exportToExcel(exportData, 'material_usage', 'Material_Usage');
};

// Print functionality
export const printTable = (data: any[], title: string) => {
  if (data.length === 0) {
    alert('No data to print');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const headers = Object.keys(data[0]);
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title} - ${new Date().toLocaleDateString()}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; text-align: center; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <table>
        <thead>
          <tr>
            ${headers.map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row =>
            `<tr>${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}</tr>`
          ).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.print();
};