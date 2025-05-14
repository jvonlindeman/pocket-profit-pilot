
import React, { useState, useEffect } from 'react';
import { InitialBalanceDialog as DetailedInitialBalanceDialog } from '@/components/Dashboard/InitialBalanceDialog';
import { format } from 'date-fns';

interface InitialBalanceDialogProps {
  startingBalance: number | undefined;
  updateStartingBalance: (balance: number) => void;
}

export const InitialBalanceDialog: React.FC<InitialBalanceDialogProps> = ({ 
  startingBalance, 
  updateStartingBalance 
}) => {
  const [open, setOpen] = useState<boolean>(startingBalance === undefined);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  useEffect(() => {
    // If there's no starting balance, open the dialog
    if (startingBalance === undefined) {
      setOpen(true);
    }
  }, [startingBalance]);

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
  };

  const handleBalanceSaved = () => {
    console.log('Balance saved');
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Balance Inicial</h2>
        <button 
          onClick={() => setOpen(true)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {startingBalance !== undefined ? 'Cambiar' : 'Establecer'} balance inicial
        </button>
      </div>
      
      <DetailedInitialBalanceDialog 
        open={open}
        onOpenChange={handleOpenChange}
        currentDate={currentDate}
        onBalanceSaved={handleBalanceSaved}
      />
    </div>
  );
};
