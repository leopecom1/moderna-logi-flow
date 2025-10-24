import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { MessageLoading } from '@/components/ui/message-loading';
import { RouteMap } from '@/components/ui/route-map';
import { Calendar, MapPin, User, Package, Clock, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Route {
  id: string;
  route_name: string;
  route_date: string;
  cadete_name: string;
  total_deliveries: number;
  completed_deliveries: number;
  start_time?: string;
  end_time?: string;
}

interface DeliveryLocation {
  id: string;
  address: string;
  lat?: number;
  lng?: number;
  status: string;
  customer_name: string;
  order_number: string;
}

export const RoutesViewPanel = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveryLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchRoutes();
  }, [filterDate]);

  useEffect(() => {
    if (selectedRoute) {
      fetchRouteDeliveries(selectedRoute);
    }
  }, [selectedRoute]);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const { data: routesData, error } = await supabase
        .from('routes')
        .select('*')
        .eq('route_date', filterDate)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch cadetes information
      const cadeteIds = [...new Set(routesData?.map(r => r.cadete_id).filter(Boolean))];
      const { data: cadetesData } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', cadeteIds);

      const cadetesMap = new Map(cadetesData?.map(c => [c.user_id, c.full_name]));

      const formattedRoutes = routesData?.map((route: any) => ({
        id: route.id,
        route_name: route.route_name,
        route_date: route.route_date,
        cadete_name: cadetesMap.get(route.cadete_id) || 'Sin asignar',
        total_deliveries: route.total_deliveries || 0,
        completed_deliveries: route.completed_deliveries || 0,
        start_time: route.start_time,
        end_time: route.end_time,
      })) || [];

      setRoutes(formattedRoutes);

      // Auto-select first route if available
      if (formattedRoutes.length > 0 && !selectedRoute) {
        setSelectedRoute(formattedRoutes[0].id);
      }
    } catch (error: any) {
      console.error('Error fetching routes:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las rutas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRouteDeliveries = async (routeId: string) => {
    try {
      setLoadingDeliveries(true);
      // @ts-ignore - Complex Supabase query type inference
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          id,
          status,
          latitude,
          longitude,
          orders(
            id,
            order_number,
            delivery_address,
            customers(name)
          )
        `)
        .eq('route_id', routeId);

      if (error) throw error;

      const formattedDeliveries = data
        .filter((d: any) => d.orders) // Filter out deliveries without orders
        .map((d: any) => ({
          id: d.id,
          address: d.orders.delivery_address,
          lat: d.latitude || undefined,
          lng: d.longitude || undefined,
          status: d.status,
          customer_name: d.orders.customers?.name || 'Cliente desconocido',
          order_number: d.orders.order_number,
        }));

      setDeliveries(formattedDeliveries);
    } catch (error: any) {
      console.error('Error fetching deliveries:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las entregas de la ruta',
        variant: 'destructive',
      });
    } finally {
      setLoadingDeliveries(false);
    }
  };

  const getRouteStatus = (route: Route) => {
    if (route.end_time) return 'completada';
    if (route.start_time) return 'en_curso';
    return 'pendiente';
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completada: { variant: 'default' as const, label: 'Completada', className: 'bg-green-500' },
      en_curso: { variant: 'secondary' as const, label: 'En Curso', className: 'bg-blue-500' },
      pendiente: { variant: 'outline' as const, label: 'Pendiente', className: '' },
    };
    const config = variants[status as keyof typeof variants] || variants.pendiente;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getProgressPercentage = (route: Route) => {
    if (route.total_deliveries === 0) return 0;
    return Math.round((route.completed_deliveries / route.total_deliveries) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <MessageLoading />
        <span className="ml-3">Cargando rutas...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Routes List */}
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Rutas</CardTitle>
            <CardDescription>Selecciona una ruta para ver el mapa</CardDescription>
            <div className="pt-2">
              <label className="text-sm font-medium mb-2 block">Filtrar por fecha</label>
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {routes.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No hay rutas para la fecha seleccionada</p>
              </div>
            ) : (
              routes.map((route) => (
                <Card
                  key={route.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedRoute === route.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedRoute(route.id)}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-sm">{route.route_name}</h4>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{route.cadete_name}</span>
                        </div>
                      </div>
                      {getStatusBadge(getRouteStatus(route))}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(route.route_date).toLocaleDateString('es-UY')}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Package className="h-3 w-3" />
                        <span>
                          {route.completed_deliveries}/{route.total_deliveries}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progreso</span>
                        <span className="font-medium">{getProgressPercentage(route)}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${getProgressPercentage(route)}%` }}
                        />
                      </div>
                    </div>

                    {route.start_time && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          Inicio: {new Date(route.start_time).toLocaleTimeString('es-UY', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Map View */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Vista de Mapa</CardTitle>
            <CardDescription>
              {selectedRoute
                ? `Entregas de ${routes.find(r => r.id === selectedRoute)?.route_name}`
                : 'Selecciona una ruta para ver las entregas en el mapa'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedRoute ? (
              <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
                <div className="text-center">
                  <MapPin className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Selecciona una ruta para ver el mapa</p>
                </div>
              </div>
            ) : loadingDeliveries ? (
              <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
                <MessageLoading />
                <span className="ml-3">Cargando entregas...</span>
              </div>
            ) : deliveries.length === 0 ? (
              <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
                <div className="text-center">
                  <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay entregas asignadas a esta ruta</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Package className="h-4 w-4" />
                      <span className="text-xs">Total Entregas</span>
                    </div>
                    <p className="text-2xl font-bold">{deliveries.length}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-xs">Completadas</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {deliveries.filter(d => d.status === 'entregado').length}
                    </p>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs">Pendientes</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {deliveries.filter(d => d.status === 'pendiente').length}
                    </p>
                  </div>
                </div>
                <RouteMap deliveries={deliveries} height="500px" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
