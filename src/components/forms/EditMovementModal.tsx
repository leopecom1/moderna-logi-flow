import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const formSchema = z.object({
  movement_date: z.string().min(1, 'La fecha es requerida'),
  balance_amount: z.string().min(1, 'El monto es requerido'),
  payment_info: z.string().optional(),
});

interface Movement {
  id: string;
  movement_date: string;
  payment_info: string | null;
  balance_amount: number;
  created_at: string;
}

interface EditMovementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movement: Movement | null;
  onMovementUpdated: () => void;
}

export const EditMovementModal = ({
  open,
  onOpenChange,
  movement,
  onMovementUpdated,
}: EditMovementModalProps) => {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      movement_date: movement ? movement.movement_date.split('T')[0] : '',
      balance_amount: movement ? movement.balance_amount.toString() : '',
      payment_info: movement?.payment_info || '',
    },
  });

  // Reset form when movement changes
  useEffect(() => {
    if (movement) {
      form.reset({
        movement_date: movement.movement_date.split('T')[0],
        balance_amount: movement.balance_amount.toString(),
        payment_info: movement.payment_info || '',
      });
    }
  }, [movement, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!movement) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('customer_movements')
        .update({
          movement_date: values.movement_date,
          balance_amount: Number(values.balance_amount),
          payment_info: values.payment_info || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', movement.id);

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Movimiento actualizado correctamente',
      });

      onMovementUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating movement:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el movimiento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Movimiento</DialogTitle>
          <DialogDescription>
            Modifica los detalles del movimiento del cliente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="movement_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha del Movimiento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="balance_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_info"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Información de Pago (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detalles del pago..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};