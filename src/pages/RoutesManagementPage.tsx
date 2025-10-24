import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MessageLoading } from '@/components/ui/message-loading';
import { CreateRouteModal } from '@/components/forms/CreateRouteModal';
import { Plus, Truck, Calendar, User } from 'lucide-react';

interface Route {
  id: string;
  route_name: string;
  route_date: string;
  cadete_id: string;
  cadete_name: string;
  total_deliveries: number;
  completed_deliveries: number;
  start_time: string | null;
  end_time: string | null;
}

export default function RoutesManagementPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      // @ts-ignore - Complex Supabase query type inference
      const { data, error } = await supabase
        .from('routes')
        .select('id, route_name, route_date, cadete_id, total_deliveries, completed_deliveries, start_time, end_time, profiles(full_name)')
        .order('route_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedRoutes = data.map((route: any) => ({
        id: route.id,
        route_name: route.route_name,
        route_date: route.route_date,
        cadete_id: route.cadete_id,
        cadete_name: route.profiles?.full_name || 'Sin asignar',
        total_deliveries: route.total_deliveries || 0,
        completed_deliveries: route.completed_deliveries || 0,
        start_time: route.start_time,
        end_time: route.end_time,
      }));

      setRoutes(formattedRoutes);
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

  const getRouteStatus = (route: Route) => {
    if (route.end_time) return 'completada';
    if (route.start_time) return 'en_curso';
    return 'pendiente';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completada':
        return <Badge variant="default" className="bg-green-500">Completada</Badge>;
      case 'en_curso':
        return <Badge variant="default" className="bg-blue-500">En Curso</Badge>;
      case 'pendiente':
        return <Badge variant="secondary">Pendiente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center py-12">
            <MessageLoading />
            <span className="ml-3">Cargando rutas...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gestión de Envíos</h1>
            <p className="text-muted-foreground">
              Crea y administra rutas de entrega para los cadetes
            </p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Ruta
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Rutas de Entrega</CardTitle>
            <CardDescription>
              Todas las rutas creadas ordenadas por fecha
            </CardDescription>
          </CardHeader>
          <CardContent>
            {routes.length === 0 ? (
              <div className="text-center py-12">
                <Truck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No hay rutas creadas</p>
                <Button onClick={() => setCreateModalOpen(true)} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Crear Primera Ruta
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ruta</TableHead>
                      <TableHead>Cadete</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Entregas</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Hora Inicio</TableHead>
                      <TableHead>Hora Fin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routes.map((route) => (
                      <TableRow key={route.id}>
                        <TableCell className="font-medium">{route.route_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {route.cadete_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(route.route_date).toLocaleDateString('es-UY')}
                          </div>
                        </TableCell>
                        <TableCell>
                          {route.completed_deliveries} / {route.total_deliveries}
                        </TableCell>
                        <TableCell>{getStatusBadge(getRouteStatus(route))}</TableCell>
                        <TableCell>
                          {route.start_time 
                            ? new Date(route.start_time).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {route.end_time 
                            ? new Date(route.end_time).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <CreateRouteModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onRouteCreated={() => {
            fetchRoutes();
            setCreateModalOpen(false);
          }}
        />
      </div>
    </MainLayout>
  );
}
