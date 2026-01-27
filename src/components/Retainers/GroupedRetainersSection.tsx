import React from "react";
import { ChevronDown, Stethoscope, Globe } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RetainersTable } from "./RetainersTable";
import type { RetainerRow } from "@/types/retainers";

interface Props {
  title: string;
  variant: "doctor-premier" | "webart";
  retainers: RetainerRow[];
  onEdit: (row: RetainerRow) => void;
  onDelete: (row: RetainerRow) => void;
  defaultOpen?: boolean;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-PA", { 
    style: "currency", 
    currency: "USD", 
    maximumFractionDigits: 0 
  }).format(n ?? 0);
}

export const GroupedRetainersSection: React.FC<Props> = ({
  title,
  variant,
  retainers,
  onEdit,
  onDelete,
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  const totalMRR = React.useMemo(() => {
    return retainers.reduce((sum, r) => sum + (Number(r.net_income) || 0), 0);
  }, [retainers]);

  const clientCount = retainers.length;

  if (clientCount === 0) {
    return null;
  }

  const Icon = variant === "doctor-premier" ? Stethoscope : Globe;
  const accentColor = variant === "doctor-premier" 
    ? "text-blue-600 dark:text-blue-400" 
    : "text-emerald-600 dark:text-emerald-400";
  const bgColor = variant === "doctor-premier"
    ? "bg-blue-50 dark:bg-blue-950/30"
    : "bg-emerald-50 dark:bg-emerald-950/30";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={`w-full flex items-center justify-between p-4 rounded-t-lg border border-b-0 ${bgColor} hover:opacity-90 transition-opacity`}
        >
          <div className="flex items-center gap-3">
            <Icon className={`h-5 w-5 ${accentColor}`} />
            <span className={`font-semibold text-lg ${accentColor}`}>{title}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">{clientCount}</span> clientes
              <span className="mx-2">|</span>
              <span className="font-medium">{formatCurrency(totalMRR)}</span> MRR
            </div>
            <ChevronDown
              className={`h-5 w-5 text-muted-foreground transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border border-t-0 rounded-b-lg overflow-hidden">
          <RetainersTable data={retainers} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
