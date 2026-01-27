import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { ClientMetric, MarginStatus } from "@/hooks/useProfitabilityMetrics";
import { getMarginStatus } from "@/hooks/useProfitabilityMetrics";

interface ProfitabilityTableProps {
  clients: ClientMetric[];
}

type SortKey = "clientName" | "income" | "expenses" | "margin" | "marginPercent";
type SortDir = "asc" | "desc";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const formatPercent = (n: number) =>
  new Intl.NumberFormat("es-PA", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n / 100);

const STATUS_BADGES: Record<MarginStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  high: { label: "Alto", variant: "default" },
  medium: { label: "Medio", variant: "secondary" },
  low: { label: "Bajo", variant: "destructive" },
  negative: { label: "Negativo", variant: "destructive" },
};

export const ProfitabilityTable: React.FC<ProfitabilityTableProps> = ({ clients }) => {
  const [sortKey, setSortKey] = useState<SortKey>("margin");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterStatus, setFilterStatus] = useState<MarginStatus | "all">("all");

  const filtered = useMemo(() => {
    let result = [...clients];
    
    if (filterStatus !== "all") {
      result = result.filter((c) => c.status === filterStatus);
    }

    result.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc" 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      
      return sortDir === "asc" 
        ? (aVal as number) - (bVal as number) 
        : (bVal as number) - (aVal as number);
    });

    return result;
  }, [clients, sortKey, sortDir, filterStatus]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    return sortDir === "asc" 
      ? <ArrowUp className="h-3 w-3 ml-1" /> 
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base">Rentabilidad por Cliente</CardTitle>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as MarginStatus | "all")}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filtrar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="high">Alto (&gt;50%)</SelectItem>
            <SelectItem value="medium">Medio (20-50%)</SelectItem>
            <SelectItem value="low">Bajo (0-20%)</SelectItem>
            <SelectItem value="negative">Negativo</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => toggleSort("clientName")} className="h-auto p-0 font-medium">
                    Cliente <SortIcon columnKey="clientName" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => toggleSort("income")} className="h-auto p-0 font-medium">
                    Ingreso <SortIcon columnKey="income" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => toggleSort("expenses")} className="h-auto p-0 font-medium">
                    Gastos <SortIcon columnKey="expenses" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => toggleSort("margin")} className="h-auto p-0 font-medium">
                    Margen <SortIcon columnKey="margin" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => toggleSort("marginPercent")} className="h-auto p-0 font-medium">
                    Margen% <SortIcon columnKey="marginPercent" />
                  </Button>
                </TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Sin clientes que mostrar
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((client) => {
                  const { color } = getMarginStatus(client.marginPercent);
                  const badge = STATUS_BADGES[client.status];
                  
                  return (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{client.clientName}</div>
                          <div className="text-xs text-muted-foreground">{client.specialty}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(client.income)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(client.expenses)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(client.margin)}</TableCell>
                      <TableCell className="text-right">
                        <span style={{ color }}>{formatPercent(client.marginPercent)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={badge.variant} className="text-xs">
                          {badge.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
