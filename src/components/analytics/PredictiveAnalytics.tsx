import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Brain, Clock, Target, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DemandPrediction {
  date: string;
  predicted_orders: number;
  confidence: number;
  actual_orders?: number;
  accuracy: number;
}

interface DeliveryTimePrediction {
  route_id: string;
  estimated_time: number;
  confidence: number;
  factors: string[];
  weather_impact: number;
  traffic_impact: number;
}

interface PatternAnalysis {
  pattern_type: string;
  description: string;
  frequency: number;
  impact_score: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  recommendations: string[];
}

interface MLInsights {
  accuracy_score: number;
  model_performance: string;
  last_trained: string;
  data_quality: number;
  predictions_made: number;
  successful_predictions: number;
}

export const PredictiveAnalytics = () => {
  const { toast } = useToast();
  const [demandData, setDemandData] = useState<DemandPrediction[]>([]);
  const [deliveryPredictions, setDeliveryPredictions] = useState<DeliveryTimePrediction[]>([]);
  const [patterns, setPatterns] = useState<PatternAnalysis[]>([]);
  const [mlInsights, setMlInsights] = useState<MLInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTraining, setIsTraining] = useState(false);

  // Simulated ML data generation
  useEffect(() => {
    const generateMockData = () => {
      // Generate demand predictions for next 30 days
      const demandPredictions: DemandPrediction[] = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        
        const baseOrders = 50 + Math.sin(i * 0.2) * 20; // Seasonal pattern
        const randomVariation = (Math.random() - 0.5) * 10;
        const predictedOrders = Math.max(0, Math.round(baseOrders + randomVariation));
        
        demandPredictions.push({
          date: date.toISOString().split('T')[0],
          predicted_orders: predictedOrders,
          confidence: 0.75 + Math.random() * 0.2,
          actual_orders: i < 7 ? Math.round(predictedOrders + (Math.random() - 0.5) * 5) : undefined,
          accuracy: 0.85 + Math.random() * 0.1
        });
      }

      // Generate delivery time predictions
      const deliveryPreds: DeliveryTimePrediction[] = [
        {
          route_id: 'ROUTE-001',
          estimated_time: 45,
          confidence: 0.92,
          factors: ['Traffic density', 'Weather conditions', 'Driver efficiency'],
          weather_impact: 0.15,
          traffic_impact: 0.30
        },
        {
          route_id: 'ROUTE-002',
          estimated_time: 38,
          confidence: 0.88,
          factors: ['Distance', 'Road conditions', 'Package complexity'],
          weather_impact: 0.10,
          traffic_impact: 0.25
        },
        {
          route_id: 'ROUTE-003',
          estimated_time: 52,
          confidence: 0.85,
          factors: ['Multiple stops', 'Urban traffic', 'Peak hours'],
          weather_impact: 0.20,
          traffic_impact: 0.40
        }
      ];

      // Generate pattern analysis
      const patternAnalysis: PatternAnalysis[] = [
        {
          pattern_type: 'Peak Hour Demand',
          description: 'Aumentos de pedidos entre 11:00-13:00 y 18:00-20:00',
          frequency: 0.95,
          impact_score: 8.5,
          trend: 'increasing',
          recommendations: [
            'Aumentar staff durante horas pico',
            'Pre-posicionar vehículos en zonas de alta demanda',
            'Implementar tarifas dinámicas'
          ]
        },
        {
          pattern_type: 'Weather Correlation',
          description: 'Incremento del 30% en pedidos durante días lluviosos',
          frequency: 0.78,
          impact_score: 7.2,
          trend: 'stable',
          recommendations: [
            'Ajustar previsiones meteorológicas',
            'Preparar flota adicional en días de lluvia',
            'Optimizar rutas para condiciones climáticas'
          ]
        },
        {
          pattern_type: 'Geographic Clustering',
          description: 'Concentración de pedidos en zonas específicas por horario',
          frequency: 0.82,
          impact_score: 6.8,
          trend: 'increasing',
          recommendations: [
            'Crear rutas zonificadas',
            'Establecer centros de distribución locales',
            'Implementar entrega colaborativa'
          ]
        }
      ];

      // Generate ML insights
      const insights: MLInsights = {
        accuracy_score: 0.89,
        model_performance: 'Excelente',
        last_trained: new Date().toISOString(),
        data_quality: 0.94,
        predictions_made: 1247,
        successful_predictions: 1109
      };

      setDemandData(demandPredictions);
      setDeliveryPredictions(deliveryPreds);
      setPatterns(patternAnalysis);
      setMlInsights(insights);
      setLoading(false);
    };

    generateMockData();
  }, []);

  const handleRetrainModel = async () => {
    setIsTraining(true);
    
    // Simulate model retraining
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Update model performance
    if (mlInsights) {
      setMlInsights({
        ...mlInsights,
        accuracy_score: Math.min(0.98, mlInsights.accuracy_score + 0.02),
        last_trained: new Date().toISOString(),
        data_quality: Math.min(0.98, mlInsights.data_quality + 0.01)
      });
    }
    
    setIsTraining(false);
    toast({
      title: "Modelo Reentrenado",
      description: "El modelo de ML ha sido actualizado con los datos más recientes"
    });
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ML Performance Overview */}
      {mlInsights && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Precisión del Modelo</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(mlInsights.accuracy_score * 100).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Performance: {mlInsights.model_performance}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calidad de Datos</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(mlInsights.data_quality * 100).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Datos procesados correctamente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Predicciones Exitosas</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((mlInsights.successful_predictions / mlInsights.predictions_made) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {mlInsights.successful_predictions} de {mlInsights.predictions_made}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Último Entrenamiento</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold">
                {new Date(mlInsights.last_trained).toLocaleDateString()}
              </div>
              <Button 
                size="sm" 
                onClick={handleRetrainModel}
                disabled={isTraining}
                className="mt-2 w-full"
              >
                {isTraining ? 'Entrenando...' : 'Reentrenar'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="demand" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="demand">Predicción Demanda</TabsTrigger>
          <TabsTrigger value="delivery">Tiempos Entrega</TabsTrigger>
          <TabsTrigger value="patterns">Análisis Patrones</TabsTrigger>
          <TabsTrigger value="insights">Insights ML</TabsTrigger>
        </TabsList>

        <TabsContent value="demand" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Predicción de Demanda - Próximos 30 Días</CardTitle>
              <CardDescription>
                Predicciones basadas en patrones históricos, estacionalidad y factores externos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={demandData.slice(0, 14)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: any, name) => [
                      name === 'predicted_orders' ? `${value} pedidos` : value,
                      name === 'predicted_orders' ? 'Predicción' : 'Actual'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predicted_orders" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Predicción"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actual_orders" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Actual"
                  />
                </LineChart>
              </ResponsiveContainer>
              
              <div className="mt-4 grid grid-cols-3 gap-4">
                {demandData.slice(0, 3).map((prediction, index) => (
                  <div key={index} className="text-center p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">
                      {new Date(prediction.date).toLocaleDateString()}
                    </div>
                    <div className="text-2xl font-bold">{prediction.predicted_orders}</div>
                    <div className="text-sm">
                      <Badge variant={prediction.confidence > 0.8 ? "default" : "secondary"}>
                        {(prediction.confidence * 100).toFixed(0)}% confianza
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Predicción de Tiempos de Entrega</CardTitle>
              <CardDescription>
                Estimaciones basadas en ML considerando tráfico, clima y complejidad de ruta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {deliveryPredictions.map((prediction, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">{prediction.route_id}</h3>
                        <p className="text-sm text-muted-foreground">
                          Tiempo estimado: {prediction.estimated_time} minutos
                        </p>
                      </div>
                      <Badge variant={prediction.confidence > 0.9 ? "default" : "secondary"}>
                        {(prediction.confidence * 100).toFixed(0)}% confianza
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Impacto Clima</div>
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${prediction.weather_impact * 100}%` }}
                            />
                          </div>
                          <span className="text-sm">{(prediction.weather_impact * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Impacto Tráfico</div>
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-red-600 h-2 rounded-full" 
                              style={{ width: `${prediction.traffic_impact * 100}%` }}
                            />
                          </div>
                          <span className="text-sm">{(prediction.traffic_impact * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Factores Considerados:</div>
                      <div className="flex flex-wrap gap-2">
                        {prediction.factors.map((factor, factorIndex) => (
                          <Badge key={factorIndex} variant="outline">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Patrones Detectados</CardTitle>
              <CardDescription>
                Patrones identificados por ML con recomendaciones automatizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {patterns.map((pattern, index) => (
                  <div key={index} className="border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          {pattern.pattern_type}
                          {pattern.trend === 'increasing' && <TrendingUp className="h-4 w-4 text-green-600" />}
                          {pattern.trend === 'decreasing' && <TrendingDown className="h-4 w-4 text-red-600" />}
                          {pattern.trend === 'stable' && <BarChart3 className="h-4 w-4 text-blue-600" />}
                        </h3>
                        <p className="text-sm text-muted-foreground">{pattern.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{pattern.impact_score}/10</div>
                        <div className="text-xs text-muted-foreground">Impacto</div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Frecuencia del Patrón</span>
                        <span>{(pattern.frequency * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${pattern.frequency * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Recomendaciones:</h4>
                      <ul className="space-y-1">
                        {pattern.recommendations.map((rec, recIndex) => (
                          <li key={recIndex} className="text-sm flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Precisión por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Demanda', value: 89 },
                        { name: 'Tiempos', value: 92 },
                        { name: 'Patrones', value: 85 },
                        { name: 'Rutas', value: 94 }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evolución del Modelo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={[
                      { month: 'Ene', accuracy: 76 },
                      { month: 'Feb', accuracy: 82 },
                      { month: 'Mar', accuracy: 85 },
                      { month: 'Abr', accuracy: 89 },
                      { month: 'May', accuracy: 91 },
                      { month: 'Jun', accuracy: 89 }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[70, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="accuracy" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Alertas y Recomendaciones del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 border rounded-lg bg-yellow-50">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Calidad de Datos en Zona Norte</h4>
                    <p className="text-sm text-muted-foreground">
                      Se detectó una disminución en la calidad de datos GPS en la zona norte. 
                      Recomendamos verificar la conectividad de los dispositivos.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 border rounded-lg bg-green-50">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Nuevo Patrón Detectado</h4>
                    <p className="text-sm text-muted-foreground">
                      Se identificó un patrón de alta demanda los viernes por la tarde. 
                      Considera aumentar la capacidad de entrega.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 border rounded-lg bg-blue-50">
                  <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Optimización Sugerida</h4>
                    <p className="text-sm text-muted-foreground">
                      El modelo sugiere redistribuir 3 vehículos a la zona centro para 
                      mejorar los tiempos de entrega en un 15%.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};