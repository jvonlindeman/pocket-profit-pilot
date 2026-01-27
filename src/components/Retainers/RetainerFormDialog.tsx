import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { RetainerInsert, RetainerRow } from "@/types/retainers";
import { parseNumberLike } from "@/types/retainers";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: RetainerRow | null;
  onSave: (values: RetainerInsert | Partial<RetainerRow>) => Promise<void> | void;
}

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

function formatDateForInput(dateValue: string | null | undefined): string {
  if (!dateValue) return getTodayDateString();
  try {
    return new Date(dateValue).toISOString().split("T")[0];
  } catch {
    return getTodayDateString();
  }
}

export const RetainerFormDialog: React.FC<Props> = ({ open, onOpenChange, initial, onSave }) => {
  const [clientName, setClientName] = React.useState(initial?.client_name ?? "");
  const [specialty, setSpecialty] = React.useState(initial?.specialty ?? "");
  const [netIncome, setNetIncome] = React.useState(String(initial?.net_income ?? ""));
  const [socialCost, setSocialCost] = React.useState(String(initial?.social_media_cost ?? ""));
  const [totalExpenses, setTotalExpenses] = React.useState(String(initial?.total_expenses ?? ""));
  const [usesStripe, setUsesStripe] = React.useState<boolean>((initial as any)?.uses_stripe ?? false);
  const [articlesPerMonth, setArticlesPerMonth] = React.useState(String((initial as any)?.articles_per_month ?? "0"));
  const [hasWhatsappBot, setHasWhatsappBot] = React.useState<boolean>((initial as any)?.has_whatsapp_bot ?? false);
  const [active, setActive] = React.useState<boolean>(initial?.active ?? true);
  const [isLegacy, setIsLegacy] = React.useState<boolean>((initial as any)?.is_legacy ?? false);
  const [canceledAt, setCanceledAt] = React.useState<string>(
    initial?.canceled_at ? formatDateForInput(initial.canceled_at) : getTodayDateString()
  );
  const [notes, setNotes] = React.useState(initial?.notes ?? "");

  React.useEffect(() => {
    if (open) {
      setClientName(initial?.client_name ?? "");
      setSpecialty(initial?.specialty ?? "");
      setNetIncome(String(initial?.net_income ?? ""));
      setSocialCost(String(initial?.social_media_cost ?? ""));
      setTotalExpenses(String(initial?.total_expenses ?? ""));
      setUsesStripe((initial as any)?.uses_stripe ?? false);
      setArticlesPerMonth(String((initial as any)?.articles_per_month ?? "0"));
      setHasWhatsappBot((initial as any)?.has_whatsapp_bot ?? false);
      setActive(initial?.active ?? true);
      setIsLegacy((initial as any)?.is_legacy ?? false);
      setCanceledAt(initial?.canceled_at ? formatDateForInput(initial.canceled_at) : getTodayDateString());
      setNotes(initial?.notes ?? "");
    }
  }, [open, initial]);

  const handleActiveChange = (newActive: boolean) => {
    setActive(newActive);
    if (!newActive && !initial?.canceled_at) {
      setCanceledAt(getTodayDateString());
    }
  };

  const handleSubmit = async () => {
    const payload: any = {
      client_name: clientName.trim(),
      specialty: specialty.trim() || null,
      net_income: parseNumberLike(netIncome),
      social_media_cost: parseNumberLike(socialCost),
      total_expenses: parseNumberLike(totalExpenses),
      uses_stripe: usesStripe,
      articles_per_month: parseInt(articlesPerMonth, 10) || 0,
      has_whatsapp_bot: hasWhatsappBot,
      active,
      is_legacy: isLegacy,
      canceled_at: active ? null : new Date(canceledAt).toISOString(),
      notes: notes?.trim() || null,
    } as RetainerInsert;
    await onSave(payload);
    onOpenChange(false);
  };

  const isValid = clientName.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Editar retainer" : "Nuevo retainer"}</DialogTitle>
          <DialogDescription>Gestiona los datos del cliente retainer.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Cliente</label>
            <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nombre del cliente" />
          </div>
          <div>
            <label className="text-sm font-medium">Especialidad</label>
            <Input value={specialty ?? ""} onChange={(e) => setSpecialty(e.target.value)} placeholder="Ej. SEO, Ads" />
          </div>
          <div>
            <label className="text-sm font-medium">Ingreso neto</label>
            <Input value={netIncome} onChange={(e) => setNetIncome(e.target.value)} placeholder="0"
              inputMode="decimal" />
          </div>
          <div>
            <label className="text-sm font-medium">Redes (costo)</label>
            <Input value={socialCost} onChange={(e) => setSocialCost(e.target.value)} placeholder="0"
              inputMode="decimal" />
          </div>
          <div>
            <label className="text-sm font-medium">Total de gastos</label>
            <Input value={totalExpenses} onChange={(e) => setTotalExpenses(e.target.value)} placeholder="0"
              inputMode="decimal" />
          </div>
          <div>
            <label className="text-sm font-medium">Artículos/mes</label>
            <Input value={articlesPerMonth} onChange={(e) => setArticlesPerMonth(e.target.value)} placeholder="0"
              inputMode="numeric" />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={usesStripe} onCheckedChange={setUsesStripe} id="usesStripe" />
            <label htmlFor="usesStripe" className="text-sm">Stripe</label>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={hasWhatsappBot} onCheckedChange={setHasWhatsappBot} id="hasWhatsappBot" />
            <label htmlFor="hasWhatsappBot" className="text-sm">WhatsApp Bot</label>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={active} onCheckedChange={handleActiveChange} id="active" />
            <label htmlFor="active" className="text-sm">Activo</label>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={isLegacy} onCheckedChange={setIsLegacy} id="isLegacy" />
            <label htmlFor="isLegacy" className="text-sm text-muted-foreground">Legacy (importado)</label>
          </div>
          {!active && (
            <div>
              <label className="text-sm font-medium text-destructive">Fecha de baja</label>
              <Input 
                type="date" 
                value={canceledAt} 
                onChange={(e) => setCanceledAt(e.target.value)} 
                className="border-destructive/50"
              />
            </div>
          )}
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Notas</label>
            <Textarea value={notes ?? ""} onChange={(e) => setNotes(e.target.value)} placeholder="Notas opcionales" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!isValid}>{initial ? "Guardar" : "Crear"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
