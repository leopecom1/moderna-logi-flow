import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Package, MapPin, DollarSign } from 'lucide-react';

interface AssignOrdersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routeId: string;
  onOrdersAssigned: () => void;
}

interface Order {
  id: string;
  order_number: string;
  delivery_address: string;
  delivery_neighborhood?: string;
  total_amount: number;
  status: string;
  customer: {
    name: string;
    phone?: string;
  };
}

interface RouteData {
  id: string;
  route_name: string;
  cadete_id: string;
}

export const AssignOrdersModal = ({ open, onOpenChange, routeId, onOrdersAssigned }: AssignOrdersModalProps) => {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [route, setRoute] = useState<RouteData | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAvailableOrders();
      fetchRoute();
    }
  }, [open, routeId]);

  const fetchRoute = async () => {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('id, route_name, cadete_id')
        .eq('id', routeId)
        .single();

      if (error) throw error;
      setRoute(data);
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  };

  const fetchAvailableOrders = async () => {
    try {
      setLoading(true);
      
      // Get orders that are not assigned to any delivery yet
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          delivery_address,
          delivery_neighborhood,
          total_amount,
          status,
          customer:customers!inner(
            name,
            phone
          )
        `)
        .in('status', ['pendiente', 'asignado'])
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      console.log('Orders found:', ordersData?.length || 0);

      // Get orders that already have deliveries
      const { data: existingDeliveries } = await supabase
        .from('deliveries')
        .select('order_id');

      const orderIdsWithDeliveries = existingDeliveries?.map(d => d.order_id) || [];
      console.log('Orders with deliveries:', orderIdsWithDeliveries.length);
      
      const availableOrders = ordersData?.filter(order => !orderIdsWithDeliveries.includes(order.id)) || [];
      console.log('Available orders after filtering:', availableOrders.length);

      setOrders(availableOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los pedidos disponibles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSelection = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  const handleAssignOrders = async () => {
    if (!route || selectedOrders.length === 0) return;

    try {
      setSubmitting(true);

      // Create deliveries for selected orders
      const deliveriesToCreate = selectedOrders.map(orderId => ({
        order_id: orderId,
        cadete_id: route.cadete_id,
        route_id: routeId,
        status: 'pendiente' as const,
      }));

      const { error: deliveryError } = await supabase
        .from('deliveries')
        .insert(deliveriesToCreate);

      if (deliveryError) throw deliveryError;

      // Update route total_deliveries
      const { data: routeData, error: routeError } = await supabase
        .from('routes')
        .select('total_deliveries')
        .eq('id', routeId)
        .single();

      if (routeError) throw routeError;

      const newTotalDeliveries = (routeData.total_deliveries || 0) + selectedOrders.length;
      
      const { error: updateError } = await supabase
        .from('routes')
        .update({ total_deliveries: newTotalDeliveries })
        .eq('id', routeId);

      if (updateError) throw updateError;

      // Update order status to 'asignado'
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({ status: 'asignado' })
        .in('id', selectedOrders);

      if (orderUpdateError) throw orderUpdateError;

      toast({
        title: 'Pedidos asignados',
        description: `Se asignaron ${selectedOrders.length} pedidos a la ruta exitosamente`,
      });

      onOrdersAssigned();
      onOpenChange(false);
      setSelectedOrders([]);
    } catch (error) {
      console.error('Error assigning orders:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron asignar los pedidos a la ruta',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const selectAll = () => {
    setSelectedOrders(orders.map(order => order.id));
  };

  const clearSelection = () => {
    setSelectedOrders([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Asignar Pedidos a Ruta</span>
          </DialogTitle>
          <DialogDescription>
            Selecciona los pedidos que deseas asignar a "{route?.route_name}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAll}
                    disabled={orders.length === 0}
                  >
                    Seleccionar Todos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSelection}
                    disabled={selectedOrders.length === 0}
                  >
                    Limpiar Selección
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedOrders.length} de {orders.length} pedidos seleccionados
                </p>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay pedidos disponibles</h3>
                  <p className="text-muted-foreground mb-4">
                    Todos los pedidos ya han sido asignados a entregas
                  </p>
                  <p className="text-sm text-blue-600">
                    💡 Crea un nuevo pedido desde "Pedidos → Nuevo Pedido" para poder asignarlo a rutas
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {orders.map((order) => (
                    <div 
                      key={order.id} 
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedOrders.includes(order.id) 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleOrderSelection(order.id, !selectedOrders.includes(order.id))}
                    >
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={(checked) => handleOrderSelection(order.id, checked as boolean)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {order.order_number}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {order.status}
                            </Badge>
                          </div>
                          <p className="font-medium mb-1">{order.customer.name}</p>
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground mb-1">
                            <MapPin className="h-3 w-3" />
                            <span>{order.delivery_address}</span>
                          </div>
                          {order.delivery_neighborhood && (
                            <p className="text-xs text-muted-foreground mb-1">
                              Barrio: {order.delivery_neighborhood}
                            </p>
                          )}
                          <div className="flex items-center space-x-1 text-sm font-medium">
                            <DollarSign className="h-3 w-3" />
                            <span>${order.total_amount}</span>
                          </div>
                          {order.customer.phone && (
                            <p className="text-xs text-muted-foreground">
                              Tel: {order.customer.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleAssignOrders}
            disabled={submitting || selectedOrders.length === 0}
          >
            {submitting ? 'Asignando...' : `Asignar ${selectedOrders.length} Pedidos`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};