
import { useMemo } from 'react';

export const useFinanceFormatter = () => {
  // Format currency (USD)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format percentage 
  const formatPercentage = (percentage: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(percentage / 100);
  };

  // Format change/growth percentage with sign
  const formatChange = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return sign + formatPercentage(value);
  };

  // Format large numbers with abbreviated K/M/B
  const formatCompactNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(num);
  };

  return {
    formatCurrency,
    formatPercentage,
    formatChange,
    formatCompactNumber
  };
};
