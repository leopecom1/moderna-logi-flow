import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { AlertTriangle, Plus, Clock, User } from 'lucide-react';
import { CreateIncidentModal } from '@/components/forms/CreateIncidentModal';

interface Incident {
  id: string;
  title: string;
  description: string;
  incident_type: string;
  status: string;
  created_at: string;
  resolved_at?: string;
  order_id?: string;
  delivery_id?: string;
  orders?: {
    order_number: string;
  };
}

const IncidentsPage = () => {
  const { profile } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select(`
          *,
          orders (
            order_number
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIncidents(data || []);
    } catch (error) {
      console.error('Error fetching incidents:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las incidencias',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'abierto':
        return 'bg-red-100 text-red-800';
      case 'en_proceso':
        return 'bg-yellow-100 text-yellow-800';
      case 'resuelto':
        return 'bg-green-100 text-green-800';
      case 'cerrado':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'entrega_fallida':
        return 'bg-orange-100 text-orange-800';
      case 'producto_danado':
        return 'bg-red-100 text-red-800';
      case 'direccion_incorrecta':
        return 'bg-blue-100 text-blue-800';
      case 'cliente_ausente':
        return 'bg-purple-100 text-purple-800';
      case 'otro':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
            <h1 className="text-3xl font-bold">Incidencias</h1>
            <p className="text-muted-foreground">Gestiona y resuelve incidencias del sistema</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Incidencia
          </Button>
        </div>

        <div className="grid gap-4">
          {incidents.map((incident) => (
            <Card key={incident.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <CardTitle className="text-lg">{incident.title}</CardTitle>
                    <Badge className={getStatusColor(incident.status)}>
                      {incident.status}
                    </Badge>
                    <Badge className={getTypeColor(incident.incident_type)}>
                      {incident.incident_type}
                    </Badge>
                  </div>
                  {incident.orders && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Pedido #{incident.orders.order_number}
                      </p>
                    </div>
                  )}
                </div>
                <CardDescription>
                  {incident.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="h-4 w-4 text-blue-500" />
                    <span>Reportado por usuario</span>
                  </div>
                  
                  {incident.resolved_at && (
                    <div className="flex items-center space-x-2 text-sm">
                      <User className="h-4 w-4 text-green-500" />
                      <span>Resuelto por administrador</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>Creado: {new Date(incident.created_at).toLocaleString()}</span>
                  </div>
                  
                  {incident.resolved_at && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-green-500" />
                      <span>Resuelto: {new Date(incident.resolved_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {incidents.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay incidencias</h3>
            <p className="text-muted-foreground">
              No se han reportado incidencias en el sistema
            </p>
          </div>
        )}
      </div>

      <CreateIncidentModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onIncidentCreated={fetchIncidents}
      />
    </MainLayout>
  );
};

export default IncidentsPage;