import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Lightbulb, Star, TrendingUp, Zap, CheckCircle, X, Filter, SortDesc } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: 'efficiency' | 'cost' | 'customer' | 'operational';
  priority: 'high' | 'medium' | 'low';
  impact_score: number;
  effort_required: 'low' | 'medium' | 'high';
  estimated_savings: number;
  estimated_time_to_implement: string;
  confidence: number;
  status: 'pending' | 'accepted' | 'rejected' | 'implemented';
  reasoning: string[];
  metrics_improved: string[];
  prerequisites?: string[];
}

interface RecommendationFilter {
  category: string;
  priority: string;
  status: string;
}

export const RecommendationEngine = () => {
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [filter, setFilter] = useState<RecommendationFilter>({
    category: 'all',
    priority: 'all',
    status: 'pending'
  });
  const [loading, setLoading] = useState(true);
  const [autoApplyEnabled, setAutoApplyEnabled] = useState(false);

  useEffect(() => {
    const generateRecommendations = () => {
      const mockRecommendations: Recommendation[] = [
        {
          id: 'REC-001',
          title: 'Optimizar Rutas en Zona Centro',
          description: 'Reagrupar entregas en zona centro para reducir kilometraje y tiempo total',
          category: 'efficiency',
          priority: 'high',
          impact_score: 9.2,
          effort_required: 'low',
          estimated_savings: 2800,
          estimated_time_to_implement: '2-3 días',
          confidence: 0.94,
          status: 'pending',
          reasoning: [
            'Análisis de densidad de entregas muestra agrupación subóptima',
            'Algoritmo genético encontró ruta 23% más eficiente',
            'Implementación requiere solo ajuste de software'
          ],
          metrics_improved: ['Tiempo de entrega', 'Consumo combustible', 'Satisfacción del conductor'],
          prerequisites: ['Actualización del sistema de ruteo']
        },
        {
          id: 'REC-002',
          title: 'Implementar Entregas Dinámicas',
          description: 'Permitir reasignación de paquetes en tiempo real basada en ubicación de conductores',
          category: 'operational',
          priority: 'high',
          impact_score: 8.7,
          effort_required: 'medium',
          estimated_savings: 4200,
          estimated_time_to_implement: '1-2 semanas',
          confidence: 0.87,
          status: 'pending',
          reasoning: [
            '15% de entregas podrían reasignarse más eficientemente',
            'Reducción estimada de 20 minutos por ruta',
            'Mejora significativa en flexibilidad operacional'
          ],
          metrics_improved: ['Flexibilidad operacional', 'Tiempo de respuesta', 'Utilización de flota'],
          prerequisites: ['Sistema de tracking en tiempo real', 'App móvil actualizada']
        },
        {
          id: 'REC-003',
          title: 'Predicción de Demanda por Zona',
          description: 'Pre-posicionar vehículos basado en predicciones de demanda horaria',
          category: 'efficiency',
          priority: 'medium',
          impact_score: 7.5,
          effort_required: 'medium',
          estimated_savings: 3100,
          estimated_time_to_implement: '3-4 semanas',
          confidence: 0.82,
          status: 'pending',
          reasoning: [
            'Patrones de demanda predecibles en 78% de casos',
            'Pre-posicionamiento reduciría tiempo de primera entrega',
            'Especialmente efectivo en horas pico'
          ],
          metrics_improved: ['Tiempo primera entrega', 'Distribución de carga', 'Satisfacción cliente'],
          prerequisites: ['Modelo de predicción entrenado', 'Sistema de geo-posicionamiento']
        },
        {
          id: 'REC-004',
          title: 'Optimizar Capacidad de Vehículos',
          description: 'Ajustar asignación de paquetes según capacidad real vs. teórica de vehículos',
          category: 'cost',
          priority: 'medium',
          impact_score: 6.8,
          effort_required: 'low',
          estimated_savings: 1900,
          estimated_time_to_implement: '1 semana',
          confidence: 0.91,
          status: 'pending',
          reasoning: [
            'Vehículos operan al 73% de capacidad promedio',
            'Mejor utilización reduciría número de viajes',
            'Implementación requiere solo cambio de algoritmo'
          ],
          metrics_improved: ['Utilización vehículos', 'Costo por entrega', 'Emisiones CO2']
        },
        {
          id: 'REC-005',
          title: 'Sistema de Alertas Preventivas',
          description: 'Implementar alertas automáticas para prevenir retrasos y problemas operacionales',
          category: 'customer',
          priority: 'high',
          impact_score: 8.1,
          effort_required: 'medium',
          estimated_savings: 2600,
          estimated_time_to_implement: '2-3 semanas',
          confidence: 0.85,
          status: 'pending',
          reasoning: [
            '67% de retrasos son predecibles con 30 min de anticipación',
            'Alertas proactivas mejoran satisfacción del cliente',
            'Reducción significativa en llamadas de soporte'
          ],
          metrics_improved: ['Satisfacción cliente', 'Puntualidad entregas', 'Carga de soporte'],
          prerequisites: ['Sistema de notificaciones', 'Integración con tracking']
        }
      ];

      setRecommendations(mockRecommendations);
      setLoading(false);
    };

    generateRecommendations();
  }, []);

  const handleAcceptRecommendation = (id: string) => {
    setRecommendations(prev => 
      prev.map(rec => 
        rec.id === id ? { ...rec, status: 'accepted' } : rec
      )
    );
    toast({
      title: "Recomendación Aceptada",
      description: "La recomendación ha sido marcada para implementación"
    });
  };

  const handleRejectRecommendation = (id: string) => {
    setRecommendations(prev => 
      prev.map(rec => 
        rec.id === id ? { ...rec, status: 'rejected' } : rec
      )
    );
    toast({
      title: "Recomendación Rechazada",
      description: "La recomendación ha sido descartada"
    });
  };

  const filteredRecommendations = recommendations.filter(rec => {
    if (filter.category !== 'all' && rec.category !== filter.category) return false;
    if (filter.priority !== 'all' && rec.priority !== filter.priority) return false;
    if (filter.status !== 'all' && rec.status !== filter.status) return false;
    return true;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'efficiency': return <Zap className="h-4 w-4" />;
      case 'cost': return <TrendingUp className="h-4 w-4" />;
      case 'customer': return <Star className="h-4 w-4" />;
      case 'operational': return <CheckCircle className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Motor de Recomendaciones IA</h2>
          <p className="text-muted-foreground">
            Sugerencias inteligentes para optimizar operaciones
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-apply"
              checked={autoApplyEnabled}
              onCheckedChange={setAutoApplyEnabled}
            />
            <label htmlFor="auto-apply" className="text-sm">
              Auto-aplicar recomendaciones de baja complejidad
            </label>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Categoría</label>
              <select 
                className="w-full mt-1 p-2 border rounded-md"
                value={filter.category}
                onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
              >
                <option value="all">Todas las categorías</option>
                <option value="efficiency">Eficiencia</option>
                <option value="cost">Costos</option>
                <option value="customer">Cliente</option>
                <option value="operational">Operacional</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Prioridad</label>
              <select 
                className="w-full mt-1 p-2 border rounded-md"
                value={filter.priority}
                onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value }))}
              >
                <option value="all">Todas las prioridades</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Estado</label>
              <select 
                className="w-full mt-1 p-2 border rounded-md"
                value={filter.status}
                onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="accepted">Aceptada</option>
                <option value="rejected">Rechazada</option>
                <option value="implemented">Implementada</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {recommendations.filter(r => r.status === 'pending').length}
            </div>
            <div className="text-sm text-muted-foreground">Pendientes</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              ${recommendations.reduce((sum, rec) => sum + rec.estimated_savings, 0).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Ahorro Potencial</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {(recommendations.reduce((sum, rec) => sum + rec.impact_score, 0) / recommendations.length).toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">Impacto Promedio</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {recommendations.filter(r => r.priority === 'high').length}
            </div>
            <div className="text-sm text-muted-foreground">Alta Prioridad</div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {filteredRecommendations
          .sort((a, b) => b.impact_score - a.impact_score)
          .map((recommendation) => (
          <Card key={recommendation.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    {getCategoryIcon(recommendation.category)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                    <CardDescription>{recommendation.description}</CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={getPriorityColor(recommendation.priority)}>
                    {recommendation.priority}
                  </Badge>
                  <Badge variant="outline">
                    {recommendation.category}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {recommendation.impact_score}/10
                  </div>
                  <div className="text-sm text-muted-foreground">Impacto</div>
                </div>
                
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    ${recommendation.estimated_savings.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Ahorro Est.</div>
                </div>
                
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className={`text-2xl font-bold ${getEffortColor(recommendation.effort_required)}`}>
                    {recommendation.effort_required}
                  </div>
                  <div className="text-sm text-muted-foreground">Esfuerzo</div>
                </div>
                
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {(recommendation.confidence * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Confianza</div>
                </div>
              </div>
              
              {/* Reasoning */}
              <div className="mb-6">
                <h4 className="font-medium mb-2">Análisis y Razonamiento:</h4>
                <ul className="space-y-1">
                  {recommendation.reasoning.map((reason, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Metrics Improved */}
              <div className="mb-6">
                <h4 className="font-medium mb-2">Métricas que Mejorará:</h4>
                <div className="flex flex-wrap gap-2">
                  {recommendation.metrics_improved.map((metric, index) => (
                    <Badge key={index} variant="secondary">
                      {metric}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Prerequisites */}
              {recommendation.prerequisites && (
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Prerequisitos:</h4>
                  <ul className="space-y-1">
                    {recommendation.prerequisites.map((prereq, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        • {prereq}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Implementation Time */}
              <div className="mb-6">
                <div className="text-sm">
                  <span className="font-medium">Tiempo estimado de implementación: </span>
                  <span className="text-muted-foreground">{recommendation.estimated_time_to_implement}</span>
                </div>
              </div>
              
              {/* Actions */}
              {recommendation.status === 'pending' && (
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleAcceptRecommendation(recommendation.id)}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Aceptar
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleRejectRecommendation(recommendation.id)}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Rechazar
                  </Button>
                </div>
              )}
              
              {recommendation.status !== 'pending' && (
                <Badge variant={
                  recommendation.status === 'accepted' ? 'default' :
                  recommendation.status === 'implemented' ? 'default' : 'secondary'
                }>
                  {recommendation.status === 'accepted' && 'Aceptada para implementación'}
                  {recommendation.status === 'rejected' && 'Rechazada'}
                  {recommendation.status === 'implemented' && 'Implementada'}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredRecommendations.length === 0 && (
        <Card>
          <CardContent className="text-center p-8">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No hay recomendaciones que coincidan con los filtros seleccionados.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};