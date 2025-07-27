import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, PiggyBank, TrendingUp, RefreshCw, AlertTriangle } from 'lucide-react';
import { useFinance } from '@/contexts/FinanceContext';
import { usePersonalSalaryDistribution } from '@/hooks/usePersonalSalaryDistribution';
import DistributionCard from './PersonalSalaryCalculator/DistributionCard';

interface PersonalSalaryCalculatorProps {
  estimatedSalary: number;
}

const PersonalSalaryCalculator: React.FC<PersonalSalaryCalculatorProps> = ({
  estimatedSalary = 0
}) => {
  const { formatCurrency } = useFinance();
  const {
    estimatedSalary: editableSalary,
    setEstimatedSalary,
    distribution,
    amounts,
    totalPercentage,
    isValidDistribution,
    updatePercentage,
    balanceDistribution,
    resetToDefaults,
  } = usePersonalSalaryDistribution(estimatedSalary);

  // Update when prop changes
  useEffect(() => {
    setEstimatedSalary(estimatedSalary);
  }, [estimatedSalary, setEstimatedSalary]);

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setEstimatedSalary(value);
  };

  const distributionData = [
    {
      key: 'owners' as const,
      title: 'Owners',
      icon: User,
      color: 'bg-blue-500',
      description: 'Salario personal final',
      percentage: distribution.owners,
      amount: amounts.owners,
    },
    {
      key: 'savings' as const,
      title: 'Savings',
      icon: PiggyBank,
      color: 'bg-green-500',
      description: 'Emergencias y objetivos',
      percentage: distribution.savings,
      amount: amounts.savings,
    },
    {
      key: 'investing' as const,
      title: 'Investing',
      icon: TrendingUp,
      color: 'bg-purple-500',
      description: 'Crecimiento a largo plazo',
      percentage: distribution.investing,
      amount: amounts.investing,
    },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Calculadora de Salario Personal</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Distribución basada en el método Profit First
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefaults}
            className="flex items-center space-x-1"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reset</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Editable Salary Section */}
        <div className="space-y-2">
          <Label htmlFor="personal-salary">Salario Estimado</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="personal-salary"
              type="number"
              value={editableSalary}
              onChange={handleSalaryChange}
              placeholder="0.00"
              className="text-lg font-semibold"
            />
            <span className="text-sm text-muted-foreground">USD</span>
          </div>
        </div>

        {/* Validation Alert */}
        {!isValidDistribution && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              La distribución debe sumar 100%. Total actual: {totalPercentage}%
              <Button
                variant="outline"
                size="sm"
                onClick={balanceDistribution}
                className="ml-2"
              >
                Ajustar automáticamente
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Distribution Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {distributionData.map((item) => (
            <DistributionCard
              key={item.key}
              title={item.title}
              icon={item.icon}
              percentage={item.percentage}
              amount={item.amount}
              color={item.color}
              description={item.description}
              onPercentageChange={(value) => updatePercentage(item.key, value)}
            />
          ))}
        </div>

        {/* Summary */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">Total Distribución:</span>
            <span className={`font-bold ${isValidDistribution ? 'text-green-600' : 'text-red-600'}`}>
              {totalPercentage}%
            </span>
          </div>
          <div className="flex justify-between items-center text-sm mt-1">
            <span className="font-medium">Total Monto:</span>
            <span className="font-bold text-primary">
              {formatCurrency(amounts.owners + amounts.savings + amounts.investing)}
            </span>
          </div>
        </div>

        {/* Profit First Info */}
        <div className="bg-muted/30 p-4 rounded-lg">
          <h4 className="font-semibold text-sm mb-2">Método Profit First Personal</h4>
          <p className="text-xs text-muted-foreground">
            <strong>Owners:</strong> Tu salario final después de separar ahorros e inversiones.<br/>
            <strong>Savings:</strong> Fondo de emergencia y objetivos a corto plazo.<br/>
            <strong>Investing:</strong> Inversiones para crecimiento a largo plazo.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalSalaryCalculator;