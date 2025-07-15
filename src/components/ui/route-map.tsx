import { useEffect, useRef } from 'react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';

interface DeliveryLocation {
  id: string;
  address: string;
  lat?: number;
  lng?: number;
  status: string;
  customer_name: string;
  order_number: string;
}

interface RouteMapProps {
  deliveries: DeliveryLocation[];
  className?: string;
  height?: string;
  onDeliveryClick?: (deliveryId: string) => void;
}

export const RouteMap = ({
  deliveries,
  className = "w-full h-96",
  height = "384px",
  onDeliveryClick
}: RouteMapProps) => {
  const { isLoaded, loadError } = useGoogleMaps();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const directionsServiceRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'entregado':
        return '#22c55e'; // green
      case 'en_camino':
        return '#3b82f6'; // blue
      case 'con_demora':
        return '#f59e0b'; // yellow
      case 'no_entregado':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const getMarkerIcon = (status: string) => {
    const color = getMarkerColor(status);
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
    };
  };

  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
  };

  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    if (!window.google) return null;
    
    const geocoder = new window.google.maps.Geocoder();
    
    return new Promise((resolve) => {
      geocoder.geocode({ address }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          resolve({ lat: location.lat(), lng: location.lng() });
        } else {
          resolve(null);
        }
      });
    });
  };

  const createMarkers = async () => {
    if (!mapInstanceRef.current || !window.google) return;
    
    clearMarkers();
    
    const bounds = new window.google.maps.LatLngBounds();
    
    for (const delivery of deliveries) {
      let position: { lat: number; lng: number } | null = null;
      
      if (delivery.lat && delivery.lng) {
        position = { lat: delivery.lat, lng: delivery.lng };
      } else {
        position = await geocodeAddress(delivery.address);
      }
      
      if (position) {
        const marker = new window.google.maps.Marker({
          position,
          map: mapInstanceRef.current,
          icon: getMarkerIcon(delivery.status),
          title: `${delivery.order_number} - ${delivery.customer_name}`,
          zIndex: delivery.status === 'entregado' ? 1 : 2,
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h4 style="margin: 0 0 8px 0; font-weight: bold;">${delivery.order_number}</h4>
              <p style="margin: 0 0 4px 0;"><strong>Cliente:</strong> ${delivery.customer_name}</p>
              <p style="margin: 0 0 4px 0;"><strong>Dirección:</strong> ${delivery.address}</p>
              <p style="margin: 0; color: ${getMarkerColor(delivery.status)}; font-weight: bold;">
                <strong>Estado:</strong> ${delivery.status.replace('_', ' ').toUpperCase()}
              </p>
            </div>
          `,
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current, marker);
          if (onDeliveryClick) {
            onDeliveryClick(delivery.id);
          }
        });

        markersRef.current.push(marker);
        bounds.extend(position);
      }
    }
    
    if (markersRef.current.length > 0) {
      mapInstanceRef.current.fitBounds(bounds);
      
      // Adjust zoom if there's only one marker
      if (markersRef.current.length === 1) {
        mapInstanceRef.current.setZoom(16);
      }
    }
  };

  const calculateRoute = async () => {
    if (!directionsServiceRef.current || !directionsRendererRef.current || deliveries.length < 2) {
      return;
    }

    const pendingDeliveries = deliveries.filter(d => d.status === 'pendiente' || d.status === 'en_camino');
    
    if (pendingDeliveries.length < 2) return;

    const waypoints = [];
    const origin = pendingDeliveries[0].address;
    const destination = pendingDeliveries[pendingDeliveries.length - 1].address;

    for (let i = 1; i < pendingDeliveries.length - 1; i++) {
      waypoints.push({
        location: pendingDeliveries[i].address,
        stopover: true,
      });
    }

    const request = {
      origin,
      destination,
      waypoints,
      travelMode: window.google.maps.TravelMode.DRIVING,
      optimizeWaypoints: true,
    };

    directionsServiceRef.current.route(request, (result: any, status: any) => {
      if (status === 'OK') {
        directionsRendererRef.current.setDirections(result);
      }
    });
  };

  useEffect(() => {
    if (isLoaded && mapRef.current && window.google && !mapInstanceRef.current) {
      // Initialize map centered on Montevideo, Uruguay
      const montevideo = { lat: -34.9011, lng: -56.1645 };
      
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        zoom: 12,
        center: montevideo,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
      });

      // Initialize directions service and renderer
      directionsServiceRef.current = new window.google.maps.DirectionsService();
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        suppressMarkers: true, // We'll use custom markers
        polylineOptions: {
          strokeColor: '#3b82f6',
          strokeWeight: 4,
          strokeOpacity: 0.7,
        },
      });
      
      directionsRendererRef.current.setMap(mapInstanceRef.current);
    }
  }, [isLoaded]);

  useEffect(() => {
    if (mapInstanceRef.current && deliveries.length > 0) {
      createMarkers();
      calculateRoute();
    }
  }, [deliveries]);

  if (loadError) {
    return (
      <div className={`${className} bg-muted rounded-lg flex items-center justify-center`}>
        <p className="text-muted-foreground">Error cargando el mapa</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`${className} bg-muted rounded-lg flex items-center justify-center`}>
        <p className="text-muted-foreground">Cargando mapa...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
          <span>Pendiente</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>En Camino</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span>Con Demora</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Entregado</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>No Entregado</span>
        </div>
      </div>
      <div 
        ref={mapRef} 
        className={`rounded-lg border ${className}`}
        style={{ height }}
      />
      <p className="text-xs text-muted-foreground">
        💡 Haz clic en los marcadores para ver más información de cada entrega
      </p>
    </div>
  );
};