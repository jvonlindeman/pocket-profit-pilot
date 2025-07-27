import { useState, useCallback, useMemo, useEffect } from 'react';

export interface PersonalDistribution {
  owners: number;
  savings: number;
  investing: number;
}

export interface PersonalSalaryData {
  estimatedSalary: number;
  distribution: PersonalDistribution;
  amounts: {
    owners: number;
    savings: number;
    investing: number;
  };
}

const DEFAULT_DISTRIBUTION: PersonalDistribution = {
  owners: 70,
  savings: 20,
  investing: 10,
};

export const usePersonalSalaryDistribution = (initialSalary: number = 0) => {
  const [estimatedSalary, setEstimatedSalary] = useState(initialSalary);
  const [distribution, setDistribution] = useState<PersonalDistribution>(DEFAULT_DISTRIBUTION);
  
  // Draft states for manual editing
  const [draftSalary, setDraftSalary] = useState(initialSalary);
  const [draftDistribution, setDraftDistribution] = useState<PersonalDistribution>(DEFAULT_DISTRIBUTION);
  const [draftAmounts, setDraftAmounts] = useState({
    owners: 0,
    savings: 0,
    investing: 0,
  });

  // Change tracking states
  const [salaryManuallyChanged, setSalaryManuallyChanged] = useState(false);
  const [amountsManuallyChanged, setAmountsManuallyChanged] = useState(false);
  const [percentagesManuallyChanged, setPercentagesManuallyChanged] = useState(false);

  // Calculate final amounts based on salary and distribution
  const amounts = useMemo(() => {
    const calculated = {
      owners: (estimatedSalary * distribution.owners) / 100,
      savings: (estimatedSalary * distribution.savings) / 100,
      investing: (estimatedSalary * distribution.investing) / 100,
    };
    
    console.log('Hook amounts calculation:', {
      estimatedSalary,
      distribution,
      calculated
    });
    
    return calculated;
  }, [estimatedSalary, distribution]);

  // Update draft amounts when final amounts change
  useEffect(() => {
    setDraftAmounts(amounts);
  }, [amounts]);

  // Update draft values when main values change
  useEffect(() => {
    setDraftSalary(estimatedSalary);
    setDraftDistribution(distribution);
  }, [estimatedSalary, distribution]);

  // Validate that distribution sums to 100%
  const totalPercentage = useMemo(() => 
    distribution.owners + distribution.savings + distribution.investing
  , [distribution]);

  const draftTotalPercentage = useMemo(() =>
    draftDistribution.owners + draftDistribution.savings + draftDistribution.investing
  , [draftDistribution]);

  const isValidDistribution = totalPercentage === 100;
  const isDraftValidDistribution = draftTotalPercentage === 100;

  // Update draft percentage
  const updateDraftPercentage = useCallback((
    category: keyof PersonalDistribution, 
    newValue: number
  ) => {
    const clampedValue = Math.max(0, Math.min(100, newValue));
    setDraftDistribution(prev => ({
      ...prev,
      [category]: clampedValue
    }));
    setPercentagesManuallyChanged(true);
  }, []);

  // Update draft amount
  const updateDraftAmount = useCallback((
    category: keyof PersonalDistribution, 
    newAmount: number
  ) => {
    const clampedAmount = Math.max(0, newAmount);
    setDraftAmounts(prev => ({
      ...prev,
      [category]: clampedAmount
    }));
    setAmountsManuallyChanged(true);
  }, []);

  // Update draft salary
  const updateDraftSalary = useCallback((newSalary: number) => {
    setDraftSalary(Math.max(0, newSalary));
    setSalaryManuallyChanged(true);
  }, []);

  // Recalculate based on draft values with improved logic
  const recalculate = useCallback(() => {
    const draftTotal = draftAmounts.owners + draftAmounts.savings + draftAmounts.investing;
    const draftPercentageTotal = draftDistribution.owners + draftDistribution.savings + draftDistribution.investing;
    
    // Priority system based on what was manually changed
    if (salaryManuallyChanged && !amountsManuallyChanged && !percentagesManuallyChanged) {
      // Only salary was changed: calculate amounts from salary + current percentages
      setEstimatedSalary(draftSalary);
    } else if (percentagesManuallyChanged && !amountsManuallyChanged && draftPercentageTotal === 100) {
      // Only percentages were changed: calculate amounts from current salary + new percentages
      setDistribution(draftDistribution);
    } else if (amountsManuallyChanged && draftTotal > 0) {
      // Amounts were changed: calculate percentages from amounts (only change salary if it wasn't manually set)
      const newDistribution = {
        owners: Math.round((draftAmounts.owners / draftTotal) * 100),
        savings: Math.round((draftAmounts.savings / draftTotal) * 100),
        investing: Math.round((draftAmounts.investing / draftTotal) * 100),
      };
      
      // Ensure percentages add up to 100%
      const total = newDistribution.owners + newDistribution.savings + newDistribution.investing;
      if (total !== 100) {
        newDistribution.owners += (100 - total);
      }
      
      setDistribution(newDistribution);
      
      // Only update salary if it wasn't manually changed by the user
      if (!salaryManuallyChanged) {
        setEstimatedSalary(draftTotal);
      }
    } else if (salaryManuallyChanged && percentagesManuallyChanged && draftPercentageTotal === 100) {
      // Both salary and percentages changed: use both, calculate amounts
      setEstimatedSalary(draftSalary);
      setDistribution(draftDistribution);
    } else if (salaryManuallyChanged && amountsManuallyChanged && draftTotal > 0) {
      // Both salary and amounts changed: keep salary, derive percentages from amounts
      setEstimatedSalary(draftSalary);
      const newDistribution = {
        owners: Math.round((draftAmounts.owners / draftSalary) * 100),
        savings: Math.round((draftAmounts.savings / draftSalary) * 100),
        investing: Math.round((draftAmounts.investing / draftSalary) * 100),
      };
      
      const total = newDistribution.owners + newDistribution.savings + newDistribution.investing;
      if (total !== 100) {
        newDistribution.owners += (100 - total);
      }
      
      setDistribution(newDistribution);
    }
    
    // Reset change tracking after recalculation
    setSalaryManuallyChanged(false);
    setAmountsManuallyChanged(false);
    setPercentagesManuallyChanged(false);
  }, [draftSalary, draftDistribution, draftAmounts, salaryManuallyChanged, amountsManuallyChanged, percentagesManuallyChanged]);

  // Auto-balance to ensure 100% total
  const balanceDistribution = useCallback(() => {
    if (totalPercentage !== 100) {
      const difference = 100 - totalPercentage;
      setDistribution(prev => ({
        ...prev,
        owners: prev.owners + difference
      }));
    }
  }, [totalPercentage]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setDistribution(DEFAULT_DISTRIBUTION);
  }, []);

  return {
    estimatedSalary,
    setEstimatedSalary,
    distribution,
    amounts,
    totalPercentage,
    isValidDistribution,
    // Draft states
    draftSalary,
    setDraftSalary,
    draftDistribution,
    draftAmounts,
    draftTotalPercentage,
    isDraftValidDistribution,
    // Draft update functions
    updateDraftPercentage,
    updateDraftAmount,
    updateDraftSalary,
    // Recalculate function
    recalculate,
    // Legacy functions (kept for compatibility)
    balanceDistribution,
    resetToDefaults,
  };
};