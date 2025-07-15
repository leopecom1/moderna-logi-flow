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
  const [displayValue, setDisplayValue] = useState(value);

  // Sync with external value
  useEffect(() => {
    if (value !== displayValue) {
      setDisplayValue(value);
    }
  }, [value]);

  // Initialize autocomplete
  useEffect(() => {
    if (!isLoaded || !inputRef.current || disabled || autocompleteRef.current) {
      return;
    }

    if (!window.google?.maps?.places) {
      console.error('Google Maps Places API not loaded');
      return;
    }

    try {
      console.log('Initializing Google Places Autocomplete...');
      
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'uy' },
        fields: ['formatted_address', 'geometry', 'address_components', 'place_id']
      });

      // Set up the place changed listener
      const handlePlaceChanged = () => {
        const place = autocomplete.getPlace();
        console.log('Place changed:', place);
        
        if (place && place.formatted_address) {
          console.log('Setting address:', place.formatted_address);
          setDisplayValue(place.formatted_address);
          onChange(place.formatted_address, place);
        }
      };

      autocomplete.addListener('place_changed', handlePlaceChanged);
      autocompleteRef.current = autocomplete;

      console.log('Google Places Autocomplete initialized successfully');
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
    }

    return () => {
      if (autocompleteRef.current) {
        try {
          if (window.google?.maps?.event) {
            window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
          }
          autocompleteRef.current = null;
        } catch (error) {
          console.error('Error cleaning up autocomplete:', error);
        }
      }
    };
  }, [isLoaded, disabled, onChange]);

  // Set up CSS styles for dropdown
  useEffect(() => {
    if (!isLoaded) return;

    const styleId = 'google-places-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .pac-container {
        z-index: 99999 !important;
        border-radius: 6px !important;
        border: 1px solid #e5e7eb !important;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
        background: white !important;
        font-family: inherit !important;
        margin-top: 4px !important;
        overflow: hidden !important;
      }
      .pac-item {
        padding: 12px 16px !important;
        border-bottom: 1px solid #f3f4f6 !important;
        cursor: pointer !important;
        font-size: 14px !important;
        line-height: 1.4 !important;
        color: #374151 !important;
        background: white !important;
        transition: background-color 0.2s ease !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
      }
      .pac-item:hover {
        background: #f9fafb !important;
      }
      .pac-item:last-child {
        border-bottom: none !important;
      }
      .pac-item-selected {
        background: #f3f4f6 !important;
      }
      .pac-matched {
        font-weight: 600 !important;
        color: #1f2937 !important;
      }
      .pac-icon {
        margin-right: 8px !important;
      }
      .pac-item-query {
        color: #6b7280 !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [isLoaded]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDisplayValue(newValue);
    onChange(newValue);
  };

  const handleInputFocus = () => {
    console.log('Input focused');
    if (autocompleteRef.current) {
      console.log('Autocomplete already exists');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Don't submit form when pressing Enter in autocomplete
    }
  };

  if (loadError) {
    console.error('Google Maps load error:', loadError);
    return (
      <Input
        value={displayValue}
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
      value={displayValue}
      onChange={handleInputChange}
      onFocus={handleInputFocus}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={cn("w-full", className)}
      disabled={disabled}
      autoComplete="off"
    />
  );
};