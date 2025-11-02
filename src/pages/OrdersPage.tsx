import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Package, Plus, Search, Edit3, Building2, Trash2, Eye, Wrench, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CreateOrderModal } from '@/components/forms/CreateOrderModal';
import { EditOrderModal } from '@/components/forms/EditOrderModal';
import { ViewOrderModal } from '@/components/forms/ViewOrderModal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  payment_method: string;
  delivery_date: string;
  created_at: string;
  customer_id: string;
  delivery_address: string;
  notes?: string;
  branch_id?: string;
}

interface Branch {
  id: string;
  name: string;
}

const OrdersPage = () => {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    fetchOrders();
    fetchBranches();
    updateCompletedAssemblyOrders();
  }, []);

  const updateCompletedAssemblyOrders = async () => {
    try {
      // Actualizar pedidos con armado completado que aún estén en estado "armado"
      const { error } = await supabase
        .from('orders')
        .update({ status: 'entregado' })
        .eq('requiere_armado', true)
        .eq('armado_estado', 'completado')
        .eq('status', 'armado');

      if (error) throw error;
    } catch (error) {
      console.error('Error updating completed assembly orders:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          branches (
            id,
            name
          ),
          customers (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las ventas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name')
        .eq('is_active', true);

      if (error) throw error;
      setBranches(data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Orden eliminada correctamente',
      });
      
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la orden',
        variant: 'destructive',
      });
    }
  };

  const getStatusConfig = (status: string): { variant: any; label: string } => {
    switch (status) {
      case 'pendiente':
        return { variant: 'pending', label: 'Pendiente' };
      case 'pendiente_retiro':
        return { variant: 'waiting', label: 'Pendiente Retiro' };
      case 'pendiente_envio':
        return { variant: 'waiting', label: 'Pendiente Envío' };
      case 'armado':
        return { variant: 'ready', label: 'Preparado' };
      case 'asignado':
        return { variant: 'assigned', label: 'Asignado' };
      case 'en_ruta':
        return { variant: 'progress', label: 'En Ruta' };
      case 'entregado':
        return { variant: 'completed', label: 'Finalizado' };
      case 'cancelado':
        return { variant: 'cancelled', label: 'Cancelado' };
      case 'pago_ingresado':
        return { variant: 'payment', label: 'Pago Ingresado' };
      case 'pendiente_compra':
        return { variant: 'waiting', label: 'Pendiente Compra' };
      case 'movimiento_interno_pendiente':
        return { variant: 'waiting', label: 'Movimiento Pendiente' };
      case 'pendiente_confirmacion_transferencia':
        return { variant: 'waiting', label: 'Confirmar Transferencia' };
      default:
        return { variant: 'secondary', label: status };
    }
  };

  const filteredOrders = orders.filter(order =>
    order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.delivery_address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Ventas</h1>
            <p className="text-muted-foreground">Gestiona todas las ventas del sistema</p>
          </div>
          {(profile?.role === 'gerencia' || profile?.role === 'vendedor') && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Venta
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número de venta o dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Sucursal</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Método Pago</TableHead>
                <TableHead>Entrega</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order: any) => (
                <TableRow 
                  key={order.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowViewModal(true);
                  }}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-primary" />
                      <span>{order.order_number}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const effectiveStatus = (order.requiere_armado && order.armado_estado === 'completado')
                        ? 'entregado'
                        : order.status;
                      const cfg = getStatusConfig(effectiveStatus);
                      return (
                        <Badge variant={cfg.variant}>
                          {cfg.label}
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    {order.branches ? (
                      <div className="flex items-center space-x-1">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{order.branches.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Sin sucursal</span>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold">
                    ${order.total_amount}
                  </TableCell>
                  <TableCell>{order.payment_method}</TableCell>
                  <TableCell>
                    {new Date(order.delivery_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {order.delivery_address}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {order.retiro_en_sucursal && (
                        <Badge variant="outline" className="text-xs">Retiro</Badge>
                      )}
                      {order.entregar_ahora && (
                        <Badge variant="default" className="text-xs">Ahora</Badge>
                      )}
                      {order.requiere_armado && (
                        <Badge 
                          variant={
                            order.armado_estado === 'completado' ? 'default' : 
                            order.armado_estado === 'en_progreso' ? 'secondary' : 
                            'outline'
                          } 
                          className="text-xs flex items-center gap-1"
                        >
                          <Wrench className="h-3 w-3" />
                          {order.armado_estado === 'completado' && <CheckCircle className="h-3 w-3" />}
                          {order.armado_estado === 'en_progreso' && <Clock className="h-3 w-3" />}
                          {(order.armado_estado === 'pendiente' || order.armado_estado === 'confirmado') && <AlertTriangle className="h-3 w-3" />}
                          Armado
                        </Badge>
                      )}
                      {!order.retiro_en_sucursal && !order.entregar_ahora && !order.requiere_armado && (
                        <span className="text-xs text-muted-foreground">Envío</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                      {(profile?.role === 'gerencia' || profile?.role === 'vendedor') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrderId(order.id);
                            setShowEditModal(true);
                          }}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowViewModal(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {profile?.role === 'gerencia' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (window.confirm('¿Estás seguro de que quieres eliminar esta orden?')) {
                              deleteOrder(order.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron ventas</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Aún no hay ventas registradas'}
            </p>
          </div>
        )}
      </div>

      <CreateOrderModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onOrderCreated={fetchOrders}
      />
      
      <EditOrderModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onOrderUpdated={fetchOrders}
        orderId={selectedOrderId}
      />

      <ViewOrderModal
        open={showViewModal}
        onOpenChange={setShowViewModal}
        order={selectedOrder}
      />
    </MainLayout>
  );
};

export default OrdersPage;