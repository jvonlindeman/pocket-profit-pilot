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
  }, []);

  // Recalculate based on draft values - determines what was changed
  const recalculate = useCallback(() => {
    const draftTotal = draftAmounts.owners + draftAmounts.savings + draftAmounts.investing;
    const draftPercentageTotal = draftDistribution.owners + draftDistribution.savings + draftDistribution.investing;
    
    // Check if amounts were changed (different from calculated amounts)
    const calculatedAmounts = {
      owners: (draftSalary * distribution.owners) / 100,
      savings: (draftSalary * distribution.savings) / 100,
      investing: (draftSalary * distribution.investing) / 100,
    };
    
    const amountsChanged = 
      Math.abs(draftAmounts.owners - calculatedAmounts.owners) > 0.01 ||
      Math.abs(draftAmounts.savings - calculatedAmounts.savings) > 0.01 ||
      Math.abs(draftAmounts.investing - calculatedAmounts.investing) > 0.01;
    
    const salaryChanged = Math.abs(draftSalary - estimatedSalary) > 0.01;
    const percentagesChanged = 
      draftDistribution.owners !== distribution.owners ||
      draftDistribution.savings !== distribution.savings ||
      draftDistribution.investing !== distribution.investing;

    if (amountsChanged && draftTotal > 0) {
      // Calculate from amounts: derive salary and percentages
      const newSalary = draftTotal;
      const newDistribution = {
        owners: Math.round((draftAmounts.owners / newSalary) * 100),
        savings: Math.round((draftAmounts.savings / newSalary) * 100),
        investing: Math.round((draftAmounts.investing / newSalary) * 100),
      };
      
      // Ensure percentages add up to 100%
      const total = newDistribution.owners + newDistribution.savings + newDistribution.investing;
      if (total !== 100) {
        newDistribution.owners += (100 - total);
      }
      
      setEstimatedSalary(newSalary);
      setDistribution(newDistribution);
    } else if (percentagesChanged && draftPercentageTotal === 100) {
      // Calculate from percentages: derive amounts using current salary
      setDistribution(draftDistribution);
    } else if (salaryChanged) {
      // Calculate from salary: derive amounts using current percentages
      setEstimatedSalary(draftSalary);
    }
  }, [draftSalary, draftDistribution, draftAmounts, estimatedSalary, distribution]);

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
    // Recalculate function
    recalculate,
    // Legacy functions (kept for compatibility)
    balanceDistribution,
    resetToDefaults,
  };
};