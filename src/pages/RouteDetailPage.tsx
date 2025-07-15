import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Play, Square, Clock, MapPin, Package, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { RouteMap } from '@/components/ui/route-map';
import { AssignOrdersModal } from '@/components/forms/AssignOrdersModal';

interface RouteData {
  id: string;
  route_name: string;
  route_date: string;
  start_time?: string;
  end_time?: string;
  total_deliveries: number;
  completed_deliveries: number;
  cadete_id: string;
  created_at: string;
}

interface DeliveryData {
  id: string;
  order_id: string;
  status: string;
  delivery_notes?: string;
  delivered_at?: string;
  attempted_at?: string;
  latitude?: number;
  longitude?: number;
  order: {
    id: string;
    order_number: string;
    delivery_address: string;
    total_amount: number;
    products: any;
    customer: {
      name: string;
      phone?: string;
    };
  };
}

interface CadeteData {
  full_name: string;
  phone?: string;
}

const RouteDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [route, setRoute] = useState<RouteData | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveryData[]>([]);
  const [cadete, setCadete] = useState<CadeteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRouteData();
    }
  }, [id]);

  const fetchRouteData = async () => {
    try {
      setLoading(true);
      
      // Fetch route details
      const { data: routeData, error: routeError } = await supabase
        .from('routes')
        .select('*')
        .eq('id', id)
        .single();

      if (routeError) throw routeError;
      setRoute(routeData);

      // Fetch cadete info
      const { data: cadeteData, error: cadeteError } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('user_id', routeData.cadete_id)
        .single();

      if (cadeteError) throw cadeteError;
      setCadete(cadeteData);

      // Fetch deliveries for this route
      const { data: deliveriesData, error: deliveriesError } = await supabase
        .from('deliveries')
        .select(`
          *,
          order:orders!inner(
            id,
            order_number,
            delivery_address,
            total_amount,
            products,
            customer:customers!inner(
              name,
              phone
            )
          )
        `)
        .eq('route_id', id)
        .order('created_at');

      if (deliveriesError) throw deliveriesError;
      setDeliveries(deliveriesData || []);

    } catch (error) {
      console.error('Error fetching route data:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información de la ruta',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartRoute = async () => {
    if (!route) return;
    
    try {
      setUpdatingStatus(true);
      const { error } = await supabase
        .from('routes')
        .update({ start_time: new Date().toISOString() })
        .eq('id', route.id);

      if (error) throw error;
      
      toast({
        title: 'Ruta iniciada',
        description: 'La ruta ha sido marcada como iniciada',
      });
      
      fetchRouteData();
    } catch (error) {
      console.error('Error starting route:', error);
      toast({
        title: 'Error',
        description: 'No se pudo iniciar la ruta',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleFinishRoute = async () => {
    if (!route) return;
    
    try {
      setUpdatingStatus(true);
      const { error } = await supabase
        .from('routes')
        .update({ end_time: new Date().toISOString() })
        .eq('id', route.id);

      if (error) throw error;
      
      toast({
        title: 'Ruta finalizada',
        description: 'La ruta ha sido marcada como finalizada',
      });
      
      fetchRouteData();
    } catch (error) {
      console.error('Error finishing route:', error);
      toast({
        title: 'Error',
        description: 'No se pudo finalizar la ruta',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const updateDeliveryStatus = async (deliveryId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'entregado') {
        updateData.delivered_at = new Date().toISOString();
      } else if (newStatus === 'en_camino') {
        updateData.attempted_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('deliveries')
        .update(updateData)
        .eq('id', deliveryId);

      if (error) throw error;
      
      // Update completed deliveries count
      const completedCount = deliveries.filter(d => 
        d.id === deliveryId ? newStatus === 'entregado' : d.status === 'entregado'
      ).length;
      
      await supabase
        .from('routes')
        .update({ completed_deliveries: completedCount })
        .eq('id', route?.id);
      
      toast({
        title: 'Estado actualizado',
        description: 'El estado de la entrega ha sido actualizado',
      });
      
      fetchRouteData();
    } catch (error) {
      console.error('Error updating delivery status:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'entregado':
        return 'bg-green-100 text-green-800';
      case 'en_camino':
        return 'bg-blue-100 text-blue-800';
      case 'con_demora':
        return 'bg-yellow-100 text-yellow-800';
      case 'no_entregado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'entregado':
        return <CheckCircle className="h-4 w-4" />;
      case 'en_camino':
        return <Clock className="h-4 w-4" />;
      case 'con_demora':
        return <AlertCircle className="h-4 w-4" />;
      case 'no_entregado':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getRouteStatus = () => {
    if (!route) return 'Desconocido';
    if (route.end_time) return 'Completada';
    if (route.start_time) return 'En progreso';
    return 'Pendiente';
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!route) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Ruta no encontrada</h3>
          <p className="text-muted-foreground">
            La ruta que buscas no existe o no tienes permisos para verla
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => navigate('/routes')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Rutas
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{route.route_name}</h1>
              <p className="text-muted-foreground">
                Fecha: {new Date(route.route_date).toLocaleDateString()} | 
                Cadete: {cadete?.full_name}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(getRouteStatus().toLowerCase())}>
              {getRouteStatus()}
            </Badge>
            {profile?.role === 'gerencia' && (
              <Button 
                variant="outline" 
                onClick={() => setShowAssignModal(true)}
                disabled={route.end_time !== null}
              >
                <Package className="h-4 w-4 mr-2" />
                Asignar Pedidos
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Route Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Información de la Ruta</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Estado</p>
                  <Badge className={getStatusColor(getRouteStatus().toLowerCase())}>
                    {getRouteStatus()}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Progreso</p>
                  <p className="text-lg font-bold">
                    {route.completed_deliveries}/{route.total_deliveries}
                  </p>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${route.total_deliveries > 0 ? (route.completed_deliveries / route.total_deliveries) * 100 : 0}%` 
                  }}
                ></div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Cadete</p>
                  <p>{cadete?.full_name}</p>
                  {cadete?.phone && <p className="text-muted-foreground">{cadete.phone}</p>}
                </div>
                <div>
                  <p className="font-medium">Fecha</p>
                  <p>{new Date(route.route_date).toLocaleDateString()}</p>
                </div>
              </div>

              {route.start_time && (
                <div className="text-sm">
                  <p className="font-medium">Hora de Inicio</p>
                  <p>{new Date(route.start_time).toLocaleTimeString()}</p>
                </div>
              )}

              {route.end_time && (
                <div className="text-sm">
                  <p className="font-medium">Hora de Finalización</p>
                  <p>{new Date(route.end_time).toLocaleTimeString()}</p>
                </div>
              )}

              <div className="flex space-x-2">
                {!route.start_time && (
                  <Button 
                    onClick={handleStartRoute}
                    disabled={updatingStatus}
                    className="flex-1"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar Ruta
                  </Button>
                )}
                {route.start_time && !route.end_time && (
                  <Button 
                    onClick={handleFinishRoute}
                    disabled={updatingStatus}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Finalizar Ruta
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Map */}
          <Card>
            <CardHeader>
              <CardTitle>Mapa de Entregas</CardTitle>
              <CardDescription>
                Ubicaciones de las entregas en esta ruta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RouteMap 
                deliveries={deliveries.map(d => ({
                  id: d.id,
                  address: d.order.delivery_address,
                  lat: d.latitude || undefined,
                  lng: d.longitude || undefined,
                  status: d.status,
                  customer_name: d.order.customer.name,
                  order_number: d.order.order_number,
                }))}
                className="w-full h-96"
                height="384px"
                onDeliveryClick={(deliveryId) => {
                  // Scroll to delivery in the list
                  const element = document.getElementById(`delivery-${deliveryId}`);
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Deliveries List */}
        <Card>
          <CardHeader>
            <CardTitle>Entregas ({deliveries.length})</CardTitle>
            <CardDescription>
              Lista de todas las entregas asignadas a esta ruta
            </CardDescription>
          </CardHeader>
          <CardContent>
            {deliveries.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay entregas asignadas</h3>
                <p className="text-muted-foreground">
                  Usa el botón "Asignar Pedidos" para agregar entregas a esta ruta
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {deliveries.map((delivery) => (
                  <div key={delivery.id} id={`delivery-${delivery.id}`} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {delivery.order.order_number}
                          </Badge>
                          <Badge className={getStatusColor(delivery.status)}>
                            {getStatusIcon(delivery.status)}
                            <span className="ml-1 capitalize">{delivery.status.replace('_', ' ')}</span>
                          </Badge>
                        </div>
                        <p className="font-medium">{delivery.order.customer.name}</p>
                        <p className="text-sm text-muted-foreground mb-2">
                          {delivery.order.delivery_address}
                        </p>
                        <p className="text-sm font-medium">
                          Total: ${delivery.order.total_amount}
                        </p>
                        {delivery.delivery_notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Notas: {delivery.delivery_notes}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col space-y-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateDeliveryStatus(delivery.id, 'en_camino')}
                          disabled={delivery.status === 'entregado'}
                        >
                          En Camino
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateDeliveryStatus(delivery.id, 'entregado')}
                          disabled={delivery.status === 'entregado'}
                        >
                          Entregado
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateDeliveryStatus(delivery.id, 'no_entregado')}
                          disabled={delivery.status === 'entregado'}
                        >
                          No Entregado
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {route && (
        <AssignOrdersModal
          open={showAssignModal}
          onOpenChange={setShowAssignModal}
          routeId={route.id}
          onOrdersAssigned={fetchRouteData}
        />
      )}
    </MainLayout>
  );
};

export default RouteDetailPage;