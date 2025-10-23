import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Edit3, Package } from 'lucide-react';

const DEPARTAMENTOS_URUGUAY = [
  'Artigas', 'Canelones', 'Cerro Largo', 'Colonia', 'Durazno', 'Flores',
  'Florida', 'Lavalleja', 'Maldonado', 'Montevideo', 'Paysandú', 'Río Negro',
  'Rivera', 'Rocha', 'Salto', 'San José', 'Soriano', 'Tacuarembó', 'Treinta y Tres'
];

interface EditOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderUpdated: () => void;
  orderId: string;
}

interface Customer {
  id: string;
  name: string;
  address: string;
  neighborhood?: string;
  departamento?: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  products: any; // Can be Json type from database
  total_amount: number;
  payment_method: string;
  delivery_date: string;
  delivery_address: string;
  delivery_neighborhood?: string;
  delivery_departamento?: string;
  delivery_time_slot?: string;
  notes?: string;
  status: 'pendiente' | 'asignado' | 'en_ruta' | 'entregado' | 'cancelado' | 'pago_ingresado' | 'pendiente_compra' | 'movimiento_interno_pendiente' | 'pendiente_confirmacion_transferencia' | 'pendiente_envio' | 'pendiente_retiro' | 'armado';
}

export const EditOrderModal = ({ open, onOpenChange, onOrderUpdated, orderId }: EditOrderModalProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    products: '',
    total_amount: '',
    payment_method: '',
    delivery_date: '',
    delivery_address: '',
    delivery_neighborhood: '',
    delivery_departamento: '',
    delivery_time_slot: '',
    notes: '',
    status: '',
  });

  useEffect(() => {
    if (open && orderId) {
      fetchOrder();
      fetchCustomers();
    }
  }, [open, orderId]);

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      
      setOrder(data);
      setFormData({
        customer_id: data.customer_id,
        products: typeof data.products === 'string' ? data.products : JSON.stringify(data.products),
        total_amount: data.total_amount.toString(),
        payment_method: data.payment_method,
        delivery_date: data.delivery_date,
        delivery_address: data.delivery_address,
        delivery_neighborhood: data.delivery_neighborhood || '',
        delivery_departamento: data.delivery_departamento || '',
        delivery_time_slot: data.delivery_time_slot || '',
        notes: data.notes || '',
        status: data.status,
      });
    } catch (error) {
      console.error('Error fetching order:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el pedido',
        variant: 'destructive',
      });
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, address, neighborhood, departamento')
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customer_id: customerId,
        delivery_address: customer.address,
        delivery_neighborhood: customer.neighborhood || '',
        delivery_departamento: customer.departamento || '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    try {
      setLoading(true);

      const updateData = {
        customer_id: formData.customer_id,
        products: formData.products,
        total_amount: parseFloat(formData.total_amount),
        payment_method: formData.payment_method as 'efectivo' | 'tarjeta' | 'transferencia' | 'cuenta_corriente',
        delivery_date: formData.delivery_date,
        delivery_address: formData.delivery_address,
        delivery_neighborhood: formData.delivery_neighborhood || null,
        delivery_departamento: formData.delivery_departamento || null,
        delivery_time_slot: formData.delivery_time_slot || null,
        notes: formData.notes || null,
        status: formData.status as 'pendiente' | 'asignado' | 'en_ruta' | 'entregado' | 'cancelado' | 'pago_ingresado',
      };

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Pedido actualizado',
        description: 'El pedido ha sido actualizado exitosamente',
      });

      onOrderUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el pedido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit3 className="h-5 w-5" />
            <span>Editar Pedido {order.order_number}</span>
          </DialogTitle>
          <DialogDescription>
            Modifica la información del pedido
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer">Cliente *</Label>
            <Select value={formData.customer_id} onValueChange={handleCustomerChange} required>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_method">Método de Pago *</Label>
              <Select value={formData.payment_method} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="cuenta_corriente">Cuenta Corriente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_amount">Monto Total *</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.total_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, total_amount: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado *</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))} required>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="asignado">Asignado</SelectItem>
                <SelectItem value="en_ruta">En Ruta</SelectItem>
                <SelectItem value="entregado">Entregado</SelectItem>
                <SelectItem value="pago_ingresado">Pago Ingresado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="products">Productos *</Label>
            <Textarea
              id="products"
              placeholder="Descripción de los productos..."
              value={formData.products}
              onChange={(e) => setFormData(prev => ({ ...prev, products: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery_date">Fecha de Entrega *</Label>
            <Input
              id="delivery_date"
              type="date"
              value={formData.delivery_date}
              onChange={(e) => setFormData(prev => ({ ...prev, delivery_date: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery_address">Dirección de Entrega *</Label>
            <Input
              id="delivery_address"
              placeholder="Dirección completa"
              value={formData.delivery_address}
              onChange={(e) => setFormData(prev => ({ ...prev, delivery_address: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="delivery_neighborhood">Barrio</Label>
              <Input
                id="delivery_neighborhood"
                placeholder="Barrio"
                value={formData.delivery_neighborhood}
                onChange={(e) => setFormData(prev => ({ ...prev, delivery_neighborhood: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_departamento">Departamento</Label>
              <Select value={formData.delivery_departamento} onValueChange={(value) => setFormData(prev => ({ ...prev, delivery_departamento: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar departamento" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTAMENTOS_URUGUAY.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_time_slot">Horario de Entrega</Label>
              <Input
                id="delivery_time_slot"
                placeholder="9:00 - 12:00"
                value={formData.delivery_time_slot}
                onChange={(e) => setFormData(prev => ({ ...prev, delivery_time_slot: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Notas adicionales..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};