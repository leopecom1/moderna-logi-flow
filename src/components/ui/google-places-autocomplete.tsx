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
  onManualInput?: (isManual: boolean) => void;
}

export const GooglePlacesAutocomplete = ({
  value,
  onChange,
  placeholder = "Ingrese la dirección...",
  className,
  disabled = false,
  onManualInput
}: GooglePlacesAutocompleteProps) => {
  const { isLoaded, loadError } = useGoogleMaps();
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [inputValue, setInputValue] = useState(value);
  const [isManualInput, setIsManualInput] = useState(false);

  // Sync with external value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Initialize autocomplete once when loaded (only if not manual input)
  useEffect(() => {
    if (!isLoaded || !inputRef.current || disabled || isManualInput) {
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
        } else {
          console.log('⚠️ No valid place selected');
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
  }, [isLoaded, disabled, isManualInput]);

  // Fix z-index for dropdown to appear above modal
  useEffect(() => {
    if (!isLoaded || isManualInput) return;

    const styleId = 'google-places-z-index-fix';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .pac-container {
        z-index: 99999 !important;
        background: white !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 8px !important;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
        margin-top: 4px !important;
        max-height: 200px !important;
        overflow-y: auto !important;
      }
      .pac-item {
        padding: 12px 16px !important;
        border-bottom: 1px solid #f1f5f9 !important;
        cursor: pointer !important;
        background: white !important;
        line-height: 1.4 !important;
      }
      .pac-item:hover {
        background-color: #f8fafc !important;
      }
      .pac-item:last-child {
        border-bottom: none !important;
      }
      .pac-item-query {
        font-size: 14px !important;
        color: #1f2937 !important;
      }
      .pac-matched {
        font-weight: 600 !important;
        color: #2563eb !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle && document.head.contains(existingStyle)) {
        document.head.removeChild(existingStyle);
      }
    };
  }, [isLoaded, isManualInput]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log('⌨️ Input changed:', newValue);
    setInputValue(newValue);
    onChange(newValue);
  };

  const handleInputFocus = () => {
    console.log('🎯 Input focused');
  };

  const handleManualToggle = (checked: boolean) => {
    setIsManualInput(checked);
    onManualInput?.(checked);
    
    if (checked) {
      // Clean up autocomplete when switching to manual
      if (autocompleteRef.current) {
        try {
          if (window.google?.maps?.event) {
            window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
          }
          autocompleteRef.current = null;
        } catch (error) {
          console.error('❌ Error cleaning up autocomplete:', error);
        }
      }
    }
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
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="manual-input"
          checked={isManualInput}
          onChange={(e) => handleManualToggle(e.target.checked)}
          className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-primary focus:ring-2"
        />
        <label htmlFor="manual-input" className="text-sm font-medium">
          Introducir dirección manualmente
        </label>
      </div>
      
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={isManualInput ? "Escriba la dirección completa..." : placeholder}
          className={cn("w-full", className)}
          disabled={disabled}
          autoComplete="off"
        />
      </div>
    </div>
  );
};