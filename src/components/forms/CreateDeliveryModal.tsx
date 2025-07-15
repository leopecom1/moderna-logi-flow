import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Truck } from 'lucide-react';

interface CreateDeliveryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeliveryCreated: () => void;
}

interface Order {
  id: string;
  order_number: string;
  delivery_address: string;
  status: string;
}

interface Cadete {
  id: string;
  full_name: string;
}

interface Route {
  id: string;
  route_name: string;
  route_date: string;
}

export const CreateDeliveryModal = ({ open, onOpenChange, onDeliveryCreated }: CreateDeliveryModalProps) => {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [cadetes, setCadetes] = useState<Cadete[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    order_id: '',
    cadete_id: '',
    route_id: '',
    delivery_notes: '',
  });

  useEffect(() => {
    if (open) {
      fetchOrders();
      fetchCadetes();
      fetchRoutes();
    }
  }, [open]);

  const fetchOrders = async () => {
    try {
      // Only fetch orders that don't have deliveries yet
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, delivery_address, status')
        .in('status', ['pendiente', 'asignado'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter out orders that already have deliveries
      const { data: existingDeliveries } = await supabase
        .from('deliveries')
        .select('order_id');

      const orderIdsWithDeliveries = existingDeliveries?.map(d => d.order_id) || [];
      const availableOrders = data?.filter(order => !orderIdsWithDeliveries.includes(order.id)) || [];

      setOrders(availableOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchCadetes = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .eq('role', 'cadete')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      const mappedData = data?.map(item => ({ id: item.user_id, full_name: item.full_name })) || [];
      setCadetes(mappedData);
    } catch (error) {
      console.error('Error fetching cadetes:', error);
    }
  };

  const fetchRoutes = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('routes')
        .select('id, route_name, route_date')
        .gte('route_date', today)
        .is('end_time', null)
        .order('route_date');

      if (error) throw error;
      setRoutes(data || []);
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    try {
      setLoading(true);

      const deliveryData = {
        order_id: formData.order_id,
        cadete_id: formData.cadete_id,
        route_id: formData.route_id || null,
        status: 'pendiente' as const,
        delivery_notes: formData.delivery_notes,
      };

      const { error } = await supabase
        .from('deliveries')
        .insert([deliveryData]);

      if (error) throw error;

      // Update route total_deliveries if route is selected
      if (formData.route_id) {
        const { data: route } = await supabase
          .from('routes')
          .select('total_deliveries')
          .eq('id', formData.route_id)
          .single();

        if (route) {
          await supabase
            .from('routes')
            .update({ total_deliveries: route.total_deliveries + 1 })
            .eq('id', formData.route_id);
        }
      }

      toast({
        title: 'Entrega creada',
        description: 'La entrega ha sido asignada exitosamente',
      });

      onDeliveryCreated();
      onOpenChange(false);
      setFormData({
        order_id: '',
        cadete_id: '',
        route_id: '',
        delivery_notes: '',
      });
    } catch (error) {
      console.error('Error creating delivery:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la entrega',
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
            <Truck className="h-5 w-5" />
            <span>Crear Nueva Entrega</span>
          </DialogTitle>
          <DialogDescription>
            Asigna un pedido a un cadete para su entrega
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="order">Pedido *</Label>
            <Select value={formData.order_id} onValueChange={(value) => setFormData(prev => ({ ...prev, order_id: value }))} required>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar pedido" />
              </SelectTrigger>
              <SelectContent>
                {orders.map((order) => (
                  <SelectItem key={order.id} value={order.id}>
                    {order.order_number} - {order.delivery_address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {orders.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No hay pedidos disponibles para entrega
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cadete">Cadete *</Label>
            <Select value={formData.cadete_id} onValueChange={(value) => setFormData(prev => ({ ...prev, cadete_id: value }))} required>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cadete" />
              </SelectTrigger>
              <SelectContent>
                {cadetes.map((cadete) => (
                  <SelectItem key={cadete.id} value={cadete.id}>
                    {cadete.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="route">Ruta (Opcional)</Label>
            <Select value={formData.route_id} onValueChange={(value) => setFormData(prev => ({ ...prev, route_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar ruta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin asignar a ruta</SelectItem>
                {routes.map((route) => (
                  <SelectItem key={route.id} value={route.id}>
                    {route.route_name} - {new Date(route.route_date).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery_notes">Notas de Entrega</Label>
            <Textarea
              id="delivery_notes"
              placeholder="Instrucciones especiales para la entrega..."
              value={formData.delivery_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, delivery_notes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || orders.length === 0}>
              {loading ? 'Creando...' : 'Crear Entrega'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};