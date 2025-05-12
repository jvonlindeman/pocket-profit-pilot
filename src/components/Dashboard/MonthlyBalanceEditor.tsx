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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MonthlyBalanceEditorProps {
  currentDate: Date;
  onBalanceChange?: (balance: number) => void;
  onStripeOverrideChange?: (stripeOverride: number | null) => void;
}

// Define form schema
const formSchema = z.object({
  balance: z.coerce.number().min(0, "El saldo debe ser mayor o igual a 0"),
  notes: z.string().optional(),
  stripe_override: z.union([
    z.coerce.number().min(0, "El valor debe ser mayor o igual a 0"),
    z.literal('').transform(() => null)
  ])
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
      stripe_override: ''
    },
  });

  // Get the monthly balance data
  const {
    loading,
    error,
    monthlyBalance,
    updateMonthlyBalance,
    updateStripeOverride,
    currentMonthYear,
  } = useMonthlyBalance({ currentDate });

  // Update form values when data is loaded
  useEffect(() => {
    if (monthlyBalance) {
      form.reset({
        balance: monthlyBalance.balance,
        notes: monthlyBalance.notes || '',
        stripe_override: monthlyBalance.stripe_override !== null ? 
          monthlyBalance.stripe_override : ''
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
    updateMonthlyBalance(
      data.balance, 
      data.notes, 
      data.stripe_override === '' ? null : data.stripe_override
    );
    
    // Notify parent component if needed
    if (onBalanceChange) {
      onBalanceChange(data.balance);
    }
    
    if (onStripeOverrideChange) {
      onStripeOverrideChange(data.stripe_override === '' ? null : data.stripe_override);
    }
  };

  // Handle specific Stripe override update
  const handleStripeOverrideUpdate = (value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    updateStripeOverride(numValue);
    
    if (onStripeOverrideChange) {
      onStripeOverrideChange(numValue);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración: {capitalizedMonth}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="balance">
          <TabsList className="mb-4">
            <TabsTrigger value="balance">Balance Inicial</TabsTrigger>
            <TabsTrigger value="stripe">Stripe Manual</TabsTrigger>
          </TabsList>
          
          <TabsContent value="balance">
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
          </TabsContent>
          
          <TabsContent value="stripe">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="stripe_override"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ingresos Stripe Manual ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="Dejar vacío para usar datos automáticos" 
                          {...field} 
                          disabled={loading}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Sobrescribe los ingresos de Stripe para este mes. Dejar vacío para usar datos automáticos.
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loading}
                >
                  {monthlyBalance?.stripe_override !== null ? 'Actualizar Valor' : 'Guardar Valor'}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
        
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
