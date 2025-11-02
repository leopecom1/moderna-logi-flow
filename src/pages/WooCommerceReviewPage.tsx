import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReviewWooCommerceOrderModal } from '@/components/forms/ReviewWooCommerceOrderModal';
import { Loader2, Store, CheckCircle2, AlertCircle, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function WooCommerceReviewPage() {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch WooCommerce orders that need review (status pendiente and order_number starts with WC-)
  const { data: orders, isLoading } = useQuery({
    queryKey: ['woocommerce-orders-review'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers (
            id,
            name,
            email,
            phone
          )
        `)
        .like('order_number', 'WC-%')
        .in('status', ['pendiente', 'pendiente_envio'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const handleReview = (order: any) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const needsReview = (order: any) => {
    return !order.branch_id || order.status === 'pendiente';
  };

  const reviewedOrders = orders?.filter(o => !needsReview(o)) || [];
  const pendingOrders = orders?.filter(o => needsReview(o)) || [];

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Store className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Pedidos WooCommerce</h1>
            <p className="text-muted-foreground">
              Revisa y configura los pedidos importados desde tu tienda online
            </p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendientes de revisar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <span className="text-3xl font-bold">{pendingOrders.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Revisados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-3xl font-bold">{reviewedOrders.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total importados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                <span className="text-3xl font-bold">{orders?.length || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending orders table */}
        {pendingOrders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Pedidos Pendientes de Revisar
              </CardTitle>
              <CardDescription>
                Estos pedidos necesitan que configures sucursal, depósitos y opciones de entrega
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingOrders.map((order) => (
                    <TableRow key={order.id} className="bg-orange-50 dark:bg-orange-950/20">
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customers?.name}</p>
                          <p className="text-xs text-muted-foreground">{order.customers?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.created_at), 'dd MMM yyyy HH:mm', { locale: es })}
                      </TableCell>
                      <TableCell className="text-right">${order.total_amount}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Requiere revisión
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleReview(order)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Revisar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Reviewed orders table */}
        {reviewedOrders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Pedidos Revisados
              </CardTitle>
              <CardDescription>
                Estos pedidos ya fueron configurados y están listos para procesarse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customers?.name}</p>
                          <p className="text-xs text-muted-foreground">{order.customers?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.created_at), 'dd MMM yyyy HH:mm', { locale: es })}
                      </TableCell>
                      <TableCell className="text-right">${order.total_amount}</TableCell>
                      <TableCell>
                        <Badge variant="default">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {order.status === 'pendiente_envio' ? 'Listo para envío' : order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReview(order)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {orders?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Store className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No hay pedidos de WooCommerce</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Los pedidos importados desde WooCommerce aparecerán aquí automáticamente
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Review modal */}
      {selectedOrder && (
        <ReviewWooCommerceOrderModal
          order={selectedOrder}
          open={modalOpen}
          onOpenChange={setModalOpen}
        />
      )}
    </MainLayout>
  );
}
