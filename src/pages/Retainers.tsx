import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CreditCard, MessageSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useRetainersQuery, useCreateRetainer, useUpdateRetainer, useDeleteRetainer, upsertByClientName } from "@/hooks/queries/useRetainers";
import type { RetainerInsert, RetainerRow } from "@/types/retainers";
import { RetainerFormDialog } from "@/components/Retainers/RetainerFormDialog";
import { CsvPasteDialog } from "@/components/Retainers/CsvPasteDialog";
import { GroupedRetainersSection } from "@/components/Retainers/GroupedRetainersSection";
import { useChurnMetrics } from "@/hooks/useChurnCalculator";
import { ProfitabilityDashboard } from "@/components/Retainers/ProfitabilityDashboard";
import { isMedicalClient } from "@/utils/retainerClassification";

function useSEO() {
  React.useEffect(() => {
    const title = "Retainers | Gestión de clientes retainer";
    const desc = "Administra retainers: ingresos, gastos y márgenes por cliente.";
    document.title = title; // Title tag

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", window.location.href);
  }, []);
}

function exportCsv(rows: RetainerRow[]) {
  const headers = [
    "Cliente",
    "Especialidad",
    "Ingreso neto",
    "Stripe",
    "Articulos/mes",
    "Redes",
    "Total Gastos",
    "WHA Bot",
    "Activo",
    "Notas",
  ];
  const body = rows.map((r) => {
    const row = r as any;
    return [
      r.client_name,
      r.specialty ?? "",
      r.net_income ?? 0,
      row.uses_stripe ? "sí" : "no",
      row.articles_per_month ?? 0,
      r.social_media_cost ?? 0,
      r.total_expenses ?? 0,
      row.has_whatsapp_bot ? "sí" : "no",
      r.active ? "sí" : "no",
      r.notes ?? "",
    ];
  });
  const csv = [headers.join(","), ...body.map((row) => row.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "retainers.csv";
  a.click();
  URL.revokeObjectURL(url);
}

const RetainersPage: React.FC = () => {
  useSEO();
  const { data, isLoading } = useRetainersQuery();
  const createMut = useCreateRetainer();
  const updateMut = useUpdateRetainer();
  const deleteMut = useDeleteRetainer();

  // Ensure we always have an array to avoid runtime errors when data is not an array
  const rows = React.useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "paused" | "lost">("active");
  const [stripeOnly, setStripeOnly] = React.useState(false);
  const [whatsappOnly, setWhatsappOnly] = React.useState(false);
  const specialties = React.useMemo(
    () => Array.from(new Set(rows.map((d) => d.specialty).filter(Boolean))) as string[],
    [rows]
  );
  const [specialty, setSpecialty] = React.useState<string>("ALL");

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<RetainerRow | null>(null);

  const [csvOpen, setCsvOpen] = React.useState(false);

  const filtered = React.useMemo(() => {
    return rows.filter((r) => {
      // Filtro de estado (ahora con 4 opciones)
      const isPaused = r.active && !!(r as any).paused_at;
      const isActiveNotPaused = r.active && !(r as any).paused_at;
      
      if (statusFilter === "active" && !isActiveNotPaused) return false;
      if (statusFilter === "paused" && !isPaused) return false;
      if (statusFilter === "lost" && r.active) return false;
      // statusFilter === "all" muestra todos
      
      // Filtro de Stripe
      if (stripeOnly && !r.uses_stripe) return false;
      
      // Filtro de WhatsApp Bot
      if (whatsappOnly && !r.has_whatsapp_bot) return false;
      
      // Filtro de especialidad
      if (specialty !== "ALL" && (r.specialty ?? "") !== specialty) return false;
      
      // Búsqueda de texto
      if (search) {
        const s = search.toLowerCase();
        if (!r.client_name.toLowerCase().includes(s) && !(r.specialty ?? "").toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [rows, statusFilter, stripeOnly, whatsappOnly, specialty, search]);

  // Separate filtered retainers into Doctor Premier and Webart groups
  const { doctorPremier, webart } = React.useMemo(() => {
    const dp: RetainerRow[] = [];
    const wa: RetainerRow[] = [];
    for (const r of filtered) {
      if (isMedicalClient(r.specialty)) {
        dp.push(r);
      } else {
        wa.push(r);
      }
    }
    return { doctorPremier: dp, webart: wa };
  }, [filtered]);

  const countsBySpecialty = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) {
      const key = (r.specialty ?? "(sin especialidad)") as string;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([specialty, count]) => ({ specialty, count }))
      .sort((a, b) => b.count - a.count);
  }, [filtered]);

  const maxCount = countsBySpecialty[0]?.count ?? 0;
  const getBadgeVariant = (count: number): "success" | "secondary" | "outline" => {
    if (maxCount <= 1) return "secondary";
    const ratio = count / maxCount;
    if (ratio >= 0.66) return "success";
    if (ratio >= 0.33) return "secondary";
    return "outline";
  };

  // Churn (logo churn) state & metrics
  const [monthStr, setMonthStr] = React.useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const selectedDate = React.useMemo(() => new Date(`${monthStr}-01T00:00:00`), [monthStr]);
  const churn = useChurnMetrics(rows, selectedDate);
  const formatPercent = (n: number) =>
    new Intl.NumberFormat("es-PA", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n ?? 0);
  const handleSave = async (values: RetainerInsert | Partial<RetainerRow>) => {
    const payload = values as RetainerInsert;
    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, values: payload });
    } else {
      await createMut.mutateAsync(payload);
    }
    setEditing(null);
  };
  const handleDelete = async (row: RetainerRow) => {
    if (!confirm(`¿Eliminar retainer de ${row.client_name}?`)) return;
    await deleteMut.mutateAsync(row.id);
  };

  const handleCsvImport = async (rows: any[], updateIfExists: boolean) => {
    try {
      for (const r of rows) {
        const insert: RetainerInsert = {
          client_name: r.client_name,
          specialty: r.specialty ?? null,
          net_income: Number(r.net_income ?? 0),
          uses_stripe: r.uses_stripe ?? false,
          articles_per_month: Number(r.articles_per_month ?? 0),
          social_media_cost: Number(r.social_media_cost ?? 0),
          total_expenses: Number(r.total_expenses ?? 0),
          has_whatsapp_bot: r.has_whatsapp_bot ?? false,
          active: r.active ?? true,
          notes: r.notes ?? null,
        } as any;
        if (updateIfExists) {
          await upsertByClientName(insert);
        } else {
          await createMut.mutateAsync(insert);
        }
      }
      toast({ title: "Importación completa", description: `${rows.length} filas procesadas.` });
    } catch (e: any) {
      toast({ title: "Error de importación", description: e?.message ?? "No se pudo importar", variant: "destructive" });
    }
  };

  const formatCurrency = (n: number) => new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD" }).format(n ?? 0);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold">Retainers</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>Agregar retainer</Button>
        <Button variant="outline" onClick={() => setCsvOpen(true)}>Importar CSV (pegar)</Button>
        <Button variant="outline" onClick={() => exportCsv(filtered)}>Exportar CSV</Button>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="text-sm">Buscar</label>
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cliente o especialidad" />
            </div>
            <div>
              <label className="text-sm">Especialidad</label>
              <Select value={specialty} onValueChange={setSpecialty}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas</SelectItem>
                  {specialties.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm">Estado</label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | "active" | "paused" | "lost")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Solo activos</SelectItem>
                  <SelectItem value="paused">Solo pausados</SelectItem>
                  <SelectItem value="lost">Solo perdidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Fila de checkboxes para servicios */}
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="stripeOnly" 
                checked={stripeOnly} 
                onCheckedChange={(checked) => setStripeOnly(!!checked)} 
              />
              <label htmlFor="stripeOnly" className="text-sm flex items-center gap-1">
                <CreditCard className="h-4 w-4" /> Usa Stripe
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox 
                id="whatsappOnly" 
                checked={whatsappOnly} 
                onCheckedChange={(checked) => setWhatsappOnly(!!checked)} 
              />
              <label htmlFor="whatsappOnly" className="text-sm flex items-center gap-1">
                <MessageSquare className="h-4 w-4" /> WhatsApp Bot
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="mt-6 space-y-4">
        {isLoading ? (
          <div>Cargando...</div>
        ) : (
          <>
            <GroupedRetainersSection
              title="Doctor Premier"
              variant="doctor-premier"
              retainers={doctorPremier}
              onEdit={(row) => { setEditing(row); setFormOpen(true); }}
              onDelete={handleDelete}
            />
            <GroupedRetainersSection
              title="Webart"
              variant="webart"
              retainers={webart}
              onEdit={(row) => { setEditing(row); setFormOpen(true); }}
              onDelete={handleDelete}
            />
            {doctorPremier.length === 0 && webart.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron retainers con los filtros actuales.
              </div>
            )}
          </>
        )}
      </section>

      <section className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm mb-4">
              <span className="font-medium">Total de retainers:</span> {filtered.length}
            </div>
            <div>
              <div className="font-medium mb-2">Conteo por especialidad</div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {countsBySpecialty.map((s) => (
                  <div key={s.specialty} className="border rounded-md p-3 flex items-center justify-between">
                    <div>{s.specialty}</div>
                    <Badge variant={getBadgeVariant(s.count)}>{s.count}</Badge>
                  </div>
                ))}
                {countsBySpecialty.length === 0 && (
                  <div className="text-sm text-muted-foreground">Sin datos</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Churn de retainers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3 items-end mb-6">
              <div className="md:col-span-1">
                <label className="text-sm">Mes</label>
                <Input type="month" value={monthStr} onChange={(e) => setMonthStr(e.target.value)} />
              </div>
            </div>

            {/* Logo Churn */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Logo Churn (clientes)</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="border rounded-md p-3">
                  <div className="text-sm text-muted-foreground">Activos al inicio</div>
                  <div className="text-xl font-semibold">{churn.startingActive}</div>
                </div>
                <div className="border rounded-md p-3">
                  <div className="text-sm text-muted-foreground">Nuevos</div>
                  <div className="text-xl font-semibold">{churn.newThisPeriod}</div>
                </div>
                <div className="border rounded-md p-3">
                  <div className="text-sm text-muted-foreground">Churn (bajas)</div>
                  <div className="text-xl font-semibold">{churn.churnedThisPeriod}</div>
                </div>
                <div className="border rounded-md p-3">
                  <div className="text-sm text-muted-foreground">Activos al cierre</div>
                  <div className="text-xl font-semibold">{churn.endingActive}</div>
                </div>
                <div className="border rounded-md p-3">
                  <div className="text-sm text-muted-foreground">Churn rate</div>
                  <div className="text-xl font-semibold">{formatPercent(churn.churnRate)}</div>
                </div>
                <div className="border rounded-md p-3">
                  <div className="text-sm text-muted-foreground">Retention rate</div>
                  <div className="text-xl font-semibold">{formatPercent(churn.retentionRate)}</div>
                </div>
              </div>
            </div>

            {/* Revenue Churn */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Revenue Churn (ingresos)</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="border rounded-md p-3">
                  <div className="text-sm text-muted-foreground">MRR Inicial</div>
                  <div className="text-xl font-semibold">{formatCurrency(churn.startingMRR)}</div>
                </div>
                <div className="border rounded-md p-3">
                  <div className="text-sm text-muted-foreground">MRR Nuevo</div>
                  <div className="text-xl font-semibold text-green-600">{formatCurrency(churn.newMRR)}</div>
                </div>
                <div className="border rounded-md p-3">
                  <div className="text-sm text-muted-foreground">MRR Perdido</div>
                  <div className="text-xl font-semibold text-red-600">{formatCurrency(churn.churnedMRR)}</div>
                </div>
                <div className="border rounded-md p-3">
                  <div className="text-sm text-muted-foreground">MRR Pausado</div>
                  <div className="text-xl font-semibold text-yellow-600">
                    {formatCurrency(churn.pausedMRR)}
                    {churn.pausedCount > 0 && (
                      <span className="text-sm font-normal ml-1">({churn.pausedCount} clientes)</span>
                    )}
                  </div>
                </div>
                <div className="border rounded-md p-3">
                  <div className="text-sm text-muted-foreground">MRR Final</div>
                  <div className="text-xl font-semibold">{formatCurrency(churn.endingMRR)}</div>
                </div>
                <div className="border rounded-md p-3">
                  <div className="text-sm text-muted-foreground">Revenue Churn Rate</div>
                  <div className="text-xl font-semibold">{formatPercent(churn.revenueChurnRate)}</div>
                </div>
                <div className="border rounded-md p-3">
                  <div className="text-sm text-muted-foreground">Net Revenue Retention (NRR)</div>
                  <div className={`text-xl font-semibold ${
                    churn.netRevenueRetention >= 1 
                      ? "text-green-600" 
                      : churn.netRevenueRetention >= 0.9 
                        ? "text-yellow-600" 
                        : "text-red-600"
                  }`}>
                    {formatPercent(churn.netRevenueRetention)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Profitability Dashboard */}
      <section className="mt-6">
        <ProfitabilityDashboard retainers={rows} />
      </section>

      <RetainerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        onSave={handleSave}
      />

      <CsvPasteDialog
        open={csvOpen}
        onOpenChange={setCsvOpen}
        onImport={handleCsvImport}
      />
    </main>
  );
};

export default RetainersPage;
