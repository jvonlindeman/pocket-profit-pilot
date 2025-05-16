
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MonthlyBalance } from '@/types/financial';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface MonthlyBalanceEditorProps {
  currentDate: Date;
  onBalanceChange?: (balance: number) => void;
}

// Define form schema
const formSchema = z.object({
  balance: z.coerce.number().min(0, "El saldo debe ser mayor o igual a 0"),
  opexPercentage: z.coerce.number().min(0, "El OPEX debe ser mayor o igual a 0").default(35),
  itbmAmount: z.coerce.number().min(0, "El ITBM debe ser mayor o igual a 0").default(0),
  profitPercentage: z.coerce.number().min(0, "El Profit First debe ser mayor o igual a 0").default(1),
  notes: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

const MonthlyBalanceEditor: React.FC<MonthlyBalanceEditorProps> = ({ 
  currentDate,
  onBalanceChange
}) => {
  // Initialize form with zodResolver
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      balance: 0,
      opexPercentage: 35, // Default 35%
      itbmAmount: 0,
      profitPercentage: 1, // Default 1%
      notes: ''
    },
  });

  // Get the monthly balance data
  const {
    loading,
    error,
    monthlyBalance,
    updateMonthlyBalance,
    currentMonthYear,
  } = useMonthlyBalance({ currentDate });

  // Update form values when data is loaded
  useEffect(() => {
    if (monthlyBalance) {
      form.reset({
        balance: monthlyBalance.balance,
        opexPercentage: monthlyBalance.opex_amount !== null ? monthlyBalance.opex_amount : 35,
        itbmAmount: monthlyBalance.itbm_amount !== null ? monthlyBalance.itbm_amount : 0,
        profitPercentage: monthlyBalance.profit_percentage !== null ? monthlyBalance.profit_percentage : 1,
        notes: monthlyBalance.notes || ''
      });
    }
  }, [monthlyBalance, form]);

  // Format month name in Spanish
  const formattedMonth = format(currentDate, 'MMMM yyyy', { locale: es });
  const capitalizedMonth = formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1);

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    const success = await updateMonthlyBalance(
      data.balance, 
      data.opexPercentage, 
      data.itbmAmount, 
      data.profitPercentage, 
      data.notes
    );
    
    // IMPROVED: Immediately notify parent component on successful update
    if (success && onBalanceChange) {
      // Call the parent's onBalanceChange to update the UI immediately
      onBalanceChange(data.balance);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balance Inicial: {capitalizedMonth}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saldo Inicial ($)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      {...field} 
                      disabled={loading}
                    />
                  </FormControl>
                  <FormDescription>
                    Saldo al inicio del mes antes de cualquier transacción
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="opexPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OPEX (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1" 
                        placeholder="35.0" 
                        {...field} 
                        disabled={loading}
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
                        disabled={loading}
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
                    <FormLabel>Profit First (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1" 
                        placeholder="1.0" 
                        {...field} 
                        disabled={loading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Añade notas o comentarios sobre este balance" 
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {monthlyBalance ? 'Actualizar Balance' : 'Guardar Balance'}
            </Button>
          </form>
        </Form>
        
        {error && (
          <div className="mt-4 text-sm text-red-500">
            {error}
          </div>
        )}
        
        {monthlyBalance && (
          <div className="mt-4 text-xs text-gray-500">
            Última actualización: {new Date(monthlyBalance.updated_at).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MonthlyBalanceEditor;
