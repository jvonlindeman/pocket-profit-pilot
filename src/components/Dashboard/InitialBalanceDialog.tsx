
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { MonthlyBalance } from '@/types/financial';
import BalanceDialogHeader from './InitialBalanceDialog/BalanceDialogHeader';
import BalanceFormFields from './InitialBalanceDialog/BalanceFormFields';
import { useBalanceForm } from './InitialBalanceDialog/useBalanceForm';

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
  ) => Promise<boolean>;
  currentBalance?: MonthlyBalance | null;
}

const InitialBalanceDialog: React.FC<InitialBalanceDialogProps> = ({
  open,
  onOpenChange,
  currentDate,
  onBalanceSaved,
  currentBalance
}) => {
  const [saving, setSaving] = useState(false);
  
  const {
    balance,
    setBalance,
    opexAmount,
    setOpexAmount,
    itbmAmount,
    setItbmAmount,
    profitPercentage,
    setProfitPercentage,
    taxReservePercentage,
    setTaxReservePercentage,
    includeZohoFiftyPercent,
    setIncludeZohoFiftyPercent,
    notes,
    setNotes,
    getFormValues,
  } = useBalanceForm({ open, currentBalance });

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const {
        balanceNum,
        opexNum,
        itbmNum,
        profitNum,
        taxReserveNum,
        includeZohoFiftyPercent: includeZoho,
        notes: formNotes
      } = getFormValues();
      
      console.log("💾 InitialBalanceDialog: handleSave CALLED WITH VALUES:", {
        balanceNum,
        opexNum,
        itbmNum,
        profitNum,
        taxReserveNum,
        includeZoho,
        formNotes
      });
      
      // Call onBalanceSaved and wait for result
      const success = await onBalanceSaved(
        balanceNum, 
        opexNum, 
        itbmNum, 
        profitNum, 
        taxReserveNum,
        includeZoho,
        formNotes
      );
      
      // Only close dialog if save was successful
      if (success) {
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <BalanceDialogHeader 
          currentBalance={currentBalance}
          currentDate={currentDate}
        />
        
        <BalanceFormFields
          balance={balance}
          setBalance={setBalance}
          opexAmount={opexAmount}
          setOpexAmount={setOpexAmount}
          itbmAmount={itbmAmount}
          setItbmAmount={setItbmAmount}
          profitPercentage={profitPercentage}
          setProfitPercentage={setProfitPercentage}
          taxReservePercentage={taxReservePercentage}
          setTaxReservePercentage={setTaxReservePercentage}
          includeZohoFiftyPercent={includeZohoFiftyPercent}
          setIncludeZohoFiftyPercent={setIncludeZohoFiftyPercent}
          notes={notes}
          setNotes={setNotes}
        />
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : (currentBalance ? 'Actualizar' : 'Guardar')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InitialBalanceDialog;
