import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReceivablesSelection } from '@/types/financial';
import { formatAsCurrency } from '@/utils/financialUtils';

export interface ExportableInvoice {
  customer_name: string;
  company_name?: string;
  amount: number;
}

/**
 * Copy selected invoices to clipboard in formatted text
 */
export const copyInvoicesToClipboard = async (invoices: ExportableInvoice[]): Promise<boolean> => {
  try {
    const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
    const currentDate = new Date().toLocaleDateString('es-PA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let content = `FACTURAS SELECCIONADAS - ZOHO BOOKS\n`;
    content += `Fecha de Exportación: ${currentDate}\n`;
    content += `Total de Facturas: ${invoices.length}\n`;
    content += `Total Seleccionado: ${formatAsCurrency(totalAmount)}\n\n`;
    content += `DETALLE DE FACTURAS:\n`;
    content += `${'='.repeat(50)}\n\n`;

    invoices.forEach((invoice, index) => {
      content += `${index + 1}. Cliente: ${invoice.customer_name}\n`;
      if (invoice.company_name) {
        content += `   Compañía: ${invoice.company_name}\n`;
      }
      content += `   Monto: ${formatAsCurrency(invoice.amount)}\n\n`;
    });

    content += `${'='.repeat(50)}\n`;
    content += `TOTAL GENERAL: ${formatAsCurrency(totalAmount)}`;

    await navigator.clipboard.writeText(content);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
};

/**
 * Export selected invoices to PDF
 */
export const exportInvoicesToPDF = (invoices: ExportableInvoice[]): void => {
  try {
    const doc = new jsPDF();
    const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
    const currentDate = new Date().toLocaleDateString('es-PA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('FACTURAS SELECCIONADAS', 20, 25);
    doc.text('ZOHO BOOKS', 20, 35);

    // Date and summary
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Fecha de Exportación: ${currentDate}`, 20, 50);
    doc.text(`Total de Facturas: ${invoices.length}`, 20, 60);
    doc.text(`Total Seleccionado: ${formatAsCurrency(totalAmount)}`, 20, 70);

    // Table data
    const tableData = invoices.map((invoice, index) => [
      (index + 1).toString(),
      invoice.customer_name,
      invoice.company_name || 'N/A',
      formatAsCurrency(invoice.amount),
    ]);

    // Add table using the correct autoTable syntax
    autoTable(doc, {
      head: [['#', 'Cliente', 'Compañía', 'Monto']],
      body: tableData,
      startY: 85,
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      foot: [['', '', 'TOTAL:', formatAsCurrency(totalAmount)]],
      footStyles: {
        fillColor: [66, 66, 66],
        textColor: 255,
        fontStyle: 'bold',
      },
    });

    // Save the PDF
    const fileName = `facturas_zoho_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('No se pudo generar el PDF');
  }
};

/**
 * Export selected invoices to CSV
 */
export const exportInvoicesToCSV = (invoices: ExportableInvoice[]): void => {
  const headers = ['Cliente', 'Compañía', 'Monto', 'Fecha_Exportación'];
  const currentDate = new Date().toISOString().split('T')[0];
  
  const csvContent = [
    headers.join(','),
    ...invoices.map(invoice => [
      `"${invoice.customer_name}"`,
      `"${invoice.company_name || 'N/A'}"`,
      invoice.amount.toString(),
      currentDate,
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `facturas_zoho_${currentDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
