
import React from 'react';
import { useToast } from '@/hooks/use-toast';
import InitialLoadPrompt from '@/components/Dashboard/InitialLoadPrompt';
import InitialBalanceDialog from '@/components/Dashboard/InitialBalanceDialog';

interface InitialSetupProps {
  dataInitialized: boolean;
  onLoadData: () => void;
  showBalanceDialog: boolean;
  setShowBalanceDialog: (show: boolean) => void;
  currentMonthDate: Date;
  onBalanceSaved: (balance: number, opexAmount?: number, itbmAmount?: number, profitPercentage?: number, taxReservePercentage?: number, stripeSavingsPercentage?: number, includeZohoFiftyPercent?: boolean, notes?: string) => Promise<boolean>;
  cacheChecked?: boolean;
  hasCachedData?: boolean;
}

const InitialSetup: React.FC<InitialSetupProps> = ({
  dataInitialized,
  onLoadData,
  showBalanceDialog,
  setShowBalanceDialog,
  currentMonthDate,
  onBalanceSaved,
  cacheChecked = false,
  hasCachedData = false,
}) => {
  return (
    <>
      {/* Dialog to set initial balance */}
      <InitialBalanceDialog 
        open={showBalanceDialog} 
        onOpenChange={setShowBalanceDialog} 
        currentDate={currentMonthDate}
        onBalanceSaved={onBalanceSaved}
      />
      
      {/* Initial load prompt if data not initialized */}
      {!dataInitialized && (
        <InitialLoadPrompt 
          onLoadData={onLoadData} 
          cacheChecked={cacheChecked}
          hasCachedData={hasCachedData}
        />
      )}
    </>
  );
};

export default InitialSetup;
