import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { MessageLoading } from '@/components/ui/message-loading';
import { CheckCircle, Search, Package } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface PickupOrder {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  branch_name?: string;
  delivery_date: string;
  products: any;
  total_amount: number;
  created_at: string;
}

export const PickupsModule = () => {
  const [orders, setOrders] = useState<PickupOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<PickupOrder | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    fetchPickupOrders();
  }, []);

  const fetchPickupOrders = async () => {
    try {
      setLoading(true);
      // @ts-ignore - Complex Supabase query type inference
      const result = await supabase
        .from('orders')
        .select('id, order_number, customer_id, delivery_date, products, total_amount, created_at, customers(name), branches(name)')
        .eq('status', 'armado')
        .eq('retiro_en_sucursal', true)
        .or('entregar_ahora.is.null,entregar_ahora.eq.false')
        .order('delivery_date', { ascending: true });

      const { data, error } = result;
      if (error) throw error;

      const formattedOrders = data.map((order: any) => ({
        id: order.id,
        order_number: order.order_number,
        customer_id: order.customer_id,
        customer_name: order.customers?.name || 'Cliente desconocido',
        branch_name: order.branches?.name,
        delivery_date: order.delivery_date,
        products: order.products,
        total_amount: order.total_amount,
        created_at: order.created_at,
      }));

      setOrders(formattedOrders);
    } catch (error: any) {
      console.error('Error fetching pickup orders:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los pedidos para retiro',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPickedUp = (order: PickupOrder) => {
    setSelectedOrder(order);
    setShowConfirmDialog(true);
  };

  const confirmMarkAsPickedUp = async () => {
    if (!selectedOrder) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'entregado' })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      toast({
        title: 'Pedido retirado',
        description: `El pedido ${selectedOrder.order_number} ha sido marcado como retirado`,
      });

      fetchPickupOrders();
    } catch (error: any) {
      console.error('Error marking order as picked up:', error);
      toast({
        title: 'Error',
        description: 'No se pudo marcar el pedido como retirado',
        variant: 'destructive',
      });
    } finally {
      setShowConfirmDialog(false);
      setSelectedOrder(null);
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

  const filteredOrders = orders.filter(order =>
    order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <MessageLoading />
        <span className="ml-3">Cargando pedidos para retiro...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pedidos para Retiro</CardTitle>
              <CardDescription>
                Pedidos preparados listos para ser retirados por los clientes
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {filteredOrders.length} pedidos
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número de pedido o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No se encontraron pedidos' : 'No hay pedidos para retiro'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Sucursal</TableHead>
                    <TableHead>Fecha Retiro</TableHead>
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
                      <TableCell>{order.branch_name || '-'}</TableCell>
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
                          onClick={() => handleMarkAsPickedUp(order)}
                          className="gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Marcar Retirado
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

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar retiro</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Confirmas que el cliente retiró el pedido <strong>{selectedOrder?.order_number}</strong>?
              Esta acción marcará el pedido como entregado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmMarkAsPickedUp}>
              Confirmar Retiro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
