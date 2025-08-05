import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Eye,
  ArrowUpRight,
  Calendar,
  Target
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'stable';
  };
  progress?: {
    value: number;
    max: number;
    label: string;
  };
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  onViewDetails?: () => void;
}

export const MetricCard = ({ 
  title, 
  value, 
  description, 
  trend, 
  progress, 
  icon, 
  color = 'blue',
  onViewDetails 
}: MetricCardProps) => {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50/50',
    green: 'border-green-200 bg-green-50/50',
    orange: 'border-orange-200 bg-orange-50/50',
    red: 'border-red-200 bg-red-50/50',
    purple: 'border-purple-200 bg-purple-50/50'
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
    purple: 'text-purple-600'
  };

  const getTrendIcon = () => {
    if (trend?.direction === 'up') return <TrendingUp className="h-3 w-3" />;
    if (trend?.direction === 'down') return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (trend?.direction === 'up') return 'text-green-600 bg-green-100';
    if (trend?.direction === 'down') return 'text-red-600 bg-red-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <Card className={`relative overflow-hidden ${colorClasses[color]} border-l-4`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className={`p-2 rounded-full bg-background/50 ${iconColorClasses[color]}`}>
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">{value}</div>
            {trend && (
              <Badge variant="secondary" className={`text-xs ${getTrendColor()}`}>
                {getTrendIcon()}
                <span className="ml-1">{trend.value > 0 ? '+' : ''}{trend.value}%</span>
              </Badge>
            )}
          </div>

          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}

          {trend && (
            <p className="text-xs text-muted-foreground">{trend.label}</p>
          )}

          {progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{progress.label}</span>
                <span className="font-medium">
                  {progress.value}/{progress.max}
                </span>
              </div>
              <Progress 
                value={(progress.value / progress.max) * 100} 
                className="h-2"
              />
            </div>
          )}

          {onViewDetails && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onViewDetails}
              className="w-full mt-3 justify-center"
            >
              <Eye className="h-3 w-3 mr-1" />
              Ver detalles
              <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface KPIGridProps {
  kpis: Array<{
    id: string;
    title: string;
    value: string | number;
    description?: string;
    trend?: {
      value: number;
      label: string;
      direction: 'up' | 'down' | 'stable';
    };
    progress?: {
      value: number;
      max: number;
      label: string;
    };
    icon?: React.ReactNode;
    color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
    onViewDetails?: () => void;
  }>;
  title?: string;
  columns?: 2 | 3 | 4;
}

export const KPIGrid = ({ kpis, title, columns = 4 }: KPIGridProps) => {
  const gridClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className="space-y-4">
      {title && (
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      )}
      <div className={`grid gap-4 ${gridClasses[columns]}`}>
        {kpis.map((kpi) => (
          <MetricCard
            key={kpi.id}
            title={kpi.title}
            value={kpi.value}
            description={kpi.description}
            trend={kpi.trend}
            progress={kpi.progress}
            icon={kpi.icon}
            color={kpi.color}
            onViewDetails={kpi.onViewDetails}
          />
        ))}
      </div>
    </div>
  );
};

export const RealtimeActivityFeed = () => {
  const activities = [
    {
      id: 1,
      type: 'order',
      message: 'Nuevo pedido creado',
      details: 'Pedido #1234 - Cliente: Juan Pérez',
      timestamp: '2 minutos',
      icon: '📦',
      color: 'blue'
    },
    {
      id: 2,
      type: 'delivery',
      message: 'Entrega completada',
      details: 'Ruta Norte - Cadete: María López',
      timestamp: '5 minutos',
      icon: '✅',
      color: 'green'
    },
    {
      id: 3,
      type: 'incident',
      message: 'Incidencia reportada',
      details: 'Dirección incorrecta - Pedido #1230',
      timestamp: '12 minutos',
      icon: '⚠️',
      color: 'orange'
    },
    {
      id: 4,
      type: 'payment',
      message: 'Pago confirmado',
      details: '$150.00 - Transferencia bancaria',
      timestamp: '15 minutos',
      icon: '💰',
      color: 'green'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Actividad en Tiempo Real
        </CardTitle>
        <CardDescription>
          Últimas actualizaciones del sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="text-lg">{activity.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{activity.message}</p>
                <p className="text-xs text-muted-foreground">{activity.details}</p>
              </div>
              <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
            </div>
          ))}
        </div>
        <Button variant="outline" className="w-full mt-4">
          Ver todas las actividades
        </Button>
      </CardContent>
    </Card>
  );
};