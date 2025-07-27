import { useState, useCallback, useMemo } from 'react';

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

  // Calculate amounts based on salary and distribution
  const amounts = useMemo(() => ({
    owners: (estimatedSalary * distribution.owners) / 100,
    savings: (estimatedSalary * distribution.savings) / 100,
    investing: (estimatedSalary * distribution.investing) / 100,
  }), [estimatedSalary, distribution]);

  // Validate that distribution sums to 100%
  const totalPercentage = useMemo(() => 
    distribution.owners + distribution.savings + distribution.investing
  , [distribution]);

  const isValidDistribution = totalPercentage === 100;

  // Update individual percentage with automatic adjustment
  const updatePercentage = useCallback((
    category: keyof PersonalDistribution, 
    newValue: number
  ) => {
    const maxValue = 100;
    const clampedValue = Math.max(0, Math.min(maxValue, newValue));
    
    setDistribution(prev => {
      const newDistribution = { ...prev };
      const oldValue = newDistribution[category];
      const difference = clampedValue - oldValue;
      
      newDistribution[category] = clampedValue;
      
      // Adjust other categories proportionally if needed
      if (difference !== 0) {
        const otherCategories = Object.keys(newDistribution).filter(
          key => key !== category
        ) as (keyof PersonalDistribution)[];
        
        const totalOthers = otherCategories.reduce(
          (sum, key) => sum + newDistribution[key], 0
        );
        
        if (totalOthers > 0) {
          const remaining = 100 - clampedValue;
          const ratio = remaining / totalOthers;
          
          otherCategories.forEach(key => {
            newDistribution[key] = Math.round(newDistribution[key] * ratio);
          });
        }
      }
      
      return newDistribution;
    });
  }, []);

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
    updatePercentage,
    balanceDistribution,
    resetToDefaults,
  };
};