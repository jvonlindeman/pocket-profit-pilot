import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { parseNumberLike, toBooleanLike } from "@/types/retainers";

type ParsedRow = {
  client_name: string;
  specialty?: string | null;
  net_income?: number;
  uses_stripe?: boolean;
  articles_per_month?: number;
  social_media_cost?: number;
  total_expenses?: number;
  has_whatsapp_bot?: boolean;
  active?: boolean;
  notes?: string | null;
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImport: (rows: ParsedRow[], updateIfExists: boolean) => Promise<void> | void;
}

const headerMap: Record<string, keyof ParsedRow> = {
  "cliente": "client_name",
  "client": "client_name",
  "client_name": "client_name",
  "nombre de cliente": "client_name",
  "especialidad": "specialty",
  "specialty": "specialty",
  "ingreso neto": "net_income",
  "income": "net_income",
  "net income": "net_income",
  "net_income": "net_income",
  "stripe": "uses_stripe",
  "uses_stripe": "uses_stripe",
  "articulos/mes": "articles_per_month",
  "artículos/mes": "articles_per_month",
  "articles_per_month": "articles_per_month",
  "columna de redes": "social_media_cost",
  "redes": "social_media_cost",
  "social media": "social_media_cost",
  "social_media_cost": "social_media_cost",
  "total de gastos": "total_expenses",
  "total gastos": "total_expenses",
  "gastos": "total_expenses",
  "total_expenses": "total_expenses",
  "wha bot": "has_whatsapp_bot",
  "whatsapp": "has_whatsapp_bot",
  "whatsapp bot": "has_whatsapp_bot",
  "has_whatsapp_bot": "has_whatsapp_bot",
  "activo": "active",
  "active": "active",
  "notas": "notes",
  "notes": "notes",
};

function detectDelimiter(firstLine: string): string {
  if (firstLine.includes("\t")) return "\t";
  if (firstLine.includes(";")) return ";";
  return ","; // por defecto coma
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];
  const delimiter = detectDelimiter(lines[0]);

  const headers = lines[0]
    .split(delimiter)
    .map((h) => h.trim().toLowerCase());

  const mappedIdx: Array<{ idx: number; key: keyof ParsedRow } | null> = headers.map((h, i) => {
    const key = headerMap[h];
    return key ? { idx: i, key } : null;
  });

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(delimiter).map((p) => p.trim());
    const row: ParsedRow = { client_name: "" };
    mappedIdx.forEach((m) => {
      if (!m) return;
      const raw = parts[m.idx] ?? "";
      switch (m.key) {
        case "client_name":
          row.client_name = raw;
          break;
        case "specialty":
          row.specialty = raw || null;
          break;
        case "net_income":
          row.net_income = parseNumberLike(raw);
          break;
        case "uses_stripe":
          row.uses_stripe = toBooleanLike(raw);
          break;
        case "articles_per_month":
          row.articles_per_month = parseInt(raw, 10) || 0;
          break;
        case "social_media_cost":
          row.social_media_cost = parseNumberLike(raw);
          break;
        case "total_expenses":
          row.total_expenses = parseNumberLike(raw);
          break;
        case "has_whatsapp_bot":
          row.has_whatsapp_bot = toBooleanLike(raw);
          break;
        case "active":
          row.active = toBooleanLike(raw);
          break;
        case "notes":
          row.notes = raw || null;
          break;
      }
    });
    if (row.client_name) rows.push(row);
  }
  return rows;
}

export const CsvPasteDialog: React.FC<Props> = ({ open, onOpenChange, onImport }) => {
  const [text, setText] = React.useState("");
  const [updateIfExists, setUpdateIfExists] = React.useState(true);

  const rows = React.useMemo(() => parseCsv(text), [text]);

  const handleImport = async () => {
    await onImport(rows, updateIfExists);
    setText("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar por pegado (CSV/TSV)</DialogTitle>
          <DialogDescription>Pega tu tabla con encabezados. Detectamos delimitador automáticamente.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Textarea
            placeholder="Ejemplo: Cliente, Especialidad, Ingreso neto, Columna de redes, Total de gastos, Activo, Notas\nAcme, SEO, 1500, 200, 300, sí, Nota..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[160px]"
          />

          <div className="flex items-center gap-2">
            <Checkbox id="update-if-exists" checked={updateIfExists} onCheckedChange={(v: boolean) => setUpdateIfExists(!!v)} />
            <label htmlFor="update-if-exists" className="text-sm">Actualizar si existe cliente (por nombre)</label>
          </div>

          <div className="text-sm text-muted-foreground">Filas detectadas: {rows.length}</div>

          {rows.length > 0 && (
            <div className="max-h-48 overflow-auto border rounded-md p-2 text-sm">
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    <th>Cliente</th>
                    <th>Especialidad</th>
                    <th>Ingreso</th>
                    <th>Stripe</th>
                    <th>Art/mes</th>
                    <th>Redes</th>
                    <th>Gastos</th>
                    <th>WA Bot</th>
                    <th>Activo</th>
                    <th>Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 10).map((r, idx) => (
                    <tr key={idx}>
                      <td>{r.client_name}</td>
                      <td>{r.specialty ?? ""}</td>
                      <td>{r.net_income ?? 0}</td>
                      <td>{r.uses_stripe ? "Sí" : "No"}</td>
                      <td>{r.articles_per_month ?? 0}</td>
                      <td>{r.social_media_cost ?? 0}</td>
                      <td>{r.total_expenses ?? 0}</td>
                      <td>{r.has_whatsapp_bot ? "Sí" : "No"}</td>
                      <td>{r.active ? "Sí" : "No"}</td>
                      <td>{r.notes ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleImport} disabled={rows.length === 0}>Importar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
