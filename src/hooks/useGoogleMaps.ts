import { useState, useEffect } from 'react';

interface UseGoogleMapsReturn {
  isLoaded: boolean;
  loadError: string | null;
}

export const useGoogleMaps = (): UseGoogleMapsReturn => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        // Check if already loaded
        if (window.google?.maps?.places) {
          setIsLoaded(true);
          return;
        }

        // Create script element
        const script = document.createElement('script');
        const apiKey = await fetchGoogleMapsApiKey();
        
        if (!apiKey) {
          setLoadError('Google Maps API key not configured');
          return;
        }

        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
        script.async = true;
        script.defer = true;

        // Create global callback
        (window as any).initGoogleMaps = () => {
          setIsLoaded(true);
        };

        script.onerror = () => {
          setLoadError('Failed to load Google Maps');
        };

        document.head.appendChild(script);

        return () => {
          document.head.removeChild(script);
          delete (window as any).initGoogleMaps;
        };
      } catch (error) {
        setLoadError('Error loading Google Maps');
        console.error('Google Maps loading error:', error);
      }
    };

    loadGoogleMaps();
  }, []);

  return { isLoaded, loadError };
};

const fetchGoogleMapsApiKey = async (): Promise<string | null> => {
  try {
    const response = await fetch('https://ndusxjrjrjpauuqeruzg.supabase.co/functions/v1/google-maps-key');
    if (response.ok) {
      const { apiKey } = await response.json();
      return apiKey;
    }
    return null;
  } catch (error) {
    console.error('Error fetching Google Maps API key:', error);
    return null;
  }
};