import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  MapPin, 
  Clock, 
  Truck, 
  AlertTriangle, 
  CheckCircle2, 
  Navigation,
  Timer,
  Users
} from 'lucide-react';

interface LocationAlert {
  id: string;
  delivery_id: string;
  alert_type: 'approaching' | 'arrived' | 'delayed';
  location_name: string;
  customer_name: string;
  distance?: number;
  estimated_arrival?: string;
  triggered_at?: string;
  is_active: boolean;
  priority: 'low' | 'medium' | 'high';
}

export const LocationAlertsPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<LocationAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    checkLocationPermission();
    loadLocationAlerts();
    
    // Simular updates en tiempo real
    const interval = setInterval(loadLocationAlerts, 30000); // cada 30 segundos
    
    return () => clearInterval(interval);
  }, [user]);

  const checkLocationPermission = async () => {
    if (!navigator.geolocation) {
      console.log('Geolocation not supported');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      
      setCurrentLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
      setLocationEnabled(true);
    } catch (error) {
      console.error('Location permission denied:', error);
      setLocationEnabled(false);
    }
  };

  const loadLocationAlerts = async () => {
    if (!user) return;

    try {
      // Simular datos de alertas geográficas
      const mockAlerts: LocationAlert[] = [
        {
          id: '1',
          delivery_id: 'del-001',
          alert_type: 'approaching',
          location_name: 'Centro Comercial Tres Cruces',
          customer_name: 'María González',
          distance: 150,
          estimated_arrival: '5 minutos',
          is_active: true,
          priority: 'medium'
        },
        {
          id: '2',
          delivery_id: 'del-002',
          alert_type: 'delayed',
          location_name: 'Barrio Pocitos',
          customer_name: 'Carlos Rodríguez',
          distance: 800,
          estimated_arrival: '15 minutos',
          triggered_at: new Date(Date.now() - 300000).toISOString(), // 5 min ago
          is_active: true,
          priority: 'high'
        },
        {
          id: '3',
          delivery_id: 'del-003',
          alert_type: 'arrived',
          location_name: 'Oficina Central',
          customer_name: 'Ana Martínez',
          distance: 0,
          triggered_at: new Date(Date.now() - 120000).toISOString(), // 2 min ago
          is_active: true,
          priority: 'low'
        }
      ];

      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Error loading location alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      
      setCurrentLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
      setLocationEnabled(true);
      
      toast({
        title: "Ubicación activada",
        description: "Ahora recibirás alertas basadas en tu ubicación",
      });
    } catch (error) {
      toast({
        title: "Permisos denegados",
        description: "No se pueden mostrar alertas sin acceso a la ubicación",
        variant: "destructive",
      });
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'approaching':
        return <Navigation className="h-4 w-4 text-blue-500" />;
      case 'arrived':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'delayed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <MapPin className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'approaching':
        return 'bg-blue-100 text-blue-800';
      case 'arrived':
        return 'bg-green-100 text-green-800';
      case 'delayed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getAlertTitle = (type: string) => {
    switch (type) {
      case 'approaching':
        return 'Acercándose';
      case 'arrived':
        return 'Llegada';
      case 'delayed':
        return 'Retraso';
      default:
        return 'Alerta';
    }
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    toast({
      title: "Alerta descartada",
      description: "La alerta ha sido marcada como vista",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estado de geolocalización */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Alertas Geográficas
          </CardTitle>
          <CardDescription>
            Recibe notificaciones basadas en la ubicación de tus entregas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${locationEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div>
                <p className="font-medium">
                  {locationEnabled ? 'Ubicación activada' : 'Ubicación desactivada'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {locationEnabled 
                    ? 'Recibiendo alertas geográficas en tiempo real'
                    : 'Activa la ubicación para recibir alertas'
                  }
                </p>
              </div>
            </div>
            {!locationEnabled && (
              <Button onClick={requestLocationPermission} size="sm">
                Activar ubicación
              </Button>
            )}
          </div>

          {currentLocation && (
            <div className="text-sm text-muted-foreground">
              Ubicación actual: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de alertas activas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertas Activas
            {alerts.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {alerts.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Alertas basadas en la proximidad a destinos de entrega
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay alertas activas</h3>
              <p className="text-muted-foreground">
                Las alertas aparecerán cuando te acerques a destinos de entrega
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border transition-all duration-200 ${getPriorityColor(alert.priority)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getAlertIcon(alert.alert_type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            variant="secondary" 
                            className={getAlertColor(alert.alert_type)}
                          >
                            {getAlertTitle(alert.alert_type)}
                          </Badge>
                          <Badge 
                            variant={alert.priority === 'high' ? 'destructive' : 'secondary'}
                          >
                            {alert.priority === 'high' ? 'Urgente' : 
                             alert.priority === 'medium' ? 'Medio' : 'Bajo'}
                          </Badge>
                        </div>
                        
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          {alert.location_name}
                        </h4>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          Cliente: {alert.customer_name}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {alert.distance !== undefined && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {alert.distance}m
                            </div>
                          )}
                          
                          {alert.estimated_arrival && (
                            <div className="flex items-center gap-1">
                              <Timer className="h-3 w-3" />
                              {alert.estimated_arrival}
                            </div>
                          )}
                          
                          {alert.triggered_at && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(alert.triggered_at), 'HH:mm', { locale: es })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => dismissAlert(alert.id)}
                    >
                      Descartar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estadísticas de alertas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Estadísticas de Ubicación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {alerts.filter(a => a.alert_type === 'approaching').length}
              </div>
              <div className="text-sm text-blue-600">Acercándose</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {alerts.filter(a => a.alert_type === 'arrived').length}
              </div>
              <div className="text-sm text-green-600">Llegadas</div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {alerts.filter(a => a.alert_type === 'delayed').length}
              </div>
              <div className="text-sm text-red-600">Retrasos</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};