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

export const RetainerFormDialog: React.FC<Props> = ({ open, onOpenChange, initial, onSave }) => {
  const [clientName, setClientName] = React.useState(initial?.client_name ?? "");
  const [specialty, setSpecialty] = React.useState(initial?.specialty ?? "");
  const [netIncome, setNetIncome] = React.useState(String(initial?.net_income ?? ""));
  const [socialCost, setSocialCost] = React.useState(String(initial?.social_media_cost ?? ""));
  const [totalExpenses, setTotalExpenses] = React.useState(String(initial?.total_expenses ?? ""));
  const [active, setActive] = React.useState<boolean>(initial?.active ?? true);
  const [notes, setNotes] = React.useState(initial?.notes ?? "");

  React.useEffect(() => {
    if (open) {
      setClientName(initial?.client_name ?? "");
      setSpecialty(initial?.specialty ?? "");
      setNetIncome(String(initial?.net_income ?? ""));
      setSocialCost(String(initial?.social_media_cost ?? ""));
      setTotalExpenses(String(initial?.total_expenses ?? ""));
      setActive(initial?.active ?? true);
      setNotes(initial?.notes ?? "");
    }
  }, [open, initial]);

  const handleSubmit = async () => {
    const payload: any = {
      client_name: clientName.trim(),
      specialty: specialty.trim() || null,
      net_income: parseNumberLike(netIncome),
      social_media_cost: parseNumberLike(socialCost),
      total_expenses: parseNumberLike(totalExpenses),
      active,
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
          <div className="flex items-center gap-3">
            <Switch checked={active} onCheckedChange={setActive} id="active" />
            <label htmlFor="active" className="text-sm">Activo</label>
          </div>
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
