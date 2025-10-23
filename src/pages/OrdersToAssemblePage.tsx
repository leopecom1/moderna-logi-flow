import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Search, CheckCircle, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customers: {
    name: string;
  };
  total_amount: number;
  status: string;
  delivery_date: string;
  delivery_address: string;
  retiro_en_sucursal?: boolean;
  branches?: {
    name: string;
  };
  products: any;
  created_at: string;
}

export default function OrdersToAssemblePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers (name),
          branches (name)
        `)
        .in('status', ['pendiente_envio', 'pendiente_retiro'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los pedidos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsAssembled = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'armado' })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Pedido marcado como armado',
        description: 'El pedido ha sido marcado como armado exitosamente',
      });

      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el pedido',
        variant: 'destructive',
      });
    }
  };

  const deliverOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'entregado' })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Pedido entregado',
        description: 'El pedido ha sido marcado como entregado',
      });

      fetchOrders();
    } catch (error) {
      console.error('Error delivering order:', error);
      toast({
        title: 'Error',
        description: 'No se pudo entregar el pedido',
        variant: 'destructive',
      });
    }
  };

  const filteredOrders = orders.filter(order => 
    order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customers?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pendiente_envio': { label: 'Pendiente Envío', variant: 'default' as const },
      'pendiente_retiro': { label: 'Pendiente Retiro', variant: 'secondary' as const },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'default' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getProductCount = (products: any) => {
    try {
      const parsed = typeof products === 'string' ? JSON.parse(products) : products;
      return Array.isArray(parsed) ? parsed.reduce((sum, p) => sum + (p.quantity || 0), 0) : 0;
    } catch {
      return 0;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Pedidos a Armar</h1>
            <p className="text-muted-foreground">Gestiona los pedidos listos para armar y entregar</p>
          </div>
        </div>

        {/* Search and Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-2">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número de pedido o cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pedidos Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredOrders.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-8">Cargando pedidos...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay pedidos pendientes para armar
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Productos</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Fecha Entrega</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <Button
                          variant="link"
                          className="p-0 h-auto"
                          onClick={() => navigate(`/orders/${order.id}`)}
                        >
                          {order.order_number}
                        </Button>
                      </TableCell>
                      <TableCell>{order.customers?.name}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{getProductCount(order.products)} items</TableCell>
                      <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        {new Date(order.delivery_date).toLocaleDateString('es-UY')}
                      </TableCell>
                      <TableCell>
                        {order.retiro_en_sucursal ? (
                          <Badge variant="outline">Retiro en Sucursal</Badge>
                        ) : (
                          <Badge variant="outline">Envío a Domicilio</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsAssembled(order.id)}
                        >
                          <Package className="h-4 w-4 mr-1" />
                          Armado
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => deliverOrder(order.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Entregar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
