import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { RetainerInsert, RetainerRow } from "@/types/retainers";
import { parseNumberLike } from "@/types/retainers";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: RetainerRow | null;
  onSave: (values: RetainerInsert | Partial<RetainerRow>) => Promise<void> | void;
}

type ClientStatus = "active" | "paused" | "canceled";

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

function getInitialStatus(initial: RetainerRow | null | undefined): ClientStatus {
  if (!initial) return "active";
  if (!initial.active) return "canceled";
  if ((initial as any).paused_at) return "paused";
  return "active";
}

export const RetainerFormDialog: React.FC<Props> = ({ open, onOpenChange, initial, onSave }) => {
  const [clientName, setClientName] = React.useState(initial?.client_name ?? "");
  const [specialty, setSpecialty] = React.useState(initial?.specialty ?? "");
  const [baseIncome, setBaseIncome] = React.useState(String((initial as any)?.base_income ?? initial?.net_income ?? ""));
  const [upsellIncome, setUpsellIncome] = React.useState(String((initial as any)?.upsell_income ?? "0"));
  const [socialCost, setSocialCost] = React.useState(String(initial?.social_media_cost ?? ""));
  const [totalExpenses, setTotalExpenses] = React.useState(String(initial?.total_expenses ?? ""));
  const [usesStripe, setUsesStripe] = React.useState<boolean>((initial as any)?.uses_stripe ?? false);
  const [articlesPerMonth, setArticlesPerMonth] = React.useState(String((initial as any)?.articles_per_month ?? "0"));
  const [hasWhatsappBot, setHasWhatsappBot] = React.useState<boolean>((initial as any)?.has_whatsapp_bot ?? false);
  const [isLegacy, setIsLegacy] = React.useState<boolean>((initial as any)?.is_legacy ?? false);
  const [notes, setNotes] = React.useState(initial?.notes ?? "");
  const [n8nId, setN8nId] = React.useState(initial?.n8n_id ?? "");
  
  // Calculated total MRR
  const totalMRR = parseNumberLike(baseIncome) + parseNumberLike(upsellIncome);
  
  // New status management
  const [status, setStatus] = React.useState<ClientStatus>(getInitialStatus(initial));
  const [pausedAt, setPausedAt] = React.useState<string>(
    (initial as any)?.paused_at ? formatDateForInput((initial as any).paused_at) : getTodayDateString()
  );
  const [canceledAt, setCanceledAt] = React.useState<string>(
    initial?.canceled_at ? formatDateForInput(initial.canceled_at) : getTodayDateString()
  );

  React.useEffect(() => {
    if (open) {
      setClientName(initial?.client_name ?? "");
      setSpecialty(initial?.specialty ?? "");
      setBaseIncome(String((initial as any)?.base_income ?? initial?.net_income ?? ""));
      setUpsellIncome(String((initial as any)?.upsell_income ?? "0"));
      setSocialCost(String(initial?.social_media_cost ?? ""));
      setTotalExpenses(String(initial?.total_expenses ?? ""));
      setUsesStripe((initial as any)?.uses_stripe ?? false);
      setArticlesPerMonth(String((initial as any)?.articles_per_month ?? "0"));
      setHasWhatsappBot((initial as any)?.has_whatsapp_bot ?? false);
      setIsLegacy((initial as any)?.is_legacy ?? false);
      setNotes(initial?.notes ?? "");
      setN8nId(initial?.n8n_id ?? "");
      setStatus(getInitialStatus(initial));
      setPausedAt((initial as any)?.paused_at ? formatDateForInput((initial as any).paused_at) : getTodayDateString());
      setCanceledAt(initial?.canceled_at ? formatDateForInput(initial.canceled_at) : getTodayDateString());
    }
  }, [open, initial]);

  const handleSubmit = async () => {
    const baseIncomeValue = parseNumberLike(baseIncome);
    const upsellIncomeValue = parseNumberLike(upsellIncome);
    
    const payload: any = {
      client_name: clientName.trim(),
      specialty: specialty.trim() || null,
      base_income: baseIncomeValue,
      upsell_income: upsellIncomeValue,
      net_income: baseIncomeValue + upsellIncomeValue, // Calculated from base + upsell
      social_media_cost: parseNumberLike(socialCost),
      total_expenses: parseNumberLike(totalExpenses),
      uses_stripe: usesStripe,
      articles_per_month: parseInt(articlesPerMonth, 10) || 0,
      has_whatsapp_bot: hasWhatsappBot,
      is_legacy: isLegacy,
      notes: notes?.trim() || null,
      n8n_id: n8nId?.trim() || null,
      // Status-based fields
      active: status !== "canceled",
      paused_at: status === "paused" ? new Date(pausedAt).toISOString() : null,
      canceled_at: status === "canceled" ? new Date(canceledAt).toISOString() : null,
    } as RetainerInsert;
    await onSave(payload);
    onOpenChange(false);
  };

  const isValid = clientName.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
            <label className="text-sm font-medium">Ingreso base</label>
            <Input value={baseIncome} onChange={(e) => setBaseIncome(e.target.value)} placeholder="0"
              inputMode="decimal" />
          </div>
          <div>
            <label className="text-sm font-medium">Upsells</label>
            <Input value={upsellIncome} onChange={(e) => setUpsellIncome(e.target.value)} placeholder="0"
              inputMode="decimal" className="border-green-200 focus:border-green-400" />
          </div>
          <div>
            <label className="text-sm font-medium">Total MRR</label>
            <div className="h-10 px-3 py-2 rounded-md bg-muted text-sm font-medium flex items-center">
              ${totalMRR.toLocaleString('es-PA', { maximumFractionDigits: 0 })}
              {parseNumberLike(upsellIncome) > 0 && (
                <span className="ml-2 text-xs text-green-600">(+${parseNumberLike(upsellIncome).toLocaleString('es-PA', { maximumFractionDigits: 0 })} upsell)</span>
              )}
            </div>
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
            <Switch checked={isLegacy} onCheckedChange={setIsLegacy} id="isLegacy" />
            <label htmlFor="isLegacy" className="text-sm text-muted-foreground">Legacy (importado)</label>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">n8n ID</label>
            <Input 
              value={n8nId ?? ""} 
              onChange={(e) => setN8nId(e.target.value)} 
              placeholder="ID único en n8n (ej: 3nuuwjh)"
              className="font-mono text-sm"
            />
          </div>
        </div>

        {/* Status section with radio buttons */}
        <div className="mt-4 border rounded-lg p-4">
          <label className="text-sm font-medium mb-3 block">Estado del cliente</label>
          <RadioGroup value={status} onValueChange={(v) => setStatus(v as ClientStatus)} className="space-y-3">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="active" id="status-active" />
              <Label htmlFor="status-active" className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Activo
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="paused" id="status-paused" />
              <Label htmlFor="status-paused" className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                Pausado
              </Label>
            </div>
            {status === "paused" && (
              <div className="ml-6">
                <label className="text-sm text-muted-foreground">Fecha de pausa</label>
                <Input 
                  type="date" 
                  value={pausedAt} 
                  onChange={(e) => setPausedAt(e.target.value)} 
                  className="mt-1 max-w-[200px]"
                />
              </div>
            )}
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="canceled" id="status-canceled" />
              <Label htmlFor="status-canceled" className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Cancelado
              </Label>
            </div>
            {status === "canceled" && (
              <div className="ml-6">
                <label className="text-sm text-destructive">Fecha de baja</label>
                <Input 
                  type="date" 
                  value={canceledAt} 
                  onChange={(e) => setCanceledAt(e.target.value)} 
                  className="mt-1 max-w-[200px] border-destructive/50"
                />
              </div>
            )}
          </RadioGroup>
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium">Notas</label>
          <Textarea value={notes ?? ""} onChange={(e) => setNotes(e.target.value)} placeholder="Notas opcionales" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!isValid}>{initial ? "Guardar" : "Crear"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
