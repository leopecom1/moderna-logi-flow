import { useEffect, useRef } from 'react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';

interface GoogleMapProps {
  address?: string;
  placeDetails?: any;
  className?: string;
  height?: string;
  onLocationSelect?: (location: { lat: number; lng: number }, address: string) => void;
  allowLocationSelect?: boolean;
}

export const GoogleMap = ({
  address,
  placeDetails,
  className = "w-full h-64",
  height = "256px",
  onLocationSelect,
  allowLocationSelect = false
}: GoogleMapProps) => {
  const { isLoaded, loadError } = useGoogleMaps();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

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
      });

      // Add click listener for manual location selection
      if (allowLocationSelect && onLocationSelect) {
        mapInstanceRef.current.addListener('click', (event: any) => {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          
          // Use Geocoding API to get address
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
            if (status === 'OK' && results[0]) {
              const address = results[0].formatted_address;
              onLocationSelect({ lat, lng }, address);
              
              // Update marker
              if (markerRef.current) {
                markerRef.current.setMap(null);
              }
              markerRef.current = new window.google.maps.Marker({
                position: { lat, lng },
                map: mapInstanceRef.current,
                title: address
              });
            }
          });
        });
      }
    }
  }, [isLoaded, allowLocationSelect, onLocationSelect]);

  useEffect(() => {
    if (mapInstanceRef.current && placeDetails?.geometry?.location && window.google) {
      const location = {
        lat: placeDetails.geometry.location.lat(),
        lng: placeDetails.geometry.location.lng()
      };

      // Center map on the location
      mapInstanceRef.current.setCenter(location);
      mapInstanceRef.current.setZoom(16);

      // Remove existing marker
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }

      // Add new marker
      markerRef.current = new window.google.maps.Marker({
        position: location,
        map: mapInstanceRef.current,
        title: address || 'Ubicación seleccionada'
      });
    }
  }, [placeDetails, address]);

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
    <div className="space-y-2">
      {allowLocationSelect && (
        <div className="text-sm text-muted-foreground">
          💡 Haz clic en el mapa para seleccionar una ubicación
        </div>
      )}
      <div 
        ref={mapRef} 
        className={`rounded-lg border ${className} ${allowLocationSelect ? 'cursor-crosshair' : ''}`}
        style={{ height }}
      />
    </div>
  );
};