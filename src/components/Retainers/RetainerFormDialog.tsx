import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DollarSign, Settings2, FileText, Activity } from "lucide-react";
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
  
  const totalMRR = parseNumberLike(baseIncome) + parseNumberLike(upsellIncome);
  
  // Calcular contracción en tiempo real para mostrar en UI
  const currentBaseIncome = parseNumberLike(baseIncome);
  const previousBaseIncome = initial 
    ? (Number((initial as any).base_income) || Number(initial.net_income) || 0) 
    : 0;
  const liveContractionDelta = initial && currentBaseIncome < previousBaseIncome 
    ? previousBaseIncome - currentBaseIncome 
    : 0;
  const accumulatedContraction = Number((initial as any)?.contraction_amount) || 0;
  
  const [status, setStatus] = React.useState<ClientStatus>(getInitialStatus(initial));
  const [pausedAt, setPausedAt] = React.useState<string>(
    (initial as any)?.paused_at ? formatDateForInput((initial as any).paused_at) : getTodayDateString()
  );
  const [canceledAt, setCanceledAt] = React.useState<string>(
    initial?.canceled_at ? formatDateForInput(initial.canceled_at) : getTodayDateString()
  );
  const [expectedReactivationDate, setExpectedReactivationDate] = React.useState<string>(
    (initial as any)?.expected_reactivation_date ? formatDateForInput((initial as any).expected_reactivation_date) : ""
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
      setExpectedReactivationDate((initial as any)?.expected_reactivation_date ? formatDateForInput((initial as any).expected_reactivation_date) : "");
    }
  }, [open, initial]);

  const handleSubmit = async () => {
    const baseIncomeValue = parseNumberLike(baseIncome);
    const upsellIncomeValue = parseNumberLike(upsellIncome);
    const newNetIncome = baseIncomeValue + upsellIncomeValue;
    
    // Detectar contracción: si el ingreso BASE bajó respecto al anterior
    // (compara solo base_income, no el total, para permitir upsells simultáneos)
    let contractionDelta = 0;
    if (initial) {
      // Fallback a net_income para clientes legacy sin base_income
      const previousBaseIncome = Number((initial as any).base_income) || Number(initial.net_income) || 0;
      if (baseIncomeValue < previousBaseIncome) {
        contractionDelta = previousBaseIncome - baseIncomeValue;
      }
    }
    
    // Detectar expansión: si el upsell_income subió
    let expansionDelta = 0;
    if (initial) {
      const previousUpsell = Number((initial as any).upsell_income) || 0;
      if (upsellIncomeValue > previousUpsell) {
        expansionDelta = upsellIncomeValue - previousUpsell;
      }
    } else {
      // Nuevo cliente: si tiene upsell desde el inicio, contarlo como expansión
      expansionDelta = upsellIncomeValue;
    }
    
    const payload: any = {
      client_name: clientName.trim(),
      specialty: specialty.trim() || null,
      base_income: baseIncomeValue,
      upsell_income: upsellIncomeValue,
      net_income: newNetIncome,
      social_media_cost: parseNumberLike(socialCost),
      total_expenses: parseNumberLike(totalExpenses),
      uses_stripe: usesStripe,
      articles_per_month: parseInt(articlesPerMonth, 10) || 0,
      has_whatsapp_bot: hasWhatsappBot,
      is_legacy: isLegacy,
      notes: notes?.trim() || null,
      n8n_id: n8nId?.trim() || null,
      active: status !== "canceled",
      paused_at: status === "paused" ? new Date(pausedAt).toISOString() : null,
      canceled_at: status === "canceled" ? new Date(canceledAt).toISOString() : null,
      expected_reactivation_date: status === "paused" && expectedReactivationDate ? expectedReactivationDate : null,
      // Acumular contracción si hubo reducción de tarifa
      contraction_amount: (Number((initial as any)?.contraction_amount) || 0) + contractionDelta,
      // Acumular expansión si hubo incremento de upsell
      expansion_amount: (Number((initial as any)?.expansion_amount) || 0) + expansionDelta,
    } as RetainerInsert;
    await onSave(payload);
    onOpenChange(false);
  };

  const isValid = clientName.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{initial ? "Editar retainer" : "Nuevo retainer"}</DialogTitle>
          <DialogDescription>Gestiona los datos del cliente retainer.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {/* Always visible: Client info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium">Cliente *</Label>
              <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nombre" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium">Especialidad</Label>
              <Input value={specialty ?? ""} onChange={(e) => setSpecialty(e.target.value)} placeholder="SEO, Ads..." className="mt-1" />
            </div>
          </div>

          <Accordion type="multiple" defaultValue={["ingresos", "estado"]} className="w-full">
            {/* Income Section */}
            <AccordionItem value="ingresos">
              <AccordionTrigger className="py-2 text-sm">
                <span className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  Ingresos
                  <span className="text-muted-foreground font-normal ml-2">
                    MRR: ${totalMRR.toLocaleString('es-PA', { maximumFractionDigits: 0 })}
                    {liveContractionDelta > 0 && (
                      <span className="text-red-500 ml-1">
                        (base bajó ${liveContractionDelta.toLocaleString('es-PA', { maximumFractionDigits: 0 })})
                      </span>
                    )}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Ingreso base</Label>
                    <Input value={baseIncome} onChange={(e) => setBaseIncome(e.target.value)} placeholder="0" inputMode="decimal" className="mt-1" />
                    {liveContractionDelta > 0 && (
                      <p className="text-xs text-red-500 mt-1">
                        ↓ Reducción de ${liveContractionDelta.toLocaleString('es-PA', { maximumFractionDigits: 0 })}
                      </p>
                    )}
                    {accumulatedContraction > 0 && liveContractionDelta === 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Contracción acumulada: ${accumulatedContraction.toLocaleString('es-PA', { maximumFractionDigits: 0 })}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs">Upsells</Label>
                    <Input value={upsellIncome} onChange={(e) => setUpsellIncome(e.target.value)} placeholder="0" inputMode="decimal" className="mt-1 border-green-200 focus:border-green-400" />
                  </div>
                  <div>
                    <Label className="text-xs">Redes (costo)</Label>
                    <Input value={socialCost} onChange={(e) => setSocialCost(e.target.value)} placeholder="0" inputMode="decimal" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Total gastos</Label>
                    <Input value={totalExpenses} onChange={(e) => setTotalExpenses(e.target.value)} placeholder="0" inputMode="decimal" className="mt-1" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Services Section */}
            <AccordionItem value="servicios">
              <AccordionTrigger className="py-2 text-sm">
                <span className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-blue-600" />
                  Servicios
                </span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="usesStripe" className="text-sm">Stripe</Label>
                    <Switch checked={usesStripe} onCheckedChange={setUsesStripe} id="usesStripe" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="hasWhatsappBot" className="text-sm">WhatsApp Bot</Label>
                    <Switch checked={hasWhatsappBot} onCheckedChange={setHasWhatsappBot} id="hasWhatsappBot" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="articlesInput" className="text-sm">Artículos/mes</Label>
                    <Input id="articlesInput" value={articlesPerMonth} onChange={(e) => setArticlesPerMonth(e.target.value)} placeholder="0" inputMode="numeric" className="w-20 text-right" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isLegacy" className="text-sm text-muted-foreground">Legacy (importado)</Label>
                    <Switch checked={isLegacy} onCheckedChange={setIsLegacy} id="isLegacy" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Status Section */}
            <AccordionItem value="estado">
              <AccordionTrigger className="py-2 text-sm">
                <span className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-orange-600" />
                  Estado
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                    status === 'active' ? 'bg-green-100 text-green-700' :
                    status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {status === 'active' ? 'Activo' : status === 'paused' ? 'Pausado' : 'Cancelado'}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-3">
                <RadioGroup value={status} onValueChange={(v) => setStatus(v as ClientStatus)} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="active" id="status-active" />
                    <Label htmlFor="status-active" className="flex items-center gap-2 cursor-pointer">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      Activo
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paused" id="status-paused" />
                    <Label htmlFor="status-paused" className="flex items-center gap-2 cursor-pointer">
                      <span className="w-2 h-2 rounded-full bg-yellow-500" />
                      Pausado
                    </Label>
                  </div>
                  {status === "paused" && (
                    <div className="ml-6 space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Fecha de pausa</Label>
                        <Input type="date" value={pausedAt} onChange={(e) => setPausedAt(e.target.value)} className="mt-1 max-w-[180px]" />
                      </div>
                      <div>
                        <Label className="text-xs text-yellow-600 dark:text-yellow-500">
                          ¿Cuándo contactar para reactivar?
                        </Label>
                        <Input 
                          type="date" 
                          value={expectedReactivationDate} 
                          onChange={(e) => setExpectedReactivationDate(e.target.value)} 
                          className="mt-1 max-w-[180px] border-yellow-300 focus:border-yellow-500" 
                          min={getTodayDateString()}
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="canceled" id="status-canceled" />
                    <Label htmlFor="status-canceled" className="flex items-center gap-2 cursor-pointer">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Cancelado
                    </Label>
                  </div>
                  {status === "canceled" && (
                    <div className="ml-6">
                      <Label className="text-xs text-destructive">Fecha de baja</Label>
                      <Input type="date" value={canceledAt} onChange={(e) => setCanceledAt(e.target.value)} className="mt-1 max-w-[180px] border-destructive/50" />
                    </div>
                  )}
                </RadioGroup>
              </AccordionContent>
            </AccordionItem>

            {/* Notes Section */}
            <AccordionItem value="notas">
              <AccordionTrigger className="py-2 text-sm">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Notas y Config
                </span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-3">
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">n8n ID</Label>
                    <Input value={n8nId ?? ""} onChange={(e) => setN8nId(e.target.value)} placeholder="ID en n8n" className="mt-1 font-mono text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Notas</Label>
                    <Textarea value={notes ?? ""} onChange={(e) => setNotes(e.target.value)} placeholder="Notas opcionales" className="mt-1" rows={2} />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <DialogFooter className="flex-shrink-0 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!isValid}>{initial ? "Guardar" : "Crear"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};