import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Route, 
  MapPin, 
  Clock, 
  Fuel, 
  TrendingUp, 
  Brain, 
  Zap, 
  BarChart3,
  Target,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Navigation
} from 'lucide-react';

interface DeliveryPoint {
  id: string;
  address: string;
  customer_name: string;
  priority: 'low' | 'medium' | 'high';
  time_window?: {
    start: string;
    end: string;
  };
  estimated_duration: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  order_value: number;
}

interface OptimizedRoute {
  id: string;
  name: string;
  points: DeliveryPoint[];
  total_distance: number;
  total_time: number;
  fuel_cost: number;
  efficiency_score: number;
  traffic_factor: number;
  algorithm: 'tsp' | 'genetic' | 'ai_prediction' | 'mixed';
}

interface OptimizationMetrics {
  distance_saved: number;
  time_saved: number;
  fuel_saved: number;
  efficiency_improvement: number;
  confidence_score: number;
}

export const RouteOptimizer = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);
  const [optimizedRoutes, setOptimizedRoutes] = useState<OptimizedRoute[]>([]);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('ai_prediction');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [metrics, setMetrics] = useState<OptimizationMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeliveryPoints();
  }, [user]);

  const loadDeliveryPoints = async () => {
    try {
      // Simular carga de puntos de entrega pendientes
      const mockDeliveryPoints: DeliveryPoint[] = [
        {
          id: '1',
          address: 'Av. 18 de Julio 1234, Montevideo',
          customer_name: 'María González',
          priority: 'high',
          time_window: { start: '09:00', end: '12:00' },
          estimated_duration: 15,
          coordinates: { lat: -34.9011, lng: -56.1645 },
          order_value: 2500
        },
        {
          id: '2',
          address: 'Rambla República de México 6451, Montevideo',
          customer_name: 'Carlos Rodríguez',
          priority: 'medium',
          time_window: { start: '10:00', end: '16:00' },
          estimated_duration: 20,
          coordinates: { lat: -34.9178, lng: -56.1515 },
          order_value: 1800
        },
        {
          id: '3',
          address: 'Av. Brasil 2954, Montevideo',
          customer_name: 'Ana Martínez',
          priority: 'low',
          estimated_duration: 10,
          coordinates: { lat: -34.9089, lng: -56.1456 },
          order_value: 950
        },
        {
          id: '4',
          address: 'Dr. Luis Alberto de Herrera 1248, Montevideo',
          customer_name: 'Roberto Silva',
          priority: 'high',
          time_window: { start: '14:00', end: '18:00' },
          estimated_duration: 25,
          coordinates: { lat: -34.9156, lng: -56.1367 },
          order_value: 3200
        },
        {
          id: '5',
          address: 'Av. Luis Batlle Berres 1532, Montevideo',
          customer_name: 'Laura López',
          priority: 'medium',
          estimated_duration: 12,
          coordinates: { lat: -34.8945, lng: -56.1523 },
          order_value: 1650
        }
      ];

      setDeliveryPoints(mockDeliveryPoints);
    } catch (error) {
      console.error('Error loading delivery points:', error);
    } finally {
      setLoading(false);
    }
  };

  const optimizeRoute = async () => {
    if (deliveryPoints.length < 2) {
      toast({
        title: "Puntos insuficientes",
        description: "Se necesitan al menos 2 puntos para optimizar una ruta",
        variant: "destructive",
      });
      return;
    }

    setIsOptimizing(true);
    setOptimizationProgress(0);

    try {
      // Simular proceso de optimización
      const steps = [
        { step: 'Analizando puntos de entrega...', progress: 10 },
        { step: 'Consultando datos de tráfico...', progress: 25 },
        { step: 'Aplicando algoritmo de IA...', progress: 50 },
        { step: 'Calculando rutas alternativas...', progress: 75 },
        { step: 'Optimizando tiempos de entrega...', progress: 90 },
        { step: 'Finalizando optimización...', progress: 100 }
      ];

      for (const stepInfo of steps) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setOptimizationProgress(stepInfo.progress);
        
        toast({
          title: "Optimizando rutas",
          description: stepInfo.step,
        });
      }

      // Generar rutas optimizadas simuladas
      const optimizedRoute = await generateOptimizedRoute(deliveryPoints, selectedAlgorithm);
      const originalRoute = await generateOriginalRoute(deliveryPoints);
      
      setOptimizedRoutes([optimizedRoute, originalRoute]);
      
      // Calcular métricas de mejora
      const improvementMetrics: OptimizationMetrics = {
        distance_saved: originalRoute.total_distance - optimizedRoute.total_distance,
        time_saved: originalRoute.total_time - optimizedRoute.total_time,
        fuel_saved: originalRoute.fuel_cost - optimizedRoute.fuel_cost,
        efficiency_improvement: ((originalRoute.total_time - optimizedRoute.total_time) / originalRoute.total_time) * 100,
        confidence_score: 92
      };

      setMetrics(improvementMetrics);

      toast({
        title: "Optimización completada",
        description: `Ruta optimizada con ${improvementMetrics.efficiency_improvement.toFixed(1)}% de mejora`,
      });

    } catch (error) {
      console.error('Error optimizing route:', error);
      toast({
        title: "Error en optimización",
        description: "No se pudo completar la optimización de rutas",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const generateOptimizedRoute = async (points: DeliveryPoint[], algorithm: string): Promise<OptimizedRoute> => {
    // Simular algoritmo de optimización basado en IA
    const shuffledPoints = [...points];
    
    // Ordenar por prioridad y ventanas de tiempo
    shuffledPoints.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Si tienen la misma prioridad, ordenar por ventana de tiempo
      if (a.time_window && b.time_window) {
        return a.time_window.start.localeCompare(b.time_window.start);
      }
      
      return 0;
    });

    const totalDistance = calculateTotalDistance(shuffledPoints);
    const totalTime = calculateTotalTime(shuffledPoints);
    
    return {
      id: 'optimized',
      name: 'Ruta Optimizada (IA)',
      points: shuffledPoints,
      total_distance: totalDistance * 0.85, // 15% mejora
      total_time: totalTime * 0.82, // 18% mejora
      fuel_cost: (totalDistance * 0.85) * 0.08, // $0.08 por km
      efficiency_score: 94,
      traffic_factor: 1.15,
      algorithm: algorithm as any
    };
  };

  const generateOriginalRoute = async (points: DeliveryPoint[]): Promise<OptimizedRoute> => {
    const totalDistance = calculateTotalDistance(points);
    const totalTime = calculateTotalTime(points);
    
    return {
      id: 'original',
      name: 'Ruta Original',
      points: points,
      total_distance: totalDistance,
      total_time: totalTime,
      fuel_cost: totalDistance * 0.08,
      efficiency_score: 76,
      traffic_factor: 1.3,
      algorithm: 'tsp'
    };
  };

  const calculateTotalDistance = (points: DeliveryPoint[]): number => {
    // Simular cálculo de distancia total
    return points.reduce((total, point, index) => {
      if (index === 0) return total;
      const prevPoint = points[index - 1];
      const distance = Math.sqrt(
        Math.pow(point.coordinates.lat - prevPoint.coordinates.lat, 2) +
        Math.pow(point.coordinates.lng - prevPoint.coordinates.lng, 2)
      ) * 111; // Aproximación en km
      return total + distance;
    }, 0);
  };

  const calculateTotalTime = (points: DeliveryPoint[]): number => {
    // Simular cálculo de tiempo total (distancia + tiempo de entrega)
    const travelTime = calculateTotalDistance(points) * 2; // 2 min por km
    const deliveryTime = points.reduce((total, point) => total + point.estimated_duration, 0);
    return travelTime + deliveryTime;
  };

  const applyOptimizedRoute = async (routeId: string) => {
    try {
      // Simular aplicación de ruta optimizada
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Ruta aplicada",
        description: "La ruta optimizada ha sido asignada exitosamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo aplicar la ruta optimizada",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlgorithmIcon = (algorithm: string) => {
    switch (algorithm) {
      case 'ai_prediction': return <Brain className="h-4 w-4" />;
      case 'genetic': return <Zap className="h-4 w-4" />;
      case 'tsp': return <Target className="h-4 w-4" />;
      case 'mixed': return <BarChart3 className="h-4 w-4" />;
      default: return <Route className="h-4 w-4" />;
    }
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
      {/* Control de optimización */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Optimización de Rutas con IA
          </CardTitle>
          <CardDescription>
            Utiliza algoritmos avanzados para optimizar las rutas de entrega
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Algoritmo de optimización</label>
              <Select value={selectedAlgorithm} onValueChange={setSelectedAlgorithm}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai_prediction">IA Predictiva (Recomendado)</SelectItem>
                  <SelectItem value="genetic">Algoritmo Genético</SelectItem>
                  <SelectItem value="tsp">TSP Clásico</SelectItem>
                  <SelectItem value="mixed">Algoritmo Mixto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button 
                onClick={optimizeRoute} 
                disabled={isOptimizing || deliveryPoints.length < 2}
                className="min-w-[140px]"
              >
                {isOptimizing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Optimizando...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Optimizar Rutas
                  </>
                )}
              </Button>
              
              <div className="text-xs text-muted-foreground text-center">
                {deliveryPoints.length} puntos de entrega
              </div>
            </div>
          </div>

          {isOptimizing && (
            <div className="space-y-2">
              <Progress value={optimizationProgress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                {optimizationProgress}% completado
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Métricas de mejora */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Métricas de Optimización
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {metrics.distance_saved.toFixed(1)} km
                </div>
                <div className="text-sm text-green-600">Distancia ahorrada</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(metrics.time_saved)} min
                </div>
                <div className="text-sm text-blue-600">Tiempo ahorrado</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  ${metrics.fuel_saved.toFixed(2)}
                </div>
                <div className="text-sm text-purple-600">Combustible ahorrado</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {metrics.efficiency_improvement.toFixed(1)}%
                </div>
                <div className="text-sm text-orange-600">Mejora en eficiencia</div>
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Confianza: {metrics.confidence_score}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparación de rutas */}
      {optimizedRoutes.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {optimizedRoutes.map((route) => (
            <Card key={route.id} className={route.id === 'optimized' ? 'border-green-200 bg-green-50' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getAlgorithmIcon(route.algorithm)}
                    {route.name}
                  </div>
                  {route.id === 'optimized' && (
                    <Badge className="bg-green-100 text-green-800">
                      Recomendada
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Métricas de la ruta */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{route.total_distance.toFixed(1)} km</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{Math.round(route.total_time)} min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Fuel className="h-4 w-4 text-muted-foreground" />
                    <span>${route.fuel_cost.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span>{route.efficiency_score}% eficiencia</span>
                  </div>
                </div>

                {/* Lista de puntos de entrega */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Secuencia de entregas:</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {route.points.map((point, index) => (
                      <div key={point.id} className="flex items-center gap-3 p-2 bg-white rounded border">
                        <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{point.customer_name}</div>
                          <div className="text-xs text-muted-foreground truncate">{point.address}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={getPriorityColor(point.priority)}>
                            {point.priority}
                          </Badge>
                          {point.time_window && (
                            <Badge variant="outline" className="text-xs">
                              {point.time_window.start}-{point.time_window.end}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Acción para aplicar ruta */}
                {route.id === 'optimized' && (
                  <Button 
                    onClick={() => applyOptimizedRoute(route.id)} 
                    className="w-full"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Aplicar ruta optimizada
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Lista de puntos de entrega pendientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Puntos de Entrega Pendientes
          </CardTitle>
          <CardDescription>
            {deliveryPoints.length} entregas programadas para optimizar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deliveryPoints.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay entregas pendientes</h3>
              <p className="text-muted-foreground">
                Las entregas aparecerán aquí cuando estén programadas
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {deliveryPoints.map((point, index) => (
                <div key={point.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                  <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{point.customer_name}</div>
                    <div className="text-sm text-muted-foreground">{point.address}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={getPriorityColor(point.priority)}>
                      {point.priority}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      ${point.order_value}
                    </div>
                    {point.time_window && (
                      <Badge variant="outline">
                        {point.time_window.start}-{point.time_window.end}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};