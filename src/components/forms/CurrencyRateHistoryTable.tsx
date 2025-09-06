import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface CurrencyRateHistory {
  id: string;
  currency_code: string;
  currency_name: string;
  buy_rate: number;
  sell_rate: number;
  last_updated: string;
  created_at: string;
}

export const CurrencyRateHistoryTable = () => {
  const { data: history, isLoading } = useQuery({
    queryKey: ['currency_rate_history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('currency_rates')
        .select('*')
        .eq('currency_code', 'USD')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as CurrencyRateHistory[];
    },
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });

  const calculateTrend = (current: number, previous: number) => {
    if (current > previous) {
      return { direction: 'up', percentage: ((current - previous) / previous * 100).toFixed(2) };
    } else if (current < previous) {
      return { direction: 'down', percentage: ((previous - current) / previous * 100).toFixed(2) };
    }
    return { direction: 'equal', percentage: '0.00' };
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-green-500" />;
      default:
        return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up':
        return 'text-red-600';
      case 'down':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Cotizaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Cargando historial...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Cotizaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            No hay historial de cotizaciones disponible
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Cotizaciones USD</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Compra</TableHead>
                <TableHead>Venta</TableHead>
                <TableHead>Tendencia</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((rate, index) => {
                const previousRate = history[index + 1];
                const buyTrend = previousRate ? calculateTrend(rate.buy_rate, previousRate.buy_rate) : null;
                const sellTrend = previousRate ? calculateTrend(rate.sell_rate, previousRate.sell_rate) : null;

                return (
                  <TableRow key={rate.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {format(new Date(rate.last_updated), 'dd/MM/yyyy', { locale: es })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(rate.last_updated), 'HH:mm', { locale: es })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">${rate.buy_rate.toFixed(2)}</span>
                        {buyTrend && (
                          <div className={`flex items-center gap-1 ${getTrendColor(buyTrend.direction)}`}>
                            {getTrendIcon(buyTrend.direction)}
                            <span className="text-xs">{buyTrend.percentage}%</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">${rate.sell_rate.toFixed(2)}</span>
                        {sellTrend && (
                          <div className={`flex items-center gap-1 ${getTrendColor(sellTrend.direction)}`}>
                            {getTrendIcon(sellTrend.direction)}
                            <span className="text-xs">{sellTrend.percentage}%</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        Spread: ${(rate.sell_rate - rate.buy_rate).toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        {index === 0 ? "Actual" : "Anterior"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};