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
  const [inputValue, setInputValue] = useState(value);

  // Sync with external value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Initialize autocomplete once when loaded
  useEffect(() => {
    if (!isLoaded || !inputRef.current || disabled) {
      return;
    }

    // Don't re-initialize if already exists
    if (autocompleteRef.current) {
      return;
    }

    if (!window.google?.maps?.places?.Autocomplete) {
      console.error('❌ Google Maps Places Autocomplete not available');
      return;
    }

    try {
      console.log('🗺️ Initializing Google Places Autocomplete...');
      
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'uy' },
        fields: ['formatted_address', 'geometry', 'address_components', 'place_id']
      });

      // Place changed event
      autocomplete.addListener('place_changed', () => {
        console.log('🎯 Place changed event triggered');
        
        const place = autocomplete.getPlace();
        console.log('📍 Selected place:', place);
        
        if (place && place.formatted_address) {
          const address = place.formatted_address;
          console.log('✅ Setting address:', address);
          
          setInputValue(address);
          onChange(address, place);
        }
      });

      autocompleteRef.current = autocomplete;
      console.log('✅ Autocomplete initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing autocomplete:', error);
    }

    return () => {
      if (autocompleteRef.current) {
        try {
          if (window.google?.maps?.event) {
            window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
          }
          autocompleteRef.current = null;
        } catch (error) {
          console.error('❌ Error cleaning up:', error);
        }
      }
    };
  }, [isLoaded, disabled]);

  // Only basic styling to ensure dropdown is visible
  useEffect(() => {
    if (!isLoaded) return;

    const styleId = 'google-places-basic-fix';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .pac-container {
        z-index: 9999 !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle && document.head.contains(existingStyle)) {
        document.head.removeChild(existingStyle);
      }
    };
  }, [isLoaded]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log('⌨️ Input changed:', newValue);
    setInputValue(newValue);
    onChange(newValue);
  };

  const handleInputFocus = () => {
    console.log('🎯 Input focused');
  };

  if (loadError) {
    console.error('❌ Google Maps load error:', loadError);
    return (
      <Input
        value={inputValue}
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
      value={inputValue}
      onChange={handleInputChange}
      onFocus={handleInputFocus}
      placeholder={placeholder}
      className={cn("w-full", className)}
      disabled={disabled}
      autoComplete="off"
    />
  );
};