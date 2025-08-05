import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Users, ShoppingCart, CreditCard, Truck, Calculator, Upload, Edit, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ImportMovementsModal } from '@/components/forms/ImportMovementsModal';
import { EditMovementModal } from '@/components/forms/EditMovementModal';
import { CreateCustomerOrderModal } from '@/components/forms/CreateCustomerOrderModal';
import { CreateCustomerPaymentModal } from '@/components/forms/CreateCustomerPaymentModal';
import { CreateCustomerMovementModal } from '@/components/forms/CreateCustomerMovementModal';
import { MainLayout } from '@/components/layout/MainLayout';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string;
  neighborhood: string | null;
  city: string;
  departamento: string | null;
  notes: string | null;
  cedula_identidad: string | null;
  margen: number | null;
  created_at: string;
}

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  payment_method: string;
  status: string;
  delivery_date: string | null;
  created_at: string;
  notes: string | null;
}

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  status: string;
  paid_at: string | null;
  reference_number: string | null;
  created_at: string;
  order_id: string;
}

interface Delivery {
  id: string;
  status: string;
  delivered_at: string | null;
  attempted_at: string | null;
  delivery_notes: string | null;
  created_at: string;
  order_id: string;
}

interface Movement {
  id: string;
  movement_date: string;
  payment_info: string | null;
  balance_amount: number;
  created_at: string;
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [showCreatePaymentModal, setShowCreatePaymentModal] = useState(false);
  const [showCreateMovementModal, setShowCreateMovementModal] = useState(false);
  const [showCreateSaleModal, setShowCreateSaleModal] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);

  useEffect(() => {
    if (id) {
      fetchCustomerData();
    }
  }, [id]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);

      // Fetch customer info
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (customerError) throw customerError;
      setCustomer(customerData);

      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

      // Fetch payments for these orders
      const orderIds = ordersData?.map(order => order.id) || [];
      if (orderIds.length > 0) {
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('*')
          .in('order_id', orderIds)
          .order('created_at', { ascending: false });

        if (paymentsError) throw paymentsError;
        setPayments(paymentsData || []);

        // Fetch deliveries for these orders
        const { data: deliveriesData, error: deliveriesError } = await supabase
          .from('deliveries')
          .select('*')
          .in('order_id', orderIds)
          .order('created_at', { ascending: false });

        if (deliveriesError) throw deliveriesError;
        setDeliveries(deliveriesData || []);
      }

      // Fetch customer movements
      const { data: movementsData, error: movementsError } = await supabase
        .from('customer_movements')
        .select('*')
        .eq('customer_id', id)
        .order('movement_date', { ascending: false });

      if (movementsError) throw movementsError;
      setMovements(movementsData || []);

    } catch (error) {
      console.error('Error fetching customer data:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información del cliente',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateBalance = () => {
    const totalOrders = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
    const totalPaid = payments
      .filter(payment => payment.status === 'completado')
      .reduce((sum, payment) => sum + Number(payment.amount), 0);
    
    // Include movements in balance calculation
    const movementsBalance = movements.reduce((sum, movement) => sum + Number(movement.balance_amount), 0);
    
    return totalOrders - totalPaid + movementsBalance;
  };

  const handleEditMovement = (movement: Movement) => {
    setSelectedMovement(movement);
    setShowEditModal(true);
  };

  const getStatusBadge = (status: string, type: 'order' | 'payment' | 'delivery') => {
    const statusConfig = {
      order: {
        pendiente: { label: 'Pendiente', variant: 'secondary' as const },
        confirmado: { label: 'Confirmado', variant: 'default' as const },
        en_preparacion: { label: 'En Preparación', variant: 'default' as const },
        listo: { label: 'Listo', variant: 'default' as const },
        entregado: { label: 'Entregado', variant: 'default' as const },
        cancelado: { label: 'Cancelado', variant: 'destructive' as const },
      },
      payment: {
        pendiente: { label: 'Pendiente', variant: 'secondary' as const },
        completado: { label: 'Completado', variant: 'default' as const },
        fallido: { label: 'Fallido', variant: 'destructive' as const },
      },
      delivery: {
        pendiente: { label: 'Pendiente', variant: 'secondary' as const },
        en_ruta: { label: 'En Ruta', variant: 'default' as const },
        entregado: { label: 'Entregado', variant: 'default' as const },
        fallido: { label: 'Fallido', variant: 'destructive' as const },
      },
    };

    const config = statusConfig[type][status as keyof typeof statusConfig[typeof type]];
    return <Badge variant={config?.variant || 'secondary'}>{config?.label || status}</Badge>;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center">Cargando información del cliente...</div>
      </MainLayout>
    );
  }

  if (!customer) {
    return (
      <MainLayout>
        <div className="text-center">Cliente no encontrado</div>
      </MainLayout>
    );
  }

  const balance = calculateBalance();

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate('/customers')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Clientes
        </Button>
        <Button onClick={() => setShowImportModal(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Importar Movimientos
        </Button>
      </div>

      {/* Customer Info Header */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>{customer.name}</span>
            </div>
            <div className="flex items-center space-x-4">
              {customer.margen && (
                <Badge variant="outline">Margen: {customer.margen}%</Badge>
              )}
              <Badge variant={balance > 0 ? 'destructive' : 'default'}>
                Saldo: ${balance.toFixed(2)}
              </Badge>
            </div>
          </CardTitle>
          <CardDescription>
            {customer.address}, {customer.city}
            {customer.departamento && ` - ${customer.departamento}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {customer.phone && (
              <div className="text-sm">
                <strong>Teléfono:</strong> {customer.phone}
              </div>
            )}
            {customer.email && (
              <div className="text-sm">
                <strong>Email:</strong> {customer.email}
              </div>
            )}
            {customer.cedula_identidad && (
              <div className="text-sm">
                <strong>CI:</strong> {customer.cedula_identidad}
              </div>
            )}
          </div>
          {customer.notes && (
            <div className="mt-4 text-sm">
              <strong>Notas:</strong> {customer.notes}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs for History */}
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="summary">
            <Calculator className="h-4 w-4 mr-2" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="movements">
            <CreditCard className="h-4 w-4 mr-2" />
            Movimientos ({movements.length})
          </TabsTrigger>
          <TabsTrigger value="orders">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Órdenes ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="h-4 w-4 mr-2" />
            Pagos ({payments.length})
          </TabsTrigger>
          <TabsTrigger value="deliveries">
            <Truck className="h-4 w-4 mr-2" />
            Entregas ({deliveries.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Órdenes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${orders.reduce((sum, order) => sum + Number(order.total_amount), 0).toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${payments.filter(p => p.status === 'completado').reduce((sum, payment) => sum + Number(payment.amount), 0).toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Saldo Pendiente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${balance.toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Saldo desde Movimientos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  ${movements.reduce((sum, movement) => sum + Number(movement.balance_amount), 0).toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Órdenes Completadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {orders.filter(o => o.status === 'entregado').length}/{orders.length}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Historial de Movimientos</CardTitle>
                  <CardDescription>
                    Gestiona los movimientos del cliente
                  </CardDescription>
                </div>
                <Button onClick={() => setShowCreateMovementModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Movimiento
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {movements.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Información de Pago</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {new Date(movement.movement_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${Number(movement.balance_amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${Number(movement.balance_amount).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {movement.payment_info || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditMovement(movement)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay movimientos registrados
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Órdenes del Cliente</h3>
              <Button onClick={() => setShowCreateOrderModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Orden
              </Button>
            </div>
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Orden #{order.order_number}</span>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(order.status, 'order')}
                      <span className="text-lg font-bold">${Number(order.total_amount).toFixed(2)}</span>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Creada: {new Date(order.created_at).toLocaleDateString()}
                    {order.delivery_date && ` • Entrega: ${new Date(order.delivery_date).toLocaleDateString()}`}
                  </CardDescription>
                </CardHeader>
                {order.notes && (
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      <strong>Notas:</strong> {order.notes}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
            {orders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No hay órdenes registradas
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="payments">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Pagos del Cliente</h3>
              <Button onClick={() => setShowCreatePaymentModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Pago
              </Button>
            </div>
            {payments.map((payment) => (
              <Card key={payment.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{payment.payment_method}</span>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(payment.status, 'payment')}
                      <span className="text-lg font-bold">${Number(payment.amount).toFixed(2)}</span>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Creado: {new Date(payment.created_at).toLocaleDateString()}
                    {payment.paid_at && ` • Pagado: ${new Date(payment.paid_at).toLocaleDateString()}`}
                    {payment.reference_number && ` • Ref: ${payment.reference_number}`}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
            {payments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No hay pagos registrados
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="deliveries">
          <div className="space-y-4">
            {deliveries.map((delivery) => (
              <Card key={delivery.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Entrega</span>
                    {getStatusBadge(delivery.status, 'delivery')}
                  </CardTitle>
                  <CardDescription>
                    Creada: {new Date(delivery.created_at).toLocaleDateString()}
                    {delivery.attempted_at && ` • Intentada: ${new Date(delivery.attempted_at).toLocaleDateString()}`}
                    {delivery.delivered_at && ` • Entregada: ${new Date(delivery.delivered_at).toLocaleDateString()}`}
                  </CardDescription>
                </CardHeader>
                {delivery.delivery_notes && (
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      <strong>Notas:</strong> {delivery.delivery_notes}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
            {deliveries.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No hay entregas registradas
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <ImportMovementsModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        customerId={id}
        onImportComplete={fetchCustomerData}
      />

      <EditMovementModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        movement={selectedMovement}
        onMovementUpdated={fetchCustomerData}
      />

      <CreateCustomerMovementModal
        open={showCreateMovementModal}
        onOpenChange={setShowCreateMovementModal}
        customerId={id!}
        customerName={customer.name}
        onMovementCreated={fetchCustomerData}
      />

      <CreateCustomerOrderModal
        open={showCreateOrderModal}
        onOpenChange={setShowCreateOrderModal}
        customerId={id!}
        customerName={customer.name}
        customerAddress={customer.address}
        onOrderCreated={fetchCustomerData}
      />

      <CreateCustomerPaymentModal
        open={showCreatePaymentModal}
        onOpenChange={setShowCreatePaymentModal}
        customerId={id!}
        customerName={customer.name}
        onPaymentCreated={fetchCustomerData}
      />

    </MainLayout>
  );
}