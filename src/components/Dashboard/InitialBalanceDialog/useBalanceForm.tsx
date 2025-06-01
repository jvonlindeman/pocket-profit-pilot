
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

  // Load existing values when dialog opens - ENHANCED with better logging and validation
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
      console.log("🔧 useBalanceForm: Loading existing values from currentBalance:", currentBalance);
      
      setBalance(currentBalance.balance?.toString() || '');
      setOpexAmount((currentBalance.opex_amount ?? 35).toString());
      setItbmAmount((currentBalance.itbm_amount ?? 0).toString());
      
      // ENHANCED: Better percentage handling with explicit validation
      const profitValue = currentBalance.profit_percentage;
      const taxValue = currentBalance.tax_reserve_percentage;
      
      console.log("🔧 useBalanceForm: DETAILED percentage analysis:", {
        profitValue: { 
          raw: profitValue, 
          type: typeof profitValue, 
          isNull: profitValue === null, 
          isUndefined: profitValue === undefined,
          isZero: profitValue === 0,
          toString: profitValue?.toString()
        },
        taxValue: { 
          raw: taxValue, 
          type: typeof taxValue, 
          isNull: taxValue === null, 
          isUndefined: taxValue === undefined,
          isZero: taxValue === 0,
          toString: taxValue?.toString()
        }
      });
      
      // CRITICAL FIX: Handle 0 values correctly - 0 is a valid percentage
      const profitStr = (profitValue !== null && profitValue !== undefined) ? profitValue.toString() : '1';
      const taxStr = (taxValue !== null && taxValue !== undefined) ? taxValue.toString() : '5';
      
      console.log("🔧 useBalanceForm: Setting percentage strings:", {
        profitStr,
        taxStr,
        profitOriginal: profitValue,
        taxOriginal: taxValue
      });
      
      setProfitPercentage(profitStr);
      setTaxReservePercentage(taxStr);
      
      setIncludeZohoFiftyPercent(currentBalance.include_zoho_fifty_percent ?? true);
      setNotes(currentBalance.notes || '');
      
      console.log("🔧 useBalanceForm: Final state set to:", {
        balance: currentBalance.balance?.toString() || '',
        opexAmount: (currentBalance.opex_amount ?? 35).toString(),
        itbmAmount: (currentBalance.itbm_amount ?? 0).toString(),
        profitPercentage: profitStr,
        taxReservePercentage: taxStr,
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
    // ENHANCED: Better number parsing with detailed logging
    console.log("🔧 getFormValues: DETAILED INPUT ANALYSIS:", {
      balance: { value: balance, type: typeof balance, isEmpty: balance === '' },
      opexAmount: { value: opexAmount, type: typeof opexAmount, isEmpty: opexAmount === '' },
      itbmAmount: { value: itbmAmount, type: typeof itbmAmount, isEmpty: itbmAmount === '' },
      profitPercentage: { value: profitPercentage, type: typeof profitPercentage, isEmpty: profitPercentage === '' },
      taxReservePercentage: { value: taxReservePercentage, type: typeof taxReservePercentage, isEmpty: taxReservePercentage === '' },
      includeZohoFiftyPercent: { value: includeZohoFiftyPercent, type: typeof includeZohoFiftyPercent },
      notes: { value: notes, type: typeof notes, isEmpty: notes === '' }
    });

    // CRITICAL FIX: Don't use fallback defaults - preserve user input or use 0
    const balanceNum = balance === '' ? 0 : parseFloat(balance) || 0;
    const opexNum = opexAmount === '' ? 0 : parseFloat(opexAmount) || 0;
    const itbmNum = itbmAmount === '' ? 0 : parseFloat(itbmAmount) || 0;
    
    // CRITICAL: For percentages, if empty use 0, not defaults
    const profitNum = profitPercentage === '' ? 0 : parseFloat(profitPercentage) || 0;
    const taxReserveNum = taxReservePercentage === '' ? 0 : parseFloat(taxReservePercentage) || 0;
    
    const finalValues = {
      balanceNum,
      opexNum,
      itbmNum,
      profitNum,
      taxReserveNum,
      includeZohoFiftyPercent,
      notes: notes.trim() || undefined
    };
    
    console.log("🔧 getFormValues: FINAL PARSED VALUES:", finalValues);
    
    return finalValues;
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
