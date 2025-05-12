
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Predefined color palette for charts and visualizations
export const chartColors = {
  // Core colors
  purple: '#8B5CF6',
  magenta: '#D946EF',
  orange: '#F97316',
  blue: '#0EA5E9',
  emerald: '#10B981',
  indigo: '#6366F1',
  pink: '#EC4899',
  teal: '#14B8A6',
  amber: '#F59E0B',
  deepPurple: '#6D28D9',
  red: '#DC2626',
  green: '#059669',
  violet: '#7C3AED',
  royalBlue: '#2563EB',
  yellow: '#CA8A04',
  
  // Financial specific colors
  income: '#2ecc71',
  expense: '#e74c3c',
  profit: '#3498db',
  
  // Get color array for charts
  getColorArray: function(): string[] {
    return [
      this.purple, this.magenta, this.orange, this.blue, 
      this.emerald, this.indigo, this.pink, this.teal,
      this.amber, this.deepPurple, this.red, this.green,
      this.violet, this.royalBlue, this.yellow
    ];
  },
  
  // Get a color for a specific category
  getCategoryColor: function(category: string, index: number = 0): string {
    const categoryMap: Record<string, string> = {
      'software': this.purple,
      'tools': this.orange,
      'marketing': this.blue,
      'publicidad': this.magenta,
      'ai tools': this.emerald,
      'servidores': this.indigo,
      'impuesto': this.pink,
      'seo': this.teal,
    };
    
    // Match category by partial string (case insensitive)
    const lowerCategory = category.toLowerCase();
    for (const [key, color] of Object.entries(categoryMap)) {
      if (lowerCategory.includes(key.toLowerCase())) {
        return color;
      }
    }
    
    // Fallback to color array
    return this.getColorArray()[index % this.getColorArray().length];
  }
};

// Format currency in USD
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Format percentage
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};
