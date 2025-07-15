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

  // Initialize autocomplete
  useEffect(() => {
    if (!isLoaded || !inputRef.current || disabled || autocompleteRef.current) {
      return;
    }

    if (!window.google?.maps?.places?.Autocomplete) {
      console.error('Google Maps Places Autocomplete not available');
      return;
    }

    try {
      console.log('🗺️ Initializing Google Places Autocomplete...');
      
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'uy' },
        fields: ['formatted_address', 'geometry', 'address_components', 'place_id']
      });

      // Set up the place changed listener with immediate execution
      autocomplete.addListener('place_changed', () => {
        console.log('🎯 Place changed event triggered');
        
        const place = autocomplete.getPlace();
        console.log('📍 Selected place:', place);
        
        if (place && place.formatted_address) {
          const address = place.formatted_address;
          console.log('✅ Updating address to:', address);
          
          // Update local state immediately
          setInputValue(address);
          
          // Force update the input element
          if (inputRef.current) {
            inputRef.current.value = address;
          }
          
          // Call the onChange callback with both address and place details
          try {
            onChange(address, place);
            console.log('✅ onChange called successfully');
          } catch (error) {
            console.error('❌ Error calling onChange:', error);
          }
        } else {
          console.log('⚠️ Place has no formatted_address:', place);
        }
      });

      autocompleteRef.current = autocomplete;
      console.log('✅ Google Places Autocomplete initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Google Places Autocomplete:', error);
    }

    return () => {
      if (autocompleteRef.current) {
        try {
          if (window.google?.maps?.event) {
            window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
          }
          autocompleteRef.current = null;
          console.log('🧹 Autocomplete cleaned up');
        } catch (error) {
          console.error('❌ Error cleaning up autocomplete:', error);
        }
      }
    };
  }, [isLoaded, disabled, onChange]);

  // Enhanced CSS for dropdown visibility
  useEffect(() => {
    if (!isLoaded) return;

    const styleId = 'google-places-enhanced-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .pac-container {
        z-index: 999999 !important;
        border-radius: 8px !important;
        border: 2px solid #3b82f6 !important;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
        background: #ffffff !important;
        font-family: inherit !important;
        margin-top: 8px !important;
        overflow: visible !important;
        min-width: 300px !important;
      }
      .pac-item {
        padding: 16px 20px !important;
        border-bottom: 1px solid #e5e7eb !important;
        cursor: pointer !important;
        font-size: 14px !important;
        line-height: 1.5 !important;
        color: #1f2937 !important;
        background: #ffffff !important;
        transition: all 0.2s ease !important;
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
      .pac-item:hover {
        background: #3b82f6 !important;
        color: #ffffff !important;
      }
      .pac-item:active {
        background: #1d4ed8 !important;
        color: #ffffff !important;
      }
      .pac-item:last-child {
        border-bottom: none !important;
        border-radius: 0 0 8px 8px !important;
      }
      .pac-item:first-child {
        border-radius: 8px 8px 0 0 !important;
      }
      .pac-item-selected {
        background: #3b82f6 !important;
        color: #ffffff !important;
      }
      .pac-matched {
        font-weight: 600 !important;
      }
      .pac-icon {
        margin-right: 12px !important;
        width: 20px !important;
        height: 20px !important;
      }
      .pac-item-query {
        color: inherit !important;
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
    console.log('⌨️ Input changed to:', newValue);
    setInputValue(newValue);
    onChange(newValue);
  };

  const handleInputFocus = () => {
    console.log('🎯 Input focused');
  };

  const handleInputClick = () => {
    console.log('🖱️ Input clicked');
  };

  // Add a global click listener to debug pac-item clicks
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.classList.contains('pac-item')) {
        console.log('🖱️ PAC item clicked:', target.textContent);
      }
    };

    document.addEventListener('click', handleDocumentClick, true);
    
    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, []);

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
      onClick={handleInputClick}
      placeholder={placeholder}
      className={cn("w-full", className)}
      disabled={disabled}
      autoComplete="off"
    />
  );
};