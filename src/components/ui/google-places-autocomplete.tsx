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