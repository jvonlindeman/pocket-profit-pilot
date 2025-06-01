
import { useState, useEffect } from 'react';
import { MonthlyBalance } from '@/types/financial';

interface UseBalanceFormProps {
  open: boolean;
  currentBalance?: MonthlyBalance | null;
}

export const useBalanceForm = ({ open, currentBalance }: UseBalanceFormProps) => {
  const [balance, setBalance] = useState('');
  const [opexAmount, setOpexAmount] = useState('35');
  const [itbmAmount, setItbmAmount] = useState('0');
  const [profitPercentage, setProfitPercentage] = useState('1');
  const [taxReservePercentage, setTaxReservePercentage] = useState('5');
  const [includeZohoFiftyPercent, setIncludeZohoFiftyPercent] = useState(true);
  const [notes, setNotes] = useState('');

  // Load existing values when dialog opens - FIXED: Better data handling
  useEffect(() => {
    console.log("🔧 useBalanceForm: useEffect triggered with:", {
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
      console.log("🔧 useBalanceForm: Loading existing values from currentBalance:", currentBalance);
      
      setBalance(currentBalance.balance?.toString() || '');
      setOpexAmount((currentBalance.opex_amount ?? 35).toString());
      setItbmAmount((currentBalance.itbm_amount ?? 0).toString());
      
      // FIXED: Explicit conversion and fallback for profit and tax percentages
      const profitValue = currentBalance.profit_percentage;
      const taxValue = currentBalance.tax_reserve_percentage;
      
      console.log("🔧 useBalanceForm: Converting percentage values:", {
        profitValue: { raw: profitValue, type: typeof profitValue, isNull: profitValue === null, isUndefined: profitValue === undefined },
        taxValue: { raw: taxValue, type: typeof taxValue, isNull: taxValue === null, isUndefined: taxValue === undefined }
      });
      
      setProfitPercentage(profitValue !== null && profitValue !== undefined ? profitValue.toString() : '1');
      setTaxReservePercentage(taxValue !== null && taxValue !== undefined ? taxValue.toString() : '5');
      
      setIncludeZohoFiftyPercent(currentBalance.include_zoho_fifty_percent ?? true);
      setNotes(currentBalance.notes || '');
      
      console.log("🔧 useBalanceForm: State set to:", {
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
      console.log("🔧 useBalanceForm: Resetting to defaults (no currentBalance)");
      setBalance('');
      setOpexAmount('35');
      setItbmAmount('0');
      setProfitPercentage('1');
      setTaxReservePercentage('5');
      setIncludeZohoFiftyPercent(true);
      setNotes('');
    }
  }, [open, currentBalance]);

  const getFormValues = () => {
    const balanceNum = parseFloat(balance) || 0;
    const opexNum = parseFloat(opexAmount) || 35;
    const itbmNum = parseFloat(itbmAmount) || 0;
    const profitNum = parseFloat(profitPercentage) || 1;
    const taxReserveNum = parseFloat(taxReservePercentage) || 5;
    
    console.log("🔧 useBalanceForm: getFormValues called with values:", {
      balanceNum,
      opexNum,
      itbmNum,
      profitNum,
      taxReserveNum,
      includeZohoFiftyPercent,
      notes: notes.trim() || undefined
    });
    
    return {
      balanceNum,
      opexNum,
      itbmNum,
      profitNum,
      taxReserveNum,
      includeZohoFiftyPercent,
      notes: notes.trim() || undefined
    };
  };

  return {
    // Form state
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
    // Form utilities
    getFormValues,
  };
};
