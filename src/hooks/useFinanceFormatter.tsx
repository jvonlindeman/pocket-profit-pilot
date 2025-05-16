
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

  // Get text color class based on value
  const getValueColorClass = (value: number): string => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  // Format with appropriate local currency
  const formatLocalCurrency = (amount: number, locale: string = 'en-US', currency: string = 'USD') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  return useMemo(() => ({
    formatCurrency,
    formatPercentage,
    formatChange,
    formatCompactNumber,
    getValueColorClass,
    formatLocalCurrency
  }), []);
};
