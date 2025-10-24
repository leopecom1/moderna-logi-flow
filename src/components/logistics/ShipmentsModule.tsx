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
      // @ts-ignore - Complex Supabase query type inference
      const { data, error } = await supabase
        .from('routes')
        .select('id, route_name, profiles(full_name)')
        .eq('route_date', today);

      if (error) throw error;

      const formattedRoutes = data.map((route: any) => ({
        id: route.id,
        route_name: route.route_name,
        cadete_name: route.profiles?.full_name || 'Sin asignar',
      }));

      setRoutes(formattedRoutes);
    } catch (error: any) {
      console.error('Error fetching routes:', error);
    }
  };

  const fetchShipmentOrders = async () => {
    try {
      setLoading(true);
      // @ts-ignore - Complex Supabase query type inference
      const result = await supabase
        .from('orders')
        .select('id, order_number, customer_id, delivery_address, delivery_neighborhood, delivery_departamento, delivery_date, products, total_amount, created_at, customers(name)')
        .eq('status', 'armado')
        .eq('retiro_en_sucursal', false)
        .or('entregar_ahora.is.null,entregar_ahora.eq.false')
        .order('delivery_date', { ascending: true });

      const { data, error } = result;
      if (error) throw error;

      const formattedOrders = data.map((order: any) => ({
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
      // Aquí irá la lógica para asignar el pedido a la ruta
      // Por ahora solo mostramos un mensaje
      toast({
        title: 'Funcionalidad pendiente',
        description: 'La asignación de pedidos a rutas estará disponible próximamente',
      });
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
                Pedidos armados listos para asignar a rutas de entrega
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
