
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
import { CalendarIcon, Package, Plus, Trash2 } from 'lucide-react';
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
  purchase?: Purchase | null;
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
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      console.log('Starting stock entry process with values:', values);
      
      // First, create inventory movements for each item
      for (const item of values.items) {
        console.log(`Processing item: ${item.product_name} (${item.product_id})`);
        
        // Check if inventory item exists for this product and warehouse
        const { data: existingInventoryItem, error: checkError } = await supabase
          .from('inventory_items')
          .select('id')
          .eq('product_id', item.product_id)
          .eq('warehouse_id', values.warehouse_id)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking inventory item:', checkError);
          throw checkError;
        }

        if (!existingInventoryItem) {
          console.log(`Creating new inventory item for product ${item.product_id} in warehouse ${values.warehouse_id}`);
          // Create inventory item if it doesn't exist
          const { error: inventoryError } = await supabase
            .from('inventory_items')
            .insert({
              product_id: item.product_id,
              warehouse_id: values.warehouse_id,
              current_stock: 0,
              unit_cost: item.unit_cost,
            });

          if (inventoryError) {
            console.error('Error creating inventory item:', inventoryError);
            throw inventoryError;
          }
          console.log('Successfully created inventory item');
        }

        // Get the inventory item ID (either existing or newly created)
        const { data: inventoryItem, error: getInventoryError } = await supabase
          .from('inventory_items')
          .select('id')
          .eq('product_id', item.product_id)
          .eq('warehouse_id', values.warehouse_id)
          .single();

        if (getInventoryError) {
          console.error('Error getting inventory item:', getInventoryError);
          throw getInventoryError;
        }

        console.log(`Found inventory item with ID: ${inventoryItem.id}`);

        // Create inventory movement
        const movementData = {
          inventory_item_id: inventoryItem.id,
          movement_type: 'entrada',
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          user_id: user.id,
          movement_date: new Date().toISOString().split('T')[0],
          reference_document: purchase ? `Compra ${purchase.purchase_number} - Factura ${values.supplier_invoice_number}` : `Movimiento manual - Factura ${values.supplier_invoice_number}`,
          notes: purchase ? `Ingreso de stock por compra. Factura proveedor: ${values.supplier_invoice_number}` : `Movimiento manual de stock. Factura: ${values.supplier_invoice_number}`,
        };
        
        console.log('Creating movement with data:', movementData);
        
        const { error: movementError } = await supabase
          .from('inventory_movements')
          .insert(movementData);

        if (movementError) {
          console.error('Movement creation error:', movementError);
          throw movementError;
        }

        console.log('Successfully created inventory movement');
      }

      // Update purchase status to "recibido" if this is a purchase entry
      if (purchase?.id) {
        console.log('Updating purchase status to "recibido"');
        const { error: updatePurchaseError } = await supabase
          .from('purchases')
          .update({ 
            status: 'recibido',
            // Store supplier invoice details in notes for now
            notes: `Factura proveedor: ${values.supplier_invoice_number} (${format(values.supplier_invoice_date, 'dd/MM/yyyy', { locale: es })})`
          })
          .eq('id', purchase.id);

        if (updatePurchaseError) {
          console.error('Error updating purchase:', updatePurchaseError);
          throw updatePurchaseError;
        }
      }

      console.log('Stock entry process completed successfully!');
      toast({
        title: 'Éxito',
        description: 'Stock ingresado correctamente al inventario',
      });
      
      onSuccess();
    } catch (error: any) {
      console.error('Stock entry process failed:', error);
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

  // Query all products for manual entries
  const { data: allProducts = [] } = useQuery({
    queryKey: ['products-for-stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, code, cost')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: isOpen && !purchase,
  });

  const addManualProduct = () => {
    const newItem = {
      product_id: '',
      product_name: '',
      product_code: '',
      quantity: 0,
      unit_cost: 0,
      total_value: 0,
    };
    replace([...form.getValues('items'), newItem]);
  };

  const removeItem = (index: number) => {
    const currentItems = form.getValues('items');
    const newItems = currentItems.filter((_, i) => i !== index);
    replace(newItems);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {purchase ? `Ingresar Stock - Compra ${purchase.purchase_number}` : 'Nuevo Movimiento de Stock'}
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
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-medium">{purchase ? 'Productos de la Compra' : 'Productos'}</h4>
                {!purchase && (
                  <Button type="button" variant="outline" onClick={addManualProduct}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Producto
                  </Button>
                )}
              </div>
              
              <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Código</TableHead>
                     <TableHead>Producto</TableHead>
                     <TableHead>Cantidad</TableHead>
                     <TableHead>Costo Unitario</TableHead>
                     <TableHead>Valor Total</TableHead>
                     {!purchase && <TableHead>Acciones</TableHead>}
                   </TableRow>
                 </TableHeader>
                <TableBody>
                   {fields.map((field, index) => (
                     <TableRow key={field.id}>
                       <TableCell className="font-medium">
                         {!purchase ? (
                           <Select
                             value={field.product_id}
                             onValueChange={(value) => {
                               const selectedProduct = allProducts.find(p => p.id === value);
                               if (selectedProduct) {
                                 const currentItems = form.getValues('items');
                                 const updatedItems = [...currentItems];
                                 updatedItems[index] = {
                                   ...updatedItems[index],
                                   product_id: selectedProduct.id,
                                   product_name: selectedProduct.name,
                                   product_code: selectedProduct.code,
                                   unit_cost: selectedProduct.cost || 0,
                                   total_value: (updatedItems[index].quantity || 0) * (selectedProduct.cost || 0),
                                 };
                                 form.setValue('items', updatedItems);
                               }
                             }}
                           >
                             <SelectTrigger className="w-full">
                               <SelectValue placeholder="Seleccionar producto" />
                             </SelectTrigger>
                             <SelectContent>
                               {allProducts.map((product) => (
                                 <SelectItem key={product.id} value={product.id}>
                                   {product.code}
                                 </SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                         ) : (
                           field.product_code
                         )}
                       </TableCell>
                       <TableCell>
                         {!purchase ? (
                           <span>{field.product_name || 'Seleccionar producto'}</span>
                         ) : (
                           field.product_name
                         )}
                       </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          value={field.quantity || 0}
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
                          value={field.unit_cost || 0}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            updateItemCalculations(index, 'unit_cost', value);
                          }}
                          className="w-32"
                        />
                      </TableCell>
                       <TableCell>
                         <span className="font-medium">
                           ${(field.total_value || 0).toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                         </span>
                       </TableCell>
                       {!purchase && (
                         <TableCell>
                           <Button
                             type="button"
                             variant="ghost"
                             size="sm"
                             onClick={() => removeItem(index)}
                           >
                             <Trash2 className="h-4 w-4" />
                           </Button>
                         </TableCell>
                       )}
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
                    ${fields.reduce((sum, item) => sum + (item.total_value || 0), 0).toLocaleString('es-UY', { minimumFractionDigits: 2 })}
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
