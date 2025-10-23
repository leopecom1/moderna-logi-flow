import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { CreditCard } from 'lucide-react';

interface CreatePaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentCreated: () => void;
}

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  delivery_address: string;
}

export const CreatePaymentModal = ({ open, onOpenChange, onPaymentCreated }: CreatePaymentModalProps) => {
  const { profile } = useAuth();
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
      fetchOrders();
    }
  }, [open]);

  const fetchOrders = async () => {
    try {
      // Get orders that don't have payments yet or have pending payments
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, delivery_address')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleOrderChange = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setFormData(prev => ({
        ...prev,
        order_id: orderId,
        amount: order.total_amount.toString(),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    try {
      setLoading(true);

      const paymentData = {
        order_id: formData.order_id,
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method as 'efectivo' | 'tarjeta' | 'transferencia' | 'cuenta_corriente',
        reference_number: formData.reference_number || null,
        status: formData.status as 'pendiente' | 'pagado' | 'liquidado',
        notes: formData.notes || null,
        ...(formData.status === 'pagado' && { paid_at: new Date().toISOString() }),
      };

      const { error } = await supabase
        .from('payments')
        .insert([paymentData]);

      if (error) throw error;

      toast({
        title: 'Pago registrado',
        description: 'El pago ha sido registrado exitosamente',
      });

      onPaymentCreated();
      onOpenChange(false);
      setFormData({
        order_id: '',
        amount: '',
        payment_method: '',
        reference_number: '',
        status: 'pendiente',
        notes: '',
      });
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: 'Error',
        description: 'No se pudo registrar el pago',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Registrar Nuevo Pago</span>
          </DialogTitle>
          <DialogDescription>
            Completa la información para registrar un nuevo pago
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="order">Pedido *</Label>
            <Select value={formData.order_id} onValueChange={handleOrderChange} required>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar pedido" />
              </SelectTrigger>
              <SelectContent>
                {orders.map((order) => (
                  <SelectItem key={order.id} value={order.id}>
                    {order.order_number} - ${order.total_amount} - {order.delivery_address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Método de Pago *</Label>
              <Select value={formData.payment_method} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta de Crédito</SelectItem>
                  <SelectItem value="tarjeta_debito">Tarjeta de Débito</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="mercadopago">MercadoPago</SelectItem>
                  <SelectItem value="cuenta_corriente">Cuenta Corriente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Estado *</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="pagado">Pagado</SelectItem>
                  <SelectItem value="liquidado">Liquidado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference_number">Número de Referencia</Label>
              <Input
                id="reference_number"
                placeholder="Número de transacción"
                value={formData.reference_number}
                onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Observaciones adicionales sobre el pago..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar Pago'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};