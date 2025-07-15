import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [localValue, setLocalValue] = useState(value);

  // Sync external value changes
  useEffect(() => {
    setLocalValue(value);
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value;
    }
  }, [value]);

  const handlePlaceSelect = useCallback((place: any) => {
    console.log('Place selected:', place);
    if (place.formatted_address) {
      const newValue = place.formatted_address;
      setLocalValue(newValue);
      
      // Update the input element directly
      if (inputRef.current) {
        inputRef.current.value = newValue;
      }
      
      // Call onChange with the new value and place details
      onChange(newValue, place);
    }
  }, [onChange]);

  const setupAutocomplete = useCallback(() => {
    if (!isLoaded || !inputRef.current || !window.google || disabled || autocompleteRef.current) {
      return;
    }

    try {
      console.log('Setting up autocomplete...');
      
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'uy' },
        fields: ['formatted_address', 'geometry', 'address_components', 'place_id']
      });

      // Handle place selection
      const placeChangedListener = () => {
        const place = autocomplete.getPlace();
        handlePlaceSelect(place);
      };

      autocomplete.addListener('place_changed', placeChangedListener);
      autocompleteRef.current = autocomplete;

      console.log('Autocomplete setup complete');
    } catch (error) {
      console.error('Error setting up autocomplete:', error);
    }
  }, [isLoaded, disabled, handlePlaceSelect]);

  // Setup autocomplete when dependencies change
  useEffect(() => {
    setupAutocomplete();

    return () => {
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [setupAutocomplete]);

  // Enhanced CSS for better dropdown interaction
  useEffect(() => {
    if (!isLoaded) return;

    const styleId = 'google-places-autocomplete-style';
    let existingStyle = document.getElementById(styleId);
    
    if (!existingStyle) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .pac-container {
          z-index: 10000 !important;
          border-radius: 8px;
          border: 1px solid hsl(var(--border));
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          font-family: inherit;
          background-color: hsl(var(--background)) !important;
          margin-top: 4px !important;
        }
        .pac-item {
          padding: 12px 16px !important;
          cursor: pointer !important;
          border-bottom: 1px solid hsl(var(--border)) !important;
          background-color: hsl(var(--background)) !important;
          color: hsl(var(--foreground)) !important;
          font-size: 14px !important;
          line-height: 1.5 !important;
          transition: background-color 0.2s ease !important;
          border-left: none !important;
          border-right: none !important;
          border-top: none !important;
          position: relative !important;
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          user-select: none !important;
        }
        .pac-item:last-child {
          border-bottom: none !important;
        }
        .pac-item:hover {
          background-color: hsl(var(--accent)) !important;
          color: hsl(var(--accent-foreground)) !important;
        }
        .pac-item:active {
          background-color: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
        }
        .pac-item-selected {
          background-color: hsl(var(--accent)) !important;
          color: hsl(var(--accent-foreground)) !important;
        }
        .pac-matched {
          font-weight: 600 !important;
          color: hsl(var(--primary)) !important;
        }
        .pac-icon {
          width: 16px !important;
          height: 16px !important;
          margin-right: 8px !important;
          background-size: 16px 16px !important;
        }
        .pac-item-query {
          font-size: 14px !important;
          color: hsl(var(--foreground)) !important;
        }
        .pac-container::after {
          content: '';
          position: absolute;
          top: -8px;
          left: 16px;
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 8px solid hsl(var(--border));
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      const style = document.getElementById(styleId);
      if (style) {
        document.head.removeChild(style);
      }
    };
  }, [isLoaded]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  // Handle manual focus to ensure proper initialization
  const handleInputFocus = () => {
    if (isLoaded && !autocompleteRef.current) {
      setupAutocomplete();
    }
  };

  if (loadError) {
    return (
      <Input
        value={localValue}
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
      value={localValue}
      onChange={handleInputChange}
      onFocus={handleInputFocus}
      placeholder={placeholder}
      className={cn("w-full", className)}
      disabled={disabled}
      autoComplete="off"
      spellCheck={false}
    />
  );
};