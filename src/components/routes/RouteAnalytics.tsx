import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  MapPin, 
  Fuel, 
  Target,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Calendar
} from 'lucide-react';

interface RouteAnalyticsData {
  route_efficiency: Array<{
    route_name: string;
    efficiency_score: number;
    avg_delivery_time: number;
    distance_per_delivery: number;
    fuel_efficiency: number;
  }>;
  time_analysis: Array<{
    hour: string;
    avg_delivery_time: number;
    success_rate: number;
    traffic_factor: number;
  }>;
  performance_trends: Array<{
    date: string;
    completed_deliveries: number;
    avg_time: number;
    efficiency: number;
  }>;
  bottlenecks: Array<{
    location: string;
    delay_frequency: number;
    avg_delay_time: number;
    impact_score: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const RouteAnalytics = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [analyticsData, setAnalyticsData] = useState<RouteAnalyticsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7'); // días
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod, user]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Simular carga de datos analíticos
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockData: RouteAnalyticsData = {
        route_efficiency: [
          {
            route_name: 'Ruta Centro',
            efficiency_score: 87,
            avg_delivery_time: 12.5,
            distance_per_delivery: 2.8,
            fuel_efficiency: 92
          },
          {
            route_name: 'Ruta Pocitos',
            efficiency_score: 94,
            avg_delivery_time: 15.2,
            distance_per_delivery: 3.2,
            fuel_efficiency: 89
          },
          {
            route_name: 'Ruta Cordón',
            efficiency_score: 78,
            avg_delivery_time: 18.7,
            distance_per_delivery: 4.1,
            fuel_efficiency: 76
          },
          {
            route_name: 'Ruta Carrasco',
            efficiency_score: 82,
            avg_delivery_time: 22.3,
            distance_per_delivery: 5.6,
            fuel_efficiency: 84
          }
        ],
        time_analysis: [
          { hour: '09:00', avg_delivery_time: 14.2, success_rate: 95, traffic_factor: 1.1 },
          { hour: '10:00', avg_delivery_time: 12.8, success_rate: 97, traffic_factor: 1.0 },
          { hour: '11:00', avg_delivery_time: 13.5, success_rate: 94, traffic_factor: 1.2 },
          { hour: '12:00', avg_delivery_time: 16.1, success_rate: 89, traffic_factor: 1.4 },
          { hour: '13:00', avg_delivery_time: 18.3, success_rate: 85, traffic_factor: 1.6 },
          { hour: '14:00', avg_delivery_time: 15.7, success_rate: 91, traffic_factor: 1.3 },
          { hour: '15:00', avg_delivery_time: 14.9, success_rate: 93, traffic_factor: 1.2 },
          { hour: '16:00', avg_delivery_time: 17.2, success_rate: 88, traffic_factor: 1.5 },
          { hour: '17:00', avg_delivery_time: 19.8, success_rate: 82, traffic_factor: 1.8 },
          { hour: '18:00', avg_delivery_time: 16.4, success_rate: 90, traffic_factor: 1.4 }
        ],
        performance_trends: Array.from({ length: parseInt(selectedPeriod) }, (_, i) => {
          const date = format(subDays(new Date(), i), 'MM/dd');
          return {
            date,
            completed_deliveries: Math.floor(Math.random() * 20) + 15,
            avg_time: Math.random() * 5 + 12,
            efficiency: Math.random() * 20 + 75
          };
        }).reverse(),
        bottlenecks: [
          {
            location: 'Av. 18 de Julio (Centro)',
            delay_frequency: 68,
            avg_delay_time: 8.5,
            impact_score: 85
          },
          {
            location: 'Rambla (Pocitos)',
            delay_frequency: 42,
            avg_delay_time: 5.2,
            impact_score: 62
          },
          {
            location: 'Bvar. Artigas',
            delay_frequency: 35,
            avg_delay_time: 6.8,
            impact_score: 58
          },
          {
            location: 'Av. Italia',
            delay_frequency: 28,
            avg_delay_time: 4.3,
            impact_score: 45
          }
        ]
      };

      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos analíticos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const runDeepAnalysis = async () => {
    setAnalyzing(true);
    setAnalysisProgress(0);

    try {
      const steps = [
        { step: 'Analizando patrones históricos...', progress: 20 },
        { step: 'Identificando cuellos de botella...', progress: 40 },
        { step: 'Evaluando eficiencia por zona...', progress: 60 },
        { step: 'Generando recomendaciones...', progress: 80 },
        { step: 'Finalizando análisis...', progress: 100 }
      ];

      for (const stepInfo of steps) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setAnalysisProgress(stepInfo.progress);
      }

      await loadAnalyticsData(); // Recargar con nuevos insights

      toast({
        title: "Análisis completado",
        description: "Se han identificado nuevas oportunidades de optimización",
      });

    } catch (error) {
      toast({
        title: "Error en análisis",
        description: "No se pudo completar el análisis profundo",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const getEfficiencyColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEfficiencyBadge = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 80) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getImpactColor = (impact: number) => {
    if (impact >= 80) return 'bg-red-100 text-red-800';
    if (impact >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
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

  if (!analyticsData) return null;

  return (
    <div className="space-y-6">
      {/* Controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Análisis de Rendimiento de Rutas
          </CardTitle>
          <CardDescription>
            Insights y métricas de rendimiento basados en datos históricos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Período de análisis</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 días</SelectItem>
                  <SelectItem value="14">Últimos 14 días</SelectItem>
                  <SelectItem value="30">Último mes</SelectItem>
                  <SelectItem value="90">Últimos 3 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={runDeepAnalysis} 
              disabled={analyzing}
              variant="outline"
            >
              {analyzing ? (
                <>
                  <Activity className="h-4 w-4 mr-2 animate-pulse" />
                  Analizando...
                </>
              ) : (
                <>
                  <Target className="h-4 w-4 mr-2" />
                  Análisis Profundo
                </>
              )}
            </Button>
          </div>

          {analyzing && (
            <div className="space-y-2">
              <Progress value={analysisProgress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                {analysisProgress}% completado
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Eficiencia por ruta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Eficiencia por Ruta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.route_efficiency}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="route_name" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'efficiency_score' ? `${value}%` : `${value} min`,
                  name === 'efficiency_score' ? 'Eficiencia' : 'Tiempo promedio'
                ]}
              />
              <Bar dataKey="efficiency_score" fill="#0088FE" name="efficiency_score" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Análisis por horario */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Análisis por Horario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.time_analysis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="avg_delivery_time" 
                stroke="#8884d8" 
                name="Tiempo promedio (min)"
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="success_rate" 
                stroke="#82ca9d" 
                name="Tasa de éxito (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tendencias de rendimiento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Tendencias de Rendimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.performance_trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="completed_deliveries" 
                stroke="#8884d8" 
                name="Entregas completadas"
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="efficiency" 
                stroke="#82ca9d" 
                name="Eficiencia (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking de eficiencia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Ranking de Eficiencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.route_efficiency
                .sort((a, b) => b.efficiency_score - a.efficiency_score)
                .map((route, index) => (
                  <div key={route.route_name} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{route.route_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {route.avg_delivery_time.toFixed(1)} min promedio
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className={getEfficiencyBadge(route.efficiency_score)}>
                        {route.efficiency_score}%
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {route.fuel_efficiency}% combustible
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Cuellos de botella */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Cuellos de Botella
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.bottlenecks.map((bottleneck, index) => (
                <div key={bottleneck.location} className="p-3 border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{bottleneck.location}</div>
                    <Badge variant="secondary" className={getImpactColor(bottleneck.impact_score)}>
                      Impacto {bottleneck.impact_score}%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      <div>Frecuencia de retrasos</div>
                      <div className="font-medium text-foreground">{bottleneck.delay_frequency}%</div>
                    </div>
                    <div>
                      <div>Retraso promedio</div>
                      <div className="font-medium text-foreground">{bottleneck.avg_delay_time} min</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};