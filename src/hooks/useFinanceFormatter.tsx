
import { useMemo } from 'react';

interface FormatterOptions {
  locale?: string;
  currency?: string;
}

export const useFinanceFormatter = (options: FormatterOptions = {}) => {
  const { 
    locale = 'en-US', 
    currency = 'USD' 
  } = options;

  // Format currency (USD by default)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format percentage 
  const formatPercentage = (percentage: number) => {
    return new Intl.NumberFormat(locale, {
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
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(num);
  };

  // Get text color class based on value
  const getValueColorClass = (value: number): string => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  // Get background color class based on value
  const getBackgroundColorClass = (value: number): string => {
    if (value > 0) return 'bg-green-50';
    if (value < 0) return 'bg-red-50';
    return 'bg-gray-50';
  };

  // Get icon color class based on type
  const getIconColorClass = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'income':
        return 'text-green-500';
      case 'expense':
        return 'text-red-500';
      case 'collaborator':
        return 'text-amber-500';
      default:
        return 'text-blue-500';
    }
  };

  // Get icon background color class based on type
  const getIconBgColorClass = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'income':
        return 'bg-green-50';
      case 'expense':
        return 'bg-red-50';
      case 'collaborator':
        return 'bg-amber-50';
      default:
        return 'bg-blue-50';
    }
  };

  return useMemo(() => ({
    formatCurrency,
    formatPercentage,
    formatChange,
    formatCompactNumber,
    getValueColorClass,
    getBackgroundColorClass,
    getIconColorClass,
    getIconBgColorClass
  }), [locale, currency]);
};
