
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator } from 'lucide-react';
import { TooltipProvider } from "@/components/ui/tooltip";
import { SalaryCalculatorProps } from './types';
import { useSalaryCalculator } from './useSalaryCalculator';
import { SalarySummaryCard } from './SalarySummaryCard';
import { IncomeSourcesSection } from './IncomeSourcesSection';
import { DeductionsSection } from './DeductionsSection';
import { DetailedCalculationsSection } from './DetailedCalculationsSection';
import { SalaryResultsSection } from './SalaryResultsSection';

const SalaryCalculator: React.FC<SalaryCalculatorProps> = ({
  zohoIncome,
  stripeIncome,
  opexAmount,
  itbmAmount,
  profitPercentage,
  startingBalance = 0,
  totalZohoExpenses = 0
}) => {
  // Use the salary calculator hook to get all calculation results
  const results = useSalaryCalculator({
    zohoIncome,
    stripeIncome,
    opexAmount,
    itbmAmount,
    profitPercentage,
    startingBalance,
    totalZohoExpenses
  });

  return (
    <TooltipProvider>
      <Card className="overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 pb-4">
          <CardTitle className="flex items-center text-white">
            <Calculator className="h-6 w-6 mr-2" />
            Calculadora de Salario
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Sección de resumen principal - Visible primero */}
          <div className="p-6 bg-gradient-to-br from-blue-500/10 to-indigo-500/5">
            <SalarySummaryCard salary={results.salary} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <IncomeSourcesSection 
                stripeIncome={stripeIncome}
                startingBalance={startingBalance}
                zohoIncome={zohoIncome}
              />
              
              <DeductionsSection 
                totalZohoExpenses={totalZohoExpenses}
                opexAmount={opexAmount}
                itbmAmount={itbmAmount}
              />
            </div>
          </div>
          
          {/* Sección de cálculos detallados */}
          <div className="p-6 border-t border-blue-100">
            <DetailedCalculationsSection 
              adjustedZohoIncome={results.adjustedZohoIncome}
              profitFirstAmount={results.profitFirstAmount}
              profitPercentage={profitPercentage}
              taxReserveAmount={results.taxReserveAmount}
              taxReservePercentage={results.taxReservePercentage}
              remainingZohoIncome={results.remainingZohoIncome}
              halfStripeIncome={results.halfStripeIncome}
              halfRemainingZoho={results.halfRemainingZoho}
              halfRemainingZohoWithItbm={results.halfRemainingZohoWithItbm}
              itbmCoveragePercentage={results.itbmCoveragePercentage}
            />
            
            <SalaryResultsSection 
              salary={results.salary}
              salaryWithItbmCoverage={results.salaryWithItbmCoverage}
              itbmCoverageAmount={results.itbmCoverageAmount}
              itbmCoveragePercentage={results.itbmCoveragePercentage}
            />
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default SalaryCalculator;
