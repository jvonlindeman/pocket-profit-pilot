
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatISO } from 'date-fns';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';
import { formatCurrency } from '@/utils/financialUtils';

interface MonthlyBalanceInputProps {
  currentDate: Date;
}

const MonthlyBalanceInput: React.FC<MonthlyBalanceInputProps> = ({ currentDate }) => {
  const { balance, setBalance, saveBalance, isLoading } = useMonthlyBalance({ currentDate });
  const [inputValue, setInputValue] = useState<string>('');
  
  // Update input when balance changes
  useEffect(() => {
    if (balance !== undefined && balance !== null) {
      setInputValue(balance.toString());
    } else {
      setInputValue('');
    }
  }, [balance]);

  const handleSave = async () => {
    const numericValue = parseFloat(inputValue);
    if (!isNaN(numericValue)) {
      await saveBalance(numericValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Format month for display
  const formattedMonth = new Intl.DateTimeFormat('es-ES', {
    month: 'long',
    year: 'numeric'
  }).format(currentDate);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balance Inicial: {formattedMonth}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2">
          <Input
            type="number"
            placeholder="Balance inicial del mes"
            value={inputValue}
            onChange={handleInputChange}
            className="flex-1"
            step="0.01"
          />
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
        {balance !== undefined && balance !== null && (
          <p className="mt-2 text-sm text-gray-500">
            Balance actual: {formatCurrency(balance)}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default MonthlyBalanceInput;
