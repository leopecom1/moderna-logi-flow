import { useState, useEffect } from 'react';
import { Clock, MapPin, Route } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface DeliveryPoint {
  id: string;
  address: string;
  customer_name: string;
  order_number: string;
  status: string;
  lat?: number;
  lng?: number;
}

interface RouteTimeCalculatorProps {
  deliveries: DeliveryPoint[];
  className?: string;
}

interface RouteSegment {
  from: DeliveryPoint;
  to: DeliveryPoint;
  distance: string;
  duration: string;
  durationValue: number; // in seconds
}

export const RouteTimeCalculator = ({ deliveries, className }: RouteTimeCalculatorProps) => {
  const [routeSegments, setRouteSegments] = useState<RouteSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalTime, setTotalTime] = useState<string>('');

  const calculateRouteTimes = async () => {
    if (deliveries.length < 2) return;

    setLoading(true);
    try {
      const directionsService = new google.maps.DirectionsService();
      const segments: RouteSegment[] = [];
      let totalDurationSeconds = 0;

      // Calculate time between consecutive delivery points
      for (let i = 0; i < deliveries.length - 1; i++) {
        const origin = deliveries[i];
        const destination = deliveries[i + 1];

        try {
          const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
            directionsService.route(
              {
                origin: origin.address,
                destination: destination.address,
                travelMode: google.maps.TravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.METRIC,
                avoidHighways: false,
                avoidTolls: false,
              },
              (result, status) => {
                if (status === google.maps.DirectionsStatus.OK && result) {
                  resolve(result);
                } else {
                  reject(new Error(`Directions request failed: ${status}`));
                }
              }
            );
          });

          const route = result.routes[0];
          const leg = route.legs[0];
          
          segments.push({
            from: origin,
            to: destination,
            distance: leg.distance?.text || 'N/A',
            duration: leg.duration?.text || 'N/A',
            durationValue: leg.duration?.value || 0,
          });

          totalDurationSeconds += leg.duration?.value || 0;

          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error calculating route from ${origin.address} to ${destination.address}:`, error);
          // Add fallback segment
          segments.push({
            from: origin,
            to: destination,
            distance: 'N/A',
            duration: 'N/A',
            durationValue: 0,
          });
        }
      }

      setRouteSegments(segments);
      setTotalTime(formatDuration(totalDurationSeconds));
    } catch (error) {
      console.error('Error calculating route times:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron calcular los tiempos de ruta',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'entregado':
        return 'bg-green-100 text-green-800';
      case 'en_camino':
        return 'bg-blue-100 text-blue-800';
      case 'con_demora':
        return 'bg-yellow-100 text-yellow-800';
      case 'no_entregado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTotalDistance = (): string => {
    let totalKm = 0;
    routeSegments.forEach(segment => {
      const distance = segment.distance.replace(' km', '').replace(',', '.');
      const km = parseFloat(distance);
      if (!isNaN(km)) {
        totalKm += km;
      }
    });
    return totalKm > 0 ? `${totalKm.toFixed(1)} km` : 'N/A';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Route className="h-5 w-5" />
              <span>Tiempos de Ruta</span>
            </CardTitle>
            <CardDescription>
              Tiempo aproximado entre cada punto de entrega
            </CardDescription>
          </div>
          <Button 
            onClick={calculateRouteTimes}
            disabled={loading || deliveries.length < 2}
            size="sm"
          >
            {loading ? 'Calculando...' : 'Calcular Tiempos'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {deliveries.length < 2 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Insuficientes puntos</h3>
            <p className="text-muted-foreground">
              Se necesitan al menos 2 entregas para calcular tiempos
            </p>
          </div>
        ) : routeSegments.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tiempos no calculados</h3>
            <p className="text-muted-foreground">
              Haz clic en "Calcular Tiempos" para obtener los tiempos aproximados entre puntos
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-primary/5 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Tiempo Total Estimado</p>
                  <p className="text-lg font-bold text-primary">{totalTime}</p>
                </div>
                <div>
                  <p className="font-medium">Distancia Total</p>
                  <p className="text-lg font-bold text-primary">{getTotalDistance()}</p>
                </div>
              </div>
            </div>

            {/* Route segments */}
            <div className="space-y-3">
              {routeSegments.map((segment, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {segment.from.order_number} → {segment.to.order_number}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Desde:</span>
                          <div className="flex items-center space-x-2">
                            <span>{segment.from.customer_name}</span>
                            <Badge className={getStatusColor(segment.from.status)}>
                              {segment.from.status}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Hasta:</span>
                          <div className="flex items-center space-x-2">
                            <span>{segment.to.customer_name}</span>
                            <Badge className={getStatusColor(segment.to.status)}>
                              {segment.to.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="flex items-center space-x-1 mb-1">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="font-bold text-primary">{segment.duration}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{segment.distance}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-xs text-muted-foreground text-center pt-2 border-t">
              Los tiempos son aproximados y pueden variar según el tráfico y condiciones de la ruta
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};