import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { CreditCard } from 'lucide-react';

interface CreateCustomerPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  onPaymentCreated: () => void;
}

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  delivery_address: string;
}

export const CreateCustomerPaymentModal = ({ 
  open, 
  onOpenChange, 
  customerId, 
  customerName,
  onPaymentCreated 
}: CreateCustomerPaymentModalProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    order_id: '',
    amount: '',
    payment_method: '',
    reference_number: '',
    status: 'pendiente',
    notes: '',
  });

  useEffect(() => {
    if (open) {
      fetchCustomerOrders();
    }
  }, [open, customerId]);

  const fetchCustomerOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, delivery_address')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las órdenes del cliente',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.order_id || !formData.amount || !formData.payment_method) {
      toast({
        title: 'Error',
        description: 'Por favor completa todos los campos requeridos',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const paymentData: any = {
        order_id: formData.order_id,
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        status: formData.status,
        reference_number: formData.reference_number || null,
        notes: formData.notes || null,
      };

      if (formData.status === 'completado') {
        paymentData.paid_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('payments')
        .insert(paymentData);

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Pago creado exitosamente',
      });

      setFormData({
        order_id: '',
        amount: '',
        payment_method: '',
        reference_number: '',
        status: 'pendiente',
        notes: '',
      });
      
      onPaymentCreated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el pago',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Crear Pago</span>
          </DialogTitle>
          <DialogDescription>
            Crear un nuevo pago para {customerName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="order_id">Orden</Label>
            <Select value={formData.order_id} onValueChange={(value) => handleInputChange('order_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar orden" />
              </SelectTrigger>
              <SelectContent>
                {orders.map((order) => (
                  <SelectItem key={order.id} value={order.id}>
                    #{order.order_number} - ${Number(order.total_amount).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {orders.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No hay órdenes disponibles para este cliente
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Monto</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Método de Pago</Label>
            <Select value={formData.payment_method} onValueChange={(value) => handleInputChange('payment_method', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="tarjeta">Tarjeta</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
                <SelectItem value="credito">Crédito</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="fallido">Fallido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference_number">Número de Referencia</Label>
            <Input
              id="reference_number"
              placeholder="Número de referencia (opcional)"
              value={formData.reference_number}
              onChange={(e) => handleInputChange('reference_number', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Notas adicionales sobre el pago"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || orders.length === 0}>
              {loading ? 'Creando...' : 'Crear Pago'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};