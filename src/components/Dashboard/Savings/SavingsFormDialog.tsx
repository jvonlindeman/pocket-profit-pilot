import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MonthlySavings } from '@/types/financial';
import { format } from 'date-fns';

interface SavingsFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (saving: Omit<MonthlySavings, 'id' | 'created_at' | 'updated_at'>) => Promise<any>;
  editingSaving?: MonthlySavings | null;
  onUpdate?: (id: string, updates: Partial<MonthlySavings>) => Promise<boolean>;
}

export const SavingsFormDialog: React.FC<SavingsFormDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  editingSaving,
  onUpdate,
}) => {
  const [monthYear, setMonthYear] = useState('');
  const [amount, setAmount] = useState('');
  const [depositDate, setDepositDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingSaving) {
      setMonthYear(editingSaving.month_year);
      setAmount(editingSaving.amount.toString());
      setDepositDate(editingSaving.deposit_date);
      setNotes(editingSaving.notes || '');
    } else {
      // Default to current month and date
      const now = new Date();
      setMonthYear(format(now, 'yyyy-MM'));
      setDepositDate(format(now, 'yyyy-MM-dd'));
      setAmount('');
      setNotes('');
    }
  }, [editingSaving, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingSaving && onUpdate) {
        await onUpdate(editingSaving.id, {
          month_year: monthYear,
          amount: parseFloat(amount),
          deposit_date: depositDate,
          notes: notes || null,
        });
      } else {
        await onSave({
          month_year: monthYear,
          amount: parseFloat(amount),
          deposit_date: depositDate,
          notes: notes || null,
        });
      }
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingSaving ? 'Editar Ahorro' : 'Registrar Ahorro Mensual'}
          </DialogTitle>
          <DialogDescription>
            {editingSaving 
              ? 'Actualiza los detalles del ahorro mensual'
              : 'Registra el monto depositado al ahorro este mes'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="month-year">Mes y Año</Label>
            <Input
              id="month-year"
              type="month"
              value={monthYear}
              onChange={(e) => setMonthYear(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="amount">Monto ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <Label htmlFor="deposit-date">Fecha de Depósito</Label>
            <Input
              id="deposit-date"
              type="date"
              value={depositDate}
              onChange={(e) => setDepositDate(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Depósito trimestral, ahorro extra, etc."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : editingSaving ? 'Actualizar' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
