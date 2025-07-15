import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Route, Plus, Clock, MapPin, Eye } from 'lucide-react';
import { CreateRouteModal } from '@/components/forms/CreateRouteModal';

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

const RoutesPage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .order('route_date', { ascending: false });

      if (error) throw error;
      setRoutes(data || []);
    } catch (error) {
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

  const getRouteStatus = (route: RouteData) => {
    if (route.end_time) return 'Completada';
    if (route.start_time) return 'En progreso';
    return 'Pendiente';
  };

  const getStatusColor = (route: RouteData) => {
    const status = getRouteStatus(route);
    switch (status) {
      case 'Completada':
        return 'bg-green-100 text-green-800';
      case 'En progreso':
        return 'bg-blue-100 text-blue-800';
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgress = (route: RouteData) => {
    if (route.total_deliveries === 0) return 0;
    return Math.round((route.completed_deliveries / route.total_deliveries) * 100);
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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Rutas</h1>
            <p className="text-muted-foreground">Gestiona las rutas de entrega</p>
          </div>
          {profile?.role === 'gerencia' && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Ruta
            </Button>
          )}
        </div>

        <div className="grid gap-4">
          {routes.map((route) => (
            <Card key={route.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Route className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{route.route_name}</CardTitle>
                    <Badge className={getStatusColor(route)}>
                      {getRouteStatus(route)}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {route.completed_deliveries}/{route.total_deliveries}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getProgress(route)}% completado
                    </p>
                  </div>
                </div>
                <CardDescription className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>Cadete asignado</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgress(route)}%` }}
                    ></div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Fecha:</strong> {new Date(route.route_date).toLocaleDateString()}</p>
                      {route.start_time && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-green-500" />
                          <span>Inicio: {new Date(route.start_time).toLocaleTimeString()}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p><strong>Entregas:</strong> {route.total_deliveries}</p>
                      {route.end_time && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-red-500" />
                          <span>Fin: {new Date(route.end_time).toLocaleTimeString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Creado: {new Date(route.created_at).toLocaleString()}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/routes/${route.id}`);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalle
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {routes.length === 0 && (
          <div className="text-center py-12">
            <Route className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay rutas</h3>
            <p className="text-muted-foreground">
              Aún no hay rutas registradas en el sistema
            </p>
          </div>
        )}
      </div>

      <CreateRouteModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onRouteCreated={fetchRoutes}
      />
    </MainLayout>
  );
};

export default RoutesPage;