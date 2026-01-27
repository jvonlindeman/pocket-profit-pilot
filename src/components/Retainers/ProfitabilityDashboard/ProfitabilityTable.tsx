import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowUpDown, ArrowUp, ArrowDown, CreditCard, Info } from "lucide-react";
import type { ClientMetric, MarginStatus } from "@/hooks/useProfitabilityMetrics";
import { getMarginStatus } from "@/hooks/useProfitabilityMetrics";

interface ProfitabilityTableProps {
  clients: ClientMetric[];
  hasRealData?: boolean;
}

type SortKey = "clientName" | "income" | "expenses" | "margin" | "marginPercent" | "stripeFees" | "realProfit" | "realMarginPercent";
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

export const ProfitabilityTable: React.FC<ProfitabilityTableProps> = ({ clients, hasRealData = false }) => {
  const [sortKey, setSortKey] = useState<SortKey>(hasRealData ? "realProfit" : "margin");
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
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Rentabilidad por Cliente</CardTitle>
          {hasRealData && (
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                  Datos reales
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Fees y gastos calculados con datos del dashboard financiero</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
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
                {hasRealData && (
                  <TableHead className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => toggleSort("stripeFees")} className="h-auto p-0 font-medium">
                      <CreditCard className="h-3 w-3 mr-1" />
                      Fees <SortIcon columnKey="stripeFees" />
                    </Button>
                  </TableHead>
                )}
                <TableHead className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => toggleSort("expenses")} className="h-auto p-0 font-medium">
                    Gastos <SortIcon columnKey="expenses" />
                  </Button>
                </TableHead>
                {hasRealData && (
                  <TableHead className="text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-auto p-0 font-medium">
                          OPEX+Zoho <Info className="h-3 w-3 ml-1 opacity-50" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">OPEX y gastos Zoho prorrateados por participación en ingresos</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                )}
                <TableHead className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => toggleSort(hasRealData ? "realProfit" : "margin")} className="h-auto p-0 font-medium">
                    {hasRealData ? "Profit Real" : "Margen"} <SortIcon columnKey={hasRealData ? "realProfit" : "margin"} />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => toggleSort(hasRealData ? "realMarginPercent" : "marginPercent")} className="h-auto p-0 font-medium">
                    % <SortIcon columnKey={hasRealData ? "realMarginPercent" : "marginPercent"} />
                  </Button>
                </TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={hasRealData ? 8 : 6} className="text-center text-muted-foreground py-8">
                    Sin clientes que mostrar
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((client) => {
                  const displayMarginPercent = hasRealData ? client.realMarginPercent : client.marginPercent;
                  const { color } = getMarginStatus(displayMarginPercent);
                  const badge = STATUS_BADGES[client.status];
                  
                  return (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1">
                          <div>
                            <div className="flex items-center gap-1">
                              {client.clientName}
                              {client.usesStripe && (
                                <CreditCard className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">{client.specialty}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(client.income)}</TableCell>
                      {hasRealData && (
                        <TableCell className="text-right text-orange-600">
                          {client.usesStripe ? formatCurrency(client.stripeFees) : "—"}
                        </TableCell>
                      )}
                      <TableCell className="text-right">{formatCurrency(client.expenses)}</TableCell>
                      {hasRealData && (
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(client.opexShare + client.zohoExpenseShare)}
                        </TableCell>
                      )}
                      <TableCell className="text-right font-medium">
                        {formatCurrency(hasRealData ? client.realProfit : client.margin)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span style={{ color }}>{formatPercent(displayMarginPercent)}</span>
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
