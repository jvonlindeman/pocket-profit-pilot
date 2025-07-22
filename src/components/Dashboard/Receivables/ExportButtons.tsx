
import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import { ExportableInvoice, copyInvoicesToClipboard, exportInvoicesToPDF, exportInvoicesToCSV } from '@/utils/exportUtils';

interface ExportButtonsProps {
  selectedInvoices: ExportableInvoice[];
  disabled?: boolean;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({
  selectedInvoices,
  disabled = false,
}) => {
  const handleCopyToClipboard = async () => {
    const success = await copyInvoicesToClipboard(selectedInvoices);
    if (success) {
      toast.success(`${selectedInvoices.length} facturas copiadas al portapapeles`);
    } else {
      toast.error('Error al copiar al portapapeles');
    }
  };

  const handleExportToPDF = () => {
    try {
      exportInvoicesToPDF(selectedInvoices);
      toast.success(`PDF generado con ${selectedInvoices.length} facturas`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('Error al generar PDF');
    }
  };

  const handleExportToCSV = () => {
    try {
      exportInvoicesToCSV(selectedInvoices);
      toast.success(`CSV descargado con ${selectedInvoices.length} facturas`);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast.error('Error al descargar CSV');
    }
  };

  if (selectedInvoices.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground mr-2">
        Exportar ({selectedInvoices.length} seleccionadas):
      </span>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyToClipboard}
        disabled={disabled}
        className="flex items-center gap-1"
      >
        <Copy className="h-4 w-4" />
        Copiar
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleExportToPDF}
        disabled={disabled}
        className="flex items-center gap-1"
      >
        <FileText className="h-4 w-4" />
        PDF
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleExportToCSV}
        disabled={disabled}
        className="flex items-center gap-1"
      >
        <Download className="h-4 w-4" />
        CSV
      </Button>
    </div>
  );
};
