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
    const clampedValue = Math.max(0, Math.min(100, newValue));
    
    setDistribution(prev => {
      const newDistribution = { ...prev };
      newDistribution[category] = clampedValue;
      
      // Calculate remaining percentage to distribute
      const remaining = 100 - clampedValue;
      const otherCategories = Object.keys(newDistribution).filter(
        key => key !== category
      ) as (keyof PersonalDistribution)[];
      
      if (remaining >= 0 && otherCategories.length > 0) {
        // Get current total of other categories
        const currentOthersTotal = otherCategories.reduce(
          (sum, key) => sum + prev[key], 0
        );
        
        if (currentOthersTotal > 0) {
          // Distribute remaining proportionally
          let distributedTotal = 0;
          otherCategories.forEach((key, index) => {
            if (index === otherCategories.length - 1) {
              // Last category gets the remainder to ensure exact 100%
              newDistribution[key] = remaining - distributedTotal;
            } else {
              const proportionalValue = Math.floor((prev[key] / currentOthersTotal) * remaining);
              newDistribution[key] = proportionalValue;
              distributedTotal += proportionalValue;
            }
          });
        } else {
          // If other categories are 0, distribute evenly
          const evenDistribution = Math.floor(remaining / otherCategories.length);
          const remainder = remaining % otherCategories.length;
          
          otherCategories.forEach((key, index) => {
            newDistribution[key] = evenDistribution + (index < remainder ? 1 : 0);
          });
        }
      }
      
      return newDistribution;
    });
  }, []);

  // Update individual amount with automatic recalculation
  const updateAmount = useCallback((
    category: keyof PersonalDistribution, 
    newAmount: number
  ) => {
    const clampedAmount = Math.max(0, newAmount);
    
    // Calculate what the other amounts currently are
    const currentAmounts = {
      owners: (estimatedSalary * distribution.owners) / 100,
      savings: (estimatedSalary * distribution.savings) / 100,
      investing: (estimatedSalary * distribution.investing) / 100,
    };
    
    // Update the specific amount
    currentAmounts[category] = clampedAmount;
    
    // Calculate new total salary
    const newTotalSalary = currentAmounts.owners + currentAmounts.savings + currentAmounts.investing;
    
    if (newTotalSalary > 0) {
      // Calculate new percentages based on amounts
      const newDistribution = {
        owners: Math.round((currentAmounts.owners / newTotalSalary) * 100),
        savings: Math.round((currentAmounts.savings / newTotalSalary) * 100),
        investing: Math.round((currentAmounts.investing / newTotalSalary) * 100),
      };
      
      // Ensure percentages add up to 100% (adjust the largest one if needed)
      const total = newDistribution.owners + newDistribution.savings + newDistribution.investing;
      if (total !== 100) {
        const diff = 100 - total;
        const largest = Object.keys(newDistribution).reduce((a, b) => 
          newDistribution[a as keyof PersonalDistribution] > newDistribution[b as keyof PersonalDistribution] ? a : b
        ) as keyof PersonalDistribution;
        newDistribution[largest] += diff;
      }
      
      // Update both salary and distribution
      setEstimatedSalary(newTotalSalary);
      setDistribution(newDistribution);
    } else {
      // If total is 0, just update the salary to the new amount
      setEstimatedSalary(clampedAmount);
    }
  }, [estimatedSalary, distribution]);

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
    updateAmount,
    balanceDistribution,
    resetToDefaults,
  };
};