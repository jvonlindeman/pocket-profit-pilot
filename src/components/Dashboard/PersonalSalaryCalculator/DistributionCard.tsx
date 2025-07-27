import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from 'lucide-react';
import { useFinanceFormatter } from '@/hooks/useFinanceFormatter';

interface DistributionCardProps {
  title: string;
  icon: LucideIcon;
  percentage: number;
  amount: number;
  color: string;
  description: string;
  onPercentageChange: (value: number) => void;
  onAmountChange: (value: number) => void;
}

const DistributionCard: React.FC<DistributionCardProps> = ({
  title,
  icon: Icon,
  percentage,
  amount,
  color,
  description,
  onPercentageChange,
  onAmountChange,
}) => {
  const { formatCurrency } = useFinanceFormatter();
  const [amountInput, setAmountInput] = useState(amount.toString());

  // Update local input when prop changes
  useEffect(() => {
    setAmountInput(amount.toString());
  }, [amount]);

  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    onPercentageChange(Math.max(0, Math.min(100, value)));
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    onPercentageChange(Math.max(0, Math.min(100, value)));
  };

  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setAmountInput(inputValue);
    
    // Only update parent if input is a valid number
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue) && isFinite(numValue)) {
      onAmountChange(Math.max(0, numValue));
    }
  };

  const handleAmountBlur = () => {
    // On blur, ensure we have a valid number
    const numValue = parseFloat(amountInput);
    if (isNaN(numValue) || !isFinite(numValue)) {
      // Reset to current amount if invalid
      setAmountInput(amount.toString());
    } else {
      // Update with the valid value
      const validValue = Math.max(0, numValue);
      onAmountChange(validValue);
      setAmountInput(validValue.toString());
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-lg ${color}`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{title}</h3>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={percentage}
              onChange={handlePercentageChange}
              min="0"
              max="100"
              step="1"
              className="w-16 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <span className="text-sm text-muted-foreground">%</span>
            <div className="flex-1">
              <input
                type="range"
                value={percentage}
                onChange={handleSliderChange}
                min="0"
                max="100"
                step="1"
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${percentage}%, hsl(var(--muted)) ${percentage}%, hsl(var(--muted)) 100%)`,
                  WebkitAppearance: 'none',
                  outline: 'none'
                }}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-2">
            <span className="text-xs text-muted-foreground">$</span>
            <input
              type="number"
              value={amountInput}
              onChange={handleAmountInputChange}
              onBlur={handleAmountBlur}
              min="0"
              step="0.01"
              className="w-24 px-2 py-1 text-sm border rounded text-right font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DistributionCard;