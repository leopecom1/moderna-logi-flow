import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Car, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Navigation,
  Zap,
  Eye
} from 'lucide-react';

interface TrafficData {
  location: string;
  current_speed: number;
  normal_speed: number;
  congestion_level: 'low' | 'medium' | 'high' | 'severe';
  estimated_delay: number;
  alternative_available: boolean;
  coordinates: {
    lat: number;
    lng: number;
  };
  last_updated: string;
}

interface RouteAlert {
  id: string;
  type: 'traffic' | 'accident' | 'construction' | 'weather';
  severity: 'low' | 'medium' | 'high';
  location: string;
  description: string;
  estimated_impact: number; // minutos de retraso
  alternative_route: boolean;
  created_at: string;
}

export const TrafficAnalyzer = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [trafficData, setTrafficData] = useState<TrafficData[]>([]);
  const [routeAlerts, setRouteAlerts] = useState<RouteAlert[]>([]);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadTrafficData();
    
    // Configurar actualización en tiempo real
    if (realTimeEnabled) {
      const interval = setInterval(() => {
        loadTrafficData();
      }, 30000); // Actualizar cada 30 segundos
      
      return () => clearInterval(interval);
    }
  }, [realTimeEnabled]);

  const loadTrafficData = async () => {
    try {
      // Simular datos de tráfico en tiempo real
      const mockTrafficData: TrafficData[] = [
        {
          location: 'Av. 18 de Julio (Centro)',
          current_speed: 15,
          normal_speed: 35,
          congestion_level: 'high',
          estimated_delay: 12,
          alternative_available: true,
          coordinates: { lat: -34.9011, lng: -56.1645 },
          last_updated: new Date().toISOString()
        },
        {
          location: 'Rambla República de México',
          current_speed: 42,
          normal_speed: 50,
          congestion_level: 'medium',
          estimated_delay: 4,
          alternative_available: false,
          coordinates: { lat: -34.9178, lng: -56.1515 },
          last_updated: new Date().toISOString()
        },
        {
          location: 'Av. Brasil',
          current_speed: 55,
          normal_speed: 60,
          congestion_level: 'low',
          estimated_delay: 1,
          alternative_available: false,
          coordinates: { lat: -34.9089, lng: -56.1456 },
          last_updated: new Date().toISOString()
        },
        {
          location: 'Av. Italia',
          current_speed: 8,
          normal_speed: 45,
          congestion_level: 'severe',
          estimated_delay: 18,
          alternative_available: true,
          coordinates: { lat: -34.9156, lng: -56.1367 },
          last_updated: new Date().toISOString()
        }
      ];

      const mockAlerts: RouteAlert[] = [
        {
          id: '1',
          type: 'accident',
          severity: 'high',
          location: 'Av. Italia y Bvar. Artigas',
          description: 'Accidente de tránsito con carriles bloqueados',
          estimated_impact: 15,
          alternative_route: true,
          created_at: new Date(Date.now() - 600000).toISOString() // 10 min ago
        },
        {
          id: '2',
          type: 'construction',
          severity: 'medium',
          location: 'Av. 18 de Julio altura 1500',
          description: 'Obras de pavimentación - un carril cerrado',
          estimated_impact: 8,
          alternative_route: true,
          created_at: new Date(Date.now() - 1800000).toISOString() // 30 min ago
        },
        {
          id: '3',
          type: 'traffic',
          severity: 'medium',
          location: 'Rambla (tramo Pocitos)',
          description: 'Tráfico denso por hora pico',
          estimated_impact: 6,
          alternative_route: false,
          created_at: new Date(Date.now() - 300000).toISOString() // 5 min ago
        }
      ];

      setTrafficData(mockTrafficData);
      setRouteAlerts(mockAlerts);
      setLastUpdate(new Date());

    } catch (error) {
      console.error('Error loading traffic data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshTrafficData = async () => {
    setLoading(true);
    await loadTrafficData();
    
    toast({
      title: "Datos actualizados",
      description: "Información de tráfico actualizada correctamente",
    });
  };

  const getCongestionColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'severe': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCongestionLabel = (level: string) => {
    switch (level) {
      case 'low': return 'Fluido';
      case 'medium': return 'Moderado';
      case 'high': return 'Congestionado';
      case 'severe': return 'Severo';
      default: return 'Desconocido';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'accident': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'construction': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'traffic': return <Car className="h-4 w-4 text-orange-500" />;
      case 'weather': return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSpeedTrend = (current: number, normal: number) => {
    const ratio = current / normal;
    if (ratio >= 0.9) return { icon: CheckCircle2, color: 'text-green-500', label: 'Normal' };
    if (ratio >= 0.7) return { icon: Minus, color: 'text-yellow-500', label: 'Lento' };
    if (ratio >= 0.5) return { icon: TrendingDown, color: 'text-orange-500', label: 'Muy lento' };
    return { icon: TrendingDown, color: 'text-red-500', label: 'Crítico' };
  };

  const calculateOverallTrafficScore = () => {
    if (trafficData.length === 0) return 0;
    
    const totalScore = trafficData.reduce((acc, data) => {
      const speedRatio = data.current_speed / data.normal_speed;
      return acc + (speedRatio * 100);
    }, 0);
    
    return Math.round(totalScore / trafficData.length);
  };

  if (loading && trafficData.length === 0) {
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

  const overallScore = calculateOverallTrafficScore();

  return (
    <div className="space-y-6">
      {/* Panel de control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Análisis de Tráfico en Tiempo Real
          </CardTitle>
          <CardDescription>
            Monitoreo en vivo del estado del tráfico en rutas principales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={realTimeEnabled}
                  onCheckedChange={setRealTimeEnabled}
                  id="realtime"
                />
                <label htmlFor="realtime" className="text-sm font-medium">
                  Actualización automática
                </label>
              </div>
              
              <Button 
                onClick={refreshTrafficData} 
                variant="outline" 
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Última actualización: {format(lastUpdate, 'HH:mm:ss', { locale: es })}
            </div>
          </div>

          {/* Score general */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="text-sm font-medium mb-1">Estado General del Tráfico</div>
              <Progress value={overallScore} className="w-full" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{overallScore}%</div>
              <div className="text-sm text-muted-foreground">Fluidez</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas activas */}
      {routeAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas Activas
              <Badge variant="destructive" className="ml-2">
                {routeAlerts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {routeAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {getAlertIcon(alert.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className={getAlertColor(alert.severity)}>
                        {alert.severity === 'high' ? 'Alta' : 
                         alert.severity === 'medium' ? 'Media' : 'Baja'} prioridad
                      </Badge>
                      <span className="text-sm font-medium">{alert.location}</span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {alert.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        +{alert.estimated_impact} min de retraso
                      </div>
                      
                      {alert.alternative_route && (
                        <div className="flex items-center gap-1">
                          <Navigation className="h-3 w-3" />
                          Ruta alternativa disponible
                        </div>
                      )}
                      
                      <div>
                        {format(new Date(alert.created_at), 'HH:mm', { locale: es })}
                      </div>
                    </div>
                  </div>
                  
                  {alert.alternative_route && (
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Ver alternativa
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado del tráfico por ubicación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Estado del Tráfico por Ubicación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trafficData.map((data, index) => {
              const speedTrend = getSpeedTrend(data.current_speed, data.normal_speed);
              const SpeedIcon = speedTrend.icon;
              
              return (
                <div key={index} className="flex items-center gap-3 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    <SpeedIcon className={`h-5 w-5 ${speedTrend.color}`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{data.location}</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={getCongestionColor(data.congestion_level)}>
                          {getCongestionLabel(data.congestion_level)}
                        </Badge>
                        {data.alternative_available && (
                          <Badge variant="outline" className="text-blue-600">
                            <Zap className="h-3 w-3 mr-1" />
                            Alternativa
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Velocidad actual</div>
                        <div className="font-medium">{data.current_speed} km/h</div>
                      </div>
                      
                      <div>
                        <div className="text-muted-foreground">Velocidad normal</div>
                        <div className="font-medium">{data.normal_speed} km/h</div>
                      </div>
                      
                      <div>
                        <div className="text-muted-foreground">Retraso estimado</div>
                        <div className="font-medium text-orange-600">
                          +{data.estimated_delay} min
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-muted-foreground">Estado</div>
                        <div className={`font-medium ${speedTrend.color}`}>
                          {speedTrend.label}
                        </div>
                      </div>
                    </div>
                    
                    {/* Barra de progreso de velocidad */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Velocidad</span>
                        <span>{Math.round((data.current_speed / data.normal_speed) * 100)}% de la normal</span>
                      </div>
                      <Progress 
                        value={(data.current_speed / data.normal_speed) * 100} 
                        className="h-2"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};