
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  notes: z.string().optional(),
  stripeOverride: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().min(0, "El valor debe ser mayor o igual a 0").nullable()
  )
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
      notes: '',
      stripeOverride: null
    },
  });

  // Get the monthly balance data
  const {
    loading,
    error,
    balance,
    notes,
    stripeOverride,
    saveBalance,
    monthlyBalance,
  } = useMonthlyBalance({ currentDate });

  // Update form values when data is loaded
  useEffect(() => {
    if (balance !== null) {
      form.reset({
        balance: balance,
        notes: notes || '',
        stripeOverride: stripeOverride
      });
      
      // Notify parent component if needed
      if (onBalanceChange) {
        onBalanceChange(balance);
      }
    }
  }, [balance, notes, stripeOverride, form, onBalanceChange]);

  // Format month name in Spanish
  const formattedMonth = format(currentDate, 'MMMM yyyy', { locale: es });
  const capitalizedMonth = formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1);

  // Handle form submission
  const onSubmit = (data: FormValues) => {
    saveBalance(data.balance, data.notes, data.stripeOverride);
    
    // Notify parent component if needed
    if (onBalanceChange) {
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
            
            <FormField
              control={form.control}
              name="stripeOverride"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Anular Ingreso de Stripe ($)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="Dejar en blanco para usar datos automáticos" 
                      {...field}
                      value={field.value === null ? '' : field.value}
                      onChange={(e) => {
                        const value = e.target.value === '' ? null : parseFloat(e.target.value);
                        field.onChange(value);
                      }}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormDescription>
                    Opcional: Anula el valor automático de Stripe para este mes
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
              {balance !== null ? 'Actualizar Balance' : 'Guardar Balance'}
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
