import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Truck, MapPin, Clock } from 'lucide-react';

interface Delivery {
  id: string;
  order_id: string;
  status: string;
  latitude?: number;
  longitude?: number;
  delivery_notes?: string;
  attempted_at?: string;
  delivered_at?: string;
  created_at: string;
  orders: {
    order_number: string;
    delivery_address: string;
    delivery_neighborhood?: string;
    total_amount: number;
  };
}

const DeliveriesPage = () => {
  const { profile } = useAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          orders (
            order_number,
            delivery_address,
            delivery_neighborhood,
            total_amount
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeliveries(data || []);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las entregas',
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
      case 'en_camino':
        return 'bg-blue-100 text-blue-800';
      case 'entregado':
        return 'bg-green-100 text-green-800';
      case 'fallido':
        return 'bg-red-100 text-red-800';
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
        <div>
          <h1 className="text-3xl font-bold">Entregas</h1>
          <p className="text-muted-foreground">Gestiona y monitorea todas las entregas</p>
        </div>

        <div className="grid gap-4">
          {deliveries.map((delivery) => (
            <Card key={delivery.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Truck className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">
                      Pedido #{delivery.orders.order_number}
                    </CardTitle>
                    <Badge className={getStatusColor(delivery.status)}>
                      {delivery.status}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">${delivery.orders.total_amount}</p>
                    <p className="text-sm text-muted-foreground">
                      Cadete: Asignado
                    </p>
                  </div>
                </div>
                <CardDescription className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{delivery.orders.delivery_address}</span>
                  {delivery.orders.delivery_neighborhood && (
                    <span>, {delivery.orders.delivery_neighborhood}</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {delivery.attempted_at && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span>Intento: {new Date(delivery.attempted_at).toLocaleString()}</span>
                    </div>
                  )}
                  {delivery.delivered_at && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-green-500" />
                      <span>Entregado: {new Date(delivery.delivered_at).toLocaleString()}</span>
                    </div>
                  )}
                  {delivery.delivery_notes && (
                    <p className="text-sm">
                      <strong>Notas:</strong> {delivery.delivery_notes}
                    </p>
                  )}
                  {delivery.latitude && delivery.longitude && (
                    <p className="text-sm text-muted-foreground">
                      Ubicación: {delivery.latitude}, {delivery.longitude}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Creado: {new Date(delivery.created_at).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {deliveries.length === 0 && (
          <div className="text-center py-12">
            <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay entregas</h3>
            <p className="text-muted-foreground">
              Aún no hay entregas registradas en el sistema
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default DeliveriesPage;