
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
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

// Schema for form validation
const stripeFormSchema = z.object({
  date: z.date({
    required_error: "La fecha es requerida.",
  }),
  amount: z.coerce.number({
    required_error: "El importe es requerido.",
    invalid_type_error: "El importe debe ser un número.",
  }).positive("El importe debe ser mayor que 0."),
  description: z.string().min(3, "La descripción debe tener al menos 3 caracteres."),
});

type StripeFormValues = z.infer<typeof stripeFormSchema>;

interface ManualStripeFormProps {
  onTransactionAdded?: () => void;
}

const ManualStripeForm: React.FC<ManualStripeFormProps> = ({ onTransactionAdded }) => {
  const { toast } = useToast();
  
  const form = useForm<StripeFormValues>({
    resolver: zodResolver(stripeFormSchema),
    defaultValues: {
      date: new Date(),
      amount: undefined,
      description: 'Ingreso de Stripe',
    },
  });

  const onSubmit = async (values: StripeFormValues) => {
    try {
      const dateString = format(values.date, 'yyyy-MM-dd');
      
      // Generate a consistent external_id for the transaction
      const externalId = `stripe-manual-${dateString}-${values.amount}-${Date.now()}`;
      
      // Insert the new transaction into the database
      const { error } = await supabase
        .from('cached_transactions')
        .insert({
          date: dateString,
          amount: values.amount,
          description: values.description,
          category: 'Ingresos por plataforma',
          source: 'Stripe',
          type: 'income',
          external_id: externalId,
          sync_date: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }
      
      // Show success toast
      toast({
        title: "Transacción añadida",
        description: `Se ha añadido una transacción de Stripe por $${values.amount}`,
      });
      
      // Reset the form
      form.reset({
        date: new Date(),
        amount: undefined,
        description: 'Ingreso de Stripe',
      });
      
      // Trigger refresh if callback is provided
      if (onTransactionAdded) {
        onTransactionAdded();
      }
      
    } catch (error) {
      console.error("Error adding manual Stripe transaction:", error);
      toast({
        title: "Error",
        description: "No se pudo añadir la transacción de Stripe.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle>Añadir Transacción Manual de Stripe</CardTitle>
        <CardDescription>
          Ingresa los detalles de una transacción de Stripe manualmente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Selecciona una fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("2000-01-01")
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Importe ($)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormDescription>
                    Ingresa el importe en dólares (USD).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingreso de Stripe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full">
              Añadir Transacción
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ManualStripeForm;
