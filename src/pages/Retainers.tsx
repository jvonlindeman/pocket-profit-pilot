import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useRetainersQuery, useCreateRetainer, useUpdateRetainer, useDeleteRetainer, upsertByClientName } from "@/hooks/queries/useRetainers";
import type { RetainerInsert, RetainerRow } from "@/types/retainers";
import { RetainersTable } from "@/components/Retainers/RetainersTable";
import { RetainerFormDialog } from "@/components/Retainers/RetainerFormDialog";
import { CsvPasteDialog } from "@/components/Retainers/CsvPasteDialog";

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
    "Columna de redes",
    "Total de gastos",
    "Activo",
    "Notas",
  ];
  const body = rows.map((r) => [
    r.client_name,
    r.specialty ?? "",
    r.net_income ?? 0,
    r.social_media_cost ?? 0,
    r.total_expenses ?? 0,
    r.active ? "sí" : "no",
    r.notes ?? "",
  ]);
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
  const [onlyActive, setOnlyActive] = React.useState(true);
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
      if (onlyActive && !r.active) return false;
      if (specialty !== "ALL" && (r.specialty ?? "") !== specialty) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!r.client_name.toLowerCase().includes(s) && !(r.specialty ?? "").toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [rows, onlyActive, specialty, search]);

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
          social_media_cost: Number(r.social_media_cost ?? 0),
          total_expenses: Number(r.total_expenses ?? 0),
          active: r.active ?? true,
          notes: r.notes ?? null,
        };
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
            <div className="flex items-center gap-3">
              <Switch checked={onlyActive} onCheckedChange={setOnlyActive} id="onlyActive" />
              <label htmlFor="onlyActive" className="text-sm">Solo activos</label>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="mt-6">
        {isLoading ? (
          <div>Cargando...</div>
        ) : (
          <RetainersTable
            data={filtered}
            onEdit={(row) => { setEditing(row); setFormOpen(true); }}
            onDelete={handleDelete}
          />
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
