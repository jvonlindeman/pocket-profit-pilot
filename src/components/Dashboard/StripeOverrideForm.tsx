
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale'; // Import the Spanish locale as an ES module
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { formatCurrency } from '@/lib/date-utils';

// Schema for form validation
const stripeOverrideSchema = z.object({
  amount: z.coerce.number({
    required_error: "El importe es requerido.",
    invalid_type_error: "El importe debe ser un número.",
  })
  .nullable()
  .refine((val) => val === null || val >= 0, {
    message: "El importe debe ser mayor o igual a 0.",
  }),
});

type StripeOverrideValues = z.infer<typeof stripeOverrideSchema>;

interface StripeOverrideFormProps {
  onOverrideUpdated?: () => void;
  currentDate?: Date;
  currentOverride?: number | null;
}

const StripeOverrideForm: React.FC<StripeOverrideFormProps> = ({ 
  onOverrideUpdated, 
  currentDate = new Date(),
  currentOverride = null
}) => {
  const { toast } = useToast();
  
  const monthYear = format(currentDate, 'yyyy-MM');
  
  const form = useForm<StripeOverrideValues>({
    resolver: zodResolver(stripeOverrideSchema),
    defaultValues: {
      amount: currentOverride,
    },
  });

  const onSubmit = async (values: StripeOverrideValues) => {
    try {
      // Create the month-year string for the monthly balance
      const monthYearString = format(currentDate, 'yyyy-MM');
      
      // Check if a monthly balance record exists for this month
      const { data: existingBalance, error: checkError } = await supabase
        .from('monthly_balances')
        .select('id, stripe_override')
        .eq('month_year', monthYearString)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      let result;
      
      if (existingBalance) {
        // Update the existing monthly balance
        result = await supabase
          .from('monthly_balances')
          .update({
            stripe_override: values.amount,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingBalance.id);
      } else {
        // Insert a new monthly balance
        result = await supabase
          .from('monthly_balances')
          .insert({
            month_year: monthYearString,
            balance: 0, // Default balance
            stripe_override: values.amount,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
      
      if (result.error) {
        throw result.error;
      }
      
      const action = values.amount === null
        ? "anulado"
        : existingBalance?.stripe_override !== undefined
          ? "actualizado"
          : "establecido";
          
      const valueDisplay = values.amount === null
        ? "valor predeterminado (calculado automáticamente)"
        : formatCurrency(values.amount);
      
      // Show success toast
      toast({
        title: "Valor de Stripe actualizado",
        description: `Se ha ${action} el valor mensual fijo de Stripe a ${valueDisplay}.`,
      });
      
      // Trigger refresh if callback is provided
      if (onOverrideUpdated) {
        onOverrideUpdated();
      }
      
    } catch (error) {
      console.error("Error updating Stripe override value:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el valor fijo de Stripe.",
        variant: "destructive",
      });
    }
  };

  const resetToAuto = () => {
    form.setValue("amount", null);
    form.handleSubmit(onSubmit)();
  };

  const monthName = format(currentDate, 'MMMM yyyy', { locale: es }); // Use the imported ES locale

  return (
    <Card className="bg-white">
      <CardContent className="pt-6">
        <CardDescription className="mb-4">
          Configura un valor fijo para los ingresos mensuales de Stripe para {monthName}.
          {currentOverride !== null && currentOverride !== undefined && (
            <Badge className="ml-2 bg-amber-100 text-amber-800">Valor actual: {formatCurrency(currentOverride)}</Badge>
          )}
        </CardDescription>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Importe Fijo ($)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="Dejar vacío para cálculo automático" 
                      value={field.value === null ? '' : field.value}
                      onChange={(e) => {
                        const val = e.target.value === '' ? null : e.target.valueAsNumber;
                        field.onChange(val);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Deja vacío para usar el cálculo automático de transacciones.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex space-x-2">
              <Button type="submit" className="flex-1">
                Guardar Valor Fijo
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={resetToAuto} 
                className="flex-1"
              >
                Restablecer Auto
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default StripeOverrideForm;
