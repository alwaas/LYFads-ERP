import { useState } from "react";
import { Download, FileText, Table, FileSpreadsheet } from "lucide-react";
import toast from "react-hot-toast";

import { exportReport } from "../../services/report.service";

type ExportFormat = "csv" | "excel" | "pdf";

interface ExportButtonProps {
  reportType: string;
  params?: Record<string, any>;
  allowedFormats?: ExportFormat[];
}

const formatIcons: Record<ExportFormat, any> = {
  csv: Table,
  excel: FileSpreadsheet,
  pdf: FileText,
};

const formatLabels: Record<ExportFormat, string> = {
  csv: "CSV",
  excel: "Excel",
  pdf: "PDF",
};

const ExportButton = ({ reportType, params = {}, allowedFormats = ["csv", "excel", "pdf"] }: ExportButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (format: ExportFormat) => {
    setExporting(format);
    try {
      const blob = await exportReport(reportType, format, params);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reportType}-export-${new Date().toISOString().slice(0, 10)}.${format === "excel" ? "xlsx" : format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(`Exported ${reportType} as ${format.toUpperCase()} successfully`);
    } catch (error) {
      toast.error(`Failed to export ${reportType}`);
    } finally {
      setExporting(null);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <Download className="h-4 w-4" />
        Export
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-slate-200 bg-white shadow-lg">
            <div className="py-1">
              {allowedFormats.map((format) => {
                const Icon = formatIcons[format];
                return (
                  <button
                    key={format}
                    onClick={() => handleExport(format)}
                    disabled={exporting === format}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <Icon className="h-4 w-4" />
                    {formatLabels[format]}
                    {exporting === format && <span className="ml-auto text-xs text-slate-400">...</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportButton;
