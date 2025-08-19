import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings, Percent } from 'lucide-react';

const formSchema = z.object({
  price_list_1_name: z.string().min(1, "Nombre de lista 1 es requerido"),
  price_list_2_name: z.string().min(1, "Nombre de lista 2 es requerido"),
  auto_calculate_enabled: z.boolean(),
  margin_percentage_list_1: z.number().min(0).max(1000),
  margin_percentage_list_2: z.number().min(0).max(1000),
});

type FormValues = z.infer<typeof formSchema>;

interface PriceListsConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigUpdated?: () => void;
}

export const PriceListsConfigModal = ({ 
  open, 
  onOpenChange, 
  onConfigUpdated 
}: PriceListsConfigModalProps) => {
  const [loading, setLoading] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      price_list_1_name: 'Lista Minorista',
      price_list_2_name: 'Lista Mayorista',
      auto_calculate_enabled: false,
      margin_percentage_list_1: 0,
      margin_percentage_list_2: 0,
    },
  });

  useEffect(() => {
    if (open) {
      loadConfig();
    }
  }, [open]);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('price_lists_config')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setConfigId(data.id);
        form.reset({
          price_list_1_name: data.price_list_1_name,
          price_list_2_name: data.price_list_2_name,
          auto_calculate_enabled: data.auto_calculate_enabled,
          margin_percentage_list_1: data.margin_percentage_list_1 || 0,
          margin_percentage_list_2: data.margin_percentage_list_2 || 0,
        });
      }
    } catch (error) {
      console.error('Error loading config:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la configuración de listas de precio',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);

      const configData = {
        price_list_1_name: values.price_list_1_name,
        price_list_2_name: values.price_list_2_name,
        auto_calculate_enabled: values.auto_calculate_enabled,
        margin_percentage_list_1: values.margin_percentage_list_1,
        margin_percentage_list_2: values.margin_percentage_list_2,
      };

      let error;
      if (configId) {
        ({ error } = await supabase
          .from('price_lists_config')
          .update(configData)
          .eq('id', configId));
      } else {
        ({ error } = await supabase
          .from('price_lists_config')
          .insert([configData]));
      }

      if (error) throw error;

      // Si está habilitado el cálculo automático, actualizar todos los productos
      if (values.auto_calculate_enabled) {
        await updateAllProductPrices(values.margin_percentage_list_1, values.margin_percentage_list_2);
      }

      toast({
        title: 'Configuración guardada',
        description: 'La configuración de listas de precio ha sido actualizada',
      });

      onConfigUpdated?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la configuración',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAllProductPrices = async (margin1: number, margin2: number) => {
    try {
      const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('id, cost');

      if (fetchError) throw fetchError;

      const updates = products?.map(product => ({
        id: product.id,
        price_list_1: product.cost * (1 + margin1 / 100),
        price_list_2: product.cost * (1 + margin2 / 100),
      })) || [];

      for (const update of updates) {
        const { error } = await supabase
          .from('products')
          .update({
            price_list_1: update.price_list_1,
            price_list_2: update.price_list_2,
          })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast({
        title: 'Precios actualizados',
        description: `Se actualizaron los precios de ${updates.length} productos`,
      });
    } catch (error) {
      console.error('Error updating product prices:', error);
      toast({
        title: 'Error',
        description: 'Error al actualizar precios de productos',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configuración de Listas de Precio</span>
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price_list_1_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Lista 1</FormLabel>
                    <FormControl>
                      <Input placeholder="Lista Minorista" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price_list_2_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Lista 2</FormLabel>
                    <FormControl>
                      <Input placeholder="Lista Mayorista" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="auto_calculate_enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Cálculo Automático de Márgenes
                    </FormLabel>
                    <FormDescription>
                      Calcular precios automáticamente basado en el costo y margen
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch('auto_calculate_enabled') && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <FormField
                  control={form.control}
                  name="margin_percentage_list_1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <Percent className="h-4 w-4" />
                        <span>Margen Lista 1 (%)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="10"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="margin_percentage_list_2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <Percent className="h-4 w-4" />
                        <span>Margen Lista 2 (%)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="20"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};