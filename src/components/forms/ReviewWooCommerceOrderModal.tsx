import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Store, Package } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ReviewWooCommerceOrderModalProps {
  order: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReviewWooCommerceOrderModal({ order, open, onOpenChange }: ReviewWooCommerceOrderModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    branch_id: '',
    retiro_en_sucursal: false,
    entregar_ahora: false,
    delivery_date: '',
    requiere_armado: false,
    armado_fecha: '',
    armado_horario: '',
    armado_contacto_nombre: '',
    armado_contacto_telefono: '',
    armador_id: '',
    products: [] as any[],
  });

  // Fetch branches
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch warehouses
  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
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

  // Fetch armadores
  const { data: armadores } = useQuery({
    queryKey: ['armadores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('armadores')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Initialize form data from order
  useEffect(() => {
    if (order && open) {
      const products = typeof order.products === 'string' 
        ? JSON.parse(order.products) 
        : order.products;

      setFormData({
        branch_id: order.branch_id || '',
        retiro_en_sucursal: order.retiro_en_sucursal || false,
        entregar_ahora: order.entregar_ahora || false,
        delivery_date: order.delivery_date || '',
        requiere_armado: order.requiere_armado || false,
        armado_fecha: order.armado_fecha || '',
        armado_horario: order.armado_horario || '',
        armado_contacto_nombre: order.armado_contacto_nombre || '',
        armado_contacto_telefono: order.armado_contacto_telefono || '',
        armador_id: order.armador_id || '',
        products: products.map((p: any) => ({
          ...p,
          warehouse_id: p.warehouse_id || '',
        })),
      });
    }
  }, [order, open]);

  // Update product warehouse
  const updateProductWarehouse = (index: number, warehouseId: string) => {
    const warehouseName = warehouses?.find(w => w.id === warehouseId)?.name || '';
    const updatedProducts = [...formData.products];
    updatedProducts[index] = {
      ...updatedProducts[index],
      warehouse_id: warehouseId,
      warehouse_name: warehouseName,
    };
    setFormData({ ...formData, products: updatedProducts });
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('orders')
        .update({
          branch_id: formData.branch_id || null,
          retiro_en_sucursal: formData.retiro_en_sucursal,
          entregar_ahora: formData.entregar_ahora,
          delivery_date: formData.delivery_date || null,
          requiere_armado: formData.requiere_armado,
          armado_fecha: formData.requiere_armado ? formData.armado_fecha || null : null,
          armado_horario: formData.requiere_armado ? formData.armado_horario || null : null,
          armado_contacto_nombre: formData.requiere_armado ? formData.armado_contacto_nombre || null : null,
          armado_contacto_telefono: formData.requiere_armado ? formData.armado_contacto_telefono || null : null,
          armador_id: formData.requiere_armado ? formData.armador_id || null : null,
          armado_estado: formData.requiere_armado ? 'pendiente' : null,
          products: JSON.stringify(formData.products),
          status: 'pendiente_envio', // Update status after review
        })
        .eq('id', order.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: 'Pedido actualizado',
        description: 'La información operativa se guardó correctamente.',
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!formData.branch_id) {
      toast({
        title: 'Campo requerido',
        description: 'Debes seleccionar una sucursal.',
        variant: 'destructive',
      });
      return;
    }

    // Check all products have warehouse
    const missingWarehouse = formData.products.some(p => !p.warehouse_id);
    if (missingWarehouse) {
      toast({
        title: 'Depósitos incompletos',
        description: 'Todos los productos deben tener un depósito asignado.',
        variant: 'destructive',
      });
      return;
    }

    saveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            Revisar Pedido WooCommerce #{order?.order_number}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer info (read-only) */}
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Información del Cliente</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Cliente:</span> {order?.customers?.name}
              </div>
              <div>
                <span className="text-muted-foreground">Total:</span> ${order?.total_amount}
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Dirección:</span> {order?.delivery_address}
              </div>
            </div>
          </div>

          {/* Branch selection */}
          <div className="space-y-2">
            <Label htmlFor="branch_id" className="text-base font-semibold">
              Sucursal *
            </Label>
            <Select
              value={formData.branch_id}
              onValueChange={(value) => setFormData({ ...formData, branch_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar sucursal" />
              </SelectTrigger>
              <SelectContent>
                {branches?.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Products with warehouse selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Productos y Depósitos *
            </Label>
            <div className="space-y-2">
              {formData.products.map((product, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{product.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Cantidad: {product.quantity} | Precio: ${product.unit_price}
                    </p>
                  </div>
                  <div className="w-48">
                    <Select
                      value={product.warehouse_id}
                      onValueChange={(value) => updateProductWarehouse(index, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Depósito" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses?.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="retiro_en_sucursal"
                checked={formData.retiro_en_sucursal}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, retiro_en_sucursal: checked })
                }
              />
              <Label htmlFor="retiro_en_sucursal" className="cursor-pointer">
                Retiro en sucursal
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="entregar_ahora"
                checked={formData.entregar_ahora}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, entregar_ahora: checked })
                }
              />
              <Label htmlFor="entregar_ahora" className="cursor-pointer">
                Entregar hoy
              </Label>
            </div>
          </div>

          {/* Delivery date */}
          <div className="space-y-2">
            <Label htmlFor="delivery_date">Fecha de entrega</Label>
            <Input
              id="delivery_date"
              type="date"
              value={formData.delivery_date}
              onChange={(e) =>
                setFormData({ ...formData, delivery_date: e.target.value })
              }
            />
          </div>

          {/* Assembly section */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center space-x-2">
              <Switch
                id="requiere_armado"
                checked={formData.requiere_armado}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requiere_armado: checked })
                }
              />
              <Label htmlFor="requiere_armado" className="cursor-pointer font-semibold">
                Requiere armado
              </Label>
            </div>

            {formData.requiere_armado && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="armado_fecha">Fecha de armado</Label>
                    <Input
                      id="armado_fecha"
                      type="date"
                      value={formData.armado_fecha}
                      onChange={(e) =>
                        setFormData({ ...formData, armado_fecha: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="armado_horario">Horario</Label>
                    <Input
                      id="armado_horario"
                      type="time"
                      value={formData.armado_horario}
                      onChange={(e) =>
                        setFormData({ ...formData, armado_horario: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="armado_contacto_nombre">Nombre de contacto</Label>
                    <Input
                      id="armado_contacto_nombre"
                      value={formData.armado_contacto_nombre}
                      onChange={(e) =>
                        setFormData({ ...formData, armado_contacto_nombre: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="armado_contacto_telefono">Teléfono de contacto</Label>
                    <Input
                      id="armado_contacto_telefono"
                      type="tel"
                      value={formData.armado_contacto_telefono}
                      onChange={(e) =>
                        setFormData({ ...formData, armado_contacto_telefono: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="armador_id">Armador asignado</Label>
                  <Select
                    value={formData.armador_id}
                    onValueChange={(value) => setFormData({ ...formData, armador_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar armador (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {armadores?.map((armador) => (
                        <SelectItem key={armador.id} value={armador.id}>
                          {armador.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saveMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Guardar y Confirmar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
