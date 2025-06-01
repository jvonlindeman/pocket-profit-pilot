
import React from 'react';
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

  const handleSave = () => {
    const {
      balanceNum,
      opexNum,
      itbmNum,
      profitNum,
      taxReserveNum,
      includeZohoFiftyPercent: includeZoho,
      notes: formNotes
    } = getFormValues();
    
    onBalanceSaved(
      balanceNum, 
      opexNum, 
      itbmNum, 
      profitNum, 
      taxReserveNum,
      includeZoho,
      formNotes
    );
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
