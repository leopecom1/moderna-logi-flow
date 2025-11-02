import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MessageLoading } from '@/components/ui/message-loading';

const formSchema = z.object({
  cadete_id: z.string().min(1, 'Selecciona un cadete'),
  route_date: z.string().min(1, 'Selecciona una fecha'),
});

type FormData = z.infer<typeof formSchema>;

interface Cadete {
  user_id: string;
  full_name: string;
}

interface EditRouteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routeId: string;
  currentCadeteId: string;
  currentRouteDate: string;
  onRouteUpdated: () => void;
}

export const EditRouteModal = ({ 
  open, 
  onOpenChange, 
  routeId, 
  currentCadeteId, 
  currentRouteDate,
  onRouteUpdated 
}: EditRouteModalProps) => {
  const [cadetes, setCadetes] = useState<Cadete[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cadete_id: currentCadeteId,
      route_date: currentRouteDate,
    },
  });

  useEffect(() => {
    if (open) {
      fetchCadetes();
      // Reset form with current values when modal opens
      form.reset({
        cadete_id: currentCadeteId,
        route_date: currentRouteDate,
      });
    }
  }, [open, currentCadeteId, currentRouteDate]);

  const fetchCadetes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .eq('role', 'cadete')
        .order('full_name');

      if (error) throw error;
      setCadetes(data || []);
    } catch (error: any) {
      console.error('Error fetching cadetes:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los cadetes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: FormData) => {
    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('routes')
        .update({
          cadete_id: values.cadete_id,
          route_date: values.route_date,
          updated_at: new Date().toISOString(),
        })
        .eq('id', routeId);

      if (error) throw error;

      toast({
        title: 'Ruta actualizada',
        description: 'La ruta se ha actualizado correctamente',
      });

      onOpenChange(false);
      onRouteUpdated();
    } catch (error: any) {
      console.error('Error updating route:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la ruta',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Ruta</DialogTitle>
          <DialogDescription>
            Modifica el cadete asignado o la fecha de la ruta
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <MessageLoading />
            <span className="ml-3">Cargando...</span>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="cadete_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cadete</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un cadete" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cadetes.map((cadete) => (
                          <SelectItem key={cadete.user_id} value={cadete.user_id}>
                            {cadete.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="route_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de la ruta</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
