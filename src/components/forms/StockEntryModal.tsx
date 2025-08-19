import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarIcon, Package } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const stockItemSchema = z.object({
  product_id: z.string(),
  product_name: z.string(),
  product_code: z.string(),
  quantity: z.number().min(0, 'La cantidad debe ser mayor o igual a 0'),
  unit_cost: z.number().min(0, 'El costo debe ser mayor o igual a 0'),
  total_value: z.number().min(0),
});

const formSchema = z.object({
  supplier_invoice_number: z.string().min(1, 'Número de factura requerido'),
  supplier_invoice_date: z.date(),
  warehouse_id: z.string().min(1, 'Selecciona un depósito'),
  items: z.array(stockItemSchema).min(1, 'Debe haber al menos un producto'),
});

type FormValues = z.infer<typeof formSchema>;

interface Purchase {
  id: string;
  purchase_number: string;
  suppliers: {
    name: string;
  } | null;
}

interface PurchaseItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  products: {
    name: string;
    code: string;
  };
}

interface StockEntryModalProps {
  purchase: Purchase | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function StockEntryModal({
  purchase,
  isOpen,
  onClose,
  onSuccess,
}: StockEntryModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplier_invoice_date: new Date(),
      items: [],
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Query purchase items
  const { data: purchaseItems = [] } = useQuery({
    queryKey: ['purchase-items-stock', purchase?.id],
    queryFn: async () => {
      if (!purchase?.id) return [];
      
      const { data, error } = await supabase
        .from('purchase_items')
        .select(`
          *,
          products!inner (name, code)
        `)
        .eq('purchase_id', purchase.id);

      if (error) throw error;
      return data as PurchaseItem[];
    },
    enabled: isOpen && !!purchase?.id,
  });

  // Query warehouses
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  // Initialize form with purchase items
  useEffect(() => {
    if (purchaseItems.length > 0) {
      const formItems = purchaseItems.map(item => ({
        product_id: item.product_id,
        product_name: item.products.name,
        product_code: item.products.code,
        quantity: item.quantity,
        unit_cost: item.unit_price,
        total_value: item.quantity * item.unit_price,
      }));
      replace(formItems);
    }
  }, [purchaseItems, replace]);

  const onSubmit = async (values: FormValues) => {
    if (!user?.id || !purchase?.id) return;

    setIsSubmitting(true);
    try {
      // First, create inventory movements for each item
      for (const item of values.items) {
        // Check if inventory item exists for this product and warehouse
        const { data: existingInventoryItem } = await supabase
          .from('inventory_items')
          .select('id')
          .eq('product_id', item.product_id)
          .eq('warehouse_id', values.warehouse_id)
          .single();

        if (!existingInventoryItem) {
          // Create inventory item if it doesn't exist
          const { error: inventoryError } = await supabase
            .from('inventory_items')
            .insert({
              product_id: item.product_id,
              warehouse_id: values.warehouse_id,
              current_stock: 0,
              unit_cost: item.unit_cost,
            });

          if (inventoryError) throw inventoryError;
        }

        // Get the inventory item ID (either existing or newly created)
        const { data: inventoryItem, error: getInventoryError } = await supabase
          .from('inventory_items')
          .select('id')
          .eq('product_id', item.product_id)
          .eq('warehouse_id', values.warehouse_id)
          .single();

        if (getInventoryError) throw getInventoryError;

        // Create inventory movement
        const { error: movementError } = await supabase
          .from('inventory_movements')
          .insert({
            inventory_item_id: inventoryItem.id,
            movement_type: 'entrada',
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            total_value: item.quantity * item.unit_cost, // Ensure we calculate this
            user_id: user.id,
            movement_date: new Date().toISOString().split('T')[0], // Add movement_date explicitly
            reference_document: `Compra ${purchase.purchase_number} - Factura ${values.supplier_invoice_number}`,
            notes: `Ingreso de stock por compra. Factura proveedor: ${values.supplier_invoice_number}`,
          });

        if (movementError) throw movementError;
      }

      // Update purchase status to "recibido"
      const { error: updatePurchaseError } = await supabase
        .from('purchases')
        .update({ 
          status: 'recibido',
          // Store supplier invoice details in notes for now
          notes: `Factura proveedor: ${values.supplier_invoice_number} (${format(values.supplier_invoice_date, 'dd/MM/yyyy', { locale: es })})`
        })
        .eq('id', purchase.id);

      if (updatePurchaseError) throw updatePurchaseError;

      toast({
        title: 'Éxito',
        description: 'Stock ingresado correctamente al inventario',
      });
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al ingresar el stock',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateItemCalculations = (index: number, field: 'quantity' | 'unit_cost', value: number) => {
    const currentItems = form.getValues('items');
    const updatedItem = { ...currentItems[index] };
    
    updatedItem[field] = value;
    updatedItem.total_value = updatedItem.quantity * updatedItem.unit_cost;
    
    const updatedItems = [...currentItems];
    updatedItems[index] = updatedItem;
    
    form.setValue('items', updatedItems);
  };

  if (!purchase) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Ingresar Stock - Compra {purchase.purchase_number}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Header Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="supplier_invoice_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Factura Proveedor</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ej: FAC-001234" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supplier_invoice_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha Factura Proveedor</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className="w-full pl-3 text-left font-normal"
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
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
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="warehouse_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Depósito Destino</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un depósito" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Products Table */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Productos de la Compra</h4>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Costo Unitario</TableHead>
                    <TableHead>Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell className="font-medium">
                        {field.product_code}
                      </TableCell>
                      <TableCell>{field.product_name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          value={field.quantity}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            updateItemCalculations(index, 'quantity', value);
                          }}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={field.unit_cost}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            updateItemCalculations(index, 'unit_cost', value);
                          }}
                          className="w-32"
                        />
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          ${field.total_value.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {fields.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  No hay productos para esta compra
                </div>
              )}
            </div>

            {/* Summary */}
            {fields.length > 0 && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total General:</span>
                  <span className="text-lg font-bold">
                    ${fields.reduce((sum, item) => sum + item.total_value, 0).toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || fields.length === 0}>
                {isSubmitting ? 'Ingresando Stock...' : 'Ingresar Stock'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}