import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Download, Calendar, Filter } from 'lucide-react';

interface ChartData {
  name: string;
  value: number;
  percentage?: number;
  color?: string;
}

interface SalesChartProps {
  data: ChartData[];
  title: string;
  description?: string;
  period?: string;
  onPeriodChange?: (period: string) => void;
  onExport?: () => void;
}

export const SalesChart = ({ 
  data, 
  title, 
  description, 
  period = '30',
  onPeriodChange,
  onExport 
}: SalesChartProps) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-2">
            {onPeriodChange && (
              <Select value={period} onValueChange={onPeriodChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 días</SelectItem>
                  <SelectItem value="30">30 días</SelectItem>
                  <SelectItem value="90">3 meses</SelectItem>
                  <SelectItem value="365">1 año</SelectItem>
                </SelectContent>
              </Select>
            )}
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{item.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{item.value.toLocaleString()}</span>
                  {item.percentage !== undefined && (
                    <Badge variant="secondary" className="text-xs">
                      {item.percentage}%
                    </Badge>
                  )}
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    item.color || 'bg-primary'
                  }`}
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface RevenueChartProps {
  data: {
    period: string;
    revenue: number;
    orders: number;
    growth?: number;
  }[];
  title: string;
  onExport?: () => void;
}

export const RevenueChart = ({ data, title, onExport }: RevenueChartProps) => {
  const maxRevenue = Math.max(...data.map(d => d.revenue));
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {title}
          </CardTitle>
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{item.period}</span>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-bold">${item.revenue.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">{item.orders} pedidos</div>
                  </div>
                  {item.growth !== undefined && (
                    <Badge 
                      variant={item.growth > 0 ? "default" : "destructive"} 
                      className="text-xs"
                    >
                      {item.growth > 0 ? '+' : ''}{item.growth}%
                    </Badge>
                  )}
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-primary to-primary/80 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface PerformanceMetricsProps {
  metrics: {
    name: string;
    value: number;
    target: number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
  }[];
  title: string;
}

export const PerformanceMetrics = ({ metrics, title }: PerformanceMetricsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.map((metric, index) => {
            const percentage = (metric.value / metric.target) * 100;
            const isAboveTarget = percentage >= 100;
            
            return (
              <div key={index} className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{metric.name}</span>
                  <Badge variant={isAboveTarget ? "default" : "secondary"}>
                    {metric.trend === 'up' ? '↗' : metric.trend === 'down' ? '↘' : '→'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold">
                    {metric.value}{metric.unit}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    de {metric.target}{metric.unit}
                  </span>
                </div>
                <div className="w-full bg-background rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      isAboveTarget ? 'bg-green-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {percentage.toFixed(1)}% del objetivo
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};