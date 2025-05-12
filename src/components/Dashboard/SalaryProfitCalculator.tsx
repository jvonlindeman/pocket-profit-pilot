
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SalaryCalculation } from '@/types/financial';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Calculator, ArrowRight, DivideIcon, PlusIcon } from 'lucide-react';

// Define form schema
const formSchema = z.object({
  opexAmount: z.coerce.number().min(0, "El valor debe ser mayor o igual a 0"),
  itbmAmount: z.coerce.number().min(0, "El valor debe ser mayor o igual a 0"),
  profitPercentage: z.coerce.number().min(0, "El porcentaje debe ser mayor o igual a 0"),
});

type FormValues = z.infer<typeof formSchema>;

interface SalaryProfitCalculatorProps {
  zohoIncome: number;
  stripeIncome: number;
  opexAmount: number;
  itbmAmount: number;
  profitPercentage: number;
  salaryCalculation: SalaryCalculation;
  onUpdateValues: (opex: number, itbm: number, profitPct: number) => void;
  isLoading?: boolean;
}

const SalaryProfitCalculator: React.FC<SalaryProfitCalculatorProps> = ({
  zohoIncome,
  stripeIncome,
  opexAmount,
  itbmAmount,
  profitPercentage,
  salaryCalculation,
  onUpdateValues,
  isLoading = false
}) => {
  const { toast } = useToast();
  
  // Initialize form with zodResolver
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      opexAmount,
      itbmAmount,
      profitPercentage
    },
  });

  // Update form values when props change
  useEffect(() => {
    form.reset({
      opexAmount,
      itbmAmount,
      profitPercentage
    });
  }, [opexAmount, itbmAmount, profitPercentage, form]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value}%`;
  };

  // Handle form submission
  const onSubmit = (data: FormValues) => {
    onUpdateValues(
      data.opexAmount,
      data.itbmAmount,
      data.profitPercentage
    );
    
    toast({
      title: "Valores actualizados",
      description: "Se actualizaron los valores del cálculo de salario",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" /> 
          Calculadora de Salario
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side: Zoho calculations */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold border-b pb-2">Cálculo de Zoho</h3>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="opexAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OPEX ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            {...field} 
                            disabled={isLoading}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="itbmAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ITBM ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            {...field} 
                            disabled={isLoading}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="profitPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Porcentaje de Ganancia (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.1" 
                            placeholder="1.0" 
                            {...field} 
                            disabled={isLoading}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                >
                  Actualizar Valores
                </Button>
              </form>
            </Form>

            {/* Calculation steps */}
            <div className="mt-6 space-y-3 bg-gray-50 p-4 rounded-md">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-medium">Ingresos Zoho:</span>
                <span>{formatCurrency(salaryCalculation.zohoIncome)}</span>
              </div>
              
              <div className="flex justify-between items-center text-red-600">
                <span>- OPEX:</span>
                <span>{formatCurrency(salaryCalculation.opexAmount)}</span>
              </div>
              
              <div className="flex justify-between items-center text-red-600">
                <span>- Impuestos (5%):</span>
                <span>{formatCurrency(salaryCalculation.taxAmount)}</span>
              </div>
              
              <div className="flex justify-between items-center text-red-600">
                <span>- ITBM:</span>
                <span>{formatCurrency(salaryCalculation.itbmAmount)}</span>
              </div>
              
              <div className="flex justify-between items-center text-red-600">
                <span>- Ganancia ({profitPercentage}%):</span>
                <span>{formatCurrency(salaryCalculation.profitAmount)}</span>
              </div>
              
              <div className="flex justify-between items-center border-t pt-2 font-medium">
                <span>= Salario de Zoho:</span>
                <span>{formatCurrency(salaryCalculation.zohoSalaryProfit)}</span>
              </div>
              
              <div className="flex items-center justify-center mt-4">
                <DivideIcon className="h-4 w-4 text-gray-500" />
                <span className="mx-2 text-gray-500">Dividido por 2</span>
              </div>
              
              <div className="flex justify-between items-center border-t pt-2 font-semibold text-blue-600">
                <span>= 50% del Salario de Zoho:</span>
                <span>{formatCurrency(salaryCalculation.halfZohoSalaryProfit)}</span>
              </div>
            </div>
          </div>
          
          {/* Right side: Stripe calculations */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold border-b pb-2">Cálculo de Stripe</h3>
            
            <div className="bg-gray-50 p-4 rounded-md space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-medium">Ingresos de Stripe:</span>
                <span>{formatCurrency(salaryCalculation.stripeTotal)}</span>
              </div>
              
              <div className="flex items-center justify-center mt-4">
                <DivideIcon className="h-4 w-4 text-gray-500" />
                <span className="mx-2 text-gray-500">Dividido por 2</span>
              </div>
              
              <div className="flex justify-between items-center border-t pt-2 font-semibold text-blue-600">
                <span>= 50% del Ingreso de Stripe:</span>
                <span>{formatCurrency(salaryCalculation.halfStripeTotal)}</span>
              </div>
            </div>
            
            {/* Total Salary */}
            <div className="mt-8 p-4 bg-blue-50 rounded-md">
              <h4 className="text-lg font-medium text-blue-800 mb-4">Cálculo Final del Salario</h4>
              
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-white rounded shadow flex-1">
                  <div className="text-sm text-gray-500">50% Zoho</div>
                  <div className="font-semibold">{formatCurrency(salaryCalculation.halfZohoSalaryProfit)}</div>
                </div>
                
                <PlusIcon className="h-5 w-5 text-blue-600" />
                
                <div className="p-2 bg-white rounded shadow flex-1">
                  <div className="text-sm text-gray-500">50% Stripe</div>
                  <div className="font-semibold">{formatCurrency(salaryCalculation.halfStripeTotal)}</div>
                </div>
                
                <ArrowRight className="h-5 w-5 text-blue-600" />
                
                <div className="p-3 bg-blue-600 text-white rounded shadow flex-1">
                  <div className="text-sm">TOTAL</div>
                  <div className="font-bold text-lg">{formatCurrency(salaryCalculation.totalSalary)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalaryProfitCalculator;
