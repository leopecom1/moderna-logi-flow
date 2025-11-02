import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MessageLoading } from '@/components/ui/message-loading';
import { toast } from 'sonner';
import { Search, Package, Wrench } from 'lucide-react';

interface OrderToAssemble {
  id: string;
  order_number: string;
  customer_name: string;
  delivery_date: string | null;
  products: any;
  total_amount: number;
  status: string;
  retiro_en_sucursal: boolean;
  requiere_armado: boolean;
}

export function OrdersToAssembleModule() {
  const [orders, setOrders] = useState<OrderToAssemble[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
    
    // Suscripción en tiempo real
    const subscription = supabase
      .channel('orders-to-assemble')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // @ts-ignore - Complex Supabase query type inference
      const result = await supabase
        .from('orders')
        .select('id, order_number, customer_id, delivery_date, products, total_amount, status, retiro_en_sucursal, requiere_armado, customers(name)')
        .in('status', ['pendiente_envio', 'pendiente_retiro'])
        .eq('requiere_armado', false) // Solo pedidos que NO requieren armado
        .or('entregar_ahora.is.null,entregar_ahora.eq.false')
        .order('created_at', { ascending: false });

      const { data, error } = result;
      if (error) throw error;

      const formattedOrders = data.map((order: any) => ({
        id: order.id,
        order_number: order.order_number,
        customer_name: order.customers?.name || 'Sin nombre',
        delivery_date: order.delivery_date,
        products: order.products,
        total_amount: order.total_amount,
        status: order.status,
        retiro_en_sucursal: order.retiro_en_sucursal || false,
        requiere_armado: order.requiere_armado || false,
      }));

      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Error al cargar pedidos para preparar');
    } finally {
      setLoading(false);
    }
  };

  const markAsAssembled = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'armado'
        })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Pedido marcado como preparado');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Error al actualizar el pedido');
    }
  };

  const getProductCount = (products: any) => {
    try {
      const productsArray = typeof products === 'string' ? JSON.parse(products) : products;
      return productsArray?.reduce((sum: number, p: any) => sum + (p.quantity || 0), 0) || 0;
    } catch {
      return 0;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: 'secondary' | 'default' }> = {
      pendiente_envio: { label: 'Para Envío', variant: 'secondary' },
      pendiente_retiro: { label: 'Para Retiro', variant: 'secondary' },
    };
    const config = variants[status] || { label: status, variant: 'default' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredOrders = orders.filter(order =>
    order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <MessageLoading />
        <span className="ml-2 text-muted-foreground">Cargando pedidos para preparar...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Pedidos para Preparar
        </CardTitle>
        <CardDescription>
          Prepara los pedidos antes de enviarlos o entregarlos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número de pedido o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay pedidos pendientes de preparar</p>
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Fecha Entrega</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{order.customer_name}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Badge variant={order.retiro_en_sucursal ? 'outline' : 'default'}>
                          {order.retiro_en_sucursal ? 'Retiro' : 'Envío'}
                        </Badge>
                        {order.requiere_armado && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Wrench className="h-3 w-3" />
                            Armado
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{getProductCount(order.products)} items</TableCell>
                    <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                    <TableCell>
                      {order.delivery_date
                        ? new Date(order.delivery_date).toLocaleDateString('es-UY')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => markAsAssembled(order.id)}
                      >
                        Marcar Preparado
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
  );
}
