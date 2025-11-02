import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { MessageLoading } from '@/components/ui/message-loading';
import { Truck, Search, Package, MapPin, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ShipmentOrder {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  delivery_address: string;
  delivery_neighborhood?: string;
  delivery_departamento?: string;
  delivery_date: string;
  products: any;
  total_amount: number;
  created_at: string;
}

interface Route {
  id: string;
  route_name: string;
  cadete_name: string;
  cadete_id: string;
}

export const ShipmentsModule = () => {
  const [orders, setOrders] = useState<ShipmentOrder[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchShipmentOrders();
    fetchTodayRoutes();
  }, []);

  const fetchTodayRoutes = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: routesData, error } = await supabase
        .from('routes')
        .select('*')
        .eq('route_date', today);

      if (error) throw error;

      // Fetch cadetes information separately
      const cadeteIds = [...new Set(routesData?.map(r => r.cadete_id).filter(Boolean))];
      
      if (cadeteIds.length === 0) {
        setRoutes([]);
        return;
      }

      const { data: cadetesData } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', cadeteIds);

      const cadetesMap = new Map(cadetesData?.map(c => [c.user_id, c.full_name]));

      const formattedRoutes = routesData?.map((route: any) => ({
        id: route.id,
        route_name: route.route_name,
        cadete_name: cadetesMap.get(route.cadete_id) || 'Sin asignar',
        cadete_id: route.cadete_id,
      })) || [];

      setRoutes(formattedRoutes);
    } catch (error: any) {
      console.error('Error fetching routes:', error);
    }
  };

  const fetchShipmentOrders = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, customer_id, delivery_address, delivery_neighborhood, delivery_departamento, delivery_date, products, total_amount, created_at, requiere_armado, armado_estado, armador_entrega_mercaderia, customers(name)')
        .eq('status', 'armado')
        .eq('retiro_en_sucursal', false)
        .is('route_id', null)
        .order('delivery_date', { ascending: true });

      if (error) throw error;

      // Filtrar pedidos que:
      // - NO tienen entregar_ahora activo
      // - El armador NO va a entregar (o es null)
      // - NO requieren armado O ya completaron/confirmaron el armado
      const filteredData = (data || []).filter((order: any) => {
        // Excluir entregas inmediatas
        if (order.entregar_ahora) return false;
        
        // Si el armador entrega la mercadería, no mostrar en envíos
        if (order.armador_entrega_mercaderia) return false;
        
        // Si no requiere armado, incluir
        if (!order.requiere_armado) return true;
        
        // Si requiere armado, debe estar completado o confirmado
        return order.armado_estado === 'completado' || order.armado_estado === 'confirmado';
      });

      const formattedOrders = filteredData.map((order: any) => ({
        id: order.id,
        order_number: order.order_number,
        customer_id: order.customer_id,
        customer_name: order.customers?.name || 'Cliente desconocido',
        delivery_address: order.delivery_address,
        delivery_neighborhood: order.delivery_neighborhood,
        delivery_departamento: order.delivery_departamento,
        delivery_date: order.delivery_date,
        products: order.products,
        total_amount: order.total_amount,
        created_at: order.created_at,
      }));

      setOrders(formattedOrders);
    } catch (error: any) {
      console.error('Error fetching shipment orders:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los pedidos para envío',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToRoute = async (orderId: string) => {
    if (!selectedRoute) {
      toast({
        title: 'Error',
        description: 'Selecciona una ruta primero',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Get the route details including cadete_id
      const route = routes.find(r => r.id === selectedRoute);
      if (!route || !route.cadete_id) {
        toast({
          title: 'Error',
          description: 'La ruta seleccionada no tiene un cadete asignado',
          variant: 'destructive',
        });
        return;
      }

      // Update order with route_id and cadete_id
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          route_id: selectedRoute,
          cadete_id: route.cadete_id 
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Create delivery record
      const { error: deliveryError } = await supabase
        .from('deliveries')
        .insert({
          order_id: orderId,
          route_id: selectedRoute,
          cadete_id: route.cadete_id,
          status: 'pendiente'
        });

      if (deliveryError) throw deliveryError;

      // Increment total_deliveries for the route
      const { data: currentRoute } = await supabase
        .from('routes')
        .select('total_deliveries')
        .eq('id', selectedRoute)
        .single();

      await supabase
        .from('routes')
        .update({ 
          total_deliveries: (currentRoute?.total_deliveries || 0) + 1 
        })
        .eq('id', selectedRoute);

      toast({
        title: 'Pedido asignado',
        description: `El pedido se asignó correctamente a ${route.route_name}`,
      });

      // Refresh the orders list
      fetchShipmentOrders();
    } catch (error: any) {
      console.error('Error assigning order to route:', error);
      toast({
        title: 'Error',
        description: 'No se pudo asignar el pedido a la ruta',
        variant: 'destructive',
      });
    }
  };

  const getProductCount = (products: any) => {
    if (!products) return 0;
    try {
      const productsArray = typeof products === 'string' ? JSON.parse(products) : products;
      return Array.isArray(productsArray) 
        ? productsArray.reduce((sum, p) => sum + (p.quantity || 0), 0)
        : 0;
    } catch {
      return 0;
    }
  };

  const getFullAddress = (order: ShipmentOrder) => {
    const parts = [
      order.delivery_address,
      order.delivery_neighborhood,
      order.delivery_departamento,
    ].filter(Boolean);
    return parts.join(', ');
  };

  const filteredOrders = orders.filter(order =>
    order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.delivery_address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <MessageLoading />
        <span className="ml-3">Cargando pedidos para envío...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pedidos para Envío</CardTitle>
              <CardDescription>
                Pedidos preparados listos para asignar a rutas de entrega
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {filteredOrders.length} pedidos
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {routes.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No hay rutas creadas para el día de hoy. Por favor, crea una ruta en <strong>Gestión de Envíos</strong> antes de asignar pedidos.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Seleccionar Ruta</label>
                <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una ruta..." />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map((route) => (
                      <SelectItem key={route.id} value={route.id}>
                        {route.route_name} - {route.cadete_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número de pedido, cliente o dirección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No se encontraron pedidos' : 'No hay pedidos para envío'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead>Fecha Entrega</TableHead>
                    <TableHead className="text-right">Productos</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>{order.customer_name}</TableCell>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{getFullAddress(order)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.delivery_date 
                          ? new Date(order.delivery_date).toLocaleDateString('es-UY')
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">{getProductCount(order.products)}</TableCell>
                      <TableCell className="text-right">
                        ${order.total_amount.toLocaleString('es-UY')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => handleAssignToRoute(order.id)}
                          disabled={!selectedRoute}
                        >
                          <Truck className="h-4 w-4" />
                          Asignar a Ruta
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
