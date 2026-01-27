import React from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Archive, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RetainerRow } from "@/types/retainers";

interface Props {
  clients: RetainerRow[];
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-PA", { 
    style: "currency", 
    currency: "USD", 
    maximumFractionDigits: 0 
  }).format(n ?? 0);
}

export const CanceledClientsHistory: React.FC<Props> = ({ clients }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  if (clients.length === 0) return null;
  
  const totalLostMRR = clients.reduce((sum, c) => sum + (c.net_income ?? 0), 0);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Archive className="h-4 w-4" />
            <span className="text-sm">
              Historial de bajas ({clients.length} {clients.length === 1 ? 'cliente' : 'clientes'})
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {formatCurrency(totalLostMRR)} MRR perdido
            </span>
            <ChevronDown className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )} />
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Cliente</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Fecha de baja</TableHead>
                <TableHead className="text-right">MRR perdido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map(c => (
                <TableRow key={c.id} className="opacity-60 hover:opacity-80">
                  <TableCell className="font-medium">{c.client_name}</TableCell>
                  <TableCell>{c.specialty ?? "-"}</TableCell>
                  <TableCell>
                    {c.canceled_at 
                      ? new Date(c.canceled_at).toLocaleDateString('es-PA', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })
                      : "-"
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(c.net_income ?? 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
