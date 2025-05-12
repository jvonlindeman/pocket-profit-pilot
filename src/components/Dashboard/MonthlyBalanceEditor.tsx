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
import { Switch } from "@/components/ui/switch";

interface MonthlyBalanceEditorProps {
  currentDate: Date;
  onBalanceChange?: (balance: number) => void;
  onStripeOverrideChange?: (override: number | null) => void;
}

// Define form schema
const formSchema = z.object({
  balance: z.coerce.number().min(0, "El saldo debe ser mayor o igual a 0"),
  notes: z.string().optional(),
  stripe_override: z.coerce.number().optional().nullable(),
  use_override: z.boolean().default(false)
});

type FormValues = z.infer<typeof formSchema>;

const MonthlyBalanceEditor: React.FC<MonthlyBalanceEditorProps> = ({ 
  currentDate,
  onBalanceChange,
  onStripeOverrideChange
}) => {
  // Initialize form with zodResolver
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      balance: 0,
      notes: '',
      stripe_override: null,
      use_override: false
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
        notes: monthlyBalance.notes || '',
        stripe_override: monthlyBalance.stripe_override,
        use_override: !!monthlyBalance.stripe_override
      });
      
      // Notify parent component if needed
      if (onBalanceChange) {
        onBalanceChange(monthlyBalance.balance);
      }
      
      if (onStripeOverrideChange) {
        onStripeOverrideChange(monthlyBalance.stripe_override);
      }
    }
  }, [monthlyBalance, form, onBalanceChange, onStripeOverrideChange]);

  // Format month name in Spanish
  const formattedMonth = format(currentDate, 'MMMM yyyy', { locale: es });
  const capitalizedMonth = formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1);

  // Handle form submission
  const onSubmit = (data: FormValues) => {
    const override = data.use_override ? data.stripe_override : null;
    updateMonthlyBalance(data.balance, data.notes, override);
    
    // Notify parent component if needed
    if (onBalanceChange) {
      onBalanceChange(data.balance);
    }
    
    if (onStripeOverrideChange) {
      onStripeOverrideChange(override);
    }
  };

  // Toggle for using Stripe override
  const handleOverrideToggle = (checked: boolean) => {
    form.setValue('use_override', checked);
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
            
            <div className="space-y-4 border-t border-b py-4 my-4">
              <FormField
                control={form.control}
                name="use_override"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Usar valor manual para Stripe</FormLabel>
                      <FormDescription>
                        Sobreescribir el valor obtenido de la API de Stripe
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          handleOverrideToggle(checked);
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {form.watch('use_override') && (
                <FormField
                  control={form.control}
                  name="stripe_override"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ingreso Neto de Stripe ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field} 
                          value={field.value === null ? '' : field.value}
                          onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                          disabled={loading || !form.watch('use_override')}
                        />
                      </FormControl>
                      <FormDescription>
                        Valor manual para los ingresos de Stripe (neto después de comisiones)
                      </FormDescription>
                    </FormItem>
                  )}
                />
              )}
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
