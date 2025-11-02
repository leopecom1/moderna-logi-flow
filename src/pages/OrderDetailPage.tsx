import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Package, 
  User, 
  MapPin, 
  Calendar, 
  CreditCard,
  Phone,
  Mail,
  FileText,
  Clock,
  DollarSign,
  AlertTriangle,
  Camera,
  Wrench
} from 'lucide-react';

interface AssemblyPhoto {
  id: string;
  photo_url: string;
  photo_type: string;
  created_at: string;
  notes?: string;
}

interface OrderDetail {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  payment_method: string;
  delivery_date: string;
  delivery_address: string;
  delivery_neighborhood?: string;
  delivery_departamento?: string;
  delivery_time_slot?: string;
  notes?: string;
  products: any;
  created_at: string;
  updated_at: string;
  requiere_armado?: boolean;
  armado_estado?: string;
  armado_fecha?: string;
  armado_horario?: string;
  armado_contacto_nombre?: string;
  armado_contacto_telefono?: string;
  armado_confirmado_at?: string;
  armado_completado_at?: string;
  armador_entrega_mercaderia?: boolean;
  customer: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address: string;
    neighborhood?: string;
    departamento?: string;
  };
  seller?: {
    id: string;
    full_name: string;
    phone?: string;
    role: string;
  };
  payment?: {
    status: string;
    payment_method: string;
  };
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [assemblyPhotos, setAssemblyPhotos] = useState<AssemblyPhoto[]>([]);

  useEffect(() => {
    if (id) {
      fetchOrderDetail();
      fetchAssemblyPhotos();
    }
  }, [id]);

  const fetchAssemblyPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('assembly_photos')
        .select('*')
        .eq('order_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssemblyPhotos(data || []);
    } catch (error) {
      console.error('Error fetching assembly photos:', error);
    }
  };

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      
      // Primero obtenemos el pedido
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (orderError) throw orderError;

      // Luego obtenemos el cliente
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', orderData.customer_id)
        .single();

      if (customerError) throw customerError;

      // Obtenemos el vendedor
      const { data: sellerData, error: sellerError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', orderData.seller_id)
        .single();

      if (sellerError) throw sellerError;

      // Obtenemos información del pago si existe
      const { data: paymentData } = await supabase
        .from('payments')
        .select('status, payment_method')
        .eq('order_id', orderData.id)
        .single();

      // Combinamos los datos
      const combinedData = {
        ...orderData,
        customer: customerData,
        seller: sellerData,
        payment: paymentData
      };

      setOrder(combinedData as any);
    } catch (error) {
      console.error('Error fetching order detail:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información del pedido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'asignado':
        return 'bg-blue-100 text-blue-800';
      case 'en_ruta':
        return 'bg-orange-100 text-orange-800';
      case 'entregado':
        return 'bg-green-100 text-green-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendiente':
        return 'Pendiente';
      case 'asignado':
        return 'Asignado';
      case 'en_ruta':
        return 'En Ruta';
      case 'entregado':
        return 'Entregado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'efectivo':
        return 'Efectivo';
      case 'tarjeta':
        return 'Tarjeta';
      case 'transferencia':
        return 'Transferencia';
      case 'cuenta_corriente':
        return 'Cuenta Corriente';
      default:
        return method;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const parseProducts = (products: any) => {
    try {
      if (typeof products === 'string') {
        return JSON.parse(products);
      }
      return Array.isArray(products) ? products : [products];
    } catch {
      return [];
    }
  };

  const isTransferNotConfirmed = () => {
    return order?.payment_method === 'transferencia' && 
           order?.payment?.status === 'pendiente';
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="">
          <div className="flex items-center space-x-4 mb-6">
            <Skeleton className="h-10 w-10 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!order) {
    return (
      <MainLayout>
        <div className="">
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Pedido no encontrado</h3>
            <p className="text-muted-foreground mb-4">
              No se pudo encontrar la información del pedido solicitado.
            </p>
            <Button onClick={() => navigate('/orders')}>
              Volver a Pedidos
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
        <div className="">
          <div className="flex items-center space-x-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/orders')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold">{order.order_number}</h1>
                <Badge className={getStatusColor(order.status)}>
                  {getStatusLabel(order.status)}
                </Badge>
              </div>
              <p className="text-muted-foreground">Información detallada del pedido</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">${order.total_amount}</p>
              <p className="text-sm text-muted-foreground">{getPaymentMethodLabel(order.payment_method)}</p>
            </div>
          </div>

          {/* Alerta para transferencias no confirmadas */}
          {isTransferNotConfirmed() && (
            <Alert className="mb-6 border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Atención:</strong> El pago por transferencia aún no ha sido confirmado por el cliente.
              </AlertDescription>
            </Alert>
          )}

        <div className="grid gap-6">
          {/* Información del Pedido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Información del Pedido</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Número de Pedido</p>
                  <p className="text-sm">{order.order_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estado</p>
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusLabel(order.status)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de Creación</p>
                  <p className="text-sm">{formatDateTime(order.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Última Actualización</p>
                  <p className="text-sm">{formatDateTime(order.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Productos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Productos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {parseProducts(order.products).length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Precio Unitario</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parseProducts(order.products).map((product: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{product.product_name || product.name || 'Producto sin nombre'}</p>
                            {product.warehouse_name && (
                              <p className="text-sm text-muted-foreground">Depósito: {product.warehouse_name}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{product.quantity || 1}</TableCell>
                        <TableCell>${product.unit_price || 0}</TableCell>
                        <TableCell className="text-right">
                          ${((product.quantity || 1) * (product.unit_price || 0)).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="bg-muted p-4 rounded-md">
                  <p className="text-sm text-muted-foreground">No hay productos registrados</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Cliente</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                  <p className="text-sm">{order.customer.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm">{order.customer.email || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                  <p className="text-sm">{order.customer.phone || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dirección</p>
                  <p className="text-sm">{order.customer.address}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Barrio</p>
                  <p className="text-sm">{order.customer.neighborhood || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Departamento</p>
                  <p className="text-sm">{order.customer.departamento || 'No especificado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de Entrega */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Entrega</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de Entrega</p>
                  <p className="text-sm">{formatDate(order.delivery_date)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Horario</p>
                  <p className="text-sm">{order.delivery_time_slot || 'No especificado'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Dirección de Entrega</p>
                  <p className="text-sm">{order.delivery_address}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Barrio</p>
                  <p className="text-sm">{order.delivery_neighborhood || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Departamento</p>
                  <p className="text-sm">{order.delivery_departamento || 'No especificado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de Pago */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Pago</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Método de Pago</p>
                  <p className="text-sm">{getPaymentMethodLabel(order.payment_method)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monto Total</p>
                  <p className="text-lg font-bold">${order.total_amount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vendedor */}
          {order.seller && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Vendedor</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                    <p className="text-sm">{order.seller.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                    <p className="text-sm">{order.seller.phone || 'No especificado'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Rol</p>
                    <p className="text-sm capitalize">{order.seller.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Información de Armado */}
          {order.requiere_armado && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wrench className="h-5 w-5" />
                  <span>Armado</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Estado</p>
                    <Badge variant={order.armado_estado === 'completado' ? 'default' : 'outline'}>
                      {order.armado_estado === 'pendiente' && 'Pendiente'}
                      {order.armado_estado === 'confirmado' && 'Confirmado'}
                      {order.armado_estado === 'en_progreso' && 'En Progreso'}
                      {order.armado_estado === 'completado' && 'Completado'}
                    </Badge>
                  </div>
                  {order.armado_fecha && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Fecha de Armado</p>
                      <p className="text-sm">{formatDate(order.armado_fecha)}</p>
                    </div>
                  )}
                  {order.armado_horario && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Horario</p>
                      <p className="text-sm">{order.armado_horario}</p>
                    </div>
                  )}
                  {order.armado_contacto_nombre && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Contacto</p>
                      <p className="text-sm">{order.armado_contacto_nombre}</p>
                    </div>
                  )}
                  {order.armado_contacto_telefono && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Teléfono de Contacto</p>
                      <p className="text-sm">{order.armado_contacto_telefono}</p>
                    </div>
                  )}
                  {order.armador_entrega_mercaderia !== undefined && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Entrega</p>
                      <p className="text-sm">
                        {order.armador_entrega_mercaderia ? 'El armador entrega' : 'Logística entrega'}
                      </p>
                    </div>
                  )}
                  {order.armado_confirmado_at && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Confirmado</p>
                      <p className="text-sm">{formatDateTime(order.armado_confirmado_at)}</p>
                    </div>
                  )}
                  {order.armado_completado_at && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Completado</p>
                      <p className="text-sm">{formatDateTime(order.armado_completado_at)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fotos de Armado */}
          {assemblyPhotos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Camera className="h-5 w-5" />
                  <span>Fotos del Armado</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {assemblyPhotos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.photo_url}
                        alt="Foto de armado"
                        className="w-full h-40 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(photo.photo_url, '_blank')}
                      />
                      <Badge
                        className="absolute top-2 right-2"
                        variant={photo.photo_type === 'completado' ? 'default' : 'secondary'}
                      >
                        {photo.photo_type === 'completado' ? 'Completado' : 'Progreso'}
                      </Badge>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        {new Date(photo.created_at).toLocaleString('es-ES')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notas */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Notas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}