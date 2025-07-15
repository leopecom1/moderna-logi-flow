import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string, placeDetails?: any) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const GooglePlacesAutocomplete = ({
  value,
  onChange,
  placeholder = "Ingrese la dirección...",
  className,
  disabled = false
}: GooglePlacesAutocompleteProps) => {
  const { isLoaded, loadError } = useGoogleMaps();
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    if (isLoaded && inputRef.current && !autocompleteRef.current && !disabled && window.google) {
      try {
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'uy' },
          fields: ['formatted_address', 'geometry', 'address_components', 'place_id']
        });

        // Ensure the dropdown is properly styled and clickable
        const pacContainer = document.querySelector('.pac-container');
        if (pacContainer) {
          (pacContainer as HTMLElement).style.zIndex = '9999';
        }

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          console.log('Place selected:', place);
          if (place.formatted_address) {
            // Force update the input value
            if (inputRef.current) {
              inputRef.current.value = place.formatted_address;
            }
            onChange(place.formatted_address, place);
          }
        });

        // Add focus event to ensure dropdown appears
        inputRef.current.addEventListener('focus', () => {
          const pacContainer = document.querySelector('.pac-container');
          if (pacContainer) {
            (pacContainer as HTMLElement).style.zIndex = '9999';
            (pacContainer as HTMLElement).style.pointerEvents = 'auto';
          }
        });

        autocompleteRef.current = autocomplete;
      } catch (error) {
        console.error('Error initializing autocomplete:', error);
      }
    }

    return () => {
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [isLoaded, disabled, onChange]);

  // Add global CSS for Google Places dropdown
  useEffect(() => {
    if (isLoaded) {
      const style = document.createElement('style');
      style.textContent = `
        .pac-container {
          z-index: 9999 !important;
          border-radius: 8px;
          border: 1px solid hsl(var(--border));
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          font-family: inherit;
        }
        .pac-item {
          padding: 8px 12px;
          cursor: pointer !important;
          border-bottom: 1px solid hsl(var(--border));
        }
        .pac-item:hover {
          background-color: hsl(var(--accent));
        }
        .pac-item-selected {
          background-color: hsl(var(--accent));
        }
        .pac-matched {
          font-weight: 600;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [isLoaded]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  if (loadError) {
    return (
      <Input
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
      />
    );
  }

  if (!isLoaded) {
    return (
      <Input
        placeholder="Cargando Google Maps..."
        disabled
        className={className}
      />
    );
  }

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={handleInputChange}
      placeholder={placeholder}
      className={cn("w-full", className)}
      disabled={disabled}
      autoComplete="off"
    />
  );
};