
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

  // Load existing values when dialog opens - FIXED: Better data handling
  useEffect(() => {
    console.log("🔧 InitialBalanceDialog: useEffect triggered with:", {
      open,
      currentBalance,
      currentBalanceData: currentBalance ? {
        balance: currentBalance.balance,
        opex_amount: currentBalance.opex_amount,
        itbm_amount: currentBalance.itbm_amount,
        profit_percentage: currentBalance.profit_percentage,
        tax_reserve_percentage: currentBalance.tax_reserve_percentage,
        include_zoho_fifty_percent: currentBalance.include_zoho_fifty_percent,
        notes: currentBalance.notes
      } : null
    });

    if (open && currentBalance) {
      // FIXED: Better number conversion and null handling
      console.log("🔧 InitialBalanceDialog: Loading existing values from currentBalance:", currentBalance);
      
      setBalance(currentBalance.balance?.toString() || '');
      setOpexAmount((currentBalance.opex_amount ?? 35).toString());
      setItbmAmount((currentBalance.itbm_amount ?? 0).toString());
      
      // FIXED: Explicit conversion and fallback for profit and tax percentages
      const profitValue = currentBalance.profit_percentage;
      const taxValue = currentBalance.tax_reserve_percentage;
      
      console.log("🔧 InitialBalanceDialog: Converting percentage values:", {
        profitValue: { raw: profitValue, type: typeof profitValue, isNull: profitValue === null, isUndefined: profitValue === undefined },
        taxValue: { raw: taxValue, type: typeof taxValue, isNull: taxValue === null, isUndefined: taxValue === undefined }
      });
      
      setProfitPercentage(profitValue !== null && profitValue !== undefined ? profitValue.toString() : '1');
      setTaxReservePercentage(taxValue !== null && taxValue !== undefined ? taxValue.toString() : '5');
      
      setIncludeZohoFiftyPercent(currentBalance.include_zoho_fifty_percent ?? true);
      setNotes(currentBalance.notes || '');
      
      console.log("🔧 InitialBalanceDialog: State set to:", {
        balance: currentBalance.balance?.toString() || '',
        opexAmount: (currentBalance.opex_amount ?? 35).toString(),
        itbmAmount: (currentBalance.itbm_amount ?? 0).toString(),
        profitPercentage: profitValue !== null && profitValue !== undefined ? profitValue.toString() : '1',
        taxReservePercentage: taxValue !== null && taxValue !== undefined ? taxValue.toString() : '5',
        includeZohoFiftyPercent: currentBalance.include_zoho_fifty_percent ?? true,
        notes: currentBalance.notes || ''
      });
    } else if (open && !currentBalance) {
      // Reset to defaults for new balance
      console.log("🔧 InitialBalanceDialog: Resetting to defaults (no currentBalance)");
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
    
    console.log("🔧 InitialBalanceDialog: handleSave called with values:", {
      balanceNum,
      opexNum,
      itbmNum,
      profitNum,
      taxReserveNum,
      includeZohoFiftyPercent,
      notes: notes.trim() || undefined
    });
    
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
