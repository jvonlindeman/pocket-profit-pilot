import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MonthlyBalance } from '@/types/financial';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface InitialBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDate: Date;
  onBalanceSaved: (
    balance: number, 
    opexAmount?: number, 
    itbmAmount?: number, 
    profitPercentage?: number,
    taxReservePercentage?: number,
    includeZohoFiftyPercent?: boolean,
    notes?: string
  ) => void;
  currentBalance?: MonthlyBalance | null;
}

const InitialBalanceDialog: React.FC<InitialBalanceDialogProps> = ({
  open,
  onOpenChange,
  currentDate,
  onBalanceSaved,
  currentBalance
}) => {
  const [balance, setBalance] = useState('');
  const [opexAmount, setOpexAmount] = useState('35');
  const [itbmAmount, setItbmAmount] = useState('0');
  const [profitPercentage, setProfitPercentage] = useState('1');
  const [taxReservePercentage, setTaxReservePercentage] = useState('5');
  const [includeZohoFiftyPercent, setIncludeZohoFiftyPercent] = useState(true);
  const [notes, setNotes] = useState('');

  // Load existing values when dialog opens
  useEffect(() => {
    if (open && currentBalance) {
      setBalance(currentBalance.balance.toString());
      setOpexAmount((currentBalance.opex_amount ?? 35).toString());
      setItbmAmount((currentBalance.itbm_amount ?? 0).toString());
      setProfitPercentage((currentBalance.profit_percentage ?? 1).toString());
      setTaxReservePercentage((currentBalance.tax_reserve_percentage ?? 5).toString());
      setIncludeZohoFiftyPercent(currentBalance.include_zoho_fifty_percent ?? true);
      setNotes(currentBalance.notes || '');
    } else if (open && !currentBalance) {
      // Reset to defaults for new balance
      setBalance('');
      setOpexAmount('35');
      setItbmAmount('0');
      setProfitPercentage('1');
      setTaxReservePercentage('5');
      setIncludeZohoFiftyPercent(true);
      setNotes('');
    }
  }, [open, currentBalance]);

  const handleSave = () => {
    const balanceNum = parseFloat(balance) || 0;
    const opexNum = parseFloat(opexAmount) || 35;
    const itbmNum = parseFloat(itbmAmount) || 0;
    const profitNum = parseFloat(profitPercentage) || 1;
    const taxReserveNum = parseFloat(taxReservePercentage) || 5;
    
    onBalanceSaved(
      balanceNum, 
      opexNum, 
      itbmNum, 
      profitNum, 
      taxReserveNum,
      includeZohoFiftyPercent,
      notes.trim() || undefined
    );
  };

  const formattedMonth = (() => {
    try {
      if (currentDate && !isNaN(currentDate.getTime())) {
        return format(currentDate, 'MMMM yyyy', { locale: es });
      }
      return format(new Date(), 'MMMM yyyy', { locale: es });
    } catch (err) {
      return format(new Date(), 'MMMM yyyy', { locale: es });
    }
  })();
  
  const capitalizedMonth = formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {currentBalance ? 'Editar' : 'Configurar'} Balance Inicial - {capitalizedMonth}
          </DialogTitle>
          <DialogDescription>
            Configure el balance inicial y parámetros para {capitalizedMonth}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="balance" className="text-right">
              Balance Inicial
            </Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="opex" className="text-right">
              OPEX ($)
            </Label>
            <Input
              id="opex"
              type="number"
              step="0.01"
              placeholder="35.00"
              value={opexAmount}
              onChange={(e) => setOpexAmount(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="itbm" className="text-right">
              ITBM ($)
            </Label>
            <Input
              id="itbm"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={itbmAmount}
              onChange={(e) => setItbmAmount(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="profit" className="text-right">
              Profit First (%)
            </Label>
            <Input
              id="profit"
              type="number"
              step="0.1"
              placeholder="1.0"
              value={profitPercentage}
              onChange={(e) => setProfitPercentage(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="taxReserve" className="text-right">
              Tax Reserve (%)
            </Label>
            <Input
              id="taxReserve"
              type="number"
              step="0.1"
              placeholder="5.0"
              value={taxReservePercentage}
              onChange={(e) => setTaxReservePercentage(e.target.value)}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="includeZoho" className="text-right">
              Incluir 50% Zoho
            </Label>
            <div className="col-span-3 flex items-center space-x-2">
              <Switch
                id="includeZoho"
                checked={includeZohoFiftyPercent}
                onCheckedChange={setIncludeZohoFiftyPercent}
              />
              <Label htmlFor="includeZoho" className="text-sm text-gray-600">
                Incluir 50% del Zoho restante en el cálculo del salario
              </Label>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="notes" className="text-right pt-2">
              Notas
            </Label>
            <Textarea
              id="notes"
              placeholder="Notas opcionales..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="col-span-3"
              rows={3}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {currentBalance ? 'Actualizar' : 'Guardar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InitialBalanceDialog;
